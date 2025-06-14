const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000; // Render uses port 10000
const JWT_SECRET = process.env.JWT_SECRET || 'scholar-track-pulse-render-secret-2025';

console.log('🚀 Starting Scholar Track Pulse server...');
console.log(`📍 Port: ${PORT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Initialize SQLite database
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/opt/render/project/src/database.sqlite'
  : path.join(__dirname, 'database.sqlite');

console.log(`📊 Database path: ${dbPath}`);

// Database initialization function
function initializeDatabase() {
  console.log('🔧 Initializing database schema...');
  
  try {
    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User roles table
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
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id)
      )
    `);

    // Teachers table
    db.exec(`
      CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        subject TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id)
      )
    `);

    // Students table
    db.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        student_id TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        date_of_birth DATE,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Classes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        teacher_id TEXT,
        academic_year TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
      )
    `);

    // Exams table
    db.exec(`
      CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        class_id TEXT,
        teacher_id TEXT,
        exam_date DATE NOT NULL,
        exam_time TIME,
        duration_minutes INTEGER,
        total_marks INTEGER DEFAULT 100,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
      )
    `);

    // Attendance table
    db.exec(`
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        date DATE NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'not_marked')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        UNIQUE(student_id, class_id, date)
      )
    `);

    // Create default admin user if not exists
    const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get('admin@school.com');
    if (adminExists.count === 0) {
      console.log('👤 Creating default admin user...');
      
      const adminId = require('uuid').v4();
      const hashedPassword = require('bcryptjs').hashSync('admin123', 10);
      
      db.prepare(`
        INSERT INTO users (id, email, password_hash) 
        VALUES (?, ?, ?)
      `).run(adminId, 'admin@school.com', hashedPassword);
      
      db.prepare(`
        INSERT INTO user_roles (id, user_id, role) 
        VALUES (?, ?, 'admin')
      `).run(require('uuid').v4(), adminId);
      
      // Create admin profile
      db.prepare(`
        INSERT INTO admin_profiles (id, user_id, first_name, last_name) 
        VALUES (?, ?, 'System', 'Administrator')
      `).run(require('uuid').v4(), adminId);
      
      console.log('✅ Default admin user created');
    }

    // Create default teacher user if not exists
    const teacherExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get('teacher@school.com');
    if (teacherExists.count === 0) {
      console.log('👨‍🏫 Creating default teacher user...');
      
      const teacherId = require('uuid').v4();
      const hashedPassword = require('bcryptjs').hashSync('teacher123', 10);
      
      db.prepare(`
        INSERT INTO users (id, email, password_hash) 
        VALUES (?, ?, ?)
      `).run(teacherId, 'teacher@school.com', hashedPassword);
      
      db.prepare(`
        INSERT INTO user_roles (id, user_id, role) 
        VALUES (?, ?, 'teacher')
      `).run(require('uuid').v4(), teacherId);
      
      // Create teacher profile
      db.prepare(`
        INSERT INTO teachers (id, user_id, first_name, last_name, subject) 
        VALUES (?, ?, 'Default', 'Teacher', 'General Studies')
      `).run(require('uuid').v4(), teacherId);
      
      console.log('✅ Default teacher user created');
    }

    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log('✅ Database connected successfully');
  
  // Initialize database schema if needed
  initializeDatabase();
  
  // Test database connection
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`👥 Users in database: ${userCount.count}`);
  
  // Debug: Check if users have passwords
  const sampleUsers = db.prepare('SELECT email, password_hash FROM users LIMIT 3').all();
  console.log('📝 Sample user data:');
  sampleUsers.forEach(user => {
    console.log(`  - ${user.email}: ${user.password_hash ? 'Has password' : 'No password'}`);
  });
} catch (error) {
  console.error('❌ Database connection failed:', error);
  process.exit(1);
}

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://scholar-track-pulse.onrender.com', process.env.RENDER_EXTERNAL_URL]
    : ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'Connected',
      userCount: result.count,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message 
    });
  }
});

// Debug endpoint to check database schema
app.get('/debug/schema', (req, res) => {
  try {
    // Get all table names
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();
    
    // Get column info for each table
    const schema = {};
    tables.forEach(table => {
      try {
        const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
        schema[table.name] = columns;
      } catch (error) {
        schema[table.name] = { error: error.message };
      }
    });
    
    res.json({
      tables: tables.map(t => t.name),
      schema: schema,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based access control
const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Login attempt for: ${email}`);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare(`
      SELECT u.*, ur.role 
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      WHERE u.email = ?
    `).get(email);

    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has a password
    if (!user.password_hash) {
      console.log('❌ User has no password set');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ Login successful for: ${email} (${user.role})`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Students endpoints
app.get('/api/students', authenticateToken, (req, res) => {
  try {
    const students = db.prepare(`
      SELECT s.*, c.name as class_name, c.section 
      FROM students s 
      LEFT JOIN student_enrollments se ON s.id = se.student_id 
      LEFT JOIN classes c ON se.class_id = c.id 
      WHERE se.status = 'active' OR se.status IS NULL
    `).all();
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/students/:id/profile', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    const student = db.prepare(`
      SELECT s.*, c.name as class_name, c.section 
      FROM students s 
      LEFT JOIN student_enrollments se ON s.id = se.student_id 
      LEFT JOIN classes c ON se.class_id = c.id 
      WHERE s.id = ? AND (se.status = 'active' OR se.status IS NULL)
    `).get(id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const attendanceStats = db.prepare(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as attendance_percentage
      FROM attendance 
      WHERE student_id = ?
    `).get(id);

    const profile = {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        date_of_birth: student.date_of_birth,
        enrollment_date: student.enrollment_date,
        class_name: student.class_name,
        section: student.section
      },
      attendance: {
        total_records: attendanceStats?.total_records || 0,
        present_count: attendanceStats?.present_count || 0,
        absent_count: attendanceStats?.absent_count || 0,
        attendance_percentage: attendanceStats?.attendance_percentage || 0
      }
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get individual student
app.get('/api/students/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    const student = db.prepare(`
      SELECT s.*, c.name as class_name 
      FROM students s 
      LEFT JOIN student_enrollments se ON s.id = se.student_id 
      LEFT JOIN classes c ON se.class_id = c.id 
      WHERE s.id = ? AND (se.status = 'active' OR se.status IS NULL)
    `).get(id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update student
app.put('/api/students/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { name, roll_number, class: studentClass, section, parent_phone, address } = req.body;

    // Check if student exists
    const existingStudent = db.prepare('SELECT id FROM students WHERE id = ?').get(id);
    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update student
    const updateQuery = db.prepare(`
      UPDATE students 
      SET name = ?, roll_number = ?, class = ?, section = ?, parent_phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = updateQuery.run(name, roll_number, studentClass, section, parent_phone, address, id);
    
    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to update student' });
    }

    // Return updated student
    const updatedStudent = db.prepare(`
      SELECT s.*, c.name as class_name 
      FROM students s 
      LEFT JOIN student_enrollments se ON s.id = se.student_id 
      LEFT JOIN classes c ON se.class_id = c.id 
      WHERE s.id = ? AND (se.status = 'active' OR se.status IS NULL)
    `).get(id);

    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new student
