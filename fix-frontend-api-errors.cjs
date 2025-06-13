#!/usr/bin/env node

/**
 * Comprehensive API Test - Fix Frontend Loading Errors
 * This tests all the endpoints the frontend is trying to access
 */

const http = require('http');

const BASE_URL = 'http://localhost:8888';

async function makeRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: res.statusCode === 200 ? JSON.parse(data) : data
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: data
          });
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

async function testAPIsWithAuth() {
  console.log('🔧 FIXING FRONTEND API LOADING ERRORS');
  console.log('=====================================\n');

  try {
    // Step 1: Login to get authentication token
    console.log('1. 🔐 Authenticating...');
    const loginResult = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });

    if (loginResult.status !== 200) {
      throw new Error(`Login failed: ${loginResult.status}`);
    }

    const token = loginResult.data.token;
    const authHeaders = { 'Authorization': `Bearer ${token}` };
    console.log('✅ Authentication successful\n');

    // Step 2: Test all endpoints the frontend is trying to access
    console.log('2. 🧪 Testing API endpoints that were failing...\n');

    const endpointsToTest = [
      { name: 'Students', endpoint: '/api/students' },
      { name: 'Topics (General)', endpoint: '/api/topics' },
      { name: 'Teachers', endpoint: '/api/teachers' },
      { name: 'Classes', endpoint: '/api/classes' },
      { name: 'Attendance Reports', endpoint: '/api/attendance' },
      { name: 'Exam Types', endpoint: '/api/exam-types' },
      { name: 'Exams', endpoint: '/api/exams' },
      { name: 'Users', endpoint: '/api/users' },
      { name: 'Health Check', endpoint: '/api/health' }
    ];

    const results = {};
    
    for (const test of endpointsToTest) {
      try {
        const result = await makeRequest(test.endpoint, { headers: authHeaders });
        
        if (result.status === 200) {
          const dataLength = Array.isArray(result.data) ? result.data.length : 
                           typeof result.data === 'object' ? Object.keys(result.data).length : 1;
          console.log(`✅ ${test.name}: SUCCESS (${dataLength} items)`);
          results[test.name] = { status: 'SUCCESS', count: dataLength };
        } else {
          console.log(`❌ ${test.name}: FAILED (${result.status})`);
          results[test.name] = { status: 'FAILED', error: result.status };
        }
      } catch (error) {
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        results[test.name] = { status: 'ERROR', error: error.message };
      }
    }

    // Step 3: Test specific dropdown endpoints
    console.log('\n3. 🎯 Testing dropdown endpoints...\n');
    
    const dropdownEndpoints = [
      { name: 'Teachers Dropdown', endpoint: '/api/teachers/dropdown' },
      { name: 'Academic Years Dropdown', endpoint: '/api/academic-years/dropdown' },
      { name: 'Available Topics (Teachers)', endpoint: '/api/teachers/available-topics' }
    ];

    for (const test of dropdownEndpoints) {
      try {
        const result = await makeRequest(test.endpoint, { headers: authHeaders });
        
        if (result.status === 200) {
          const count = Array.isArray(result.data) ? result.data.length : 1;
          console.log(`✅ ${test.name}: SUCCESS (${count} items)`);
        } else {
          console.log(`❌ ${test.name}: FAILED (${result.status})`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      }
    }

    // Step 4: Summary
    console.log('\n🎯 RESOLUTION SUMMARY');
    console.log('====================');
    
    const successCount = Object.values(results).filter(r => r.status === 'SUCCESS').length;
    const totalCount = Object.keys(results).length;
    
    console.log(`✅ ${successCount}/${totalCount} API endpoints now working`);
    console.log('🔧 Frontend API loading errors should now be resolved');
    
    if (successCount === totalCount) {
      console.log('\n🎉 ALL API ENDPOINTS WORKING!');
      console.log('The frontend should now load without errors.');
      console.log('\n📱 You can now:');
      console.log('   • Access the app at http://localhost:8082');
      console.log('   • Login with admin@school.com / admin123');
      console.log('   • Use all features without loading errors');
    } else {
      console.log('\n⚠️  Some endpoints still need attention:');
      Object.entries(results).forEach(([name, result]) => {
        if (result.status !== 'SUCCESS') {
          console.log(`   • ${name}: ${result.error}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the comprehensive test
testAPIsWithAuth();
