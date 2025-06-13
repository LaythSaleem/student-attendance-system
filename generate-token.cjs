// Generate and output full token for testing
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const db = new Database('./database.sqlite');

const generateToken = () => {
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
  
  console.log('Fresh token:');
  console.log(token);
  return token;
};

const token = generateToken();