app.post('/api/students', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, roll_number, class: studentClass, section, parent_phone, address, email, password } = req.body;

    // Create user account for student
    const userId = uuidv4();
    const studentId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password || 'student123', 10);

    // Insert user
    db.prepare(`
      INSERT INTO users (id, email, password_hash) 
      VALUES (?, ?, ?)
    `).run(userId, email, hashedPassword);
    
    db.prepare(`
      INSERT INTO user_roles (id, user_id, role) 
      VALUES (?, ?, 'student')
    `).run(uuidv4(), userId);
    
    // Insert student record
    db.prepare(`
      INSERT INTO students (id, user_id, name, roll_number, class, section, parent_phone, address) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(studentId, userId, name, roll_number, studentClass, section, parent_phone, address);

    // Return created student
    const createdStudent = db.prepare(`
      SELECT s.*, c.name as class_name 
      FROM students s 
      LEFT JOIN student_enrollments se ON s.id = se.student_id 
      LEFT JOIN classes c ON se.class_id = c.id 
      WHERE s.id = ? AND (se.status = 'active' OR se.status IS NULL)
    `).get(studentId);

    res.status(201).json(createdStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete student
app.delete('/api/students/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;

    // Check if student exists
    const student = db.prepare('SELECT user_id FROM students WHERE id = ?').get(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Delete student record (this will cascade to related records)
    const result = db.prepare('DELETE FROM students WHERE id = ?').run(id);
    
    if (result.changes > 0) {
      // Also delete the user account
      db.prepare('DELETE FROM users WHERE id = ?').run(student.user_id);
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: error.message });
  }
});

// Classes endpoints
app.get('/api/classes', authenticateToken, (req, res) => {
  try {
    const classes = db.prepare(`
      SELECT c.*, 
             COUNT(se.student_id) as student_count,
             t.name as teacher_name
      FROM classes c
      LEFT JOIN student_enrollments se ON c.id = se.class_id AND se.status = 'active'
      LEFT JOIN teachers t ON c.teacher_id = t.id
      GROUP BY c.id
    `).all();
    
    // Add sample topics data to each class
    const classesWithTopics = classes.map(cls => ({
      ...cls,
      total_topics: 3, // Sample count
      topics: [
        {
          id: `${cls.id}-topic-1`,
          class_id: cls.id,
          title: 'Introduction to Medicine',
          description: 'Basic medical concepts and terminology',
          status: 'completed',
          order_index: 1,
          created_at: new Date().toISOString()
        },
        {
          id: `${cls.id}-topic-2`,
          class_id: cls.id,
          title: 'Anatomy Basics',
          description: 'Human body structure and systems',
          status: 'in_progress',
          order_index: 2,
          created_at: new Date().toISOString()
        },
        {
          id: `${cls.id}-topic-3`,
          class_id: cls.id,
          title: 'Physiology Overview',
          description: 'How body systems function',
          status: 'planned',
          order_index: 3,
          created_at: new Date().toISOString()
        }
      ]
    }));
    
    res.json(classesWithTopics);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Teachers endpoints
app.get('/api/teachers', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const teachers = db.prepare(`
      SELECT t.*, 
             COUNT(DISTINCT c.id) as class_count
      FROM teachers t
      LEFT JOIN classes c ON t.id = c.teacher_id
      GROUP BY t.id
    `).all();
    
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Attendance endpoints
app.get('/api/attendance', authenticateToken, (req, res) => {
  try {
    const { classId, date, studentId } = req.query;
    let query = `
      SELECT a.*, s.name as student_name, c.name as class_name, c.section
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (classId) {
      query += ' AND a.class_id = ?';
      params.push(classId);
    }
    
    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    
    if (studentId) {
      query += ' AND a.student_id = ?';
      params.push(studentId);
    }
    
    query += ' ORDER BY a.date DESC, s.name LIMIT 100';
    
    const attendance = db.prepare(query).all(...params);
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reports endpoints
app.get('/api/reports/daily-attendance', authenticateToken, (req, res) => {
  try {
    const { date, classId } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];
    
    let query = `
      SELECT 
        s.name as student_name,
        c.name as class_name,
        c.section,
        COALESCE(a.status, 'not_marked') as status,
        a.marked_at
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN classes c ON se.class_id = c.id
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ? AND a.class_id = c.id
      WHERE se.status = 'active'
    `;
    
    const params = [reportDate];
    
    if (classId) {
      query += ' AND c.id = ?';
      params.push(classId);
    }
    
    query += ' ORDER BY c.name, s.name';
    
    const data = db.prepare(query).all(...params);
    
    const summary = {
      date: reportDate,
      total_students: data.length,
      present: data.filter(r => r.status === 'present').length,
      absent: data.filter(r => r.status === 'absent').length,
      not_marked: data.filter(r => r.status === 'not_marked').length
    };
    
    res.json({ summary, data });
  } catch (error) {
    console.error('Error generating daily attendance report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Teachers dropdown endpoint
app.get('/api/teachers/dropdown', authenticateToken, (req, res) => {
  try {
    const teachers = db.prepare(`
      SELECT t.id, t.name, u.email
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.name
    `).all();
    
    res.json(teachers.map(t => ({
      id: t.id,
      name: t.name,
      email: t.email
    })));
  } catch (error) {
    console.error('Error fetching teachers dropdown:', error);
    res.status(500).json({ error: error.message });
  }
});

// Academic years dropdown endpoint
app.get('/api/academic-years/dropdown', authenticateToken, (req, res) => {
  try {
    const academicYears = db.prepare(`
      SELECT id, name 
      FROM academic_years 
      ORDER BY name DESC
    `).all();
    
    res.json(academicYears.map(ay => ({
      id: ay.id,
      name: ay.name
    })));
  } catch (error) {
    console.error('Error fetching academic years dropdown:', error);
    res.status(500).json({ error: error.message });
  }
});

// Available topics endpoint
app.get('/api/teachers/available-topics', authenticateToken, (req, res) => {
  try {
    // Return some sample topics/subjects
    const topics = [
      { id: 1, name: 'Mathematics', stage: 'Primary' },
      { id: 2, name: 'English', stage: 'Primary' },
      { id: 3, name: 'Science', stage: 'Primary' },
      { id: 4, name: 'History', stage: 'Secondary' },
      { id: 5, name: 'Physics', stage: 'Secondary' },
      { id: 6, name: 'Chemistry', stage: 'Secondary' },
      { id: 7, name: 'Biology', stage: 'Secondary' },
      { id: 8, name: 'Geography', stage: 'Secondary' },
      { id: 9, name: 'Art', stage: 'All' },
      { id: 10, name: 'Physical Education', stage: 'All' }
    ];
    
    res.json(topics);
  } catch (error) {
    console.error('Error fetching available topics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Topics endpoint (alternative path)
app.get('/api/teachers/topics', authenticateToken, (req, res) => {
  try {
    // Return same topics as available-topics
    const topics = [
      { id: 1, name: 'Mathematics', stage: 'Primary' },
      { id: 2, name: 'English', stage: 'Primary' },
      { id: 3, name: 'Science', stage: 'Primary' },
      { id: 4, name: 'History', stage: 'Secondary' },
      { id: 5, name: 'Physics', stage: 'Secondary' },
      { id: 6, name: 'Chemistry', stage: 'Secondary' },
      { id: 7, name: 'Biology', stage: 'Secondary' },
      { id: 8, name: 'Geography', stage: 'Secondary' },
      { id: 9, name: 'Art', stage: 'All' },
      { id: 10, name: 'Physical Education', stage: 'All' }
    ];
    
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exams endpoint
app.get('/api/exams', authenticateToken, (req, res) => {
  try {
    const exams = db.prepare(`
      SELECT 
        e.*,
        c.name as class_name,
        t.name as teacher_name,
        et.name as exam_type_name
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN teachers t ON e.created_by = t.user_id
      LEFT JOIN exam_types et ON e.exam_type_id = et.id
      ORDER BY e.date DESC
    `).all();
    
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exam types endpoint
app.get('/api/exam-types', authenticateToken, (req, res) => {
  try {
    const examTypes = [
      { id: 1, name: 'Midterm Exam', description: 'Mid-semester examination' },
      { id: 2, name: 'Final Exam', description: 'End of semester examination' },
      { id: 3, name: 'Quiz', description: 'Short assessment' },
      { id: 4, name: 'Assignment', description: 'Take-home assignment' },
      { id: 5, name: 'Project', description: 'Long-term project evaluation' },
      { id: 6, name: 'Practical', description: 'Hands-on practical examination' }
    ];
    
    res.json(examTypes);
  } catch (error) {
    console.error('Error fetching exam types:', error);
    res.status(500).json({ error: error.message });
  }
});

// Detailed attendance reports endpoint
app.get('/api/reports/attendance-detailed', authenticateToken, (req, res) => {
  try {
    const { class_id, date_from, date_to } = req.query;
    
    let query = `
      SELECT 
        a.*,
        s.name as student_name,
        s.roll_number,
        c.name as class_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (class_id) {
      query += ` AND a.class_id = ?`;
      params.push(class_id);
    }
    
    if (date_from) {
      query += ` AND a.date >= ?`;
      params.push(date_from);
    }
    
    if (date_to) {
      query += ` AND a.date <= ?`;
      params.push(date_to);
    }
    
    query += ` ORDER BY a.date DESC, s.name`;
    
    const records = db.prepare(query).all(...params);
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching detailed attendance reports:', error);
    res.status(500).json({ error: error.message });
  }
});

// Topics endpoints
// Get topics for a specific class
app.get('/api/classes/:classId/topics', authenticateToken, (req, res) => {
  try {
    const { classId } = req.params;
    
    // For now, return sample topics since we don't have a topics table
    const sampleTopics = [
      {
        id: '1',
        class_id: classId,
        title: 'Introduction to Medicine',
        description: 'Basic medical concepts and terminology',
        status: 'completed',
        order_index: 1,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        class_id: classId,
        title: 'Anatomy Basics',
        description: 'Human body structure and systems',
        status: 'in_progress',
        order_index: 2,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        class_id: classId,
        title: 'Physiology Overview',
        description: 'How body systems function',
        status: 'planned',
        order_index: 3,
        created_at: new Date().toISOString()
      }
    ];
    
    res.json(sampleTopics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get/Update/Delete specific topic
app.get('/api/topics/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    // Return sample topic data
    const sampleTopic = {
      id: id,
      class_id: 'sample-class-id',
      title: 'Sample Topic',
      description: 'Sample topic description',
      status: 'planned',
      order_index: 1,
      created_at: new Date().toISOString()
    };
    
    res.json(sampleTopic);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/topics/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    
    // Return updated topic data
    const updatedTopic = {
      id: id,
      title: title || 'Updated Topic',
      description: description || 'Updated description',
      status: status || 'planned',
      updated_at: new Date().toISOString()
    };
    
    res.json(updatedTopic);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/topics/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    res.json({ message: 'Topic deleted successfully', id });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reorder topics
app.put('/api/classes/:classId/topics/reorder', authenticateToken, (req, res) => {
  try {
    const { classId } = req.params;
    const { topics } = req.body;
    
    // Return success response
    res.json({ 
      message: 'Topics reordered successfully',
      classId,
      topics 
    });
  } catch (error) {
    console.error('Error reordering topics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Users endpoint (for admin user management)
app.get('/api/users', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.created_at,
        ur.role,
        CASE 
          WHEN ur.role = 'student' THEN s.name
          WHEN ur.role = 'teacher' THEN t.name
          WHEN ur.role = 'admin' THEN ap.name
          ELSE 'Unknown'
        END as name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      LEFT JOIN admin_profiles ap ON u.id = ap.user_id
      ORDER BY u.created_at DESC
    `).all();
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all handler: send back index.html for any non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  if (db) db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  if (db) db.close();
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Scholar Track Pulse server running on port ${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Static files: ${path.join(__dirname, 'dist')}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
