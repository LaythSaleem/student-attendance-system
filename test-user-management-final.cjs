const fs = require('fs');

async function testUserManagementAPI() {
    console.log('🔍 Testing User Management API...');
    
    try {
        // Step 1: Login to get token
        const loginResponse = await fetch('http://localhost:8888/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@school.com',
                password: 'admin123'
            })
        });
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log('Token:', loginData.token.substring(0, 50) + '...');
        
        // Step 2: Test users endpoint
        const usersResponse = await fetch('http://localhost:8888/api/users', {
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!usersResponse.ok) {
            throw new Error(`Users API failed: ${usersResponse.status}`);
        }
        
        const users = await usersResponse.json();
        console.log('✅ Users API successful');
        console.log('Total users:', users.length);
        console.log('Sample user:', users[0]);
        
        // Step 3: Test frontend accessibility
        const frontendResponse = await fetch('http://localhost:8082');
        if (frontendResponse.ok) {
            console.log('✅ Frontend accessible');
        }
        
        // Step 4: Check if vite proxy is working
        const proxyResponse = await fetch('http://localhost:8082/api/users', {
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (proxyResponse.ok) {
            const proxyUsers = await proxyResponse.json();
            console.log('✅ Vite proxy working - Users count:', proxyUsers.length);
        } else {
            console.log('❌ Vite proxy issue:', proxyResponse.status);
        }
        
        console.log('\n🎯 User Management should now work correctly!');
        console.log('Visit: http://localhost:8082/admin');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testUserManagementAPI();
