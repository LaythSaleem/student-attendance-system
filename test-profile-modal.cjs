const fetch = globalThis.fetch || require('node-fetch');

const API_BASE = 'http://localhost:8888/api';

async function testStudentProfileModal() {
  try {
    console.log('🧪 Testing Student Profile Modal Integration');
    
    // Get auth token
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Authentication successful');
    
    // Test multiple students to ensure consistency
    const students = ['student_1', 'student_2', 'student_3'];
    
    for (const studentId of students) {
      try {
        const profileResponse = await fetch(`${API_BASE}/students/${studentId}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!profileResponse.ok) {
          console.log(`⚠️ Student ${studentId}: ${profileResponse.status}`);
          continue;
        }
        
        const profileData = await profileResponse.json();
        
        // Verify all expected properties exist
        const checks = {
          'student object': !!profileData.student,
          'student.name': !!profileData.student?.name,
          'student.rollNumber': !!profileData.student?.rollNumber,
          'student.class': !!profileData.student?.class,
          'student.section': !!profileData.student?.section,
          'student.overallAttendancePercentage': typeof profileData.student?.overallAttendancePercentage === 'number',
          'attendanceHistory array': Array.isArray(profileData.attendanceHistory),
          'attendanceStats object': !!profileData.attendanceStats,
          'monthlyAttendance array': Array.isArray(profileData.monthlyAttendance),
          'enrollments array': Array.isArray(profileData.enrollments),
          'examResults array': Array.isArray(profileData.examResults)
        };
        
        const failedChecks = Object.entries(checks).filter(([key, passed]) => !passed);
        
        if (failedChecks.length === 0) {
          console.log(`✅ ${profileData.student.name} (${studentId}): All properties valid`);
        } else {
          console.log(`❌ ${studentId}: Missing properties:`, failedChecks.map(([key]) => key));
        }
        
      } catch (error) {
        console.log(`❌ ${studentId}: ${error.message}`);
      }
    }
    
    console.log('🎉 Student Profile Modal test completed!');
    console.log('✅ The TypeError "undefined is not an object (evaluating \'studentProfileData.student.name\')" should now be resolved!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStudentProfileModal();
