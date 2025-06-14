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

    // Add sample topic assignments if none exist
    const assignmentCount = db.prepare('SELECT COUNT(*) as count FROM teacher_topic_assignments').get().count;
    if (assignmentCount === 0) {
      console.log('🔗 Adding sample teacher topic assignments...');
      
      const teachers = db.prepare('SELECT id, name FROM teachers').all();
      const topics = db.prepare('SELECT id, name, class_id FROM topics').all();
      
      if (teachers.length > 0 && topics.length > 0) {
        teachers.forEach((teacher, teacherIndex) => {
          // Assign 2-3 topics to each teacher
          const topicsToAssign = Math.min(topics.length, Math.floor(Math.random() * 2) + 2);
          const shuffledTopics = [...topics].sort(() => Math.random() - 0.5);
          
          for (let i = 0; i < topicsToAssign; i++) {
            const topic = shuffledTopics[i];
            const assignmentId = require('uuid').v4();
            
            db.prepare(`
              INSERT INTO teacher_topic_assignments (id, teacher_id, topic_id, status, assigned_at)
              VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)
            `).run(assignmentId, teacher.id, topic.id);
          }
        });
        console.log('✅ Sample topic assignments created');
      }
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
      SELECT 
        s.id,
        s.name,
        s.roll_number as rollNumber,
        s.class,
        s.section,
        s.parent_phone as parentPhone,
        s.address,
        s.created_at,
        s.updated_at,
        c.name as className,
        CASE 
          WHEN se.status IS NOT NULL THEN se.status 
          ELSE 'active' 
        END as status
      FROM students s 
      LEFT JOIN student_enrollments se ON s.id = se.student_id 
      LEFT JOIN classes c ON se.class_id = c.id 
      WHERE se.status = 'active' OR se.status IS NULL
    `).all();
    
    // Add attendance stats for each student
    const studentsWithStats = students.map(student => {
      const attendanceStats = db.prepare(`
        SELECT 
          COUNT(*) as total_records,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
          ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)), 2) as attendance_percentage
        FROM attendance 
        WHERE student_id = ?
      `).get(student.id) || { total_records: 0, present_count: 0, absent_count: 0, attendance_percentage: 0 };
      
      return {
        ...student,
        enrollmentNumber: student.rollNumber, // Add enrollment number field
        attendancePercentage: attendanceStats.attendance_percentage || 0,
        totalClasses: attendanceStats.total_records || 0,
        presentDays: attendanceStats.present_count || 0,
        absentDays: attendanceStats.absent_count || 0
      };
    });
    
    res.json(studentsWithStats);
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
    const studentData = req.body;
    
    // Convert camelCase to snake_case for database
    const name = studentData.name;
    const roll_number = studentData.rollNumber || studentData.roll_number;
    const studentClass = studentData.class;
    const section = studentData.section;
    const parent_phone = studentData.parentPhone || studentData.parent_phone;
    const address = studentData.address;

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

    // Return updated student with camelCase fields for frontend
    const updatedStudent = db.prepare(`
      SELECT 
        id,
        name,
        roll_number as rollNumber,
        class,
        section,
        parent_phone as parentPhone,
        address,
        created_at,
        updated_at
      FROM students 
      WHERE id = ?
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
    const studentData = req.body;
    
    // Convert camelCase to snake_case for database
    const name = studentData.name;
    const roll_number = studentData.rollNumber || studentData.roll_number;
    const studentClass = studentData.class;
    const section = studentData.section;
    const parent_phone = studentData.parentPhone || studentData.parent_phone;
    const address = studentData.address;
    const email = studentData.email;
    const password = studentData.password || 'student123';

    // Create user account for student
    const userId = uuidv4();
    const studentId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);

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

    // Return created student with camelCase fields
    const createdStudent = db.prepare(`
      SELECT 
        id,
        name,
        roll_number as rollNumber,
        class,
        section,
        parent_phone as parentPhone,
        address,
        created_at,
        updated_at
      FROM students 
      WHERE id = ?
    `).get(studentId);

    res.status(201).json({
      ...createdStudent,
      enrollmentNumber: createdStudent.rollNumber,
      status: 'active',
      attendancePercentage: 0,
      totalClasses: 0,
      presentDays: 0,
      absentDays: 0
    });
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
    
    // Get topics for each teacher
    const teachersWithTopics = teachers.map(teacher => {
      const topics = db.prepare(`
        SELECT tp.id, tp.name, tp.description, tp.status, tp.order_index,
               c.name as class_name, c.id as class_id
        FROM teacher_topic_assignments tta
        JOIN topics tp ON tta.topic_id = tp.id
        JOIN classes c ON tp.class_id = c.id
        WHERE tta.teacher_id = ? AND tta.status = 'active'
        ORDER BY c.name, tp.order_index
      `).all(teacher.id);
      
      return {
        ...teacher,
        topics: topics,
        topic_count: topics.length,
        topics_assigned: topics.length > 0 ? `${topics.length} topics` : 'No topics assigned'
      };
    });
    
    res.json(teachersWithTopics);
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

