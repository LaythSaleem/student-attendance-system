const fs = require('fs');

const API_BASE = 'http://localhost:3001/api';

// Test credentials
const TEACHER_CREDENTIALS = {
  email: 'teacher@school.com',
  password: 'teacher123'
};

async function login(credentials) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Login error:', error.message);
    return null;
  }
}

async function testExamAttendanceEndpoints(token) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log('\n=== Testing Exam Attendance Endpoints ===\n');

  try {
    // 1. Test fetching exams
    console.log('1. Testing /api/exams endpoint...');
    const examsResponse = await fetch(`${API_BASE}/exams`, { headers });
    if (examsResponse.ok) {
      const exams = await examsResponse.json();
      console.log(`✅ Found ${exams.length} exams`);
      if (exams.length > 0) {
        console.log(`   First exam: ${exams[0].title} (ID: ${exams[0].id})`);
      }
    } else {
      console.log(`❌ Exams fetch failed: ${examsResponse.status}`);
    }

    // 2. Test fetching teacher classes
    console.log('\n2. Testing /api/teachers/my-classes endpoint...');
    const classesResponse = await fetch(`${API_BASE}/teachers/my-classes`, { headers });
    if (classesResponse.ok) {
      const classes = await classesResponse.json();
      console.log(`✅ Found ${classes.length} classes`);
      
      if (classes.length > 0) {
        const testClass = classes[0];
        console.log(`   Test class: ${testClass.name} (ID: ${testClass.id})`);

        // 3. Test fetching students for the class
        console.log('\n3. Testing /api/teachers/class-students endpoint...');
        const studentsResponse = await fetch(`${API_BASE}/teachers/class-students?classId=${testClass.id}`, { headers });
        if (studentsResponse.ok) {
          const students = await studentsResponse.json();
          console.log(`✅ Found ${students.length} students in class`);

          if (students.length > 0) {
            // 4. Test exam attendance submission
            console.log('\n4. Testing exam attendance submission...');
            
            const examAttendanceData = {
              classId: testClass.id,
              examId: 'test_exam_001',
              date: new Date().toISOString().split('T')[0],
              attendance: students.slice(0, 2).map((student, index) => ({
                studentId: student.id,
                status: index === 0 ? 'present' : 'absent',
                photo: index === 0 ? 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=' : null,
                notes: `Exam attendance - ${index === 0 ? 'present' : 'absent'}`
              }))
            };

            const submitResponse = await fetch(`${API_BASE}/teachers/exam-attendance`, {
              method: 'POST',
              headers,
              body: JSON.stringify(examAttendanceData)
            });

            if (submitResponse.ok) {
              const result = await submitResponse.json();
              console.log(`✅ Exam attendance submitted successfully: ${result.count} records`);

              // 5. Test fetching exam attendance records
              console.log('\n5. Testing exam attendance records retrieval...');
              const recordsResponse = await fetch(
                `${API_BASE}/teachers/exam-attendance-records?classId=${testClass.id}&examId=test_exam_001&date=${examAttendanceData.date}`,
                { headers }
              );

              if (recordsResponse.ok) {
                const records = await recordsResponse.json();
                console.log(`✅ Retrieved ${records.length} exam attendance records`);
                
                records.forEach(record => {
                  console.log(`   - ${record.student_name}: ${record.status} ${record.photo ? '(with photo)' : '(no photo)'}`);
                });
              } else {
                console.log(`❌ Failed to retrieve exam attendance records: ${recordsResponse.status}`);
              }
            } else {
              const errorText = await submitResponse.text();
              console.log(`❌ Exam attendance submission failed: ${submitResponse.status} - ${errorText}`);
            }
          } else {
            console.log('⚠️  No students found in class - skipping attendance tests');
          }
        } else {
          console.log(`❌ Students fetch failed: ${studentsResponse.status}`);
        }
      } else {
        console.log('⚠️  No classes found - skipping class-specific tests');
      }
    } else {
      console.log(`❌ Classes fetch failed: ${classesResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Exam Attendance API Tests...\n');
  
  // Login as teacher
  console.log('Logging in as teacher...');
  const token = await login(TEACHER_CREDENTIALS);
  
  if (!token) {
    console.error('❌ Failed to obtain authentication token');
    return;
  }
  
  console.log('✅ Successfully logged in as teacher');
  
  // Run tests
  await testExamAttendanceEndpoints(token);
  
  console.log('\n🎉 Exam Attendance Tests Completed!');
}

// Run the tests
runTests().catch(console.error);
