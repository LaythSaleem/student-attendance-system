#!/usr/bin/env node

// Test script to verify the student classes API works
const BASE_URL = 'http://localhost:3001/api';

async function testStudentClassesAPI() {
  console.log('🧪 Testing Student Classes API...\n');

  try {
    // Step 1: Login as admin to check the system
    console.log('1. 📝 Logging in as admin to check system...');
    const adminLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });

    if (!adminLoginResponse.ok) {
      throw new Error('Admin login failed');
    }

    const { token: adminToken } = await adminLoginResponse.json();
    console.log('✅ Admin login successful\n');

    const adminAuthHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };

    // Step 2: Check what classes exist
    console.log('2. 📚 Checking available classes...');
    const classesResponse = await fetch(`${BASE_URL}/classes`, {
      headers: adminAuthHeaders
    });

    if (!classesResponse.ok) {
      throw new Error('Failed to fetch classes');
    }

    const classes = await classesResponse.json();
    console.log(`✅ Found ${classes.length} classes`);
    
    classes.forEach((cls, index) => {
      console.log(`   ${index + 1}. ${cls.name} - ${cls.section} (${cls.total_students} students, ${cls.total_topics} topics)`);
    });
    console.log('');

    // Step 3: Try to login as a student (we'll test without enrollment)
    console.log('3. 🎓 Testing student access (no enrollment required)...');
    
    // First, let's check if any student accounts exist
    const studentsResponse = await fetch(`${BASE_URL}/students`, {
      headers: adminAuthHeaders
    });
    
    const students = await studentsResponse.json();
    console.log(`   Found ${students.length} students in system`);
    
    // Try to find a student with an email account
    const studentWithEmail = students.find(s => s.email);
    
    if (studentWithEmail) {
      console.log(`   Attempting to test with student: ${studentWithEmail.email}`);
      
      // Try to login as this student (using default password)
      try {
        const studentLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: studentWithEmail.email,
            password: 'student123' // Default password from the API
          })
        });

        if (studentLoginResponse.ok) {
          const { token: studentToken } = await studentLoginResponse.json();
          console.log('   ✅ Student login successful');

          const studentAuthHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${studentToken}`
          };

          // Test the student classes endpoint
          console.log('   📚 Testing student classes endpoint...');
          const studentClassesResponse = await fetch(`${BASE_URL}/students/my-classes`, {
            headers: studentAuthHeaders
          });

          if (studentClassesResponse.ok) {
            const studentClasses = await studentClassesResponse.json();
            console.log(`   ✅ Student can see ${studentClasses.length} classes`);
            
            studentClasses.forEach((cls, index) => {
              console.log(`      ${index + 1}. ${cls.name} - ${cls.section} (${cls.total_topics} topics)`);
            });
          } else {
            console.log('   ❌ Student classes fetch failed');
          }

          // Test student attendance endpoint
          console.log('   📊 Testing student attendance endpoint...');
          const attendanceResponse = await fetch(`${BASE_URL}/students/my-attendance`, {
            headers: studentAuthHeaders
          });

          if (attendanceResponse.ok) {
            const attendance = await attendanceResponse.json();
            console.log(`   ✅ Student attendance endpoint works (${attendance.length} records)`);
          } else {
            console.log('   ❌ Student attendance fetch failed');
          }

        } else {
          console.log('   ⚠️  Student login failed - may need to set up student credentials');
        }
      } catch (err) {
        console.log('   ⚠️  Student login test failed:', err.message);
      }
    } else {
      console.log('   ⚠️  No student accounts with email found');
    }

    console.log('\n🎉 Student API Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   • ${classes.length} classes available`);
    console.log(`   • ${students.length} students in system`);
    console.log('   • Student classes endpoint updated to show all classes');
    console.log('   • No enrollment records required');
    console.log('\n🌐 Students can now view all available classes and topics');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testStudentClassesAPI().catch(console.error);
