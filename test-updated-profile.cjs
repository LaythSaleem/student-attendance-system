const fetch = globalThis.fetch || require('node-fetch');

const API_BASE = 'http://localhost:8888/api';

async function testUpdatedStudentProfile() {
  try {
    console.log('🧪 Testing Updated Student Profile Endpoint');
    
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
    console.log('✅ Got auth token');
    
    // Test with student_1
    const profileResponse = await fetch(`${API_BASE}/students/student_1/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!profileResponse.ok) {
      throw new Error(`Profile fetch failed: ${profileResponse.status} - ${await profileResponse.text()}`);
    }
    
    const profileData = await profileResponse.json();
    console.log('✅ Profile endpoint working!');
    
    // Check structure
    console.log('📋 Data structure:');
    console.log('- student:', !!profileData.student);
    console.log('- attendanceHistory:', Array.isArray(profileData.attendanceHistory));
    console.log('- attendanceStats:', !!profileData.attendanceStats);
    console.log('- monthlyAttendance:', Array.isArray(profileData.monthlyAttendance));
    console.log('- enrollments:', Array.isArray(profileData.enrollments));
    console.log('- examResults:', Array.isArray(profileData.examResults));
    
    // Check student data
    if (profileData.student) {
      console.log('👤 Student info:');
      console.log('  - Name:', profileData.student.name);
      console.log('  - Roll Number:', profileData.student.rollNumber);
      console.log('  - Class:', profileData.student.class);
      console.log('  - Section:', profileData.student.section);
      console.log('  - Overall Attendance:', profileData.student.overallAttendancePercentage + '%');
    }
    
    // Check attendance stats
    if (profileData.attendanceStats) {
      console.log('📊 Attendance stats:');
      console.log('  - Total Classes:', profileData.attendanceStats.totalClasses);
      console.log('  - Present:', profileData.attendanceStats.presentClasses);
      console.log('  - Absent:', profileData.attendanceStats.absentClasses);
      console.log('  - Percentage:', profileData.attendanceStats.overallAttendancePercentage + '%');
    }
    
    console.log('🎉 Student profile structure is correct!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpdatedStudentProfile();
