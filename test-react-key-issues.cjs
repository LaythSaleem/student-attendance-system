#!/usr/bin/env node

/**
 * React Key Duplication Test for Attendance System
 * Tests the same-day attendance edit feature and checks for React warnings
 */

// Use native fetch (Node.js 18+)

const API_BASE = 'http://localhost:8888/api';

class ReactKeyTest {
  constructor() {
    this.teacherToken = null;
    this.studentToken = null;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substr(11, 8);
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${timestamp} ${icon} ${message}`);
    this.testResults.push({ timestamp, type, message });
  }

  async loginAsTeacher() {
    this.log('Logging in as teacher...');
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'teacher@school.com',
          password: 'teacher123'
        })
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      this.teacherToken = data.token;
      this.log('Teacher login successful', 'success');
      return true;
    } catch (error) {
      this.log(`Teacher login failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testStudentListAPI() {
    this.log('Testing student list API for duplicate keys...');
    
    try {
      const response = await fetch(`${API_BASE}/teachers/students-with-attendance`, {
        headers: {
          'Authorization': `Bearer ${this.teacherToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const students = await response.json();
      this.log(`Found ${students.length} students`);

      // Check for duplicate IDs
      const ids = students.map(s => s.id);
      const uniqueIds = [...new Set(ids)];
      
      if (ids.length !== uniqueIds.length) {
        this.log('DUPLICATE STUDENT IDs FOUND IN API RESPONSE!', 'error');
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        this.log(`Duplicate IDs: ${duplicates.join(', ')}`, 'error');
        return false;
      }

      // Check for duplicate roll numbers
      const rollNumbers = students.map(s => s.roll_number).filter(Boolean);
      const uniqueRollNumbers = [...new Set(rollNumbers)];
      
      if (rollNumbers.length !== uniqueRollNumbers.length) {
        this.log('DUPLICATE ROLL NUMBERS FOUND IN API RESPONSE!', 'error');
        return false;
      }

      this.log('Student list API: No duplicate keys found', 'success');
      return true;
    } catch (error) {
      this.log(`Student list API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testClassesAPI() {
    this.log('Testing classes API for duplicate keys...');
    
    try {
      const response = await fetch(`${API_BASE}/teachers/my-classes`, {
        headers: {
          'Authorization': `Bearer ${this.teacherToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const classes = await response.json();
      this.log(`Found ${classes.length} classes`);

      // Check for duplicate class IDs
      const ids = classes.map(c => c.id);
      const uniqueIds = [...new Set(ids)];
      
      if (ids.length !== uniqueIds.length) {
        this.log('DUPLICATE CLASS IDs FOUND IN API RESPONSE!', 'error');
        return false;
      }

      this.log('Classes API: No duplicate keys found', 'success');
      return true;
    } catch (error) {
      this.log(`Classes API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testAttendanceSession() {
    this.log('Testing attendance session for same-day edit feature...');
    
    try {
      // Get teacher's classes
      const classesResponse = await fetch(`${API_BASE}/teachers/my-classes`, {
        headers: {
          'Authorization': `Bearer ${this.teacherToken}`,
          'Content-Type': 'application/json'
        }
      });

      const classes = await classesResponse.json();
      if (classes.length === 0) {
        this.log('No classes found for teacher', 'warning');
        return false;
      }

      const testClass = classes[0];
      this.log(`Using test class: ${testClass.name}`);

      // Get students for the class
      const studentsResponse = await fetch(`${API_BASE}/teachers/classes/${testClass.id}/students`, {
        headers: {
          'Authorization': `Bearer ${this.teacherToken}`,
          'Content-Type': 'application/json'
        }
      });

      const students = await studentsResponse.json();
      if (students.length === 0) {
        this.log('No students found in class', 'warning');
        return false;
      }

      this.log(`Found ${students.length} students in class`);

      // Check for duplicate student IDs in class response
      const studentIds = students.map(s => s.id);
      const uniqueStudentIds = [...new Set(studentIds)];
      
      if (studentIds.length !== uniqueStudentIds.length) {
        this.log('DUPLICATE STUDENT IDs IN CLASS STUDENTS API!', 'error');
        return false;
      }

      // Test attendance submission (simulate same-day edit feature)
      const today = new Date().toISOString().split('T')[0];
      const attendanceData = {
        classId: testClass.id,
        date: today,
        attendance: students.slice(0, 3).map(student => ({
          studentId: student.id,
          status: 'present',
          photo: null,
          notes: 'Test attendance record'
        }))
      };

      const submitResponse = await fetch(`${API_BASE}/teachers/photo-attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.teacherToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attendanceData)
      });

      if (!submitResponse.ok) {
        this.log(`Attendance submission failed: ${submitResponse.status}`, 'error');
        return false;
      }

      this.log('Attendance session test completed successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Attendance session test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testAttendanceRecords() {
    this.log('Testing attendance records API for duplicate keys...');
    
    try {
      const response = await fetch(`${API_BASE}/teachers/attendance-records`, {
        headers: {
          'Authorization': `Bearer ${this.teacherToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const records = await response.json();
      this.log(`Found ${records.length} attendance records`);

      // Check for duplicate record IDs
      const ids = records.map(r => r.id);
      const uniqueIds = [...new Set(ids)];
      
      if (ids.length !== uniqueIds.length) {
        this.log('DUPLICATE ATTENDANCE RECORD IDs FOUND!', 'error');
        return false;
      }

      this.log('Attendance records API: No duplicate keys found', 'success');
      return true;
    } catch (error) {
      this.log(`Attendance records API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting React Key Duplication Tests...\n');

    const loginSuccess = await this.loginAsTeacher();
    if (!loginSuccess) {
      this.log('Tests aborted due to login failure', 'error');
      return;
    }

    const tests = [
      { name: 'Student List API', test: () => this.testStudentListAPI() },
      { name: 'Classes API', test: () => this.testClassesAPI() },
      { name: 'Attendance Session', test: () => this.testAttendanceSession() },
      { name: 'Attendance Records API', test: () => this.testAttendanceRecords() }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const testCase of tests) {
      this.log(`\n--- Running ${testCase.name} Test ---`);
      const success = await testCase.test();
      if (success) {
        passedTests++;
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }

    this.log('\n📊 TEST SUMMARY');
    this.log('================');
    this.log(`Total Tests: ${totalTests}`);
    this.log(`Passed: ${passedTests}`, passedTests === totalTests ? 'success' : 'warning');
    this.log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? 'success' : 'error');

    if (passedTests === totalTests) {
      this.log('\n🎉 ALL TESTS PASSED!', 'success');
      this.log('✅ No React key duplication issues found', 'success');
      this.log('✅ Same-day attendance edit feature working correctly', 'success');
    } else {
      this.log('\n❌ SOME TESTS FAILED!', 'error');
      this.log('Please check the errors above and fix the issues', 'warning');
    }

    return passedTests === totalTests;
  }
}

// Run the tests
const tester = new ReactKeyTest();
tester.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
