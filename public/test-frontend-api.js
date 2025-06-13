// Test Frontend API Connection
console.log('🧪 Testing Frontend API Connection...');

// Simulate login and test classes API
async function testFrontendAPI() {
  try {
    const API_BASE = 'http://localhost:3001/api';
    
    // Test login
    console.log('1. Testing login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    localStorage.setItem('auth_token', token);
    console.log('✅ Login successful, token stored');
    
    // Test classes fetch
    console.log('2. Testing classes fetch...');
    const classesResponse = await fetch(`${API_BASE}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!classesResponse.ok) {
      throw new Error('Classes fetch failed');
    }
    
    const classes = await classesResponse.json();
    console.log(`✅ Classes fetched: ${classes.length} classes found`);
    
    // Test dropdown data
    console.log('3. Testing dropdown data...');
    const teachersResponse = await fetch(`${API_BASE}/teachers/dropdown`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const teachers = await teachersResponse.json();
    
    const academicYearsResponse = await fetch(`${API_BASE}/academic-years/dropdown`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const academicYears = await academicYearsResponse.json();
    
    const subjectsResponse = await fetch(`${API_BASE}/subjects/dropdown`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const subjects = await subjectsResponse.json();
    
    console.log(`✅ Dropdown data: ${teachers.length} teachers, ${academicYears.length} years, ${subjects.length} subjects`);
    
    console.log('🎉 Frontend API connection test successful!');
    
    // Now let's test the useClassesManagement hook behavior
    console.log('4. Testing hook data format...');
    classes.forEach((cls, index) => {
      console.log(`Class ${index + 1}: ${cls.name} - ${cls.section} (${cls.total_students} students, ${cls.total_topics} topics)`);
    });
    
    return { success: true, classes, teachers, academicYears, subjects };
    
  } catch (error) {
    console.error('❌ Frontend API test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testFrontendAPI().then(result => {
  console.log('Test result:', result.success ? 'SUCCESS' : 'FAILED');
});
