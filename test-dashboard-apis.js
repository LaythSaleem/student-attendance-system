#!/usr/bin/env node

const API_BASE = 'http://localhost:8888/api';

async function testDashboardAPIs() {
  console.log('🧪 Testing Dashboard API Integration');
  console.log('====================================\n');

  try {
    // Step 1: Login
    console.log('1. 🔐 Authenticating...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const { token } = await loginResponse.json();
    console.log('✅ Authentication successful\n');

    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test all dashboard endpoints
    console.log('2. 📊 Testing dashboard endpoints...');
    
    const endpoints = [
      { name: 'Students', path: '/students' },
      { name: 'Teachers', path: '/teachers' },
      { name: 'Classes', path: '/classes' },
      { name: 'Topics', path: '/teachers/available-topics' },
      { name: 'Exams', path: '/exams' }
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE}${endpoint.path}`, {
          headers: authHeaders
        });
        
        if (response.ok) {
          const data = await response.json();
          const count = Array.isArray(data) ? data.length : Object.keys(data).length;
          results[endpoint.name] = count;
          console.log(`   ✅ ${endpoint.name}: ${count} records`);
        } else {
          console.log(`   ❌ ${endpoint.name}: Failed (${response.status})`);
          results[endpoint.name] = 0;
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: Error - ${error.message}`);
        results[endpoint.name] = 0;
      }
    }

    console.log('\n📈 Dashboard Summary:');
    console.log('====================');
    console.log(`   Students: ${results.Students || 0}`);
    console.log(`   Teachers: ${results.Teachers || 0}`);
    console.log(`   Classes: ${results.Classes || 0}`);
    console.log(`   Topics: ${results.Topics || 0}`);
    console.log(`   Exams: ${results.Exams || 0}`);

    console.log('\n🎉 Dashboard API test completed!');
    console.log('✅ Dashboard should now display real data');
    console.log('🌐 Visit: http://localhost:8080 and check the Overview page');

  } catch (error) {
    console.error('❌ Dashboard API test failed:', error.message);
  }
}

testDashboardAPIs();
