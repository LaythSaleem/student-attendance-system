#!/usr/bin/env node

const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('📸 Adding sample student profile pictures...');

try {
  // Sample profile pictures (placeholder URLs)
  const samplePhotos = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108755-2616b5b3c8b7?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face'
  ];

  // Get all students
  const students = db.prepare('SELECT id, name FROM students').all();
  console.log(`Found ${students.length} students`);

  if (students.length === 0) {
    console.log('❌ No students found in database');
    process.exit(1);
  }

  let profileCount = 0;

  students.forEach((student, index) => {
    // Check if student profile already exists
    const existingProfile = db.prepare('SELECT id FROM student_profiles WHERE student_id = ?').get(student.id);
    
    if (existingProfile) {
      // Update existing profile with photo
      const photoUrl = samplePhotos[index % samplePhotos.length];
      db.prepare(`
        UPDATE student_profiles 
        SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ?
      `).run(photoUrl, student.id);
      
      console.log(`✅ Updated profile picture for "${student.name}"`);
    } else {
      // Create new profile with photo
      const profileId = uuidv4();
      const photoUrl = samplePhotos[index % samplePhotos.length];
      
      db.prepare(`
        INSERT INTO student_profiles (id, student_id, profile_picture, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(profileId, student.id, photoUrl);
      
      console.log(`✅ Created profile with picture for "${student.name}"`);
    }
    
    profileCount++;
  });

  console.log(`\n🎉 Successfully added/updated ${profileCount} student profile pictures!`);
  
  // Verify the results
  const profilesWithPhotos = db.prepare(`
    SELECT COUNT(*) as count 
    FROM student_profiles 
    WHERE profile_picture IS NOT NULL AND profile_picture != ''
  `).get();
  
  console.log(`📊 Total student profiles with photos: ${profilesWithPhotos.count}`);

} catch (error) {
  console.error('❌ Error adding profile pictures:', error);
  process.exit(1);
} finally {
  db.close();
}
