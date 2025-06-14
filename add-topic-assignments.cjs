#!/usr/bin/env node

const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔗 Adding sample teacher topic assignments...');

try {
  // Get existing teachers and topics
  const teachers = db.prepare('SELECT id, name FROM teachers').all();
  const topics = db.prepare('SELECT id, name, class_id FROM topics').all();
  
  console.log(`Found ${teachers.length} teachers and ${topics.length} topics`);
  
  if (teachers.length === 0 || topics.length === 0) {
    console.log('❌ No teachers or topics found in database');
    process.exit(1);
  }
  
  // Clear existing assignments
  db.prepare('DELETE FROM teacher_topic_assignments').run();
  console.log('🧹 Cleared existing topic assignments');
  
  // Assign topics to teachers
  let assignmentCount = 0;
  
  teachers.forEach((teacher, teacherIndex) => {
    // Assign 2-4 topics to each teacher
    const topicsToAssign = Math.min(topics.length, Math.floor(Math.random() * 3) + 2);
    const shuffledTopics = [...topics].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < topicsToAssign; i++) {
      const topic = shuffledTopics[i];
      const assignmentId = uuidv4();
      
      db.prepare(`
        INSERT INTO teacher_topic_assignments (id, teacher_id, topic_id, status, assigned_at)
        VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)
      `).run(assignmentId, teacher.id, topic.id);
      
      assignmentCount++;
      console.log(`✅ Assigned "${topic.name}" to "${teacher.name}"`);
    }
  });
  
  console.log(`🎉 Successfully created ${assignmentCount} topic assignments!`);
  
} catch (error) {
  console.error('❌ Error adding topic assignments:', error);
} finally {
  db.close();
}
