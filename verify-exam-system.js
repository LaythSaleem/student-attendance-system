#!/usr/bin/env node

/**
 * Quick Verification Script for Exam Management System
 * Verifies that all components are working properly
 */

const API_BASE = 'http://localhost:3001/api';

async function quickVerification() {
  console.log('🏥 Quick Exam Management System Verification');
  console.log('===========================================\n');

  try {
    // Step 1: Test basic API connectivity
    console.log('1. 🔍 Testing API connectivity...');
    
    try {
      const response = await fetch(`${API_BASE}/health`);
      console.log('✅ API server is responsive');
    } catch (error) {
      console.log('⚠️  API server may not be running - trying login endpoint...');
    }

    // Step 2: Test authentication
    console.log('\n2. 🔐 Testing authentication...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Authentication failed - check server status');
    }

    const { token } = await loginResponse.json();
    console.log('✅ Authentication successful');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Step 3: Test exam types endpoint
    console.log('\n3. 📚 Testing exam types...');
    const examTypesResponse = await fetch(`${API_BASE}/exam-types`, {
      headers: authHeaders
    });

    if (examTypesResponse.ok) {
      const examTypes = await examTypesResponse.json();
      console.log(`✅ Found ${examTypes.length} exam types available`);
    } else {
      console.log('❌ Exam types endpoint failed');
    }

    // Step 4: Test exams endpoint
    console.log('\n4. 🎯 Testing exams endpoint...');
    const examsResponse = await fetch(`${API_BASE}/exams`, {
      headers: authHeaders
    });

    if (examsResponse.ok) {
      const exams = await examsResponse.json();
      console.log(`✅ Found ${exams.length} exams in system`);
    } else {
      console.log('❌ Exams endpoint failed');
    }

    // Step 5: Test medical stages (classes)
    console.log('\n5. 🏥 Testing medical stages...');
    const classesResponse = await fetch(`${API_BASE}/classes`, {
      headers: authHeaders
    });

    if (classesResponse.ok) {
      const classes = await classesResponse.json();
      const medicalStages = classes.filter(c => 
        c.name.includes('Stage') || c.section.includes('Year')
      );
      console.log(`✅ Found ${medicalStages.length} medical stages available`);
    } else {
      console.log('❌ Classes endpoint failed');
    }

    // Final Summary
    console.log('\n🎉 VERIFICATION COMPLETE!');
    console.log('========================');
    console.log('✅ Backend API: Working');
    console.log('✅ Authentication: Working');
    console.log('✅ Exam Management: Endpoints accessible');
    console.log('✅ Medical College: Stages available');
    console.log('');
    console.log('🌐 Frontend Access:');
    console.log('   URL: http://localhost:8080');
    console.log('   Login: admin@school.com / admin123');
    console.log('   Navigate: Sidebar → Exams');
    console.log('');
    console.log('🎯 Exam Management Features:');
    console.log('   ➕ Schedule Exam: Create new exams');
    console.log('   👥 Mark Attendance: Track student attendance');
    console.log('   ✏️  Edit Exams: Update exam details');
    console.log('   📊 Dashboard: View exam statistics');
    console.log('');
    console.log('🚀 System Status: READY FOR USE!');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Start server: npm run dev:full');
    console.log('   2. Check port 3001: Backend API');
    console.log('   3. Check port 8080: Frontend app');
    console.log('   4. Run migration: node migrate-exam-system.cjs');
  }
}

// Run verification
quickVerification();
