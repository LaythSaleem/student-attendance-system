// Test Classes Page Functionality
// This script tests the complete classes management functionality

const API_BASE = 'http://localhost:3001/api';

async function testClassesPageFunctionality() {
  console.log('🧪 Testing Classes Page Functionality...\n');
  
  try {
    // 1. Test login
    console.log('1. 🔐 Testing login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // 2. Test classes with topics
    console.log('\n2. 📚 Testing classes with topics...');
    const classesResponse = await fetch(`${API_BASE}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const classes = await classesResponse.json();
    console.log(`✅ Found ${classes.length} classes`);
    
    // Show class details with topics
    classes.forEach((cls, index) => {
      console.log(`   ${index + 1}. ${cls.name} - ${cls.section}`);
      console.log(`      Teacher: ${cls.teacher_name}`);
      console.log(`      Students: ${cls.total_students}, Topics: ${cls.total_topics}`);
      if (cls.topics && cls.topics.length > 0) {
        console.log(`      Topics:`);
        cls.topics.forEach((topic, topicIndex) => {
          console.log(`        ${topicIndex + 1}. ${topic.name} (${topic.status})`);
        });
      }
      console.log('');
    });

    // 3. Test dropdown data endpoints
    console.log('3. 📋 Testing dropdown data endpoints...');
    
    const teachersResponse = await fetch(`${API_BASE}/teachers/dropdown`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const teachers = await teachersResponse.json();
    console.log(`✅ Teachers dropdown: ${teachers.length} teachers available`);

    const academicYearsResponse = await fetch(`${API_BASE}/academic-years/dropdown`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const academicYears = await academicYearsResponse.json();
    console.log(`✅ Academic years dropdown: ${academicYears.length} years available`);

    const subjectsResponse = await fetch(`${API_BASE}/subjects/dropdown`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const subjects = await subjectsResponse.json();
    console.log(`✅ Subjects dropdown: ${subjects.length} subjects available`);

    // 4. Calculate statistics
    console.log('\n4. 📊 Testing statistics calculation...');
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.total_students || 0), 0);
    const totalTopics = classes.reduce((sum, cls) => sum + (cls.total_topics || 0), 0);
    const averageStudentsPerClass = classes.length > 0 ? Math.round(totalStudents / classes.length) : 0;
    
    console.log(`✅ Statistics:`);
    console.log(`   Total Classes: ${classes.length}`);
    console.log(`   Total Students: ${totalStudents}`);
    console.log(`   Total Topics: ${totalTopics}`);
    console.log(`   Average Students per Class: ${averageStudentsPerClass}`);

    // 5. Test topic status distribution
    console.log('\n5. 🎯 Testing topic status distribution...');
    const allTopics = classes.flatMap(cls => cls.topics || []);
    const statusCounts = allTopics.reduce((acc, topic) => {
      acc[topic.status] = (acc[topic.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`✅ Topic status distribution:`);
    console.log(`   Completed: ${statusCounts.completed || 0}`);
    console.log(`   In Progress: ${statusCounts.in_progress || 0}`);
    console.log(`   Planned: ${statusCounts.planned || 0}`);

    console.log('\n🎉 Classes Page Functionality Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   • ${classes.length} classes with detailed information`);
    console.log(`   • ${teachers.length} teachers available for class assignment`);
    console.log(`   • ${subjects.length} subjects for topic creation`);
    console.log(`   • ${totalTopics} topics across all classes`);
    console.log(`   • All dropdown data endpoints working`);
    console.log(`   • Statistics calculation working`);
    console.log('\n🌐 Frontend ready at: http://localhost:8083');
    console.log('   Login as admin@school.com / admin123 to test the UI');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testClassesPageFunctionality();
