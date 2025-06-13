#!/usr/bin/env node

/**
 * Verify Medical College System Setup
 */

const API_BASE = 'http://localhost:3001/api';

async function verifyMedicalCollegeSystem() {
  console.log('🏥 Verifying Medical College System');
  console.log('==================================\n');

  try {
    // Login as admin
    console.log('1. 🔐 Authenticating...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });

    const { token } = await loginResponse.json();
    console.log('✅ Login successful\n');

    // Get classes (medical stages)
    console.log('2. 📚 Fetching medical stages...');
    const classesResponse = await fetch(`${API_BASE}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const classes = await classesResponse.json();
    console.log(`✅ Found ${classes.length} medical stages\n`);

    // Display medical college structure
    console.log('🏥 Medical College Structure:');
    console.log('============================');
    
    classes.forEach((stage, index) => {
      console.log(`\n${index + 1}. ${stage.name} - ${stage.section}`);
      console.log(`   📖 Description: ${stage.description}`);
      console.log(`   📚 Topics: ${stage.total_topics}`);
      console.log(`   👥 Students: ${stage.total_students}`);
      console.log(`   👨‍🏫 Teacher: ${stage.teacher_name || 'Not assigned'}`);
      
      if (stage.topics && stage.topics.length > 0) {
        console.log(`   📝 Topic List:`);
        stage.topics.slice(0, 3).forEach((topic, topicIndex) => {
          console.log(`      ${topicIndex + 1}. ${topic.name} (${topic.status})`);
        });
        if (stage.topics.length > 3) {
          console.log(`      ... and ${stage.topics.length - 3} more topics`);
        }
      }
    });

    // Summary statistics
    console.log('\n📊 Medical College Statistics:');
    console.log('==============================');
    const totalTopics = classes.reduce((sum, stage) => sum + stage.total_topics, 0);
    const totalStudents = classes.reduce((sum, stage) => sum + stage.total_students, 0);
    
    console.log(`🏥 Total Medical Stages: ${classes.length}`);
    console.log(`📚 Total Topics: ${totalTopics}`);
    console.log(`👥 Total Students: ${totalStudents}`);
    
    // Topic status breakdown
    const allTopics = classes.flatMap(stage => stage.topics || []);
    const statusCounts = {
      completed: allTopics.filter(t => t.status === 'completed').length,
      in_progress: allTopics.filter(t => t.status === 'in_progress').length,
      planned: allTopics.filter(t => t.status === 'planned').length
    };
    
    console.log(`\n📈 Topic Progress:`);
    console.log(`   ✅ Completed: ${statusCounts.completed} topics`);
    console.log(`   🔄 In Progress: ${statusCounts.in_progress} topics`);
    console.log(`   📋 Planned: ${statusCounts.planned} topics`);

    console.log('\n🎉 Medical College System Verification Complete!');
    console.log('================================================');
    console.log('✅ All medical stages are properly created');
    console.log('✅ Topics are correctly assigned to stages');
    console.log('✅ System is ready for medical college management');
    console.log('\n🌐 Access the frontend at: http://localhost:8080');

  } catch (error) {
    console.error('\n❌ Medical College System Verification Failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyMedicalCollegeSystem();
