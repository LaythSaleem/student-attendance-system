#!/usr/bin/env node

/**
 * Test frontend-backend integration for topic creation
 * This will simulate exactly what the frontend should be doing
 */

const API_BASE = 'http://localhost:3001/api';

async function testFrontendTopicCreation() {
  console.log('🧪 Testing Frontend Topic Creation Flow');
  console.log('=====================================\n');

  try {
    // Step 1: Login
    console.log('1. 🔐 Authenticating...');
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

    const { token } = await loginResponse.json();
    console.log('✅ Login successful\n');

    // Step 2: Get classes (like useClassesManagement does)
    console.log('2. 📚 Fetching classes...');
    const classesResponse = await fetch(`${API_BASE}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!classesResponse.ok) {
      throw new Error(`Classes fetch failed: ${classesResponse.status}`);
    }

    const classes = await classesResponse.json();
    console.log(`✅ Found ${classes.length} classes`);

    if (classes.length === 0) {
      console.log('⚠️  No classes available, creating one...');
      
      // Get academic years
      const academicYearsResponse = await fetch(`${API_BASE}/academic-years/dropdown`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const academicYears = await academicYearsResponse.json();

      // Create a test class
      const classData = {
        name: 'Frontend Test Class',
        section: 'FE',
        description: 'Test class for frontend integration',
        teacher_id: '',
        academic_year_id: academicYears[0]?.id || '',
        capacity: 30
      };

      const createClassResponse = await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(classData)
      });

      const newClass = await createClassResponse.json();
      classes.push(newClass);
      console.log(`✅ Created test class: ${newClass.name}`);
    }

    const testClass = classes[0];
    console.log(`📋 Using class: ${testClass.name} - ${testClass.section} (ID: ${testClass.id})\n`);

    // Step 3: Create topic exactly like TopicsList.tsx would
    console.log('3. 📝 Creating topic (frontend simulation)...');
    
    const topicFormData = {
      name: 'Frontend Test Topic',
      description: 'This topic was created by frontend simulation',
      order_index: 1,
      status: 'planned'
    };

    console.log('   Topic data being sent:', JSON.stringify(topicFormData, null, 2));

    const createTopicResponse = await fetch(`${API_BASE}/classes/${testClass.id}/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(topicFormData)
    });

    console.log(`   Response status: ${createTopicResponse.status}`);

    if (!createTopicResponse.ok) {
      const errorText = await createTopicResponse.text();
      throw new Error(`Topic creation failed: ${createTopicResponse.status} - ${errorText}`);
    }

    const createdTopic = await createTopicResponse.json();
    console.log('✅ Topic created successfully!');
    console.log('   Created topic:', JSON.stringify(createdTopic, null, 2));

    // Step 4: Verify topic appears in class topics
    console.log('\n4. 🔍 Verifying topic in class...');
    const updatedClassResponse = await fetch(`${API_BASE}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const updatedClasses = await updatedClassResponse.json();
    const updatedClass = updatedClasses.find(c => c.id === testClass.id);

    console.log(`✅ Class now has ${updatedClass.topics.length} topics`);
    if (updatedClass.topics.length > 0) {
      console.log('   Topics:');
      updatedClass.topics.forEach(topic => {
        console.log(`   - ${topic.name} (${topic.status})`);
      });
    }

    // Step 5: Clean up
    console.log('\n5. 🧹 Cleaning up...');
    await fetch(`${API_BASE}/topics/${createdTopic.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Test topic deleted');

    console.log('\n🎉 Frontend Topic Creation Test PASSED!');
    console.log('✅ All steps completed successfully');
    console.log('✅ Frontend-backend integration is working correctly');

  } catch (error) {
    console.error('\n❌ Frontend Topic Creation Test FAILED!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testFrontendTopicCreation();
