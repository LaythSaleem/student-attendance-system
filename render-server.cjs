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
    
    res.json(classes);
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
