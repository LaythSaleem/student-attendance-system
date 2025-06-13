#!/usr/bin/env node

const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🏥 Creating Student Enrollments for Medical College System');
console.log('====================================================\n');

try {
  // Get all students and classes
  const students = db.prepare('SELECT id, name, class FROM students').all();
  const classes = db.prepare('SELECT id, name, section FROM classes ORDER BY name').all();
  
  console.log(`📊 Found ${students.length} students and ${classes.length} classes\n`);
  
  // Map student class assignments to actual medical stages
  const classMapping = {
    'class_1': 'stage_1', // Grade 10A -> Stage 1 (First Year)
    'class_2': 'stage_2', // Grade 10B -> Stage 2 (Second Year) 
    'class_3': 'stage_3', // Grade 11A -> Stage 3 (Third Year)
    'class_4': 'stage_4', // Advanced CS -> Stage 4 (Fourth Year)
    '1': 'stage_1'        // Handle the one student with just "1"
  };
  
  // Clear existing enrollments
  console.log('🧹 Clearing existing enrollments...');
  db.prepare('DELETE FROM student_enrollments').run();
  
  // Create enrollment statement
  const insertEnrollment = db.prepare(`
    INSERT INTO student_enrollments (id, student_id, class_id, enrollment_date, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  // Enroll students
  let enrollmentCount = 0;
  const enrollmentDate = '2024-09-01'; // Academic year start
  
  console.log('👥 Creating enrollments...\n');
  
  students.forEach((student) => {
    const targetClassId = classMapping[student.class];
    
    if (targetClassId) {
      const targetClass = classes.find(c => c.id === targetClassId);
      
      if (targetClass) {
        const enrollmentId = uuidv4();
        insertEnrollment.run(
          enrollmentId,
          student.id,
          targetClassId,
          enrollmentDate,
          'active'
        );
        
        console.log(`✅ Enrolled ${student.name} in ${targetClass.name} - ${targetClass.section}`);
        enrollmentCount++;
      } else {
        console.log(`❌ Class ${targetClassId} not found for student ${student.name}`);
      }
    } else {
      console.log(`❌ No mapping found for class ${student.class} (student: ${student.name})`);
    }
  });
  
  console.log(`\n🎉 Successfully created ${enrollmentCount} enrollments!`);
  
  // Verify enrollments
  console.log('\n📊 Enrollment Summary:');
  const enrollmentSummary = db.prepare(`
    SELECT 
      c.name as class_name,
      c.section,
      COUNT(se.student_id) as student_count
    FROM student_enrollments se
    JOIN classes c ON se.class_id = c.id
    WHERE se.status = 'active'
    GROUP BY c.id, c.name, c.section
    ORDER BY c.name
  `).all();
  
  enrollmentSummary.forEach(summary => {
    console.log(`   ${summary.class_name} - ${summary.section}: ${summary.student_count} students`);
  });
  
  console.log('\n✅ Student enrollment setup complete!');
  console.log('\n🧪 Test the API:');
  console.log('   1. Login as a student: john.doe@student.school.com / student123');
  console.log('   2. Call GET /api/students/my-classes');
  console.log('   3. Check enrolled classes and subjects');

} catch (error) {
  console.error('❌ Error creating enrollments:', error);
} finally {
  db.close();
}
