#!/usr/bin/env node

/**
 * Test Frontend Exam Creation Flow
 * This simulates the exact data flow from ExamsPage.tsx to the backend
 */

const BASE_URL = 'http://localhost:3001/api';

async function testFrontendExamCreation() {
  console.log('🔍 Testing Frontend Exam Creation Flow');
  console.log('=====================================\n');

  try {
    // Step 1: Authenticate
    console.log('1. 🔐 Authenticating...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
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
    console.log('✅ Authentication successful\n');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Step 2: Fetch required data (like frontend does)
    console.log('2. 📋 Fetching required data...');
    
    // Get exam types
    const examTypesResponse = await fetch(`${BASE_URL}/exam-types`, {
      headers: authHeaders
    });
    
    if (!examTypesResponse.ok) {
      throw new Error(`Exam types fetch failed: ${examTypesResponse.status}`);
    }
    
    const examTypes = await examTypesResponse.json();
    console.log(`   ✅ Exam types: ${examTypes.length} found`);

    // Get stages (classes)
    const stagesResponse = await fetch(`${BASE_URL}/teachers/available-topics`, {
      headers: authHeaders
    });
    
    if (!stagesResponse.ok) {
      throw new Error(`Stages fetch failed: ${stagesResponse.status}`);
    }
    
    const stages = await stagesResponse.json();
    console.log(`   ✅ Stages: ${stages.length} found`);
    console.log('');

    // Step 3: Test form data processing (exactly like frontend)
    console.log('3. 🧪 Testing frontend form data processing...');

    // Simulate form data from ExamsPage.tsx
    const frontendFormData = {
      exam_type_id: examTypes[0]?.id || '',
      class_id: stages[0]?.id || '',
      topic_id: 'none', // This is what frontend uses for "No specific topic"
      title: 'Frontend Test Exam',
      description: 'Testing frontend data flow',
      date: '2025-07-15',
      start_time: '09:00',
      end_time: '11:00',
      duration_minutes: 120,
      total_marks: 100,
      pass_marks: 40
    };

    console.log('   Frontend form data:');
    console.log('   ', JSON.stringify(frontendFormData, null, 4));

    // Process data exactly like frontend createExam function
    const processedData = {
      ...frontendFormData,
      topic_id: frontendFormData.topic_id === 'none' ? null : frontendFormData.topic_id
    };

    console.log('\n   Processed data for backend:');
    console.log('   ', JSON.stringify(processedData, null, 4));

    // Step 4: Submit exactly like frontend
    console.log('\n4. 📤 Submitting exam creation...');
    const createResponse = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(processedData)
    });

    console.log(`   Response status: ${createResponse.status}`);
    console.log(`   Response headers:`, Object.fromEntries(createResponse.headers.entries()));

    if (!createResponse.ok) {
      // Try to get error details
      const contentType = createResponse.headers.get('content-type');
      console.log(`   Content-Type: ${contentType}`);
      
      let errorText;
      try {
        if (contentType && contentType.includes('application/json')) {
          const errorJson = await createResponse.json();
          errorText = JSON.stringify(errorJson, null, 2);
        } else {
          errorText = await createResponse.text();
        }
      } catch (e) {
        errorText = 'Could not parse error response';
      }
      
      console.log('   ❌ ERROR RESPONSE:');
      console.log('   ', errorText);
      
      throw new Error(`Exam creation failed: ${createResponse.status}`);
    } else {
      const createdExam = await createResponse.json();
      console.log('   ✅ EXAM CREATED SUCCESSFULLY!');
      console.log('   Created exam:', JSON.stringify(createdExam, null, 4));

      // Clean up
      const deleteResponse = await fetch(`${BASE_URL}/exams/${createdExam.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      console.log(`   🧹 Cleanup: ${deleteResponse.ok ? 'Success' : 'Failed'}`);
    }

    // Step 5: Test with topic selection
    console.log('\n5. 🧪 Testing with topic selection...');
    
    const stageWithTopics = stages.find(stage => stage.topics && stage.topics.length > 0);
    
    if (stageWithTopics && stageWithTopics.topics.length > 0) {
      const formDataWithTopic = {
        ...frontendFormData,
        class_id: stageWithTopics.id,
        topic_id: stageWithTopics.topics[0].id,
        title: 'Frontend Test Exam with Topic'
      };

      const processedDataWithTopic = {
        ...formDataWithTopic,
        topic_id: formDataWithTopic.topic_id === 'none' ? null : formDataWithTopic.topic_id
      };

      console.log('   Form data with topic:');
      console.log('   ', JSON.stringify(processedDataWithTopic, null, 4));

      const createWithTopicResponse = await fetch(`${BASE_URL}/exams`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(processedDataWithTopic)
      });

      console.log(`   Response status: ${createWithTopicResponse.status}`);

      if (!createWithTopicResponse.ok) {
        const errorText = await createWithTopicResponse.text();
        console.log('   ❌ ERROR WITH TOPIC:', errorText);
      } else {
        const createdExamWithTopic = await createWithTopicResponse.json();
        console.log('   ✅ EXAM WITH TOPIC CREATED!');
        console.log(`   Topic: ${createdExamWithTopic.topic_name}`);

        // Clean up
        const deleteResponse = await fetch(`${BASE_URL}/exams/${createdExamWithTopic.id}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        console.log(`   🧹 Cleanup: ${deleteResponse.ok ? 'Success' : 'Failed'}`);
      }
    } else {
      console.log('   ⚠️  No topics available for testing');
    }

    console.log('\n🎉 FRONTEND EXAM CREATION TEST COMPLETE!');
    console.log('========================================');
    console.log('✅ Authentication: Working');
    console.log('✅ Data fetching: Working');
    console.log('✅ Form processing: Working');
    console.log('✅ Backend communication: Working');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testFrontendExamCreation();
