#!/usr/bin/env node

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('👤 Setting up Student User Roles and Passwords');
console.log('==============================================\n');

try {
  // Get all users with student emails that don't have roles
  const studentUsers = db.prepare(`
    SELECT u.id, u.email 
    FROM users u 
    LEFT JOIN user_roles ur ON u.id = ur.user_id 
    WHERE u.email LIKE '%student%' AND ur.role IS NULL
  `).all();
  
  console.log(`📊 Found ${studentUsers.length} student users without roles\n`);
  
  // Default password for all students
  const defaultPassword = 'student123';
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
  
  // Update password and create roles
  const updatePassword = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
  const insertRole = db.prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)');
  
  console.log('🔐 Setting up student accounts...\n');
  
  studentUsers.forEach((user) => {
    // Update password
    updatePassword.run(hashedPassword, user.id);
    
    // Create student role
    const roleId = uuidv4();
    insertRole.run(roleId, user.id, 'student');
    
    console.log(`✅ Set up ${user.email} with role 'student' and password '${defaultPassword}'`);
  });
  
  console.log('\n🎉 Student account setup complete!');
  
  // Verify setup
  console.log('\n📊 Verification:');
  const verificationResults = db.prepare(`
    SELECT u.email, ur.role, s.name as student_name
    FROM users u 
    JOIN user_roles ur ON u.id = ur.user_id 
    LEFT JOIN students s ON u.id = s.user_id
    WHERE ur.role = 'student'
    ORDER BY s.name
  `).all();
  
  verificationResults.forEach(result => {
    console.log(`   ${result.student_name}: ${result.email} (${result.role})`);
  });
  
  console.log('\n🧪 Test Login:');
  console.log(`   Email: ${verificationResults[0]?.email || 'john.doe@student.school.com'}`);
  console.log(`   Password: ${defaultPassword}`);
  console.log('   Role: student');

} catch (error) {
  console.error('❌ Error setting up student accounts:', error);
} finally {
  db.close();
}
