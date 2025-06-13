// Migration script to update exam system for topic-based assignments
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🏥 Migrating Exam Management System...');
console.log('=====================================\n');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // 1. Create new exams table with topic support
  console.log('📝 Creating new exams table with topic support...');
  
  // First, backup existing exams if any
  const existingExams = db.prepare('SELECT COUNT(*) as count FROM exams').get();
  console.log(`   Found ${existingExams.count} existing exams`);

  // Create new exams table without subject_id
  db.exec(`
    CREATE TABLE exams_new (
      id TEXT PRIMARY KEY,
      exam_type_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      topic_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      duration_minutes INTEGER DEFAULT 120,
      total_marks INTEGER NOT NULL DEFAULT 100,
      pass_marks INTEGER NOT NULL DEFAULT 40,
      status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_type_id) REFERENCES exam_types(id),
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 2. Create exam attendance table
  console.log('📋 Creating exam attendance table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS exam_attendance (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      attendance_status TEXT DEFAULT 'absent' CHECK (attendance_status IN ('present', 'absent', 'late', 'excused')),
      arrival_time TIME,
      notes TEXT,
      marked_by TEXT NOT NULL,
      marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (marked_by) REFERENCES users(id),
      UNIQUE(exam_id, student_id)
    )
  `);

  // 3. Migrate existing exams data (if any)
  if (existingExams.count > 0) {
    console.log('🔄 Migrating existing exam data...');
    
    // Copy exams data (excluding subject_id)
    db.exec(`
      INSERT INTO exams_new (
        id, exam_type_id, class_id, title, description, date, 
        start_time, end_time, total_marks, pass_marks, created_by, 
        created_at, updated_at
      )
      SELECT 
        id, exam_type_id, class_id, title, description, date,
        start_time, end_time, total_marks, pass_marks, created_by,
        created_at, updated_at
      FROM exams
    `);
    
    console.log(`   ✅ Migrated ${existingExams.count} exams`);
  }

  // 4. Replace old exams table
  console.log('🔄 Replacing exams table...');
  db.exec('DROP TABLE IF EXISTS exams');
  db.exec('ALTER TABLE exams_new RENAME TO exams');

  // 5. Ensure exam types exist
  console.log('📚 Setting up default exam types...');
  const examTypesCount = db.prepare('SELECT COUNT(*) as count FROM exam_types').get();
  
  if (examTypesCount.count === 0) {
    const examTypes = [
      { id: uuidv4(), name: 'Midterm Exam', description: 'Mid-semester examination', weight: 0.3 },
      { id: uuidv4(), name: 'Final Exam', description: 'Final semester examination', weight: 0.5 },
      { id: uuidv4(), name: 'Quiz', description: 'Short assessment quiz', weight: 0.1 },
      { id: uuidv4(), name: 'Practical Exam', description: 'Hands-on practical examination', weight: 0.2 },
      { id: uuidv4(), name: 'Viva Voce', description: 'Oral examination', weight: 0.15 },
      { id: uuidv4(), name: 'Clinical Assessment', description: 'Clinical skills assessment', weight: 0.25 }
    ];

    const insertExamType = db.prepare(`
      INSERT INTO exam_types (id, name, description, weight, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    examTypes.forEach(type => {
      insertExamType.run(type.id, type.name, type.description, type.weight);
      console.log(`   ✅ Added exam type: ${type.name}`);
    });
  }

  // Commit transaction
  db.exec('COMMIT');

  console.log('\n✅ Exam system migration completed successfully!');
  console.log('==========================================');
  
  // Verify migration
  console.log('\n📊 Migration Results:');
  
  const examsCount = db.prepare('SELECT COUNT(*) as count FROM exams').get();
  console.log(`   • Exams: ${examsCount.count}`);
  
  const examTypesCountFinal = db.prepare('SELECT COUNT(*) as count FROM exam_types').get();
  console.log(`   • Exam Types: ${examTypesCountFinal.count}`);
  
  const examAttendanceCount = db.prepare('SELECT COUNT(*) as count FROM exam_attendance').get();
  console.log(`   • Exam Attendance Records: ${examAttendanceCount.count}`);

  console.log('\n🎯 New Features:');
  console.log('   • Topic-based exam creation');
  console.log('   • Exam attendance tracking');
  console.log('   • Multiple exam types support');
  console.log('   • Exam status management');
  console.log('   • Duration tracking');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', error.message);
  throw error;
} finally {
  db.close();
}
