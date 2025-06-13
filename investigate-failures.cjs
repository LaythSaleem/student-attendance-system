#!/usr/bin/env node
const http = require('http');

console.log('🔍 INVESTIGATING FAILED API ENDPOINTS');
console.log('='.repeat(50));

async function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8888,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    let postData = '';
    if (data && method !== 'GET') {
      postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: responseData,
            rawBody: body
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            success: false,
            error: 'Invalid JSON response',
            rawBody: body
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        success: false,
        error: error.message
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function investigateFailures() {
  // First get admin token
  const adminLogin = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@school.com',
    password: 'admin123'
  });

  if (!adminLogin.success) {
    console.log('❌ Cannot get admin token for investigation');
    return;
  }

  const token = adminLogin.data.token;
  console.log('✅ Got admin token for investigation\n');

  // Issue 1: Student Update Failure
  console.log('🔍 INVESTIGATING STUDENT UPDATE FAILURE');
  console.log('-'.repeat(40));

  // First create a test student
  const testStudent = {
    name: 'Debug Test Student',
    rollNumber: 'DEBUG001',
    class: 'Debug Class',
    section: 'A',
    parentPhone: '+1234567890',
    address: 'Debug Address',
    email: 'debug.test@student.com'
  };

  const createResult = await makeRequest('POST', '/api/students', testStudent, token);
  console.log(`Student Creation: ${createResult.success ? '✅' : '❌'} Status: ${createResult.status}`);

  if (createResult.success) {
    const studentId = createResult.data.id;
    console.log(`Created student with ID: ${studentId}`);

    // Try to update the student
    const updateData = {
      ...testStudent,
      name: 'Updated Debug Student'
    };

    const updateResult = await makeRequest('PUT', `/api/students/${studentId}`, updateData, token);
    console.log(`Student Update: ${updateResult.success ? '✅' : '❌'} Status: ${updateResult.status}`);
    
    if (!updateResult.success) {
      console.log('Update Error Details:');
      console.log('Raw Response:', updateResult.rawBody);
      console.log('Parsed Data:', updateResult.data);
    }

    // Clean up
    await makeRequest('DELETE', `/api/students/${studentId}`, null, token);
  }

  console.log('\n🔍 INVESTIGATING TEACHER CREATION FAILURE');
  console.log('-'.repeat(40));

  // Issue 2: Teacher Creation Failure
  const testTeacher = {
    name: 'Debug Test Teacher',
    email: 'debug.teacher@school.com',
    phone: '+1234567890',
    address: 'Debug Teacher Address'
  };

  const teacherResult = await makeRequest('POST', '/api/teachers', testTeacher, token);
  console.log(`Teacher Creation: ${teacherResult.success ? '✅' : '❌'} Status: ${teacherResult.status}`);
  
  if (!teacherResult.success) {
    console.log('Teacher Creation Error Details:');
    console.log('Raw Response:', teacherResult.rawBody);
    console.log('Parsed Data:', teacherResult.data);
  } else {
    // Clean up if successful
    await makeRequest('DELETE', `/api/teachers/${teacherResult.data.id}`, null, token);
  }

  // Additional diagnostic - check server logs
  console.log('\n📋 DIAGNOSTIC RECOMMENDATIONS:');
  console.log('-'.repeat(40));
  console.log('1. Check server console logs for detailed error messages');
  console.log('2. Verify database schema for students and teachers tables');
  console.log('3. Check for missing required fields in API requests');
  console.log('4. Verify foreign key constraints and relationships');
}

investigateFailures().catch(console.error);
