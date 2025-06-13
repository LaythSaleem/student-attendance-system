#!/usr/bin/env node

// Direct API test to debug 404 issue
const http = require('http');

function testEndpoint(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      method: 'GET',
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function debugAPI() {
  console.log('🔍 Debugging API Endpoints...\n');

  try {
    // Test 1: Health endpoint
    console.log('1. Testing /api/health...');
    const healthRes = await testEndpoint('/health');
    console.log(`   Status: ${healthRes.status}`);
    console.log(`   Response: ${healthRes.data.substring(0, 100)}`);

    // Test 2: Login endpoint
    console.log('\n2. Testing /api/auth/login...');
    const loginRes = await testEndpoint('/auth/login');
    console.log(`   Status: ${loginRes.status}`);
    
    // Test 3: Users endpoint (without auth - should give 401)
    console.log('\n3. Testing /api/users (no auth)...');
    const usersRes = await testEndpoint('/users');
    console.log(`   Status: ${usersRes.status}`);
    console.log(`   Response: ${usersRes.data.substring(0, 100)}`);

    // Test 4: Try with a simple POST to login first
    console.log('\n4. Testing actual login...');
    await testLogin();

  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

function testLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'admin@school.com',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Login Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          console.log('   ✅ Login successful, testing users endpoint...');
          testUsersWithAuth(result.token);
        } else {
          console.log(`   ❌ Login failed: ${data}`);
        }
        resolve();
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function testUsersWithAuth(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n5. Testing /api/users with auth token...`);
        console.log(`   Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          const users = JSON.parse(data);
          console.log(`   ✅ Users endpoint working! Found ${users.length} users`);
        } else {
          console.log(`   ❌ Users endpoint failed: ${data}`);
        }
        resolve();
      });
    });

    req.on('error', reject);
    req.end();
  });
}

debugAPI();
