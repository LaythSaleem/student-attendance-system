// Migration script to add teacher-stage and teacher-topic assignment tables
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔄 Migrating teacher assignment system...');
console.log('=========================================\n');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // 1. Create teacher_stage_assignments table
  console.log('📚 Creating teacher_stage_assignments table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS teacher_stage_assignments (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      UNIQUE(teacher_id, class_id)
    )
  `);

  // 2. Create teacher_topic_assignments table
  console.log('📝 Creating teacher_topic_assignments table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS teacher_topic_assignments (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      UNIQUE(teacher_id, topic_id)
    )
  `);

  // 3. Migrate existing teacher assignments
  console.log('🔄 Migrating existing teacher assignments...');
  
  // Get teachers who are assigned to classes
  const teachersWithClasses = db.prepare(`
    SELECT DISTINCT t.id as teacher_id, c.id as class_id, c.name as class_name
    FROM teachers t
    JOIN classes c ON c.teacher_id = t.id
  `).all();

  console.log(`   Found ${teachersWithClasses.length} existing teacher-class assignments`);

  // Migrate to new assignment system
  const insertStageAssignment = db.prepare(`
    INSERT OR IGNORE INTO teacher_stage_assignments (id, teacher_id, class_id, status)
    VALUES (?, ?, ?, 'active')
  `);

  teachersWithClasses.forEach(assignment => {
    const assignmentId = uuidv4();
    insertStageAssignment.run(assignmentId, assignment.teacher_id, assignment.class_id);
    console.log(`   ✅ Migrated: Teacher → ${assignment.class_name}`);
  });

  // 4. Create new teachers table without subject column
  console.log('🗑️  Removing subject column from teachers table...');
  
  // Create temporary table without subject column
  db.exec(`
    CREATE TABLE teachers_new (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id)
    )
  `);

  // Copy data from old table to new table (excluding subject column)
  db.exec(`
    INSERT INTO teachers_new (id, user_id, name, phone, address, created_at, updated_at)
    SELECT id, user_id, name, phone, address, created_at, updated_at
    FROM teachers
  `);

  // Drop old table and rename new table
  db.exec('DROP TABLE teachers');
  db.exec('ALTER TABLE teachers_new RENAME TO teachers');

  // Commit transaction
  db.exec('COMMIT');

  console.log('\n✅ Migration completed successfully!');
  console.log('=====================================');
  
  // Verify migration
  console.log('\n📊 Migration Results:');
  
  const stageAssignments = db.prepare('SELECT COUNT(*) as count FROM teacher_stage_assignments').get();
  console.log(`   • Teacher-Stage Assignments: ${stageAssignments.count}`);
  
  const topicAssignments = db.prepare('SELECT COUNT(*) as count FROM teacher_topic_assignments').get();
  console.log(`   • Teacher-Topic Assignments: ${topicAssignments.count}`);
  
  const teacherCount = db.prepare('SELECT COUNT(*) as count FROM teachers').get();
  console.log(`   • Teachers (without subject column): ${teacherCount.count}`);

  console.log('\n🎯 Next Steps:');
  console.log('   1. Update backend API for teacher assignments');
  console.log('   2. Update frontend to manage stage/topic assignments');
  console.log('   3. Test assignment functionality');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', error.message);
  throw error;
} finally {
  db.close();
}
