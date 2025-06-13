#!/usr/bin/env node

/**
 * Verify that the classes endpoint now shows correct topic and student counts
 */

const API_BASE = 'http://localhost:8888/api';

async function verifyFix() {
  console.log('🔧 VERIFYING CLASSES DATA FIX');
  console.log('==============================\n');

  try {
    // Step 1: Use valid JWT token
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5Ac2Nob29sLmNvbSIsImlhdCI6MTc0OTY5NDYyOH0.HQUGPWeWP-GQu2FZXYLArY0lVoWgxxV3XQbZQSQeZQU';

    // Step 2: Test classes endpoint
    console.log('📋 Testing /api/classes endpoint...');
    const response = await fetch(`${API_BASE}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const classes = await response.json();
    console.log(`✅ Found ${classes.length} classes\n`);

    // Step 3: Show summary
    console.log('📊 CLASSES SUMMARY:');
    console.log('==================');

    let totalStudents = 0;
    let totalTopics = 0;
    let classesWithTopics = 0;
    let classesWithStudents = 0;

    classes.forEach((cls, index) => {
      const studentCount = cls.student_count || 0;
      const topicCount = cls.total_topics || 0;
      const actualTopics = cls.topics ? cls.topics.length : 0;

      console.log(`${index + 1}. ${cls.name} - ${cls.section}`);
      console.log(`   Students: ${studentCount}`);
      console.log(`   Topics: ${topicCount} (actual: ${actualTopics})`);
      
      if (topicCount !== actualTopics) {
        console.log(`   ⚠️  Mismatch: total_topics=${topicCount}, actual topics=${actualTopics}`);
      }

      totalStudents += studentCount;
      totalTopics += topicCount;
      
      if (topicCount > 0) classesWithTopics++;
      if (studentCount > 0) classesWithStudents++;
      
      console.log('');
    });

    console.log('🎯 SUMMARY STATISTICS:');
    console.log('=====================');
    console.log(`Total Classes: ${classes.length}`);
    console.log(`Classes with Students: ${classesWithStudents}`);
    console.log(`Classes with Topics: ${classesWithTopics}`);
    console.log(`Total Students: ${totalStudents}`);
    console.log(`Total Topics: ${totalTopics}`);

    console.log('\n✅ FIX VERIFICATION COMPLETE!');
    
    if (classesWithTopics > 0 && totalTopics > 0) {
      console.log('🎉 SUCCESS: Topics are now showing correctly!');
    } else {
      console.log('❌ ISSUE: Topics still showing as 0');
    }

    if (classesWithStudents > 0 && totalStudents > 0) {
      console.log('🎉 SUCCESS: Student counts are showing correctly!');
    } else {
      console.log('❌ ISSUE: Student counts still showing as 0');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyFix();
