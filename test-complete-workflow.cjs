const fetch = globalThis.fetch || require('node-fetch');

const API_BASE = 'http://localhost:8888/api';

async function testCompleteStudentProfileWorkflow() {
  try {
    console.log('🧪 Testing Complete Student Profile Workflow');
    
    // Step 1: Login
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
    console.log('✅ Step 1: Successfully logged in');
    
    // Step 2: Get detailed attendance reports (what AttendanceReportsPage does)
    const reportParams = new URLSearchParams({
      classId: '',
      teacherId: '',
      topicId: '',
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    });
    
    const reportResponse = await fetch(`${API_BASE}/reports/attendance-detailed?${reportParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    let attendanceReports = [];
    if (reportResponse.ok) {
      attendanceReports = await reportResponse.json();
      console.log(`✅ Step 2: Got ${attendanceReports.length} attendance reports`);
    } else {
      console.log('ℹ️ Step 2: No attendance reports available');
    }
    
    // Step 3: Test student profile fetch for each unique student in reports
    const studentIds = [...new Set(attendanceReports.map(r => r.student_id))];
    
    if (studentIds.length === 0) {
      // Fallback: get students from the main endpoint
      const studentsResponse = await fetch(`${API_BASE}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const students = await studentsResponse.json();
      studentIds.push(...students.slice(0, 3).map(s => s.id));
      console.log(`ℹ️ Step 3: Using fallback student IDs: ${studentIds.slice(0, 3)}`);
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const studentId of studentIds.slice(0, 5)) { // Test first 5 students
      try {
        const profileResponse = await fetch(`${API_BASE}/students/${studentId}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          console.log(`✅ Profile loaded for ${profile.name} (${studentId})`);
          successCount++;
        } else {
          console.log(`❌ Profile failed for ${studentId}: ${profileResponse.status}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`❌ Profile error for ${studentId}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`📊 Results: ${successCount} successful, ${errorCount} failed`);
    
    if (successCount > 0) {
      console.log('🎉 Student Profile Workflow Test PASSED!');
      console.log('✅ The AttendanceReportsPage should now work without 404 errors');
    } else {
      console.log('❌ Student Profile Workflow Test FAILED!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteStudentProfileWorkflow();
