// Script to generate and set proper auth token in localStorage
// Run this in browser console to fix authentication issues

const generateProperToken = () => {
  // Admin user data (matching the database)
  const userData = {
    id: '261ea83f-beb5-41e3-8f48-f8692b6947d0',
    email: 'admin@school.com',
    role: 'admin'
  };
  
  // For development, we'll use a token that matches what the server would generate
  // In production, always get tokens from the server via login
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNjFlYTgzZi1iZWI1LTQxZTMtOGY0OC1mODY5MmI2OTQ3ZDAiLCJlbWFpbCI6ImFkbWluQHNjaG9vbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NDk4MjU1MjgsImV4cCI6MTc0OTkxMTkyOH0.lFWJqrQFqjlKuOJwc1cVtYYiuWpbU9pTpGSdPEBZvbI';
  
  // Clear existing auth data
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('user_role');
  
  // Set new auth data
  localStorage.setItem('auth_token', mockToken);
  localStorage.setItem('auth_user', JSON.stringify(userData));
  localStorage.setItem('user_role', userData.role);
  
  console.log('✅ Auth data updated in localStorage');
  console.log('🎫 Token:', mockToken.substring(0, 50) + '...');
  console.log('👤 User:', userData);
  
  // Reload page to apply changes
  window.location.reload();
};

// Auto-run when included in HTML
if (typeof window !== 'undefined') {
  generateProperToken();
}