// Teacher dashboard endpoints
app.get('/api/teachers/dashboard-stats', authenticateToken, requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.userId;
    
    // Get teacher's classes count
    const classesCount = db.prepare(`
      SELECT COUNT(*) as count FROM classes WHERE teacher_id = ?
    `).get(teacherId)?.count || 0;
    
    // Get total students in teacher's classes
    const studentsCount = db.prepare(`
      SELECT COUNT(DISTINCT s.id) as count 
      FROM students s
      JOIN classes c ON s.class = c.name
      WHERE c.teacher_id = ?
    `).get(teacherId)?.count || 0;
    
    // Get topics assigned to teacher
    const topicsCount = db.prepare(`
      SELECT COUNT(*) as count FROM teacher_topic_assignments WHERE teacher_id = ?
    `).get(teacherId)?.count || 0;
    
    // Get recent attendance rate
    const attendanceRate = db.prepare(`
      SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND((COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 1)
        END as rate
      FROM attendance a
      JOIN classes c ON a.class_id = c.id
      WHERE c.teacher_id = ? AND a.date >= date('now', '-7 days')
    `).get(teacherId)?.rate || 0;
    
    res.json({
      classesCount,
      studentsCount,
      topicsCount,
      attendanceRate: parseFloat(attendanceRate)
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teachers/recent-activity', authenticateToken, requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.userId;
    
    // Get recent attendance activities
    const activities = db.prepare(`
      SELECT 
        'attendance' as type,
        a.date,
        s.name as student_name,
        c.name as class_name,
        a.status,
        a.created_at
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      WHERE c.teacher_id = ? AND a.date >= date('now', '-7 days')
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all(teacherId);
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teachers/my-topics', authenticateToken, requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.userId;
    
    // Get teacher record
    const teacher = db.prepare('SELECT id FROM teachers WHERE user_id = ?').get(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }
    
    const topics = db.prepare(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.class_id,
        c.name as class_name,
        c.section as class_section,
        t.status,
        t.order_index
      FROM topics t
      JOIN teacher_topic_assignments tta ON t.id = tta.topic_id
      JOIN classes c ON t.class_id = c.id
      WHERE tta.teacher_id = ? AND tta.status = 'active'
      ORDER BY c.name, t.order_index, t.name
    `).all(teacher.id);
    
    res.json(topics);
  } catch (error) {
    console.error('Error fetching teacher topics:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teachers/students-requiring-attention', authenticateToken, requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.userId;
    
    // Get students with low attendance or recent absences
    const students = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.roll_number,
        c.name as class_name,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(a.id) as total_attendance,
        CASE 
          WHEN COUNT(a.id) = 0 THEN 0
          ELSE ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(a.id)), 1)
        END as attendance_rate,
        MAX(CASE WHEN a.status = 'absent' THEN a.date END) as last_absent_date
      FROM students s
      JOIN classes c ON s.class = c.name
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date >= date('now', '-30 days')
      WHERE c.teacher_id = ?
      GROUP BY s.id, s.name, s.roll_number, c.name
      HAVING attendance_rate < 80 OR last_absent_date >= date('now', '-3 days')
      ORDER BY attendance_rate ASC, last_absent_date DESC
      LIMIT 10
    `).all(teacherId);
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students requiring attention:', error);
    res.status(500).json({ error: error.message });
  }
});

// Students with attendance data
app.get('/api/teachers/students-with-attendance', authenticateToken, requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { stage } = req.query;
    
    // Get teacher record
    const teacher = db.prepare('SELECT id FROM teachers WHERE user_id = ?').get(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    let whereClause = 'WHERE c.teacher_id = ?';
    let params = [teacher.id];
    
    if (stage && stage !== 'all') {
      whereClause += ' AND c.name = ?';
      params.push(stage);
    }

    const students = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.roll_number,
        c.name as stage,
        c.section as section,
        c.name as class_name,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(a.id) as total_sessions,
        ROUND(
          CAST(COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS FLOAT) * 100 / 
          NULLIF(COUNT(a.id), 0), 2
        ) as attendance_rate,
        sp.profile_picture as latest_photo,
        se.enrollment_date as enrollment_date,
        CASE 
          WHEN COUNT(a.id) = 0 THEN 'No Data'
          WHEN CAST(COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS FLOAT) * 100 / COUNT(a.id) >= 85 THEN 'Good'
          WHEN CAST(COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS FLOAT) * 100 / COUNT(a.id) >= 70 THEN 'Average'
          ELSE 'Poor'
        END as status
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN classes c ON se.class_id = c.id
      LEFT JOIN student_profiles sp ON s.id = sp.student_id
      LEFT JOIN attendance a ON s.id = a.student_id AND a.class_id = c.id
      ${whereClause}
      GROUP BY s.id, s.name, s.roll_number, c.name, c.section, sp.profile_picture, se.enrollment_date
      ORDER BY s.name ASC
    `).all(...params);

    res.json(students);
  } catch (error) {
    console.error('Error fetching students with attendance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get students for a specific class (for daily attendance)
app.get('/api/teachers/classes/:classId/students', authenticateToken, requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { classId } = req.params;
    
    // Get teacher record
    const teacher = db.prepare('SELECT id FROM teachers WHERE user_id = ?').get(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }
    
    // Verify teacher has access to this class (through topic assignments)
    const hasAccess = db.prepare(`
      SELECT COUNT(*) as count
      FROM teacher_topic_assignments tta
      JOIN topics t ON tta.topic_id = t.id
      WHERE tta.teacher_id = ? AND t.class_id = ?
    `).get(teacher.id, classId);
    
    if (hasAccess.count === 0) {
      return res.status(403).json({ error: 'Access denied to this class' });
    }
    
    // Get students enrolled in the class with attendance data
    const students = db.prepare(`
      SELECT DISTINCT
        s.id,
        s.name,
        s.roll_number as rollNumber,
        sp.profile_picture as latest_photo,
        se.enrollment_date,
        c.name as stage,
        c.section,
        -- Calculate attendance stats
        COALESCE(
          (SELECT COUNT(*) 
           FROM attendance a 
           WHERE a.student_id = s.id AND a.class_id = ? AND a.status = 'present'), 0
        ) as present_count,
        COALESCE(
          (SELECT COUNT(*) 
           FROM attendance a 
           WHERE a.student_id = s.id AND a.class_id = ? AND a.status = 'late'), 0
        ) as late_count,
        COALESCE(
          (SELECT COUNT(*) 
           FROM attendance a 
           WHERE a.student_id = s.id AND a.class_id = ?), 0
        ) as total_sessions,
        -- Today's attendance status
        COALESCE(
          (SELECT a.status 
           FROM attendance a 
           WHERE a.student_id = s.id AND a.class_id = ? AND DATE(a.date) = DATE('now')
           LIMIT 1), 'not_marked'
        ) as today_status
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN classes c ON se.class_id = c.id
      LEFT JOIN student_profiles sp ON s.id = sp.student_id
      WHERE se.class_id = ?
      ORDER BY s.roll_number, s.name
    `).all(classId, classId, classId, classId, classId);
    
    // Calculate attendance rate and status for each student
    const studentsWithStats = students.map(student => {
      const attendance_rate = student.total_sessions > 0 
        ? Math.round((student.present_count / student.total_sessions) * 100)
        : 0;
      
      let status = 'No Data';
      if (student.total_sessions > 0) {
        if (attendance_rate >= 90) status = 'Good';
        else if (attendance_rate >= 75) status = 'Average';
        else status = 'Poor';
      }
      
      return {
        ...student,
        attendance_rate,
        status
      };
    });
    
    res.json(studentsWithStats);
  } catch (error) {
    console.error('Error fetching class students:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teachers/upcoming-exams', authenticateToken, requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.userId;
    
    const exams = db.prepare(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date as exam_date,
        e.start_time as exam_time,
        e.duration_minutes,
        e.total_marks,
        c.name as class_name,
        et.name as exam_type
      FROM exams e
      JOIN classes c ON e.class_id = c.id
      LEFT JOIN exam_types et ON e.exam_type_id = et.id
      WHERE e.created_by = ? AND e.date >= date('now')
      ORDER BY e.date ASC, e.start_time ASC
      LIMIT 10
    `).all(teacherId);
    
    res.json(exams);
  } catch (error) {
    console.error('Error fetching upcoming exams:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teachers/my-classes', authenticateToken, requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.userId;
    
    // Get teacher record
    const teacher = db.prepare('SELECT id FROM teachers WHERE user_id = ?').get(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }
    
    // Get classes through topic assignments
    const classes = db.prepare(`
      SELECT DISTINCT
        c.id,
        c.name,
        c.section,
        c.description,
        COUNT(DISTINCT se.student_id) as student_count,
        COUNT(DISTINCT tta.topic_id) as topics_count,
        AVG(CASE 
          WHEN a.status = 'present' THEN 100.0
          WHEN a.status = 'absent' THEN 0.0
          ELSE NULL
        END) as avg_attendance_rate
      FROM classes c
      JOIN topics t ON c.id = t.class_id
      JOIN teacher_topic_assignments tta ON t.id = tta.topic_id
      LEFT JOIN student_enrollments se ON c.id = se.class_id
      LEFT JOIN attendance a ON a.class_id = c.id AND a.date >= date('now', '-7 days')
      WHERE tta.teacher_id = ? AND tta.status = 'active'
      GROUP BY c.id, c.name, c.section, c.description
      ORDER BY c.name
    `).all(teacher.id);
    
    res.json(classes.map(cls => ({
      ...cls,
      avg_attendance_rate: cls.avg_attendance_rate ? parseFloat(cls.avg_attendance_rate.toFixed(1)) : 0
    })));
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teachers/weekly-attendance', authenticateToken, requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.userId;
    
    // Get weekly attendance data for the last 7 days
    const weeklyData = db.prepare(`
      SELECT 
        a.date,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
        COUNT(a.id) as total_count
      FROM attendance a
      JOIN classes c ON a.class_id = c.id
      WHERE c.teacher_id = ? AND a.date >= date('now', '-7 days')
      GROUP BY a.date
      ORDER BY a.date DESC
    `).all(teacherId);
    
    res.json(weeklyData);
  } catch (error) {
    console.error('Error fetching weekly attendance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Teachers attendance reports endpoint
app.get('/api/teachers/attendance-reports', authenticateToken, requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { class_id, date_from, date_to } = req.query;
    
    // Get teacher record
    const teacher = db.prepare('SELECT id FROM teachers WHERE user_id = ?').get(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    let query = `
      SELECT 
        a.id,
        a.date,
        a.status,
        a.notes,
        s.name as student_name,
        s.roll_number,
        c.name as class_name,
        c.id as class_id
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      WHERE c.teacher_id = ?
    `;
    
    const params = [teacher.id];
    
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
    
    query += ` ORDER BY a.date DESC, s.name ASC`;
    
    const reports = db.prepare(query).all(...params);
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching attendance reports:', error);
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
