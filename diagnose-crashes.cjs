#!/usr/bin/env node

const http = require('http');

async function testTeachersAndUserManagement() {
    console.log('🔍 DIAGNOSING TEACHERS & USER MANAGEMENT CRASHES');
    console.log('='.repeat(60));
    
    // Test if backend server is running
    console.log('1. 🔧 Checking Backend Server Status...');
    try {
        const healthCheck = await new Promise((resolve, reject) => {
            const req = http.get('http://localhost:8888', (res) => {
                console.log(`   ✅ Backend server responding: ${res.statusCode}`);
                resolve(true);
            });
            req.on('error', (err) => {
                console.log(`   ❌ Backend server error: ${err.message}`);
                reject(err);
            });
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Backend timeout'));
            });
        });
    } catch (error) {
        console.log(`   ❌ Backend server not accessible: ${error.message}`);
        console.log('   🔧 Starting backend server...');
        
        // Check if server.cjs exists and try to start it
        const fs = require('fs');
        if (fs.existsSync('server.cjs')) {
            console.log('   📁 server.cjs found, please run: node server.cjs');
        }
        return;
    }
    
    // Get authentication token
    console.log('\n2. 🔐 Testing Authentication...');
    let authToken;
    try {
        const loginResponse = await new Promise((resolve, reject) => {
            const loginData = JSON.stringify({
                email: 'admin@school.com',
                password: 'admin123'
            });
            
            const options = {
                hostname: 'localhost',
                port: 8888,
                path: '/api/auth/login',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(loginData)
                }
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                });
            });
            
            req.on('error', reject);
            req.write(loginData);
            req.end();
        });
        
        if (loginResponse.token) {
            authToken = loginResponse.token;
            console.log('   ✅ Authentication successful');
        } else {
            console.log('   ❌ Authentication failed:', loginResponse);
            return;
        }
    } catch (error) {
        console.log(`   ❌ Authentication error: ${error.message}`);
        return;
    }
    
    // Test critical endpoints for Teachers and User Management
    console.log('\n3. 🧪 Testing Critical API Endpoints...');
    
    const criticalEndpoints = [
        { name: 'Teachers List', path: '/api/teachers' },
        { name: 'Teachers Dropdown', path: '/api/teachers/dropdown' },
        { name: 'Available Topics', path: '/api/teachers/available-topics' },
        { name: 'User Management', path: '/api/users' }
    ];
    
    for (const endpoint of criticalEndpoints) {
        try {
            const result = await new Promise((resolve, reject) => {
                const options = {
                    hostname: 'localhost',
                    port: 8888,
                    path: endpoint.path,
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                };
                
                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const result = JSON.parse(data);
                            resolve({ status: res.statusCode, data: result });
                        } catch (e) {
                            resolve({ status: res.statusCode, data, error: 'Invalid JSON' });
                        }
                    });
                });
                
                req.on('error', reject);
                req.setTimeout(5000, () => {
                    req.destroy();
                    reject(new Error('Request timeout'));
                });
                req.end();
            });
            
            if (result.status === 200) {
                const dataCount = Array.isArray(result.data) ? result.data.length : 'N/A';
                console.log(`   ✅ ${endpoint.name}: Working (${dataCount} items)`);
            } else {
                console.log(`   ❌ ${endpoint.name}: Failed (${result.status}) - ${result.data}`);
            }
        } catch (error) {
            console.log(`   ❌ ${endpoint.name}: Error - ${error.message}`);
        }
    }
    
    // Test frontend connectivity
    console.log('\n4. 🌐 Testing Frontend Connectivity...');
    try {
        const frontendTest = await new Promise((resolve, reject) => {
            const req = http.get('http://localhost:8082', (res) => {
                console.log(`   ✅ Frontend accessible: ${res.statusCode}`);
                resolve(true);
            });
            req.on('error', (err) => {
                console.log(`   ❌ Frontend error: ${err.message}`);
                reject(err);
            });
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Frontend timeout'));
            });
        });
    } catch (error) {
        console.log(`   ❌ Frontend not accessible: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 DIAGNOSIS SUMMARY:');
    console.log('='.repeat(60));
    console.log('✅ If all endpoints above are working, the API is fine');
    console.log('❌ If Teachers/User Management pages still crash, it might be:');
    console.log('   🔍 1. Browser JavaScript errors (check console)');
    console.log('   🔍 2. React component runtime errors');
    console.log('   🔍 3. Missing dependencies or imports');
    console.log('   🔍 4. State management issues');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Open browser dev console while navigating to problematic pages');
    console.log('2. Check for JavaScript errors, failed network requests');
    console.log('3. Look for specific error messages in console');
    console.log('4. Try hard refresh (Ctrl+F5 or Cmd+Shift+R)');
    console.log('\n🌐 Frontend URL: http://localhost:8082');
    console.log('🔐 Login: admin@school.com / admin123');
}

testTeachersAndUserManagement().catch(console.error);
