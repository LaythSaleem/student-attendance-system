#!/usr/bin/env node

/**
 * Teacher Dashboard API Endpoint Test
 * Tests all API endpoints used by TeacherDashboardNew component
 */

const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:8888/api';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'teacher@school.com',
  password: 'teacher123'
};

let authToken = '';

console.log('🔍 TEACHER DASHBOARD API ENDPOINT TEST');
console.log('====================================\n');

// Simple fetch implementation using http module
function simpleFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = lib.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, json: () => parsed, status: res.statusCode });
        } catch (e) {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, text: () => data, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function authenticate() {
  try {
    console.log('🔐 Testing authentication...');
    const response = await simpleFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CREDENTIALS)
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data = await response.json();
    authToken = data.token;
    console.log('✅ Authentication successful\n');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return false;
  }
}

async function testEndpoint(name, url, description) {
  try {
    const response = await simpleFetch(url, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      const dataLength = Array.isArray(data) ? data.length : Object.keys(data).length;
      console.log(`✅ ${name}: ${description} (${dataLength} items)`);
      return true;
    } else {
      console.log(`❌ ${name}: ${description} - Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${description} - Error: ${error.message}`);
    return false;
  }
}

async function testAllEndpoints() {
  const endpoints = [
    // Core teacher endpoints
    ['Teacher Classes', `${API_BASE}/teachers/my-classes`, 'Get teacher assigned classes'],
    ['Dashboard Stats', `${API_BASE}/teachers/dashboard-stats`, 'Get dashboard statistics'],
    ['Recent Activity', `${API_BASE}/teachers/recent-activity`, 'Get recent teacher activity'],
    
    // Topic and exam endpoints
    ['My Topics', `${API_BASE}/teachers/my-topics`, 'Get assigned topics'],
    ['Upcoming Exams', `${API_BASE}/teachers/upcoming-exams`, 'Get upcoming exams'],
    ['All Exams', `${API_BASE}/exams`, 'Get all exams'],
    
    // Attendance endpoints
    ['Weekly Attendance', `${API_BASE}/teachers/weekly-attendance`, 'Get weekly attendance data'],
    ['Students Requiring Attention', `${API_BASE}/teachers/students-requiring-attention`, 'Get students with low attendance'],
    ['Students with Attendance', `${API_BASE}/teachers/students-with-attendance`, 'Get students attendance summary'],
    ['Attendance Reports', `${API_BASE}/teachers/attendance-reports`, 'Get attendance reports'],
    ['Attendance Records', `${API_BASE}/teachers/attendance-records`, 'Get attendance records'],
    
    // Photo attendance endpoint (POST endpoint - just checking if it exists)
    // ['Photo Attendance', `${API_BASE}/teachers/photo-attendance`, 'Submit photo attendance'],
    
    // Exam attendance endpoints
    ['Exam Attendance Records', `${API_BASE}/teachers/exam-attendance-records`, 'Get exam attendance records']
  ];

  console.log('📊 Testing API endpoints...\n');
  
  let successCount = 0;
  let totalCount = endpoints.length;

  for (const [name, url, description] of endpoints) {
    const success = await testEndpoint(name, url, description);
    if (success) successCount++;
  }

  console.log(`\n📈 ENDPOINT TEST RESULTS:`);
  console.log(`✅ Working: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
  
  return { successCount, totalCount };
}

async function testClassSpecificEndpoints() {
  console.log('\n🏫 Testing class-specific endpoints...\n');
  
  try {
    // Get first class
    const classesResponse = await simpleFetch(`${API_BASE}/teachers/my-classes`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!classesResponse.ok) {
      console.log('❌ Cannot get classes for class-specific tests');
      return;
    }
    
    const classes = await classesResponse.json();
    if (classes.length === 0) {
      console.log('❌ No classes available for class-specific tests');
      return;
    }
    
    const testClass = classes[0];
    console.log(`📋 Using test class: ${testClass.name} (${testClass.id})`);
    
    // Test class students endpoint
    await testEndpoint(
      'Class Students', 
      `${API_BASE}/teachers/classes/${testClass.id}/students`, 
      `Get students for class ${testClass.name}`
    );
    
    // Test attendance with class filter
    const today = new Date().toISOString().split('T')[0];
    await testEndpoint(
      'Attendance Records (Filtered)', 
      `${API_BASE}/teachers/attendance-records?classId=${testClass.id}&date=${today}`, 
      'Get attendance records for specific class and date'
    );
    
  } catch (error) {
    console.log('❌ Class-specific endpoint tests failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Teacher Dashboard API tests...\n');
  
  // Test authentication
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test basic endpoints
  const { successCount, totalCount } = await testAllEndpoints();
  
  // Test class-specific endpoints
  await testClassSpecificEndpoints();
  
  // Final summary
  console.log('\n🎯 FINAL RESULTS');
  console.log('==============');
  
  if (successCount === totalCount) {
    console.log('✅ ALL ENDPOINTS WORKING!');
    console.log('🎉 Teacher Dashboard backend is fully functional');
  } else {
    console.log(`⚠️  ${totalCount - successCount} endpoints need attention`);
    console.log('🔧 Some features may not work properly');
  }
  
  console.log('\n🌐 ACCESS INFO:');
  console.log('- Frontend: http://localhost:8082');
  console.log('- Backend: http://localhost:8888');
  console.log('- Login: teacher@school.com / teacher123');
}

// Run the tests
runTests().catch(console.error);
