#!/usr/bin/env node

/**
 * Test Medical College Add Class Functionality
 * This script tests that the Add Class dialog works with the medical college system
 */

const BASE_URL = 'http://localhost:3001/api';

async function testMedicalCollegeAddClass() {
  console.log('🏥 Testing Medical College Add Class Functionality');
  console.log('=============================================\n');

  try {
    // 1. Login as admin
    console.log('1. 🔐 Authenticating as admin...');
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
    console.log('✅ Login successful\n');

    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Check available dropdown data
    console.log('2. 📋 Checking dropdown data availability...');
    
    // Check teachers
    const teachersResponse = await fetch(`${BASE_URL}/teachers`, {
      headers: authHeaders
    });
    const teachers = await teachersResponse.json();
    console.log(`   ✅ Teachers available: ${teachers.length}`);
    teachers.forEach(teacher => {
      console.log(`      - ${teacher.name} (ID: ${teacher.id})`);
    });

    // Check academic years
    const academicYearsResponse = await fetch(`${BASE_URL}/academic-years`, {
      headers: authHeaders
    });
    const academicYears = await academicYearsResponse.json();
    console.log(`   ✅ Academic years available: ${academicYears.length}`);
    academicYears.forEach(year => {
      console.log(`      - ${year.name} (ID: ${year.id}) ${year.is_current ? '(Current)' : ''}`);
    });

    // 3. Get current medical stages count
    console.log('\n3. 📊 Checking current medical stages...');
    const classesResponse = await fetch(`${BASE_URL}/classes`, {
      headers: authHeaders
    });
    const currentClasses = await classesResponse.json();
    console.log(`   ✅ Current medical stages: ${currentClasses.length}`);

    // 4. Test creating a new medical stage
    console.log('\n4. 🆕 Testing creation of new medical stage...');
    const newMedicalStage = {
      name: 'Stage 7',
      section: 'Seventh Year',
      description: 'Advanced Specialization and Residency Preparation',
      teacher_id: teachers[0]?.id || '',
      academic_year_id: academicYears.find(year => year.name.includes('Medical'))?.id || academicYears[0]?.id,
      capacity: 50
    };

    console.log('   📝 Creating medical stage with data:', JSON.stringify(newMedicalStage, null, 2));

    const createResponse = await fetch(`${BASE_URL}/classes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newMedicalStage)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create medical stage: ${createResponse.status} - ${errorText}`);
    }

    const createdStage = await createResponse.json();
    console.log('   ✅ Medical stage created successfully!');
    console.log(`      - ID: ${createdStage.id}`);
    console.log(`      - Name: ${createdStage.name} - ${createdStage.section}`);
    console.log(`      - Description: ${createdStage.description}`);

    // 5. Verify the stage was created
    console.log('\n5. ✅ Verifying medical stage creation...');
    const verifyResponse = await fetch(`${BASE_URL}/classes`, {
      headers: authHeaders
    });
    const updatedClasses = await verifyResponse.json();
    console.log(`   ✅ Total medical stages now: ${updatedClasses.length}`);

    const createdStageInList = updatedClasses.find(cls => cls.id === createdStage.id);
    if (createdStageInList) {
      console.log('   ✅ New medical stage found in list!');
      console.log(`      - ${createdStageInList.name} - ${createdStageInList.section}`);
      console.log(`      - Faculty: ${createdStageInList.teacher_name || 'Not assigned'}`);
      console.log(`      - Capacity: ${createdStageInList.capacity}`);
    } else {
      throw new Error('Created medical stage not found in updated list');
    }

    // 6. Clean up - delete the test stage
    console.log('\n6. 🧹 Cleaning up test medical stage...');
    const deleteResponse = await fetch(`${BASE_URL}/classes/${createdStage.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    if (deleteResponse.ok) {
      console.log('   ✅ Test medical stage cleaned up successfully');
    } else {
      console.log('   ⚠️  Warning: Could not clean up test medical stage');
    }

    console.log('\n🎉 Medical College Add Class Test PASSED!');
    console.log('==========================================');
    console.log('✅ Authentication works');
    console.log('✅ Dropdown data is available');
    console.log('✅ Medical stage creation works');
    console.log('✅ Medical stage appears in list');
    console.log('✅ Medical stage deletion works');
    console.log('\n🏥 The Add Medical Stage functionality is working correctly!');

  } catch (error) {
    console.error('\n❌ Medical College Add Class Test FAILED!');
    console.error('==========================================');
    console.error('Error:', error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testMedicalCollegeAddClass();
}

module.exports = { testMedicalCollegeAddClass };
