#!/usr/bin/env node

/**
 * Debug the students-with-attendance endpoint to find duplicate student IDs
 */

async function debugStudentsAPI() {
  console.log('🔍 Debugging students-with-attendance API...\n');

  try {
    // Login as teacher
    console.log('1. Logging in as teacher...');
    const loginResponse = await fetch('http://localhost:8888/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher@school.com',
        password: 'teacher123'
      })
    });

    const { token } = await loginResponse.json();
    console.log('✅ Login successful');

    // Get students with attendance
    console.log('\n2. Fetching students with attendance...');
    const response = await fetch('http://localhost:8888/api/teachers/students-with-attendance', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const students = await response.json();
    console.log(`Found ${students.length} total records`);

    // Analyze duplicates
    const studentMap = new Map();
    const duplicates = [];

    students.forEach((student, index) => {
      if (studentMap.has(student.id)) {
        duplicates.push({
          id: student.id,
          name: student.name,
          class: student.stage,
          class_name: student.class_name,
          first_occurrence: studentMap.get(student.id),
          duplicate_occurrence: index
        });
      } else {
        studentMap.set(student.id, index);
      }
    });

    console.log(`\n3. Analysis Results:`);
    console.log(`   Unique students: ${studentMap.size}`);
    console.log(`   Total records: ${students.length}`);
    console.log(`   Duplicates found: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log('\n4. Duplicate Details:');
      duplicates.forEach(dup => {
        const first = students[dup.first_occurrence];
        const duplicate = students[dup.duplicate_occurrence];
        
        console.log(`\n   Student ID: ${dup.id}`);
        console.log(`   Name: ${dup.name}`);
        console.log(`   First occurrence (index ${dup.first_occurrence}):`);
        console.log(`     Class: ${first.stage} - ${first.class_name}`);
        console.log(`     Enrollment: ${first.enrollment_date} (${first.enrollment_status})`);
        console.log(`   Duplicate occurrence (index ${dup.duplicate_occurrence}):`);
        console.log(`     Class: ${duplicate.stage} - ${duplicate.class_name}`);
        console.log(`     Enrollment: ${duplicate.enrollment_date} (${duplicate.enrollment_status})`);
      });

      console.log('\n5. Root Cause Analysis:');
      console.log('   The duplicates are likely caused by:');
      console.log('   - Students enrolled in multiple classes');
      console.log('   - Improper JOIN conditions in SQL query');
      console.log('   - Missing DISTINCT clause or GROUP BY issues');
    } else {
      console.log('\n✅ No duplicates found!');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugStudentsAPI();
