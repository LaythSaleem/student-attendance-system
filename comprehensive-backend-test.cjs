#!/usr/bin/env node
const http = require('http');

console.log('🔍 COMPREHENSIVE BACKEND API TEST');
console.log('='.repeat(60));

// All API endpoints to test systematically
const endpoints = [
  // ✅ Authentication endpoints
  { category: 'Authentication', method: 'POST', path: '/api/auth/login', data: {email: 'admin@school.com', password: 'admin123'} },
  { category: 'Authentication', method: 'POST', path: '/api/auth/login', data: {email: 'teacher@school.com', password: 'teacher123'} },
  { category: 'Authentication', method: 'POST', path: '/api/auth/login', data: {email: 'john.doe@student.school.com', password: 'student123'} },
  
  // ✅ Students Management
  { category: 'Students', method: 'GET', path: '/api/students' },
  { category: 'Students', method: 'GET', path: '/api/students/student_1' },
  { category: 'Students', method: 'GET', path: '/api/students/student_1/profile' },
  
  // ✅ Teachers Management  
  { category: 'Teachers', method: 'GET', path: '/api/teachers' },
  { category: 'Teachers', method: 'GET', path: '/api/teachers/dropdown' },
  { category: 'Teachers', method: 'GET', path: '/api/teachers/teacher_1' },
  { category: 'Teachers', method: 'GET', path: '/api/teachers/teacher_1/dashboard' },
  { category: 'Teachers', method: 'GET', path: '/api/teachers/teacher_1/classes' },
  { category: 'Teachers', method: 'GET', path: '/api/teachers/classes/stage_1/students' },
  
  // ✅ Classes Management
  { category: 'Classes', method: 'GET', path: '/api/classes' },
  { category: 'Classes', method: 'GET', path: '/api/classes/stage_1' },
  { category: 'Classes', method: 'GET', path: '/api/classes/stage_1/topics' },
  
  // ✅ Topics Management
  { category: 'Topics', method: 'GET', path: '/api/topics' },
  { category: 'Topics', method: 'GET', path: '/api/topics/stage_1' },
  
  // ✅ Attendance System
  { category: 'Attendance', method: 'GET', path: '/api/attendance' },
  { category: 'Attendance', method: 'GET', path: '/api/attendance/student_1' },
  { category: 'Attendance', method: 'GET', path: '/api/attendance/reports/summary' },
  { category: 'Attendance', method: 'GET', path: '/api/attendance/reports/detailed' },
  
  // ✅ Exams Management
  { category: 'Exams', method: 'GET', path: '/api/exams' },
  { category: 'Exams', method: 'GET', path: '/api/exam-types' },
  { category: 'Exams', method: 'GET', path: '/api/exams/student_1/results' },
  
  // ✅ Reports & Analytics
  { category: 'Reports', method: 'GET', path: '/api/reports/attendance-summary' },
  { category: 'Reports', method: 'GET', path: '/api/reports/attendance-detailed' },
  { category: 'Reports', method: 'GET', path: '/api/reports/student-performance' },
  
  // ✅ Dropdown Data
  { category: 'Dropdowns', method: 'GET', path: '/api/academic-years/dropdown' },
  { category: 'Dropdowns', method: 'GET', path: '/api/subjects/dropdown' },
  { category: 'Dropdowns', method: 'GET', path: '/api/teachers/dropdown' },
  
  // ✅ User Management
  { category: 'Users', method: 'GET', path: '/api/users' },
  { category: 'Users', method: 'GET', path: '/api/users/1' },
  
  // ✅ Student Portal APIs
  { category: 'Student Portal', method: 'GET', path: '/api/students/my-classes' },
  { category: 'Student Portal', method: 'GET', path: '/api/students/my-attendance' },
  
  // ✅ System Health
  { category: 'System', method: 'GET', path: '/api/health' },
  { category: 'System', method: 'GET', path: '/api/stats' }
];

