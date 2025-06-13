#!/usr/bin/env node
const http = require('http');
const fs = require('fs');

console.log('🚀 COMPREHENSIVE APPLICATION INTEGRATION TEST');
console.log('='.repeat(70));

class ApplicationTester {
  constructor() {
    this.results = {
      authentication: [],
      studentManagement: [],
      teacherManagement: [],
      classManagement: [],
      attendanceSystem: [],
      examSystem: [],
      reportSystem: [],
      userSystem: [],
      systemHealth: []
    };
    this.tokens = {};
    this.testData = {};
  }

  async makeRequest(method, path, data = null, token = null) {
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
              data: responseData
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

  logTest(category, test, result) {
    const status = result.success ? '✅' : '❌';
    const info = result.data && Array.isArray(result.data) ? 
      `[${result.data.length} items]` : 
      result.data && typeof result.data === 'object' ? '[object]' : '';
    
    console.log(`${status} ${test} - ${result.status} ${info}`);
    
    if (!result.success && result.error) {
      console.log(`    Error: ${result.error}`);
    }

    this.results[category].push({
      test,
      ...result
    });
  }

  async testAuthentication() {
    console.log('\n🔐 AUTHENTICATION SYSTEM TEST');
    console.log('-'.repeat(50));

    // Test Admin Login
    const adminLogin = await this.makeRequest('POST', '/api/auth/login', {
      email: 'admin@school.com',
      password: 'admin123'
    });
    this.logTest('authentication', 'Admin Login', adminLogin);
    if (adminLogin.success) {
      this.tokens.admin = adminLogin.data.token;
    }

    // Test Teacher Login
    const teacherLogin = await this.makeRequest('POST', '/api/auth/login', {
      email: 'teacher@school.com',
      password: 'teacher123'
    });
    this.logTest('authentication', 'Teacher Login', teacherLogin);
    if (teacherLogin.success) {
      this.tokens.teacher = teacherLogin.data.token;
    }

    // Test Invalid Login
    const invalidLogin = await this.makeRequest('POST', '/api/auth/login', {
      email: 'invalid@test.com',
      password: 'wrong'
    });
    this.logTest('authentication', 'Invalid Login (Should Fail)', {
      success: !invalidLogin.success,
      status: invalidLogin.status
    });

    // Test Token Validation
    if (this.tokens.admin) {
      const profileTest = await this.makeRequest('GET', '/api/user/profile', null, this.tokens.admin);
      this.logTest('authentication', 'Token Validation', profileTest);
    }
  }

  async testStudentManagement() {
    console.log('\n👥 STUDENT MANAGEMENT SYSTEM TEST');
    console.log('-'.repeat(50));

    const token = this.tokens.admin;

    // Get all students
    const students = await this.makeRequest('GET', '/api/students', null, token);
    this.logTest('studentManagement', 'Get All Students', students);
    
    if (students.success && students.data.length > 0) {
      this.testData.studentId = students.data[0].id;
    }

    // Test creating a new student
    const newStudent = {
      name: 'Test Student Integration',
      rollNumber: 'TEST001',
      class: 'Test Class',
      section: 'A',
      parentPhone: '+1234567890',
      address: 'Test Address',
      email: 'test.integration@student.com'
    };

    const createStudent = await this.makeRequest('POST', '/api/students', newStudent, token);
    this.logTest('studentManagement', 'Create New Student', createStudent);
    
    if (createStudent.success) {
      this.testData.newStudentId = createStudent.data.id;
      
      // Test updating the student
      const updateStudent = await this.makeRequest('PUT', `/api/students/${this.testData.newStudentId}`, {
        ...newStudent,
        name: 'Updated Test Student'
      }, token);
      this.logTest('studentManagement', 'Update Student', updateStudent);
      
      // Test deleting the student
      const deleteStudent = await this.makeRequest('DELETE', `/api/students/${this.testData.newStudentId}`, null, token);
      this.logTest('studentManagement', 'Delete Student', deleteStudent);
    }
  }

  async testTeacherManagement() {
    console.log('\n👨‍🏫 TEACHER MANAGEMENT SYSTEM TEST');
    console.log('-'.repeat(50));

    const token = this.tokens.admin;

    // Get all teachers
    const teachers = await this.makeRequest('GET', '/api/teachers', null, token);
    this.logTest('teacherManagement', 'Get All Teachers', teachers);

    // Get teachers dropdown
    const teachersDropdown = await this.makeRequest('GET', '/api/teachers/dropdown', null, token);
    this.logTest('teacherManagement', 'Get Teachers Dropdown', teachersDropdown);

    // Test creating a new teacher
    const newTeacher = {
      name: 'Test Teacher Integration',
      email: 'test.teacher@school.com',
      phone: '+1234567890',
      address: 'Test Teacher Address'
    };

    const createTeacher = await this.makeRequest('POST', '/api/teachers', newTeacher, token);
    this.logTest('teacherManagement', 'Create New Teacher', createTeacher);
    
    if (createTeacher.success) {
      this.testData.newTeacherId = createTeacher.data.id;
      
      // Test deleting the teacher
      const deleteTeacher = await this.makeRequest('DELETE', `/api/teachers/${this.testData.newTeacherId}`, null, token);
      this.logTest('teacherManagement', 'Delete Teacher', deleteTeacher);
    }
  }

  async testClassManagement() {
    console.log('\n🏫 CLASS MANAGEMENT SYSTEM TEST');
    console.log('-'.repeat(50));

    const token = this.tokens.admin;

    // Get all classes
    const classes = await this.makeRequest('GET', '/api/classes', null, token);
    this.logTest('classManagement', 'Get All Classes', classes);
    
    if (classes.success && classes.data.length > 0) {
      this.testData.classId = classes.data[0].id;
      
      // Get class topics
      const topics = await this.makeRequest('GET', `/api/classes/${this.testData.classId}/topics`, null, token);
      this.logTest('classManagement', 'Get Class Topics', topics);
      
      // Test creating a new topic
      const newTopic = {
        name: 'Test Topic Integration',
        description: 'Test topic for integration testing',
        status: 'planned',
        order_index: 999
      };

      const createTopic = await this.makeRequest('POST', `/api/classes/${this.testData.classId}/topics`, newTopic, token);
      this.logTest('classManagement', 'Create New Topic', createTopic);
    }

    // Get all topics
    const allTopics = await this.makeRequest('GET', '/api/topics', null, token);
    this.logTest('classManagement', 'Get All Topics', allTopics);
  }

  async testAttendanceSystem() {
    console.log('\n📊 ATTENDANCE SYSTEM TEST');
    console.log('-'.repeat(50));

    const token = this.tokens.admin;

    // Get attendance records
    const attendance = await this.makeRequest('GET', '/api/attendance', null, token);
    this.logTest('attendanceSystem', 'Get Attendance Records', attendance);

    // Test student portal attendance (if student token available)
    if (this.tokens.student) {
      const myAttendance = await this.makeRequest('GET', '/api/students/my-attendance', null, this.tokens.student);
      this.logTest('attendanceSystem', 'Student My Attendance', myAttendance);
    }
  }

  async testExamSystem() {
    console.log('\n📝 EXAM MANAGEMENT SYSTEM TEST');
    console.log('-'.repeat(50));

    const token = this.tokens.admin;

    // Get all exams
    const exams = await this.makeRequest('GET', '/api/exams', null, token);
    this.logTest('examSystem', 'Get All Exams', exams);

    // Get exam types
    const examTypes = await this.makeRequest('GET', '/api/exam-types', null, token);
    this.logTest('examSystem', 'Get Exam Types', examTypes);
  }

  async testReportSystem() {
    console.log('\n📈 REPORT SYSTEM TEST');
    console.log('-'.repeat(50));

    const token = this.tokens.admin;

    // Test attendance summary report
    const summaryReport = await this.makeRequest('GET', '/api/reports/attendance-summary', null, token);
    this.logTest('reportSystem', 'Attendance Summary Report', summaryReport);

    // Test detailed attendance report
    const detailedReport = await this.makeRequest('GET', '/api/reports/attendance-detailed', null, token);
    this.logTest('reportSystem', 'Attendance Detailed Report', detailedReport);
  }

  async testUserSystem() {
    console.log('\n👤 USER MANAGEMENT SYSTEM TEST');
    console.log('-'.repeat(50));

    const token = this.tokens.admin;

    // Get all users
    const users = await this.makeRequest('GET', '/api/users', null, token);
    this.logTest('userSystem', 'Get All Users', users);

    // Test creating a new user
    const newUser = {
      email: 'test.integration@user.com',
      password: 'testpass123',
      role: 'student',
      name: 'Test Integration User'
    };

    const createUser = await this.makeRequest('POST', '/api/users', newUser, token);
    this.logTest('userSystem', 'Create New User', createUser);
    
    if (createUser.success) {
      this.testData.newUserId = createUser.data.id;
      
      // Test deleting the user
      const deleteUser = await this.makeRequest('DELETE', `/api/users/${this.testData.newUserId}`, null, token);
      this.logTest('userSystem', 'Delete User', deleteUser);
    }
  }

  async testSystemHealth() {
    console.log('\n💓 SYSTEM HEALTH TEST');
    console.log('-'.repeat(50));

    // Test health endpoint
    const health = await this.makeRequest('GET', '/api/health');
    this.logTest('systemHealth', 'Health Check', health);

    // Test academic years
    const academicYears = await this.makeRequest('GET', '/api/academic-years/dropdown', null, this.tokens.admin);
    this.logTest('systemHealth', 'Academic Years Dropdown', academicYears);
  }

  generateReport() {
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(70));

    let totalTests = 0;
    let passedTests = 0;

    Object.entries(this.results).forEach(([category, tests]) => {
      const passed = tests.filter(t => t.success).length;
      const total = tests.length;
      const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
      
      totalTests += total;
      passedTests += passed;
      
      const status = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌';
      console.log(`${status} ${category.toUpperCase()}: ${passed}/${total} (${percentage}%)`);
    });

    const overallPercentage = Math.round((passedTests / totalTests) * 100);
    const overallStatus = overallPercentage >= 80 ? '✅' : overallPercentage >= 60 ? '⚠️' : '❌';
    
    console.log(`\n${overallStatus} OVERALL SYSTEM: ${passedTests}/${totalTests} (${overallPercentage}%)`);

    // Detailed failure analysis
    const failures = [];
    Object.values(this.results).flat().forEach(result => {
      if (!result.success) {
        failures.push(result);
      }
    });

    if (failures.length > 0) {
      console.log(`\n🔍 FAILURE ANALYSIS (${failures.length} issues):`);
      console.log('-'.repeat(50));
      failures.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.test}`);
        console.log(`   Status: ${failure.status}`);
        console.log(`   Error: ${failure.error || 'Unknown error'}`);
      });
    }

    // System recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(50));
    
    if (overallPercentage >= 90) {
      console.log('🎉 Excellent! Your system is running very well.');
    } else if (overallPercentage >= 70) {
      console.log('👍 Good system health with minor issues to address.');
    } else {
      console.log('⚠️  System needs attention. Multiple components have issues.');
    }

    // Generate detailed report file
    const report = `# Comprehensive Application Test Report
Generated: ${new Date().toISOString()}

## Executive Summary
- **Overall Score**: ${passedTests}/${totalTests} (${overallPercentage}%)
- **System Status**: ${overallStatus === '✅' ? 'HEALTHY' : overallStatus === '⚠️' ? 'NEEDS ATTENTION' : 'CRITICAL ISSUES'}
- **Total Components Tested**: ${Object.keys(this.results).length}

## Test Results by Category
${Object.entries(this.results).map(([category, tests]) => {
  const passed = tests.filter(t => t.success).length;
  const total = tests.length;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
  
  return `### ${category.toUpperCase()}
- **Score**: ${passed}/${total} (${percentage}%)
- **Status**: ${percentage >= 80 ? 'PASSING' : percentage >= 60 ? 'WARNING' : 'FAILING'}

${tests.map(test => `- ${test.success ? '✅' : '❌'} ${test.test} (${test.status})`).join('\n')}`;
}).join('\n\n')}

## Detailed Failure Analysis
${failures.length > 0 ? failures.map((failure, index) => 
  `### ${index + 1}. ${failure.test}
- **Status Code**: ${failure.status}
- **Error**: ${failure.error || 'Unknown error'}
`).join('\n') : 'No failures detected! 🎉'}

## System Health Indicators
- **Authentication**: ${this.results.authentication.filter(t => t.success).length}/${this.results.authentication.length} working
- **Database Operations**: ${this.results.studentManagement.filter(t => t.success).length + this.results.teacherManagement.filter(t => t.success).length + this.results.classManagement.filter(t => t.success).length} CRUD operations tested
- **API Endpoints**: ${passedTests} endpoints responding correctly
- **Token Security**: ${this.tokens.admin ? 'Admin ✅' : 'Admin ❌'} ${this.tokens.teacher ? 'Teacher ✅' : 'Teacher ❌'}

## Recommendations
${overallPercentage >= 90 ? '🎉 **Excellent Performance**: System is running optimally with minimal issues.' :
  overallPercentage >= 70 ? '👍 **Good Performance**: Address minor issues for optimal performance.' :
  '⚠️ **Needs Attention**: Multiple system components require immediate attention.'}
`;

    fs.writeFileSync('comprehensive-test-report.md', report);
    console.log('\n📄 Detailed report saved to: comprehensive-test-report.md');

    return {
      totalTests,
      passedTests,
      overallPercentage,
      status: overallStatus,
      failures: failures.length
    };
  }

  async runFullTest() {
    console.log('🚀 Starting comprehensive application test...');
    console.log('This will test all major system components...\n');

    try {
      await this.testAuthentication();
      await this.testStudentManagement();
      await this.testTeacherManagement();
      await this.testClassManagement();
      await this.testAttendanceSystem();
      await this.testExamSystem();
      await this.testReportSystem();
      await this.testUserSystem();
      await this.testSystemHealth();

      return this.generateReport();
    } catch (error) {
      console.log(`❌ Test suite failed: ${error.message}`);
      return null;
    }
  }
}

// Run the comprehensive test
const tester = new ApplicationTester();
tester.runFullTest().then((results) => {
  if (results) {
    console.log('\n🏁 Comprehensive application testing complete!');
    console.log(`Final Score: ${results.passedTests}/${results.totalTests} (${results.overallPercentage}%)`);
  }
}).catch(console.error);
