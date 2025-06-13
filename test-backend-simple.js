#!/usr/bin/env node

// Simple backend test without external dependencies
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testBackend() {
  console.log('🧪 Testing Backend Server...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await makeRequest('http://localhost:3001/api/health');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${healthResponse.data}`);
    
    if (healthResponse.status === 200) {
      console.log('✅ Backend server is responding!\n');
      
      // Test login
      console.log('2. Testing login...');
      const loginData = JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      });
      
      const loginResponse = await makeRequest('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData)
        },
        body: loginData
      });
      
      console.log(`   Login Status: ${loginResponse.status}`);
      console.log(`   Login Response: ${loginResponse.data.substring(0, 100)}...`);
      
      if (loginResponse.status === 200) {
        const loginResult = JSON.parse(loginResponse.data);
        const token = loginResult.token;
        console.log('✅ Login successful!\n');
        
        // Test users endpoint
        console.log('3. Testing users endpoint...');
        const usersResponse = await makeRequest('http://localhost:3001/api/users', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log(`   Users Status: ${usersResponse.status}`);
        if (usersResponse.status === 200) {
          const users = JSON.parse(usersResponse.data);
          console.log(`✅ Found ${users.length} users`);
          console.log('✅ User Management API is working!');
        } else {
          console.log(`❌ Users endpoint failed: ${usersResponse.data}`);
        }
      } else {
        console.log('❌ Login failed');
      }
    } else {
      console.log('❌ Backend server not responding properly');
    }
    
  } catch (error) {
    console.error('❌ Error testing backend:', error.message);
  }
}

testBackend();