async function testEndpoint(endpoint, token = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8888,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    let postData = '';
    if (endpoint.data && endpoint.method !== 'GET') {
      postData = JSON.stringify(endpoint.data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: data,
            endpoint: endpoint
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            success: false,
            error: 'Invalid JSON response',
            endpoint: endpoint
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        success: false,
        error: error.message,
        endpoint: endpoint
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runComprehensiveTest() {
  console.log('🚀 Starting comprehensive backend test...\n');
  
  let adminToken = null;
  let teacherToken = null;
  let studentToken = null;
  
  const results = {};
  let totalTests = 0;
  let passedTests = 0;
  
  // Test authentication first and get tokens
  console.log('🔐 AUTHENTICATION TESTS');
  console.log('-'.repeat(40));
  
  for (const endpoint of endpoints.filter(e => e.category === 'Authentication')) {
    const result = await testEndpoint(endpoint);
    totalTests++;
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${endpoint.method} ${endpoint.path} - ${result.status}`);
    
    if (result.success) {
      passedTests++;
      if (endpoint.data.email === 'admin@school.com') {
        adminToken = result.data.token;
      } else if (endpoint.data.email === 'teacher@school.com') {
        teacherToken = result.data.token;
      } else if (endpoint.data.email.includes('student')) {
        studentToken = result.data.token;
      }
    }
    
    if (!results[endpoint.category]) results[endpoint.category] = [];
    results[endpoint.category].push(result);
  }
  
  console.log(`\n📊 Admin Token: ${adminToken ? 'Obtained' : 'Failed'}`);
  console.log(`📊 Teacher Token: ${teacherToken ? 'Obtained' : 'Failed'}`);
  console.log(`📊 Student Token: ${studentToken ? 'Obtained' : 'Failed'}\n`);
  
  // Test all other endpoints with appropriate tokens
  const categories = [...new Set(endpoints.map(e => e.category))].filter(c => c !== 'Authentication');
  
  for (const category of categories) {
    console.log(`📂 ${category.toUpperCase()} TESTS`);
    console.log('-'.repeat(40));
    
    const categoryEndpoints = endpoints.filter(e => e.category === category);
    
    for (const endpoint of categoryEndpoints) {
      // Choose appropriate token based on endpoint
      let token = adminToken; // Default to admin
      if (endpoint.path.includes('/students/my-')) {
        token = studentToken;
      } else if (endpoint.path.includes('/teachers/') && endpoint.path.includes('/dashboard')) {
        token = teacherToken;
      }
      
      const result = await testEndpoint(endpoint, token);
      totalTests++;
      
      const status = result.success ? '✅' : '❌';
      const dataInfo = result.success && result.data ? 
        (Array.isArray(result.data) ? `[${result.data.length} items]` : 
         typeof result.data === 'object' && Object.keys(result.data).length > 0 ? '[object]' : '') : '';
      
      console.log(`${status} ${endpoint.method} ${endpoint.path} - ${result.status} ${dataInfo}`);
      
      if (result.success) {
        passedTests++;
      } else if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
      
      if (!results[endpoint.category]) results[endpoint.category] = [];
      results[endpoint.category].push(result);
    }
    console.log('');
  }
  
  // Summary
  console.log('📈 COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([category, categoryResults]) => {
    const passed = categoryResults.filter(r => r.success).length;
    const total = categoryResults.length;
    const percentage = Math.round((passed / total) * 100);
    console.log(`${category}: ${passed}/${total} (${percentage}%)`);
  });
  
  console.log(`\n🎯 OVERALL RESULTS:`);
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📊 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  // Detailed failure analysis
  const failures = [];
  Object.values(results).flat().forEach(result => {
    if (!result.success) {
      failures.push(result);
    }
  });
  
  if (failures.length > 0) {
    console.log(`\n🔍 FAILURE ANALYSIS:`);
    console.log('-'.repeat(40));
    failures.forEach(failure => {
      console.log(`❌ ${failure.endpoint.method} ${failure.endpoint.path}`);
      console.log(`   Status: ${failure.status}`);
      console.log(`   Error: ${failure.error || 'Unknown error'}`);
    });
  }
  
  return {
    totalTests,
    passedTests,
    successRate: Math.round((passedTests / totalTests) * 100),
    results,
    tokens: { adminToken, teacherToken, studentToken }
  };
}

// Run the test
runComprehensiveTest().then(testResults => {
  console.log('\n🏁 Backend API testing complete!');
  
  // Write results to file
  const fs = require('fs');
  const report = `# Backend API Test Report
Generated: ${new Date().toISOString()}

## Summary
- Total Tests: ${testResults.totalTests}
- Passed: ${testResults.passedTests}
- Failed: ${testResults.totalTests - testResults.passedTests}
- Success Rate: ${testResults.successRate}%

## Test Results by Category
${Object.entries(testResults.results).map(([category, results]) => {
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  return `### ${category}
- Tests: ${total}
- Passed: ${passed}
- Success Rate: ${Math.round((passed/total)*100)}%

${results.map(r => `- ${r.success ? '✅' : '❌'} ${r.endpoint.method} ${r.endpoint.path} (${r.status})`).join('\n')}`;
}).join('\n\n')}
`;
  
  fs.writeFileSync('backend-test-report.md', report);
  console.log('📄 Report saved to: backend-test-report.md');
}).catch(console.error);
