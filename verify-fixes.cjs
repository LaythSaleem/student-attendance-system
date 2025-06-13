#!/usr/bin/env node

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:8888';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNzY0MDkzNn0.example'; // Mock token for testing

// List of endpoints that were causing frontend errors
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

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8888,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: jsonData,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data,
                        success: false,
                        error: 'Invalid JSON response'
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function runTests() {
    console.log('🧪 SCHOLAR TRACK PULSE - API FIXES VERIFICATION');
    console.log('='.repeat(60));
    console.log(`Testing ${CRITICAL_ENDPOINTS.length} critical endpoints that were causing frontend errors...\n`);

    const results = [];
    
    for (const endpoint of CRITICAL_ENDPOINTS) {
        process.stdout.write(`Testing ${endpoint.path.padEnd(35)} `);
        
        try {
            const result = await makeRequest(endpoint.path);
            
            if (result.success) {
                console.log('✅ WORKING');
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
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
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
        });
    }
    
    if (passed === CRITICAL_ENDPOINTS.length) {
        console.log('\n🎉 ALL CRITICAL API ENDPOINTS ARE WORKING!');
        console.log('The frontend components should now load without errors.');
        console.log('\nNext steps:');
        console.log('1. Navigate to Teachers page in the browser');
        console.log('2. Check Attendance Reports page');
        console.log('3. Test User Management page');
        console.log('4. Verify all dropdowns are populated');
    } else {
        console.log('\n⚠️  Some endpoints are still failing. Check the backend logs.');
    }
    
    console.log('\n' + '='.repeat(60));
}

// Run the tests
runTests().catch(console.error);
