// Debug script to test API authentication
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const db = new Database('./database.sqlite');

// Test login
const testLogin = async () => {
  try {
    console.log('🔍 Testing login...');
    
    // Get admin user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@school.com');
    console.log('👤 User found:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('📧 Email:', user.email);
      console.log('🔑 Role:', user.role);
      
      // Test password
      const passwordMatch = bcrypt.compareSync('admin123', user.password_hash);
      console.log('🔐 Password match:', passwordMatch);
      
      if (passwordMatch) {
        // Get user role from user_roles table
        const userRole = db.prepare('SELECT * FROM user_roles WHERE user_id = ?').get(user.id);
        console.log('👤 User role from DB:', userRole);
        
        // Generate token (matching server.cjs structure)
        const token = jwt.sign(
          { 
            userId: user.id, 
            email: user.email, 
            role: userRole?.role 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        console.log('🎫 Generated token:', token.substring(0, 50) + '...');
        
        // Test token verification
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          console.log('✅ Token verification successful:', decoded);
        } catch (err) {
          console.log('❌ Token verification failed:', err.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Login test failed:', error);
  }
};

// Test API endpoints
const testAPI = async () => {
  try {
    console.log('\n🔍 Testing API endpoints...');
    
    // Test students endpoint
    const studentsCount = db.prepare('SELECT COUNT(*) as count FROM students').get();
    console.log('👥 Students in DB:', studentsCount.count);
    
    // Test teachers endpoint
    const teachersCount = db.prepare('SELECT COUNT(*) as count FROM teachers').get();
    console.log('👨‍🏫 Teachers in DB:', teachersCount.count);
    
    // Test classes endpoint
    const classesCount = db.prepare('SELECT COUNT(*) as count FROM classes').get();
    console.log('🏫 Classes in DB:', classesCount.count);
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
};

// Run tests
testLogin();
testAPI();
