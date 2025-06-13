#!/usr/bin/env node

const http = require('http');

async function testAppStability() {
    console.log('🔧 TESTING APP STABILITY ON CORRECT PORTS');
    console.log('='.repeat(55));
    
    // Check port status
    console.log('1. 🔍 Port Status Check...');
    const ports = [
        { port: 8082, service: 'Frontend (Vite)', expected: true },
        { port: 8083, service: 'Old Frontend', expected: false },
        { port: 8888, service: 'Backend API', expected: true }
    ];
    
    for (const { port, service, expected } of ports) {
        try {
            const response = await new Promise((resolve, reject) => {
                const req = http.get(`http://localhost:${port}`, (res) => {
                    resolve({ status: res.statusCode, running: true });
                });
                req.on('error', () => resolve({ running: false }));
                req.setTimeout(2000, () => {
                    req.destroy();
                    resolve({ running: false });
                });
            });
            
            const status = response.running ? '✅ RUNNING' : '❌ NOT RUNNING';
            const expectation = expected ? '(Expected)' : '(Should be stopped)';
            console.log(`   Port ${port} - ${service}: ${status} ${expectation}`);
            
            if (expected !== response.running) {
                console.log(`   ⚠️  Warning: Port ${port} status doesn't match expectation`);
            }
        } catch (error) {
            console.log(`   Port ${port} - ${service}: ❌ ERROR - ${error.message}`);
        }
    }
    
    // Test authentication and API
    console.log('\n2. 🔐 Authentication Test...');
    try {
        const loginResponse = await makeRequest('/api/auth/login', 'POST', {
            email: 'admin@school.com',
            password: 'admin123'
        }, 8888);
        
        if (loginResponse.success && loginResponse.data.token) {
            console.log('   ✅ Backend authentication working');
            
            // Test critical API endpoints
            console.log('\n3. 🧪 API Endpoints Test...');
            const token = loginResponse.data.token;
            
            const criticalEndpoints = [
                '/api/teachers',
                '/api/users', 
                '/api/students',
                '/api/classes'
            ];
            
            for (const endpoint of criticalEndpoints) {
                try {
                    const result = await makeRequest(endpoint, 'GET', null, 8888, {
                        'Authorization': `Bearer ${token}`
                    });
                    
                    if (result.success) {
                        const count = Array.isArray(result.data) ? result.data.length : 'N/A';
                        console.log(`   ✅ ${endpoint}: ${count} items`);
                    } else {
                        console.log(`   ❌ ${endpoint}: HTTP ${result.status}`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${endpoint}: ${error.message}`);
                }
            }
        } else {
            console.log('   ❌ Backend authentication failed');
        }
    } catch (error) {
        console.log(`   ❌ Authentication error: ${error.message}`);
    }
    
    // Test frontend proxy
    console.log('\n4. 🌐 Frontend Proxy Test...');
    try {
        const frontendResponse = await new Promise((resolve, reject) => {
            const req = http.get('http://localhost:8082', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ 
                    status: res.statusCode, 
                    hasVite: data.includes('vite') || data.includes('@vite'),
                    hasReact: data.includes('React') || data.includes('react'),
                    size: data.length
                }));
            });
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
        });
        
        if (frontendResponse.status === 200) {
            console.log(`   ✅ Frontend accessible (${frontendResponse.size} bytes)`);
            console.log(`   ${frontendResponse.hasVite ? '✅' : '❌'} Vite development server detected`);
            console.log(`   ${frontendResponse.hasReact ? '✅' : '❌'} React application detected`);
        } else {
            console.log(`   ❌ Frontend error: HTTP ${frontendResponse.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Frontend test failed: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(55));
    console.log('🎯 SUMMARY & RECOMMENDATIONS');
    console.log('='.repeat(55));
    
    console.log('✅ CORRECT SETUP:');
    console.log('   • Frontend: http://localhost:8082 (Vite dev server)');
    console.log('   • Backend:  http://localhost:8888 (Express API server)');
    console.log('   • Proxy:    /api requests → backend automatically');
    
    console.log('\n❌ AVOID:');
    console.log('   • Port 8083 - can cause conflicts and app failures');
    console.log('   • Multiple frontend servers running simultaneously');
    console.log('   • Direct backend calls from frontend');
    
    console.log('\n🚀 USAGE:');
    console.log('   1. Always use http://localhost:8082 for development');
    console.log('   2. Login: admin@school.com / admin123');
    console.log('   3. All pages should work without crashes');
    console.log('   4. Kill port 8083 if it starts automatically');
    
    console.log('\n' + '='.repeat(55));
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

testAppStability().catch(console.error);
