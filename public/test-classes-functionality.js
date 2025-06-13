// Test script to check Classes functionality
// Run this in the browser console when on the Classes page

console.log('=== Classes Management Test ===');

// Check if we're authenticated
const token = localStorage.getItem('auth_token');
console.log('1. Auth Token:', token ? 'Present' : 'Missing');

if (!token) {
  console.log('❌ Not authenticated. Please login first.');
} else {
  // Test API endpoints
  const testAPI = async () => {
    try {
      console.log('2. Testing Classes API...');
      
      const response = await fetch('http://localhost:3001/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Classes API working:', data.length, 'classes');
      } else {
        console.log('❌ Classes API failed:', response.status);
      }
      
      // Test dropdown data
      console.log('3. Testing Dropdown APIs...');
      
      const teachersResponse = await fetch('http://localhost:3001/api/teachers/dropdown', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (teachersResponse.ok) {
        const teachers = await teachersResponse.json();
        console.log('✅ Teachers API working:', teachers.length, 'teachers');
      } else {
        console.log('❌ Teachers API failed:', teachersResponse.status);
      }
      
      const yearsResponse = await fetch('http://localhost:3001/api/academic-years/dropdown', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (yearsResponse.ok) {
        const years = await yearsResponse.json();
        console.log('✅ Academic Years API working:', years.length, 'years');
        console.log('Academic Years:', years);
      } else {
        console.log('❌ Academic Years API failed:', yearsResponse.status);
      }
      
    } catch (error) {
      console.log('❌ API Test failed:', error);
    }
  };
  
  testAPI();
}

// Check React components
console.log('4. Testing React Components...');

// Try to find Add Class button
const addButton = document.querySelector('button[class*="gap-2"]');
console.log('Add Class Button:', addButton ? 'Found' : 'Not Found');

if (addButton) {
  console.log('Button text:', addButton.textContent);
  console.log('Button enabled:', !addButton.disabled);
}

// Check if dialogs exist in DOM
const dialogs = document.querySelectorAll('[role="dialog"]');
console.log('Dialog elements found:', dialogs.length);

console.log('=== Test Complete ===');
