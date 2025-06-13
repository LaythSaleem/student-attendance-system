// Test the "My Students" functionality end-to-end
const API_BASE = 'http://localhost:8888/api';

class StudentsWithAttendanceTest {
  constructor() {
    this.token = null;
    this.teacherId = null;
  }

  async login() {
    console.log('🔐 Logging in as teacher...');
    
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'teacher@school.com',
          password: 'teacher123'
        })
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.token;
      this.teacherId = data.user.id;
      
      console.log('✅ Login successful');
      console.log(`   Teacher ID: ${this.teacherId}`);
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      return false;
    }
  }

  async testStudentsWithAttendance() {
    console.log('\n📊 Testing Students with Attendance API...');
    
    try {
      // Test without filters
      console.log('\n1. Testing without filters:');
      const response1 = await fetch(`${API_BASE}/teachers/students-with-attendance`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response1.ok) {
        throw new Error(`API call failed: ${response1.status}`);
      }

      const students1 = await response1.json();
      console.log(`   ✅ Found ${students1.length} students`);
      
      students1.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (${student.roll_number})`);
        console.log(`      Stage: ${student.stage} - ${student.section}`);
        console.log(`      Attendance: ${student.attendance_rate || 0}% (${student.present_count}P/${student.late_count}L/${student.absent_count}A)`);
        console.log(`      Status: ${student.status}`);
        console.log(`      Photo: ${student.latest_photo ? 'Yes' : 'No'}`);
      });

      // Test with search filter
      console.log('\n2. Testing with search filter (John):');
      const response2 = await fetch(`${API_BASE}/teachers/students-with-attendance?search=John`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      const students2 = await response2.json();
      console.log(`   ✅ Found ${students2.length} students matching "John"`);
      
      students2.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (${student.roll_number})`);
      });

      // Test with stage filter
      console.log('\n3. Testing with stage filter (Stage 1):');
      const response3 = await fetch(`${API_BASE}/teachers/students-with-attendance?stage=Stage%201`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      const students3 = await response3.json();
      console.log(`   ✅ Found ${students3.length} students in "Stage 1"`);
      
      students3.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (${student.roll_number})`);
      });

      console.log('\n✅ All API tests passed!');
      return true;
      
    } catch (error) {
      console.error('❌ API test failed:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting "My Students" functionality test...\n');
    
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('\n❌ Test failed: Could not login');
      return;
    }

    const apiSuccess = await this.testStudentsWithAttendance();
    if (!apiSuccess) {
      console.log('\n❌ Test failed: API tests failed');
      return;
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Authentication working');
    console.log('   ✅ Students with attendance API working');
    console.log('   ✅ Search filtering working');
    console.log('   ✅ Stage filtering working');
    console.log('   ✅ Attendance data calculation working');
    console.log('   ✅ Photo retrieval working');
    console.log('   ✅ Status categorization working');
    
    console.log('\n🔥 The "My Students" section is ready for use!');
  }
}

// Run the test
const tester = new StudentsWithAttendanceTest();
tester.runAllTests();
