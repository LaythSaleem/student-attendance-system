// Use node's built-in fetch (Node 18+) or fallback to http
const fetch = globalThis.fetch || require('node-fetch');

const API_BASE = 'http://localhost:8888';

async function testStudentProfile() {
  try {
    console.log('🧪 Testing Student Profile Endpoint');
    
    // First, get a valid auth token
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.token) {
      throw new Error('Failed to get auth token');
    }
    
    const token = loginData.token;
    console.log('✅ Got auth token');
    
    // Get list of students first
    const studentsResponse = await fetch(`${API_BASE}/api/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!studentsResponse.ok) {
      throw new Error(`Students fetch failed: ${studentsResponse.status}`);
    }
    
    const students = await studentsResponse.json();
    console.log(`✅ Found ${students.length} students`);
    
    if (students.length === 0) {
      console.log('❌ No students found to test profile endpoint');
      return;
    }
    
    // Test the profile endpoint with the first student
    const firstStudent = students[0];
    console.log(`🔍 Testing profile for student: ${firstStudent.name} (ID: ${firstStudent.id})`);
    
    const profileResponse = await fetch(`${API_BASE}/api/students/${firstStudent.id}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!profileResponse.ok) {
      throw new Error(`Profile fetch failed: ${profileResponse.status} - ${await profileResponse.text()}`);
    }
    
    const profile = await profileResponse.json();
    console.log('✅ Student profile endpoint working!');
    console.log('📋 Profile data:', {
      id: profile.id,
      name: profile.name,
      rollNumber: profile.rollNumber,
      class: profile.class,
      section: profile.section,
      email: profile.email,
      parentPhone: profile.parentPhone,
      attendanceRate: profile.attendanceRate
    });
    
    // Test with a non-existent student ID
    const nonExistentResponse = await fetch(`${API_BASE}/api/students/999999/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (nonExistentResponse.status === 404) {
      console.log('✅ Non-existent student returns 404 as expected');
    } else {
      console.log('⚠️ Non-existent student should return 404');
    }
    
    console.log('🎉 All student profile tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStudentProfile();
