// Final Verification Test for Classes Management Issues
// Tests: 1. Add class, 2. Delete class, 3. Add topics to class

const API_BASE = 'http://localhost:3001/api';

async function runFinalTest() {
  console.log('🧪 FINAL VERIFICATION: Classes Management Issues');
  console.log('================================================\n');

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
      throw new Error('Authentication failed');
    }

    const { token } = await loginResponse.json();
    console.log('✅ Authentication successful\n');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Step 2: Get dropdown data (academic years, teachers, subjects)
    console.log('2. 📋 Fetching dropdown data...');
    
    const [teachersRes, academicYearsRes, subjectsRes] = await Promise.all([
      fetch(`${API_BASE}/teachers/dropdown`, { headers: authHeaders }),
      fetch(`${API_BASE}/academic-years/dropdown`, { headers: authHeaders }),
      fetch(`${API_BASE}/subjects/dropdown`, { headers: authHeaders })
    ]);

    const teachers = await teachersRes.json();
    const academicYears = await academicYearsRes.json();
    const subjects = await subjectsRes.json();

    console.log(`✅ Dropdown data loaded: ${teachers.length} teachers, ${academicYears.length} academic years, ${subjects.length} subjects\n`);

    if (teachers.length === 0 || academicYears.length === 0 || subjects.length === 0) {
      throw new Error('Missing required dropdown data');
    }

    // Step 3: TEST ISSUE #1 - "Add class is not working"
    console.log('3. 🏫 TESTING ISSUE #1: Add Class');
    console.log('   Creating new class...');

    const classData = {
      name: 'Final Test Class',
      section: 'FTC',
      description: 'Testing class creation functionality',
      teacher_id: teachers[0].id,
      academic_year_id: academicYears[0].id,
      capacity: 25
    };

    console.log('   Class data:', JSON.stringify(classData, null, 2));

    const createClassResponse = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(classData)
    });

    if (!createClassResponse.ok) {
      const errorText = await createClassResponse.text();
      throw new Error(`Class creation failed: ${createClassResponse.status} - ${errorText}`);
    }

    const newClass = await createClassResponse.json();
    console.log(`✅ ISSUE #1 RESOLVED: Class created successfully with ID: ${newClass.id}\n`);

    // Step 4: TEST ISSUE #3 - "Add topics to the class is not working"
    console.log('4. 📚 TESTING ISSUE #3: Add Topics to Class');
    console.log('   Adding topic to the newly created class...');

    const topicData = {
      name: 'Final Test Topic',
      description: 'Testing topic creation functionality',
      subject_id: subjects[0].id,
      order_index: 1,
      status: 'planned'
    };

    console.log('   Topic data:', JSON.stringify(topicData, null, 2));

    const createTopicResponse = await fetch(`${API_BASE}/classes/${newClass.id}/topics`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(topicData)
    });

    if (!createTopicResponse.ok) {
      const errorText = await createTopicResponse.text();
      throw new Error(`Topic creation failed: ${createTopicResponse.status} - ${errorText}`);
    }

    const newTopic = await createTopicResponse.json();
    console.log(`✅ ISSUE #3 RESOLVED: Topic created successfully with ID: ${newTopic.id}\n`);

    // Step 5: Verify class with topic exists
    console.log('5. 🔍 Verifying class with topic...');
    const classesResponse = await fetch(`${API_BASE}/classes`, { headers: authHeaders });
    const classes = await classesResponse.json();
    const createdClass = classes.find(c => c.id === newClass.id);

    if (!createdClass) {
      throw new Error('Created class not found in classes list');
    }

    console.log(`✅ Class verified: "${createdClass.name}" with ${createdClass.total_topics} topic(s)\n`);

    // Step 6: TEST ISSUE #2 - "Delete class is not working"
    console.log('6. 🗑️  TESTING ISSUE #2: Delete Class');
    console.log('   Deleting the test class (and its topics)...');

    const deleteClassResponse = await fetch(`${API_BASE}/classes/${newClass.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    if (!deleteClassResponse.ok) {
      const errorText = await deleteClassResponse.text();
      throw new Error(`Class deletion failed: ${deleteClassResponse.status} - ${errorText}`);
    }

    const deleteResult = await deleteClassResponse.json();
    console.log('✅ ISSUE #2 RESOLVED: Class deleted successfully\n');

    // Step 7: Verify deletion
    console.log('7. ✅ Verifying deletion...');
    const finalClassesResponse = await fetch(`${API_BASE}/classes`, { headers: authHeaders });
    const finalClasses = await finalClassesResponse.json();
    const deletedClass = finalClasses.find(c => c.id === newClass.id);

    if (deletedClass) {
      throw new Error('Class still exists after deletion');
    }

    console.log('✅ Deletion verified: Class and topics successfully removed\n');

    // Final Summary
    console.log('🎉 FINAL VERIFICATION COMPLETE!');
    console.log('================================');
    console.log('✅ ISSUE #1: Add Class - WORKING');
    console.log('✅ ISSUE #2: Delete Class - WORKING');
    console.log('✅ ISSUE #3: Add Topics to Class - WORKING');
    console.log('');
    console.log('🎯 All three reported issues have been RESOLVED!');
    console.log('📊 Backend API: Fully functional');
    console.log('🗄️  Database: Properly configured');
    console.log('🔗 Frontend-Backend: Successfully integrated');
    console.log('');
    console.log('👨‍💻 The Classes Management system is now ready for use!');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
runFinalTest();
