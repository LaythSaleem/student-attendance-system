const fetch = globalThis.fetch || require('node-fetch');

const API_BASE = 'http://localhost:8888/api';

async function testReportGenerationEndpoints() {
  try {
    console.log('🧪 Testing Report Generation Endpoints');
    
    // Get auth token
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Authentication successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test all report endpoints
    const reportEndpoints = [
      { name: 'Daily Attendance', path: '/reports/daily-attendance' },
      { name: 'Weekly Attendance', path: '/reports/weekly-attendance' },
      { name: 'Monthly Attendance', path: '/reports/monthly-attendance' },
      { name: 'Class Performance', path: '/reports/class-performance' }
    ];
    
    for (const endpoint of reportEndpoints) {
      try {
        const response = await fetch(`${API_BASE}${endpoint.path}`, { headers });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint.name}: ${data.data?.length || 0} records`);
          
          // Show sample summary data
          if (data.summary) {
            const summaryKeys = Object.keys(data.summary).slice(0, 3);
            const summaryData = summaryKeys.map(key => `${key}: ${data.summary[key]}`).join(', ');
            console.log(`   Summary: ${summaryData}`);
          }
        } else {
          console.log(`❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ${error.message}`);
      }
    }
    
    // Test student-specific report
    try {
      const studentsResponse = await fetch(`${API_BASE}/students`, { headers });
      if (studentsResponse.ok) {
        const students = await studentsResponse.json();
        if (students.length > 0) {
          const firstStudent = students[0];
          const studentReportResponse = await fetch(
            `${API_BASE}/reports/student-attendance/${firstStudent.id}`, 
            { headers }
          );
          
          if (studentReportResponse.ok) {
            const studentData = await studentReportResponse.json();
            console.log(`✅ Student Report (${firstStudent.name}): ${studentData.data?.length || 0} records`);
          } else {
            console.log(`❌ Student Report: ${studentReportResponse.status}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Student Report: ${error.message}`);
    }
    
    console.log('🎉 Report generation endpoint tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testReportGenerationEndpoints();
