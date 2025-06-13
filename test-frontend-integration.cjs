const fetch = globalThis.fetch || require('node-fetch');

const API_BASE = 'http://localhost:8888';

async function testFrontendStudentProfile() {
  try {
    console.log('🧪 Testing Frontend Student Profile Integration');
    
    // Get a valid auth token
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
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
    
    // Simulate what AttendanceReportsPage does - get attendance data
    const attendanceResponse = await fetch(`${API_BASE}/api/attendance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!attendanceResponse.ok) {
      console.log('⚠️ Attendance endpoint not available or no data');
      return;
    }
    
    const attendanceData = await attendanceResponse.json();
    console.log(`✅ Found ${attendanceData.length} attendance records`);
    
    if (attendanceData.length === 0) {
      console.log('ℹ️ No attendance data to test student profiles with');
      return;
    }
    
    // Test student profile for the first attendance record
    const firstRecord = attendanceData[0];
    const studentId = firstRecord.student_id;
    
    console.log(`🔍 Testing profile for student ID: ${studentId}`);
    
    const profileResponse = await fetch(`${API_BASE}/api/students/${studentId}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        console.log(`❌ Student profile not found for ID: ${studentId} (404 error)`);
        // Try to get all students to see what IDs exist
        const studentsResponse = await fetch(`${API_BASE}/api/students`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const students = await studentsResponse.json();
        console.log('Available student IDs:', students.map(s => s.id).slice(0, 5));
      } else {
        throw new Error(`Profile fetch failed: ${profileResponse.status}`);
      }
      return;
    }
    
    const profile = await profileResponse.json();
    console.log('✅ Student profile loaded successfully!');
    console.log('📋 Profile:', {
      id: profile.id,
      name: profile.name,
      class: profile.class,
      section: profile.section
    });
    
    console.log('🎉 Frontend integration test passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendStudentProfile();
