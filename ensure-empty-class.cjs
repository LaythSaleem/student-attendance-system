#!/usr/bin/env node

/**
 * Quick test to ensure we have a class without topics for testing
 */

const API_BASE = 'http://localhost:3001/api';

async function ensureEmptyClass() {
  try {
    // Login
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });

    const { token } = await loginResponse.json();

    // Get classes
    const classesResponse = await fetch(`${API_BASE}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const classes = await classesResponse.json();
    
    // Find a class without topics
    const emptyClass = classes.find(c => !c.topics || c.topics.length === 0);
    
    if (emptyClass) {
      console.log('✅ Found class without topics:');
      console.log(`   Name: ${emptyClass.name}`);
      console.log(`   Section: ${emptyClass.section}`);
      console.log(`   ID: ${emptyClass.id}`);
      console.log(`   Topics: ${emptyClass.topics?.length || 0}`);
    } else {
      console.log('❌ No class without topics found');
      
      // Clear topics from the first class
      const targetClass = classes[0];
      if (targetClass.topics && targetClass.topics.length > 0) {
        console.log(`🧹 Clearing topics from ${targetClass.name}...`);
        
        for (const topic of targetClass.topics) {
          await fetch(`${API_BASE}/topics/${topic.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        
        console.log(`✅ Cleared ${targetClass.topics.length} topics`);
        console.log(`   Test with: ${targetClass.name} - ${targetClass.section}`);
      }
    }

    console.log('\n🧪 TEST STEPS:');
    console.log('==============');
    console.log('1. Open http://localhost:8083');
    console.log('2. Login as admin@school.com / admin123');
    console.log('3. Go to Classes page');
    console.log('4. Find the class without topics');
    console.log('5. Click "⋮" → "View Details"');
    console.log('6. Look for "Add First Topic" button');
    console.log('7. Click it and check console for debug logs');
    console.log('8. Verify if the Add Topic dialog opens');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

ensureEmptyClass();
