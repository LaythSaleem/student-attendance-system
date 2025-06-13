#!/usr/bin/env node

// Debug script to identify API issues with Teachers, Attendance Reports, and User Management

console.log('🔍 DEBUGGING API ISSUES');
console.log('========================\n');

const BASE_URL = 'http://localhost:8888';

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { body: JSON.stringify(data) })
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.text();
    
    return {
      status: response.status,
      ok: response.ok,
      data: responseData
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function testAPIs() {
  let authToken = null;

  // Step 1: Login to get token
  console.log('1️⃣ Testing Authentication...');
  const loginResponse = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@school.com',
    password: 'admin123'
  });

  if (loginResponse.ok) {
    try {
      const loginData = JSON.parse(loginResponse.data);
      authToken = loginData.token;
      console.log('   ✅ Login successful');
    } catch (e) {
      console.log('   ❌ Login response parsing failed:', e.message);
      return;
    }
  } else {
    console.log('   ❌ Login failed:', loginResponse.status, loginResponse.data);
    return;
  }

  // Step 2: Test Teachers API
  console.log('\n2️⃣ Testing Teachers API...');
  const teachersResponse = await makeRequest('GET', '/api/teachers', null, authToken);
  if (teachersResponse.ok) {
    try {
      const teachers = JSON.parse(teachersResponse.data);
      console.log(`   ✅ Teachers API working: ${teachers.length} teachers found`);
    } catch (e) {
      console.log('   ❌ Teachers response parsing failed:', e.message);
    }
  } else {
    console.log('   ❌ Teachers API failed:', teachersResponse.status, teachersResponse.data || teachersResponse.error);
  }

  // Step 3: Test Attendance Reports API
  console.log('\n3️⃣ Testing Attendance Reports API...');
  const attendanceResponse = await makeRequest('GET', '/api/attendance', null, authToken);
  if (attendanceResponse.ok) {
    try {
      const attendance = JSON.parse(attendanceResponse.data);
      console.log(`   ✅ Attendance API working: ${attendance.length} records found`);
    } catch (e) {
      console.log('   ❌ Attendance response parsing failed:', e.message);
    }
  } else {
    console.log('   ❌ Attendance API failed:', attendanceResponse.status, attendanceResponse.data || attendanceResponse.error);
  }

  // Step 4: Test User Management API
  console.log('\n4️⃣ Testing User Management API...');
  const usersResponse = await makeRequest('GET', '/api/users', null, authToken);
  if (usersResponse.ok) {
    try {
      const users = JSON.parse(usersResponse.data);
      console.log(`   ✅ Users API working: ${users.length} users found`);
    } catch (e) {
      console.log('   ❌ Users response parsing failed:', e.message);
    }
  } else {
    console.log('   ❌ Users API failed:', usersResponse.status, usersResponse.data || usersResponse.error);
  }

  // Step 5: Test specific endpoints that might be failing
  console.log('\n5️⃣ Testing Additional Endpoints...');
  
  const endpoints = [
    '/api/teachers/dropdown',
    '/api/teachers/available-topics',
    '/api/reports/attendance-detailed',
    '/api/academic-years/dropdown'
  ];

  for (const endpoint of endpoints) {
    const response = await makeRequest('GET', endpoint, null, authToken);
    if (response.ok) {
      try {
        const data = JSON.parse(response.data);
        console.log(`   ✅ ${endpoint}: ${Array.isArray(data) ? data.length + ' items' : 'OK'}`);
      } catch (e) {
        console.log(`   ⚠️  ${endpoint}: Response not JSON`);
      }
    } else {
      console.log(`   ❌ ${endpoint}: ${response.status} ${response.data || response.error}`);
    }
  }

  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log('If you see ✅ for all APIs above, the backend is working correctly.');
  console.log('If you see ❌, there may be issues with:');
  console.log('  - Server not running on port 8888');
  console.log('  - Database connection issues');
  console.log('  - Authentication problems');
  console.log('  - Missing API endpoints');
}

// Import fetch for Node.js
import('node-fetch').then(({ default: fetch }) => {
  global.fetch = fetch;
  testAPIs();
}).catch(err => {
  console.log('Please install node-fetch: npm install node-fetch');
  console.log('Or use a Node.js version with built-in fetch (18+)');
});
