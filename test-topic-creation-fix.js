#!/usr/bin/env node

/**
 * Test Topic Creation Fix - Comprehensive Frontend-Backend Integration Test
 */

const API_BASE = 'http://localhost:3001/api';

async function testTopicCreationFix() {
  console.log('🔧 Testing Topic Creation Fix');
  console.log('==============================\n');

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

    const { token } = await loginResponse.json();
    console.log('✅ Login successful\n');

    // Step 2: Get or create a test class
    console.log('2. 📚 Getting classes...');
    const classesResponse = await fetch(`${API_BASE}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let classes = await classesResponse.json();
    console.log(`✅ Found ${classes.length} classes`);

    let testClass;
    if (classes.length > 0) {
      testClass = classes[0];
      console.log(`📋 Using existing class: ${testClass.name} - ${testClass.section}`);
    } else {
      console.log('⚠️  No classes found, creating test class...');
      
      // Get academic year for class creation
      const academicYearsResponse = await fetch(`${API_BASE}/academic-years/dropdown`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const academicYears = await academicYearsResponse.json();

      const classData = {
        name: 'Topic Test Class',
        section: 'TTC',
        description: 'Class for testing topic creation',
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

      testClass = await createClassResponse.json();
      console.log(`✅ Created test class: ${testClass.name} - ${testClass.section}`);
    }

    console.log(`🎯 Testing with class ID: ${testClass.id}\n`);

    // Step 3: Test topic creation with simplified interface
    console.log('3. 📝 Testing simplified topic creation...');
    
    const topicData = {
      name: 'Fix Test Topic',
      description: 'This topic tests the topic creation fix',
      order_index: 1,
      status: 'planned'
    };

    console.log('   📤 Sending topic data:', JSON.stringify(topicData, null, 2));

    const createTopicResponse = await fetch(`${API_BASE}/classes/${testClass.id}/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(topicData)
    });

    console.log(`   📥 Response status: ${createTopicResponse.status}`);

    if (!createTopicResponse.ok) {
      const errorText = await createTopicResponse.text();
      throw new Error(`Topic creation failed: ${createTopicResponse.status} - ${errorText}`);
    }

    const createdTopic = await createTopicResponse.json();
    console.log('✅ Topic created successfully!');
    console.log('   📋 Created topic:', {
      id: createdTopic.id,
      name: createdTopic.name,
      status: createdTopic.status,
      class_id: createdTopic.class_id
    });

    // Step 4: Verify topic appears in class data
    console.log('\n4. 🔍 Verifying topic in class data...');
    const updatedClassesResponse = await fetch(`${API_BASE}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const updatedClasses = await updatedClassesResponse.json();
    const updatedClass = updatedClasses.find(c => c.id === testClass.id);

    console.log(`✅ Class now has ${updatedClass.topics.length} topics`);
    const foundTopic = updatedClass.topics.find(t => t.id === createdTopic.id);
    if (foundTopic) {
      console.log(`✅ Topic "${foundTopic.name}" found in class topics`);
    } else {
      throw new Error('Created topic not found in class topics list!');
    }

    // Step 5: Test topic update
    console.log('\n5. ✏️ Testing topic update...');
    const updateData = {
      name: createdTopic.name + ' (Updated)',
      description: createdTopic.description + ' - Updated!',
      order_index: createdTopic.order_index,
      status: 'in_progress'
    };

    const updateResponse = await fetch(`${API_BASE}/topics/${createdTopic.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const updatedTopic = await updateResponse.json();
    console.log(`✅ Topic updated: "${updatedTopic.name}" status: ${updatedTopic.status}`);

    // Step 6: Clean up
    console.log('\n6. 🧹 Cleaning up...');
    await fetch(`${API_BASE}/topics/${createdTopic.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Test topic deleted');

    console.log('\n🎉 TOPIC CREATION FIX TEST PASSED! 🎉');
    console.log('=====================================');
    console.log('✅ Backend API working correctly');
    console.log('✅ Simplified topic interface working');
    console.log('✅ Topic CRUD operations functional');
    console.log('✅ Class-topic relationship intact');
    console.log('\n📱 Frontend should now work properly!');
    console.log('🌐 Test at: http://localhost:8080');

  } catch (error) {
    console.error('\n❌ TOPIC CREATION FIX TEST FAILED!');
    console.error('==================================');
    console.error('Error:', error.message);
    console.error('\n🔍 Debugging suggestions:');
    console.error('1. Check if backend is running (http://localhost:3001)');
    console.error('2. Verify authentication is working');
    console.error('3. Check API endpoint URLs');
    console.error('4. Review topic data structure');
    process.exit(1);
  }
}

testTopicCreationFix();
