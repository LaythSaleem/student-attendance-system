#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Checking for React Key Duplication Issues...\n');

try {
  // 1. Check students table for duplicates
  console.log('1. 🧑‍🎓 Checking for duplicate student IDs...');
  const duplicateStudents = db.prepare(`
    SELECT id, COUNT(*) as count 
    FROM students 
    GROUP BY id 
    HAVING COUNT(*) > 1
  `).all();
  
  if (duplicateStudents.length > 0) {
    console.log('❌ Found duplicate student IDs:');
    duplicateStudents.forEach(dup => {
      console.log(`   ID: ${dup.id} appears ${dup.count} times`);
    });
  } else {
    console.log('✅ No duplicate student IDs found');
  }

  // 2. Check for students with same roll numbers
  console.log('\n2. 📝 Checking for duplicate roll numbers...');
  const duplicateRollNumbers = db.prepare(`
    SELECT roll_number, COUNT(*) as count, GROUP_CONCAT(id) as student_ids
    FROM students 
    GROUP BY roll_number 
    HAVING COUNT(*) > 1
  `).all();
  
  if (duplicateRollNumbers.length > 0) {
    console.log('❌ Found duplicate roll numbers:');
    duplicateRollNumbers.forEach(dup => {
      console.log(`   Roll: ${dup.roll_number} used by students: ${dup.student_ids}`);
    });
  } else {
    console.log('✅ No duplicate roll numbers found');
  }

  // 3. Check enrollment duplicates
  console.log('\n3. 📚 Checking for duplicate enrollments...');
  const duplicateEnrollments = db.prepare(`
    SELECT student_id, class_id, COUNT(*) as count 
    FROM student_enrollments 
    GROUP BY student_id, class_id 
    HAVING COUNT(*) > 1
  `).all();
  
  if (duplicateEnrollments.length > 0) {
    console.log('❌ Found duplicate enrollments:');
    duplicateEnrollments.forEach(dup => {
      console.log(`   Student ${dup.student_id} enrolled in class ${dup.class_id} ${dup.count} times`);
    });
  } else {
    console.log('✅ No duplicate enrollments found');
  }

  // 4. Check for null or empty IDs
  console.log('\n4. 🔍 Checking for null/empty student IDs...');
  const nullIds = db.prepare(`
    SELECT COUNT(*) as count 
    FROM students 
    WHERE id IS NULL OR id = ''
  `).get();
  
  if (nullIds.count > 0) {
    console.log(`❌ Found ${nullIds.count} students with null/empty IDs`);
  } else {
    console.log('✅ All students have valid IDs');
  }

  // 5. Check for unusual ID patterns
  console.log('\n5. 🔗 Checking student ID patterns...');
  const studentIds = db.prepare(`SELECT id, name FROM students ORDER BY id`).all();
  
  console.log(`   Total students: ${studentIds.length}`);
  console.log('   First 10 student IDs:');
  studentIds.slice(0, 10).forEach(student => {
    console.log(`     ${student.id} - ${student.name}`);
  });

  // 6. Check for specific problematic students mentioned
  console.log('\n6. 🎯 Checking for specific problematic students...');
  const problematicIds = ['student_11', 'student_5', 'student_1'];
  
  problematicIds.forEach(id => {
    const student = db.prepare(`SELECT * FROM students WHERE id = ?`).get(id);
    if (student) {
      console.log(`   ✅ ${id}: ${student.name} (${student.roll_number})`);
    } else {
      console.log(`   ❌ ${id}: Not found`);
    }
  });

  // 7. Check for invalid base64 images
  console.log('\n7. 🖼️  Checking for invalid base64 image data...');
  const invalidImages = db.prepare(`
    SELECT student_id, LENGTH(profile_picture) as length, 
           SUBSTR(profile_picture, 1, 30) as start_text
    FROM student_profiles 
    WHERE profile_picture IS NOT NULL 
    AND profile_picture != '' 
    AND profile_picture NOT LIKE 'data:image/%'
  `).all();
  
  if (invalidImages.length > 0) {
    console.log(`❌ Found ${invalidImages.length} invalid base64 images:`);
    invalidImages.forEach(img => {
      console.log(`   Student ${img.student_id}: "${img.start_text}..." (length: ${img.length})`);
    });
  } else {
    console.log('✅ All profile pictures have valid base64 format');
  }

  // 8. Check for malformed data URLs
  console.log('\n8. 🔗 Checking for malformed data URLs...');
  const malformedUrls = db.prepare(`
    SELECT student_id, profile_picture
    FROM student_profiles 
    WHERE profile_picture LIKE 'data:image/%'
    AND (
      profile_picture NOT LIKE 'data:image/jpeg;base64,%' 
      AND profile_picture NOT LIKE 'data:image/png;base64,%'
      AND profile_picture NOT LIKE 'data:image/gif;base64,%'
      AND profile_picture NOT LIKE 'data:image/webp;base64,%'
    )
  `).all();
  
  if (malformedUrls.length > 0) {
    console.log(`❌ Found ${malformedUrls.length} malformed data URLs:`);
    malformedUrls.forEach(url => {
      const start = url.profile_picture.substring(0, 50);
      console.log(`   Student ${url.student_id}: "${start}..."`);
    });
  } else {
    console.log('✅ All data URLs are properly formatted');
  }

  console.log('\n✅ React key duplication check completed!');

} catch (error) {
  console.error('❌ Error during check:', error);
} finally {
  db.close();
}
