// Test API endpoints with correct port
const testEndpoints = async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNjFlYTgzZi1iZWI1LTQxZTMtOGY0OC1mODY5MmI2OTQ3ZDAiLCJlbWFpbCI6ImFkbWluQHNjaG9vbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NDk4MjU1MjgsImV4cCI6MTc0OTkxMTkyOH0.lFWJqrQFqjlKuOJwc1cVtYYiuWpbU9pTpGSdPEBZvbI';
  
  const endpoints = [
    'http://localhost:8888/api/students',
    'http://localhost:8888/api/teachers',
    'http://localhost:8888/api/classes'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  Data length: ${Array.isArray(data) ? data.length : 'N/A'}`);
      } else {
        const error = await response.text();
        console.log(`  Error: ${error}`);
      }
    } catch (error) {
      console.log(`${endpoint}: Failed - ${error.message}`);
    }
  }
};

if (typeof window !== 'undefined') {
  // Browser environment
  testEndpoints();
} else {
  console.log('This script should be run in a browser console');
}
