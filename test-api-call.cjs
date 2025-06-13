// Test actual API calls with authentication
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const db = new Database('./database.sqlite');

const testAPICall = async () => {
  try {
    console.log('🔍 Testing actual API call...');
    
    // Get admin user and generate token
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@school.com');
    const userRole = db.prepare('SELECT * FROM user_roles WHERE user_id = ?').get(user.id);
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: userRole?.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('🎫 Using token with role:', userRole?.role);
    
    // Test API call to students endpoint
    const response = await fetch('http://localhost:3001/api/students', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful, students count:', data.length);
    } else {
      const errorText = await response.text();
      console.log('❌ API call failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

testAPICall();
