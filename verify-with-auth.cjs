#!/usr/bin/env node

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:8888';

function makeRequest(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8888,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        data: jsonData,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: responseData,
                        success: false,
                        error: 'Invalid JSON response'
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function getValidToken() {
    console.log('🔐 Getting valid authentication token...');
    
    try {
        const loginData = {
            email: 'admin@school.com',
            password: 'admin123'
        };
        
        const result = await makeRequest('/api/auth/login', 'POST', loginData);
        
        if (result.success && result.data.token) {
            console.log('✅ Successfully authenticated as admin');
            return result.data.token;
        } else {
            console.log('❌ Login failed:', result.data);
            return null;
        }
    } catch (error) {
        console.log('❌ Login error:', error.message);
        return null;
    }
}

async function testEndpointsWithValidToken() {
    console.log('🧪 SCHOLAR TRACK PULSE - API FIXES VERIFICATION WITH VALID TOKEN');
    console.log('='.repeat(70));
    
    // Get valid token first
    const token = await getValidToken();
    if (!token) {
        console.log('❌ Cannot proceed without valid token');
        return;
    }
    
    console.log('\n📡 Testing critical endpoints that were causing frontend errors...\n');

    const CRITICAL_ENDPOINTS = [
        { path: '/api/teachers', description: 'Teachers data (TeachersPage)' },
        { path: '/api/teachers/dropdown', description: 'Teachers dropdown (useDropdownData)' },
        { path: '/api/teachers/available-topics', description: 'Available topics (useTeacherApi)' },
        { path: '/api/reports/attendance-detailed', description: 'Attendance reports (AttendanceReportsPage)' },
        { path: '/api/users', description: 'User management (UserManagementPage)' },
        { path: '/api/classes', description: 'Classes data (ClassesPage)' },
        { path: '/api/students', description: 'Students data (StudentsPage)' },
        { path: '/api/attendance', description: 'Attendance summary' },
        { path: '/api/exam-types', description: 'Exam types' },
        { path: '/api/exams', description: 'Exams data' },
        { path: '/api/academic-years/dropdown', description: 'Academic years dropdown' }
    ];

    const results = [];
    
    for (const endpoint of CRITICAL_ENDPOINTS) {
        process.stdout.write(`Testing ${endpoint.path.padEnd(40)} `);
        
        try {
            const result = await makeRequest(endpoint.path, 'GET', null, {
                'Authorization': `Bearer ${token}`
            });
            
            if (result.success) {
                const dataCount = Array.isArray(result.data) ? result.data.length : 
                                result.data && typeof result.data === 'object' ? Object.keys(result.data).length : 1;
                console.log(`✅ WORKING (${dataCount} items)`);
                results.push({ ...endpoint, status: 'PASS', response: result });
            } else {
                console.log(`❌ FAILED (${result.status})`);
                results.push({ ...endpoint, status: 'FAIL', response: result });
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
            results.push({ ...endpoint, status: 'ERROR', error: error.message });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL VERIFICATION SUMMARY');
    console.log('='.repeat(70));
    
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const errors = results.filter(r => r.status === 'ERROR').length;
    
    console.log(`✅ PASSED: ${passed}/${CRITICAL_ENDPOINTS.length}`);
    console.log(`❌ FAILED: ${failed}/${CRITICAL_ENDPOINTS.length}`);
    console.log(`🚨 ERRORS: ${errors}/${CRITICAL_ENDPOINTS.length}`);
    
    if (failed > 0 || errors > 0) {
        console.log('\n❌ FAILED/ERROR ENDPOINTS:');
        results.filter(r => r.status !== 'PASS').forEach(result => {
            console.log(`  - ${result.path}: ${result.error || result.response?.status || 'Unknown error'}`);
            if (result.response?.data) {
                console.log(`    Response: ${JSON.stringify(result.response.data).substring(0, 100)}...`);
            }
        });
    }
    
    if (passed === CRITICAL_ENDPOINTS.length) {
        console.log('\n🎉 ALL CRITICAL API ENDPOINTS ARE WORKING PERFECTLY!');
        console.log('✅ Frontend errors should now be completely resolved.');
        console.log('\n🎯 READY FOR FINAL USER TESTING:');
        console.log('1. ✅ Navigate to Teachers page - should load without errors');
        console.log('2. ✅ Check Attendance Reports page - should display data');
        console.log('3. ✅ Test User Management page - should show user list');
        console.log('4. ✅ Verify all dropdowns are populated with data');
        console.log('\n🔗 Frontend URL: http://localhost:8083');
    } else {
        console.log('\n⚠️  Some endpoints still have issues. Debugging needed.');
    }
    
    console.log('\n' + '='.repeat(70));
}

// Run the comprehensive test
testEndpointsWithValidToken().catch(console.error);
