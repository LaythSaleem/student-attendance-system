#!/usr/bin/env node

// Debug script to test student API directly
const BASE_URL = 'http://localhost:3001/api';

async function debugStudentAPI() {
  console.log('🔍 Debugging Student API...\n');

  try {
    // Login as student
    console.log('1. 🎓 Logging in as student...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john.doe@student.school.com',
        password: 'student123'
      })
    });

    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('Login error:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('User data:', JSON.stringify(loginData, null, 2));

    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Test student classes endpoint
    console.log('\n2. 📚 Testing student classes endpoint...');
    const classesResponse = await fetch(`${BASE_URL}/students/my-classes`, {
      headers: authHeaders
    });

    console.log('Classes response status:', classesResponse.status);
    
    if (!classesResponse.ok) {
      const errorText = await classesResponse.text();
      console.log('Classes error:', errorText);
    } else {
      const classes = await classesResponse.json();
      console.log('✅ Classes fetched successfully');
      console.log(`Found ${classes.length} classes`);
      console.log('Classes data:', JSON.stringify(classes.slice(0, 2), null, 2)); // Show first 2 classes
    }

    // Test student attendance endpoint  
    console.log('\n3. 📊 Testing student attendance endpoint...');
    const attendanceResponse = await fetch(`${BASE_URL}/students/my-attendance`, {
      headers: authHeaders
    });

    console.log('Attendance response status:', attendanceResponse.status);
    
    if (!attendanceResponse.ok) {
      const errorText = await attendanceResponse.text();
      console.log('Attendance error:', errorText);
    } else {
      const attendance = await attendanceResponse.json();
      console.log('✅ Attendance fetched successfully');
      console.log(`Found ${attendance.length} attendance records`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugStudentAPI().catch(console.error);
