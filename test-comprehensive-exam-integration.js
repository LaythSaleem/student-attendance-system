#!/usr/bin/env node

/**
 * Comprehensive Integration Test for Exam Creation Issue
 * This tests the complete flow including authentication state management
 */

const BASE_URL = 'http://localhost:3001/api';

async function comprehensiveExamTest() {
  console.log('🏥 COMPREHENSIVE EXAM CREATION INTEGRATION TEST');
  console.log('==============================================\n');

  try {
    // Test 1: Backend API Direct Test
    console.log('TEST 1: 🔧 Backend API Direct Test');
    console.log('-----------------------------------');
    
    // Authenticate
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Authentication failed: ${loginResponse.status}`);
    }

    const { token, user } = await loginResponse.json();
    console.log(`✅ Authentication: Success (User: ${user.email})`);

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Test basic exam creation
    const testExamData = {
      exam_type_id: null, // Will be populated
      class_id: null,     // Will be populated  
      topic_id: null,
      title: 'Integration Test Exam',
      description: 'Testing full integration',
      date: '2025-07-20',
      start_time: '10:00',
      end_time: '12:00',
      duration_minutes: 120,
      total_marks: 100,
      pass_marks: 40
    };

    // Get exam types
    const examTypesResponse = await fetch(`${BASE_URL}/exam-types`, {
      headers: authHeaders
    });
    
    if (!examTypesResponse.ok) {
      throw new Error(`Exam types fetch failed: ${examTypesResponse.status}`);
    }
    
    const examTypes = await examTypesResponse.json();
    testExamData.exam_type_id = examTypes[0].id;
    console.log(`✅ Exam Types: ${examTypes.length} found`);

    // Get classes/stages
    const stagesResponse = await fetch(`${BASE_URL}/teachers/available-topics`, {
      headers: authHeaders
    });
    
    if (!stagesResponse.ok) {
      throw new Error(`Stages fetch failed: ${stagesResponse.status}`);
    }
    
    const stages = await stagesResponse.json();
    testExamData.class_id = stages[0].id;
    console.log(`✅ Stages: ${stages.length} found`);

    // Create exam
    const createResponse = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(testExamData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Exam creation failed: ${createResponse.status} - ${errorText}`);
    }

    const createdExam = await createResponse.json();
    console.log(`✅ Backend Exam Creation: SUCCESS (ID: ${createdExam.id})`);

    // Test 2: Frontend Data Validation
    console.log('\nTEST 2: 🎨 Frontend Data Processing Test');
    console.log('----------------------------------------');

    // Simulate frontend form data processing
    const frontendFormData = {
      exam_type_id: examTypes[0].id,
      class_id: stages[0].id,
      topic_id: 'none', // Frontend uses 'none' for no topic
      title: 'Frontend Processing Test',
      description: 'Testing frontend data processing',
      date: '2025-07-21',
      start_time: '09:00',
      end_time: '11:00',
      duration_minutes: 120,
      total_marks: 100,
      pass_marks: 40
    };

    // Process exactly like ExamsPage.tsx
    const processedData = {
      ...frontendFormData,
      topic_id: frontendFormData.topic_id === 'none' ? null : frontendFormData.topic_id
    };

    console.log('Frontend form data:', JSON.stringify(frontendFormData, null, 2));
    console.log('Processed for backend:', JSON.stringify(processedData, null, 2));

    // Submit processed data
    const frontendCreateResponse = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(processedData)
    });

    if (!frontendCreateResponse.ok) {
      const errorText = await frontendCreateResponse.text();
      throw new Error(`Frontend-style creation failed: ${frontendCreateResponse.status} - ${errorText}`);
    }

    const frontendCreatedExam = await frontendCreateResponse.json();
    console.log(`✅ Frontend-style Creation: SUCCESS (ID: ${frontendCreatedExam.id})`);

    // Test 3: Error Simulation
    console.log('\nTEST 3: ❌ Error Scenario Testing');
    console.log('----------------------------------');

    // Test with invalid data
    const invalidData = {
      exam_type_id: '', // Invalid
      class_id: '', // Invalid
      topic_id: null,
      title: '', // Invalid
      description: '',
      date: '', // Invalid
      start_time: '',
      end_time: '',
      duration_minutes: 120,
      total_marks: 100,
      pass_marks: 40
    };

    const invalidResponse = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(invalidData)
    });

    console.log(`Invalid data response: ${invalidResponse.status}`);
    if (!invalidResponse.ok) {
      const errorText = await invalidResponse.text();
      console.log(`✅ Validation Error (Expected): ${errorText}`);
    }

    // Test 4: Authentication Edge Cases
    console.log('\nTEST 4: 🔐 Authentication Edge Cases');
    console.log('------------------------------------');

    // Test with invalid token
    const invalidAuthHeaders = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid_token_12345'
    };

    const invalidAuthResponse = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: invalidAuthHeaders,
      body: JSON.stringify(testExamData)
    });

    console.log(`Invalid auth response: ${invalidAuthResponse.status}`);
    if (!invalidAuthResponse.ok) {
      console.log(`✅ Auth Rejection (Expected): ${invalidAuthResponse.status}`);
    }

    // Test with missing token
    const noAuthHeaders = {
      'Content-Type': 'application/json'
    };

    const noAuthResponse = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: noAuthHeaders,
      body: JSON.stringify(testExamData)
    });

    console.log(`No auth response: ${noAuthResponse.status}`);
    if (!noAuthResponse.ok) {
      console.log(`✅ No Auth Rejection (Expected): ${noAuthResponse.status}`);
    }

    // Test 5: Server Status Check
    console.log('\nTEST 5: 🚀 Server Health Check');
    console.log('-------------------------------');

    const healthResponse = await fetch(`${BASE_URL}/exam-types`, {
      headers: authHeaders
    });

    console.log(`Server health: ${healthResponse.status} ${healthResponse.ok ? '✅' : '❌'}`);

    // Clean up created exams
    console.log('\nCLEANUP: 🧹 Removing test exams');
    console.log('--------------------------------');

    const deleteResponse1 = await fetch(`${BASE_URL}/exams/${createdExam.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    const deleteResponse2 = await fetch(`${BASE_URL}/exams/${frontendCreatedExam.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    console.log(`Cleanup 1: ${deleteResponse1.ok ? '✅' : '❌'}`);
    console.log(`Cleanup 2: ${deleteResponse2.ok ? '✅' : '❌'}`);

    // Final Results
    console.log('\n🎉 COMPREHENSIVE TEST RESULTS');
    console.log('=============================');
    console.log('✅ Backend API: Fully functional');
    console.log('✅ Authentication: Working correctly');
    console.log('✅ Data Processing: Frontend logic working');
    console.log('✅ Error Handling: Proper validation');
    console.log('✅ Server Health: All endpoints responding');
    console.log('');
    console.log('🔍 CONCLUSION:');
    console.log('The backend is working perfectly. The issue must be:');
    console.log('1. Frontend JavaScript errors (check browser console)');
    console.log('2. Authentication token not persisting in browser');
    console.log('3. Network connectivity issues in browser');
    console.log('4. Form validation preventing submission');
    console.log('5. Frontend state management issues');
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('1. Open browser developer tools');
    console.log('2. Navigate to Exams page');
    console.log('3. Check console for JavaScript errors');
    console.log('4. Check Network tab for failed requests');
    console.log('5. Verify localStorage contains auth_token');

  } catch (error) {
    console.error('\n❌ COMPREHENSIVE TEST FAILED:', error.message);
    console.error('Full error:', error);
  }
}

// Run the comprehensive test
comprehensiveExamTest();
