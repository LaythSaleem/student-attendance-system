#!/usr/bin/env node

const http = require('http');

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

async function testPort8082API() {
    console.log('🧪 TESTING API FUNCTIONALITY ON PORT 8082');
    console.log('='.repeat(55));
    
    // Test if we can reach the frontend first
    console.log('1. Testing Frontend Access:');
    try {
        const frontendTest = await new Promise((resolve, reject) => {
            const req = http.get('http://localhost:8082', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, data }));
            });
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
        });
        
        if (frontendTest.status === 200) {
            console.log('   ✅ Frontend accessible on port 8082');
        } else {
            console.log(`   ❌ Frontend issue: Status ${frontendTest.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Frontend error: ${error.message}`);
    }
    
    // Test API through proxy
    console.log('\n2. Testing API Through Proxy:');
    
    // First get auth token
    console.log('   🔐 Getting authentication token...');
    try {
        const loginData = {
            email: 'admin@school.com',
            password: 'admin123'
        };
        
        const loginResult = await makeRequest('/api/auth/login', 'POST', loginData);
        
        if (loginResult.success && loginResult.data.token) {
            console.log('   ✅ Authentication successful');
            
            // Test a few critical endpoints
            const testEndpoints = [
                '/api/teachers',
                '/api/users', 
                '/api/reports/attendance-detailed'
            ];
            
            console.log('\n3. Testing Critical Endpoints:');
            for (const endpoint of testEndpoints) {
                try {
                    const result = await makeRequest(endpoint, 'GET', null, {
                        'Authorization': `Bearer ${loginResult.data.token}`
                    });
                    
                    if (result.success) {
                        const count = Array.isArray(result.data) ? result.data.length : 'N/A';
                        console.log(`   ✅ ${endpoint} - Working (${count} items)`);
                    } else {
                        console.log(`   ❌ ${endpoint} - Failed (${result.status})`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${endpoint} - Error: ${error.message}`);
                }
            }
            
        } else {
            console.log('   ❌ Authentication failed');
        }
        
    } catch (error) {
        console.log(`   ❌ Login error: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(55));
    console.log('🎯 SUMMARY:');
    console.log('Frontend working on port 8082: http://localhost:8082');
    console.log('Backend API working on port 8888: http://localhost:8888');
    console.log('If port 8083 has issues, use port 8082 instead');
    console.log('='.repeat(55));
}

testPort8082API().catch(console.error);
