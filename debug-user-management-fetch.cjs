#!/usr/bin/env node

const http = require('http');

async function debugUserManagementFetch() {
    console.log('🔍 DEBUGGING USER MANAGEMENT "FAILED TO FETCH" ISSUE');
    console.log('='.repeat(60));
    
    // Step 1: Test direct backend API
    console.log('1. 🧪 Testing Backend API Directly...');
    try {
        // Get auth token
        const loginResponse = await makeRequest('/api/auth/login', 'POST', {
            email: 'admin@school.com',
            password: 'admin123'
        }, 8888);
        
        if (!loginResponse.success) {
            console.log('   ❌ Authentication failed');
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('   ✅ Authentication successful');
        
        // Test users API directly on backend
        const backendUsersResponse = await makeRequest('/api/users', 'GET', null, 8888, {
            'Authorization': `Bearer ${token}`
        });
        
        if (backendUsersResponse.success) {
            const userCount = Array.isArray(backendUsersResponse.data) ? backendUsersResponse.data.length : 0;
            console.log(`   ✅ Backend /api/users: ${userCount} users returned`);
        } else {
            console.log(`   ❌ Backend /api/users failed: ${backendUsersResponse.status}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Backend test failed: ${error.message}`);
    }
    
    // Step 2: Test frontend proxy
    console.log('\n2. 🌐 Testing Frontend Proxy...');
    try {
        // Test if frontend can access the API through proxy
        const proxyResponse = await makeRequest('/api/users', 'GET', null, 8082, {
            'Authorization': `Bearer ${token}`
        });
        
        if (proxyResponse.success) {
            const userCount = Array.isArray(proxyResponse.data) ? proxyResponse.data.length : 0;
            console.log(`   ✅ Frontend proxy /api/users: ${userCount} users returned`);
        } else {
            console.log(`   ❌ Frontend proxy failed: ${proxyResponse.status}`);
            console.log(`   Response: ${JSON.stringify(proxyResponse.data).substring(0, 200)}...`);
        }
        
    } catch (error) {
        console.log(`   ❌ Frontend proxy test failed: ${error.message}`);
    }
    
    // Step 3: Check authentication state
    console.log('\n3. 🔐 Checking Authentication State...');
    
    // Create a simple test to simulate what the frontend does
    const frontendSimulation = `
    // Simulating frontend behavior:
    const token = localStorage.getItem('token');
    const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
    fetch('/api/users', { headers })
        .then(response => response.json())
        .then(data => console.log('Users:', data.length))
        .catch(error => console.error('Fetch error:', error));
    `;
    
    console.log('   Frontend simulation code:');
    console.log(frontendSimulation);
    
    // Step 4: Common issues and solutions
    console.log('\n4. 🔧 Potential Issues & Solutions...');
    console.log('   Possible causes for "Failed to fetch user":');
    console.log('   🔍 1. Token not stored in localStorage');
    console.log('   🔍 2. Token expired or invalid');
    console.log('   🔍 3. Proxy configuration issue');
    console.log('   🔍 4. CORS policy blocking request');
    console.log('   🔍 5. Backend server not responding');
    console.log('   🔍 6. Network connectivity issue');
    
    console.log('\n   Immediate fixes to try:');
    console.log('   ✅ 1. Check browser dev console for errors');
    console.log('   ✅ 2. Verify token in localStorage');
    console.log('   ✅ 3. Try hard refresh (Cmd+Shift+R)');
    console.log('   ✅ 4. Login again to get fresh token');
    console.log('   ✅ 5. Check Network tab in dev tools');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 NEXT STEPS:');
    console.log('1. Open http://localhost:8082 in browser');
    console.log('2. Open Developer Tools (F12)');
    console.log('3. Go to Console tab');
    console.log('4. Navigate to User Management page');
    console.log('5. Look for any error messages');
    console.log('6. Check Network tab for failed requests');
    console.log('='.repeat(60));
}

function makeRequest(path, method = 'GET', data = null, port = 8888, headers = {}) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: 'localhost',
            port: port,
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

        if (postData) {
            req.write(postData);
        }

        req.end();
    });
}

debugUserManagementFetch().catch(console.error);
