#!/usr/bin/env node

/**
 * Debug script to reproduce and diagnose exam creation error
 */

const BASE_URL = 'http://localhost:3001/api';

async function debugExamCreation() {
  console.log('🔍 Debugging Exam Creation Error');
  console.log('================================\n');

  try {
    // Step 1: Login
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

    // Step 2: Get exam types
    console.log('2. 📚 Fetching exam types...');
    const examTypesResponse = await fetch(`${BASE_URL}/exam-types`, {
      headers: authHeaders
    });

    if (!examTypesResponse.ok) {
      throw new Error(`Exam types fetch failed: ${examTypesResponse.status}`);
    }

    const examTypes = await examTypesResponse.json();
    console.log(`✅ Found ${examTypes.length} exam types`);
    console.log('First exam type:', examTypes[0]);

    // Step 3: Get classes
    console.log('\n3. 🏥 Fetching classes...');
    const classesResponse = await fetch(`${BASE_URL}/classes`, {
      headers: authHeaders
    });

    if (!classesResponse.ok) {
      throw new Error(`Classes fetch failed: ${classesResponse.status}`);
    }

    const classes = await classesResponse.json();
    console.log(`✅ Found ${classes.length} classes`);
    console.log('First class:', classes[0]);

    // Step 4: Test exam creation with different scenarios
    console.log('\n4. ➕ Testing exam creation...');
    
    // Test 1: Basic exam without topic
    console.log('\n   Test 1: Creating exam without topic...');
    const basicExamData = {
      exam_type_id: examTypes[0].id,
      class_id: classes[0].id,
      topic_id: null, // No topic
      title: 'Debug Test Exam 1',
      description: 'Test exam for debugging',
      date: '2025-07-15',
      start_time: '09:00',
      end_time: '11:00',
      duration_minutes: 120,
      total_marks: 100,
      pass_marks: 40
    };

    console.log('   Request data:', JSON.stringify(basicExamData, null, 2));

    const createResponse1 = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(basicExamData)
    });

    console.log('   Response status:', createResponse1.status);
    console.log('   Response headers:', Object.fromEntries(createResponse1.headers.entries()));

    if (!createResponse1.ok) {
      const errorText = await createResponse1.text();
      console.log('   ❌ Error response:', errorText);
      
      // Try to parse as JSON if possible
      try {
        const errorJson = JSON.parse(errorText);
        console.log('   ❌ Parsed error:', errorJson);
      } catch (e) {
        console.log('   ❌ Raw error text:', errorText);
      }
    } else {
      const createdExam = await createResponse1.json();
      console.log('   ✅ Exam created successfully:', createdExam.id);
      
      // Clean up
      const deleteResponse = await fetch(`${BASE_URL}/exams/${createdExam.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      console.log('   🧹 Cleanup:', deleteResponse.ok ? 'Success' : 'Failed');
    }

    // Test 2: Exam with topic (if topics exist)
    console.log('\n   Test 2: Creating exam with topic...');
    
    // Get topics for the first class
    const topicsResponse = await fetch(`${BASE_URL}/classes/${classes[0].id}/topics`, {
      headers: authHeaders
    });

    if (topicsResponse.ok) {
      const topics = await topicsResponse.json();
      console.log(`   Found ${topics.length} topics for class`);
      
      if (topics.length > 0) {
        const examWithTopicData = {
          ...basicExamData,
          topic_id: topics[0].id,
          title: 'Debug Test Exam 2 (With Topic)'
        };

        console.log('   Request data with topic:', JSON.stringify(examWithTopicData, null, 2));

        const createResponse2 = await fetch(`${BASE_URL}/exams`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(examWithTopicData)
        });

        console.log('   Response status:', createResponse2.status);

        if (!createResponse2.ok) {
          const errorText = await createResponse2.text();
          console.log('   ❌ Error response:', errorText);
        } else {
          const createdExam = await createResponse2.json();
          console.log('   ✅ Exam with topic created:', createdExam.id);
          
          // Clean up
          const deleteResponse = await fetch(`${BASE_URL}/exams/${createdExam.id}`, {
            method: 'DELETE',
            headers: authHeaders
          });
          console.log('   🧹 Cleanup:', deleteResponse.ok ? 'Success' : 'Failed');
        }
      } else {
        console.log('   ⚠️  No topics available for testing');
      }
    } else {
      console.log('   ⚠️  Could not fetch topics');
    }

    // Test 3: Test with invalid data to see validation
    console.log('\n   Test 3: Testing validation with invalid data...');
    const invalidExamData = {
      exam_type_id: '', // Invalid
      class_id: '',     // Invalid
      title: '',        // Invalid
      date: ''          // Invalid
    };

    const createResponse3 = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(invalidExamData)
    });

    console.log('   Validation response status:', createResponse3.status);
    if (!createResponse3.ok) {
      const errorText = await createResponse3.text();
      console.log('   Expected validation error:', errorText);
    }

  } catch (error) {
    console.error('\n❌ DEBUG FAILED:', error.message);
    console.error('Full error:', error);
  }
}

// Run debug
debugExamCreation();
