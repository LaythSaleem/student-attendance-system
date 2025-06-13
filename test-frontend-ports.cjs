#!/usr/bin/env node

const http = require('http');

async function testFrontendPorts() {
    console.log('🔍 TESTING FRONTEND PORTS - PORT COMPARISON');
    console.log('='.repeat(50));
    
    const ports = [8082, 8083];
    
    for (const port of ports) {
        console.log(`\n🌐 Testing Frontend on Port ${port}:`);
        console.log(`   URL: http://localhost:${port}`);
        
        try {
            const response = await new Promise((resolve, reject) => {
                const req = http.get(`http://localhost:${port}`, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
                });
                req.on('error', reject);
                req.setTimeout(5000, () => {
                    req.destroy();
                    reject(new Error('Timeout'));
                });
            });
            
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📄 Content Length: ${response.data.length} bytes`);
            
            // Check if it looks like the React app
            if (response.data.includes('vite') || response.data.includes('React')) {
                console.log(`   🎯 React App: YES`);
            } else {
                console.log(`   ❌ React App: NO`);
            }
            
            // Check if it has the correct proxy config
            if (response.data.includes('Scholar Track Pulse') || response.data.includes('Attendance')) {
                console.log(`   🎓 Scholar Track: YES`);
            } else {
                console.log(`   ❌ Scholar Track: NO`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 RECOMMENDATION:');
    console.log('Use the working port (8082) for testing');
    console.log('The issue might be that port 8083 has stale config');
    console.log('='.repeat(50));
}

testFrontendPorts().catch(console.error);
