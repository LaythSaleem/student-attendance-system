// Simple JavaScript version for database initialization
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Create database connection
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  console.log('🚀 Initializing SQLite database...');

  // Users table (auth_users equivalent)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User roles table (user_roles equivalent)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id)
    )
  `);

  // Admin profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id)
    )
  `);

  // Teachers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      subject TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id)
    )
  `);

  // Students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      roll_number TEXT UNIQUE NOT NULL,
      class TEXT NOT NULL,
      section TEXT,
      parent_phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Student profiles table (extended student information)
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      date_of_birth DATE,
      whatsapp_number TEXT,
      profile_picture TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred')),
      parent_name TEXT,
      emergency_contact TEXT,
      blood_group TEXT,
      medical_conditions TEXT,
      admission_date DATE DEFAULT (date('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(student_id)
    )
  `);

  // Subjects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Classes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      section TEXT NOT NULL,
      academic_year_id TEXT NOT NULL,
      teacher_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
      UNIQUE(name, section, academic_year_id)
    )
  `);

  // Student enrollments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      enrollment_date DATE NOT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      UNIQUE(student_id, class_id)
    )
  `);

  // Class subjects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS class_subjects (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      teacher_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
      UNIQUE(class_id, subject_id)
    )
  `);

  // Topics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      class_id TEXT NOT NULL,
      subject_id TEXT,
      order_index INTEGER DEFAULT 0,
      status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    )
  `);

  // Attendance table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      subject_id TEXT,
      date DATE NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
      marked_by TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
      FOREIGN KEY (marked_by) REFERENCES users(id),
      UNIQUE(student_id, class_id, subject_id, date)
    )
  `);

  // Exam types table
  db.exec(`
    CREATE TABLE IF NOT EXISTS exam_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      weight REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Exams table
  db.exec(`
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      exam_type_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      total_marks INTEGER NOT NULL DEFAULT 100,
      pass_marks INTEGER NOT NULL DEFAULT 40,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_type_id) REFERENCES exam_types(id),
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Exam results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS exam_results (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      obtained_marks REAL NOT NULL,
      grade TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(exam_id, student_id)
    )
  `);

  // Academic years table
  db.exec(`
    CREATE TABLE IF NOT EXISTS academic_years (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_current BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Announcements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'students', 'teachers', 'parents')),
      created_by TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      report_type TEXT NOT NULL,
      parameters TEXT NOT NULL,
      data TEXT NOT NULL,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    )
  `);

  console.log('✅ Database schema initialized successfully');
}

// Seed initial data
function seedDatabase() {
  console.log('🌱 Seeding initial data...');

  // Check if admin already exists
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM user_roles WHERE role = ?').get('admin');
  
  if (adminExists.count === 0) {
    // Create default admin user
    const adminId = uuidv4();
    const hashedPassword = bcrypt.hashSync('admin123', 10);

    // Insert admin user
    db.prepare(`
      INSERT INTO users (id, email, password_hash) 
      VALUES (?, ?, ?)
    `).run(adminId, 'admin@school.com', hashedPassword);

    // Insert admin role
    db.prepare(`
      INSERT INTO user_roles (id, user_id, role) 
      VALUES (?, ?, ?)
    `).run(uuidv4(), adminId, 'admin');

    // Insert admin profile
    db.prepare(`
      INSERT INTO admin_profiles (id, user_id, name) 
      VALUES (?, ?, ?)
    `).run(uuidv4(), adminId, 'System Administrator');

    console.log('✅ Default admin user created (admin@school.com / admin123)');
  }

  // Check if teacher already exists
  const teacherExists = db.prepare('SELECT COUNT(*) as count FROM user_roles WHERE role = ?').get('teacher');
  
  if (teacherExists.count === 0) {
    // Create default teacher user
    const teacherId = uuidv4();
    const hashedPassword = bcrypt.hashSync('teacher123', 10);

    // Insert teacher user
    db.prepare(`
      INSERT INTO users (id, email, password_hash) 
      VALUES (?, ?, ?)
    `).run(teacherId, 'teacher@school.com', hashedPassword);

    // Insert teacher role
    db.prepare(`
      INSERT INTO user_roles (id, user_id, role) 
      VALUES (?, ?, ?)
    `).run(uuidv4(), teacherId, 'teacher');

    // Insert teacher profile
    db.prepare(`
      INSERT INTO teachers (id, user_id, name, subject, phone, address) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), teacherId, 'Demo Teacher', 'Mathematics', '+1-555-0123', '123 School Street');

    console.log('✅ Default teacher user created (teacher@school.com / teacher123)');
  }

  // Create default academic year
  const currentYear = new Date().getFullYear();
  const academicYearExists = db.prepare('SELECT COUNT(*) as count FROM academic_years WHERE is_current = 1').get();
  
  if (academicYearExists.count === 0) {
    db.prepare(`
      INSERT INTO academic_years (id, name, start_date, end_date, is_current) 
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uuidv4(), 
      `${currentYear}-${currentYear + 1}`, 
      `${currentYear}-04-01`, 
      `${currentYear + 1}-03-31`, 
      1
    );

    console.log(`✅ Default academic year ${currentYear}-${currentYear + 1} created`);
  }

  // Create default exam types
  const examTypesExist = db.prepare('SELECT COUNT(*) as count FROM exam_types').get();
  
  if (examTypesExist.count === 0) {
    const examTypes = [
      { name: 'Unit Test', description: 'Monthly unit assessments', weight: 0.2 },
      { name: 'Mid Term', description: 'Mid-semester examination', weight: 0.3 },
      { name: 'Final Exam', description: 'End of semester examination', weight: 0.5 }
    ];

    const insertExamType = db.prepare(`
      INSERT INTO exam_types (id, name, description, weight) 
      VALUES (?, ?, ?, ?)
    `);

    examTypes.forEach(examType => {
      insertExamType.run(uuidv4(), examType.name, examType.description, examType.weight);
    });

    console.log('✅ Default exam types created');
  }

  console.log('✅ Database seeding completed');
}

// Run initialization
try {
  initializeDatabase();
  seedDatabase();
  console.log('🎉 Database initialization completed successfully!');
  db.close();
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}
