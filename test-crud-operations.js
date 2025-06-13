// Test Classes CRUD Operations
const API_BASE = 'http://localhost:3001/api';

async function testClassesCRUD() {
  console.log('🧪 Testing Classes CRUD Operations...\n');
  
  try {
    // 1. Login first
    console.log('1. 🔐 Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // 2. Get dropdown data first
    console.log('\n2. 📋 Getting dropdown data...');
    const teachersResponse = await fetch(`${API_BASE}/teachers/dropdown`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const teachers = await teachersResponse.json();
    
    const academicYearsResponse = await fetch(`${API_BASE}/academic-years/dropdown`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const academicYears = await academicYearsResponse.json();
    
    console.log(`✅ Found ${teachers.length} teachers, ${academicYears.length} academic years`);

    // 3. Test class creation
    console.log('\n3. ➕ Testing class creation...');
    
    // Use a valid academic year ID
    const validAcademicYearId = 'ce79f9cc-3d93-4144-8282-21600c72d0d4';
    
    const newClassData = {
      name: 'Test Class CRUD',
      section: 'TEST',
      description: 'Test class for CRUD operations',
      teacher_id: teachers[0]?.id || null,
      academic_year_id: validAcademicYearId,
      capacity: 25
    };

    console.log('Creating class with data:', JSON.stringify(newClassData, null, 2));

    const createResponse = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newClassData)
    });

    console.log('Create response status:', createResponse.status);
    const createResponseText = await createResponse.text();
    console.log('Create response body:', createResponseText);

    if (!createResponse.ok) {
      console.log('❌ Class creation failed');
      console.log('Status:', createResponse.status);
      console.log('Response:', createResponseText);
      return;
    }

    const createdClass = JSON.parse(createResponseText);
    console.log('✅ Class created successfully:', createdClass.name);

    // 4. Test adding topic to the class
    console.log('\n4. 📚 Testing topic creation...');
    const subjectsResponse = await fetch(`${API_BASE}/subjects/dropdown`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const subjects = await subjectsResponse.json();
    
    const topicData = {
      name: 'Test Topic',
      description: 'A test topic for CRUD testing',
      subject_id: subjects[0]?.id || null,
      order_index: 1,
      status: 'planned'
    };

    console.log('Creating topic with data:', JSON.stringify(topicData, null, 2));

    const topicResponse = await fetch(`${API_BASE}/classes/${createdClass.id}/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(topicData)
    });

    console.log('Topic creation response status:', topicResponse.status);
    const topicResponseText = await topicResponse.text();
    console.log('Topic creation response body:', topicResponseText);

    if (!topicResponse.ok) {
      console.log('❌ Topic creation failed');
      return;
    }

    const createdTopic = JSON.parse(topicResponseText);
    console.log('✅ Topic created successfully:', createdTopic.name);

    // 5. Test class deletion
    console.log('\n5. 🗑️ Testing class deletion...');
    const deleteResponse = await fetch(`${API_BASE}/classes/${createdClass.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Delete response status:', deleteResponse.status);
    const deleteResponseText = await deleteResponse.text();
    console.log('Delete response body:', deleteResponseText);

    if (!deleteResponse.ok) {
      console.log('❌ Class deletion failed');
      return;
    }

    console.log('✅ Class deleted successfully');

    console.log('\n🎉 All CRUD operations completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testClassesCRUD();
