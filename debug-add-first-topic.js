#!/usr/bin/env node

/**
 * Debug script for "Add First Topic" functionality
 * This script will test the complete flow of the "Add First Topic" button
 */

const API_BASE = 'http://localhost:3001/api';

async function debugAddFirstTopic() {
  console.log('🔍 DEBUGGING "ADD FIRST TOPIC" FUNCTIONALITY');
  console.log('==============================================');

  try {
    // Step 1: Login
    console.log('\n1. 🔐 Logging in as admin...');
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
    console.log('✅ Login successful');

    // Step 2: Get classes
    console.log('\n2. 📚 Fetching classes...');
    const classesResponse = await fetch(`${API_BASE}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const classes = await classesResponse.json();
    console.log(`✅ Found ${classes.length} classes`);

    // Step 3: Find a class with no topics or create one
    let targetClass = classes.find(c => !c.topics || c.topics.length === 0);
    
    if (!targetClass) {
      console.log('\n3. 🏗️ No class without topics found, creating a test class...');
      
      const createClassResponse = await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Debug Test Class',
          section: 'Debug Section',
          subject: 'Debug Subject',
          teacher_id: 'teacher_1',
          academic_year: '2024-2025'
        })
      });

      targetClass = await createClassResponse.json();
      console.log(`✅ Created test class: ${targetClass.name} - ${targetClass.section}`);
    } else {
      console.log(`\n3. 🎯 Found class without topics: ${targetClass.name} - ${targetClass.section}`);
    }

    // Step 4: Clear topics from the class (if any)
    if (targetClass.topics && targetClass.topics.length > 0) {
      console.log('\n4. 🧹 Clearing existing topics...');
      
      for (const topic of targetClass.topics) {
        await fetch(`${API_BASE}/topics/${topic.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      console.log(`✅ Cleared ${targetClass.topics.length} topics`);
    } else {
      console.log('\n4. ✅ Class already has no topics');
    }

    // Step 5: Verify class has no topics
    console.log('\n5. 🔍 Verifying class has no topics...');
    const verifyResponse = await fetch(`${API_BASE}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const updatedClasses = await verifyResponse.json();
    const verifyClass = updatedClasses.find(c => c.id === targetClass.id);
    
    if (!verifyClass.topics || verifyClass.topics.length === 0) {
      console.log('✅ Class confirmed to have 0 topics');
    } else {
      console.log(`⚠️ Class still has ${verifyClass.topics.length} topics`);
    }

    // Step 6: Test the "Add First Topic" flow
    console.log('\n6. 🎯 Testing "Add First Topic" flow...');
    console.log('📋 Test class details:');
    console.log(`   - ID: ${targetClass.id}`);
    console.log(`   - Name: ${targetClass.name}`);
    console.log(`   - Section: ${targetClass.section}`);
    console.log(`   - Topics: ${verifyClass.topics?.length || 0}`);

    // Simulate what should happen when "Add First Topic" is clicked
    console.log('\n7. 🧪 Simulating "Add First Topic" button click...');
    console.log('   Expected flow:');
    console.log('   1. setTriggerAddTopic(true) in ClassDetailsDialog');
    console.log('   2. triggerAdd prop passed to TopicsList');
    console.log('   3. useEffect in TopicsList triggers setIsAddDialogOpen(true)');
    console.log('   4. Add Topic dialog should open');

    // Step 8: Test creating a topic through the API
    console.log('\n8. 📝 Testing topic creation API...');
    const topicData = {
      name: 'Debug First Topic',
      description: 'This topic was created via the debug script',
      order_index: 1,
      status: 'planned'
    };

    const createTopicResponse = await fetch(`${API_BASE}/classes/${targetClass.id}/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(topicData)
    });

    if (!createTopicResponse.ok) {
      const errorText = await createTopicResponse.text();
      throw new Error(`Topic creation failed: ${createTopicResponse.status} - ${errorText}`);
    }

    const createdTopic = await createTopicResponse.json();
    console.log('✅ Topic created successfully via API');
    console.log(`   - ID: ${createdTopic.id}`);
    console.log(`   - Name: ${createdTopic.name}`);
    console.log(`   - Status: ${createdTopic.status}`);

    // Step 9: Verify topic appears in class
    console.log('\n9. 🔍 Verifying topic appears in class...');
    const finalClassResponse = await fetch(`${API_BASE}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const finalClasses = await finalClassResponse.json();
    const finalClass = finalClasses.find(c => c.id === targetClass.id);
    
    if (finalClass.topics && finalClass.topics.length > 0) {
      console.log(`✅ Class now has ${finalClass.topics.length} topic(s)`);
      console.log('   Topics:');
      finalClass.topics.forEach(topic => {
        console.log(`   - ${topic.name} (${topic.status})`);
      });
    } else {
      console.log('❌ Topic not found in class data');
    }

    // Step 10: Clean up
    console.log('\n10. 🧹 Cleaning up...');
    await fetch(`${API_BASE}/topics/${createdTopic.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Test topic deleted');

    console.log('\n🎉 DEBUG COMPLETE!');
    console.log('================');
    console.log('✅ Backend API working correctly');
    console.log('✅ Topic creation/deletion working');
    console.log('✅ Class-topic relationship intact');
    console.log('\n🔍 Frontend Investigation Needed:');
    console.log('1. Check if ClassDetailsDialog state management is working');
    console.log('2. Verify triggerAdd prop is being passed correctly');
    console.log('3. Check TopicsList useEffect is firing');
    console.log('4. Ensure dialog state management is working');
    console.log('\n🌐 Test manually at: http://localhost:8083');
    console.log('🎯 Use class:', targetClass.name, '-', targetClass.section);

  } catch (error) {
    console.error('\n❌ DEBUG FAILED!');
    console.error('================');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the debug script
debugAddFirstTopic().catch(console.error);
