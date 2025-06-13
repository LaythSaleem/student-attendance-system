import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Types
interface User {
  id: string;
  email: string;
  password_hash: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'teacher' | 'student';
}

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes

// Auth routes
app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    // Get user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User;
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user role
    const userRole = db.prepare('SELECT * FROM user_roles WHERE user_id = ?').get(user.id) as UserRole;

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: userRole?.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: userRole?.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req: any, res: any) => {
  try {
    const { email, password, role = 'student' } = req.body;

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create user
    const userId = uuidv4();
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
      .run(userId, email, hashedPassword);

    // Create user role
    const roleId = uuidv4();
    db.prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)')
      .run(roleId, userId, role);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User routes
app.get('/api/user/profile', authenticateToken, (req: any, res) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.email, ur.role 
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      WHERE u.id = ?
    `).get(req.user.userId);

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Students routes
app.get('/api/students', authenticateToken, (_req: any, res: any) => {
  try {
    const students = db.prepare(`
      SELECT s.*, u.email 
      FROM students s 
      LEFT JOIN users u ON s.user_id = u.id 
      ORDER BY s.name
    `).all();

    res.json(students);
  } catch (error) {
    console.error('Students fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/students', authenticateToken, (req: any, res: any) => {
  try {
    const { name, rollNumber, class: studentClass, section, parentPhone, address } = req.body;

    const studentId = uuidv4();
    db.prepare(`
      INSERT INTO students (id, name, roll_number, class, section, parent_phone, address) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(studentId, name, rollNumber, studentClass, section, parentPhone, address);

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    res.status(201).json(student);
  } catch (error) {
    console.error('Student creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Teachers routes
app.get('/api/teachers', authenticateToken, (_req: any, res: any) => {
  try {
    const teachers = db.prepare(`
      SELECT t.*, u.email 
      FROM teachers t 
      LEFT JOIN users u ON t.user_id = u.id 
      ORDER BY t.name
    `).all();

    res.json(teachers);
  } catch (error) {
    console.error('Teachers fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Classes routes
app.get('/api/classes', authenticateToken, (_req: any, res: any) => {
  try {
    const classes = db.prepare(`
      SELECT c.*, t.name as teacher_name 
      FROM classes c 
      LEFT JOIN teachers t ON c.teacher_id = t.id 
      ORDER BY c.name, c.section
    `).all();

    res.json(classes);
  } catch (error) {
    console.error('Classes fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Attendance routes
app.get('/api/attendance', authenticateToken, (req: any, res) => {
  try {
    const { date, classId, studentId } = req.query;
    
    let query = `
      SELECT a.*, s.name as student_name, s.roll_number, c.name as class_name 
      FROM attendance a 
      JOIN students s ON a.student_id = s.id 
      JOIN classes c ON a.class_id = c.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    if (classId) {
      query += ' AND a.class_id = ?';
      params.push(classId);
    }
    if (studentId) {
      query += ' AND a.student_id = ?';
      params.push(studentId);
    }

    query += ' ORDER BY a.date DESC, s.name';

    const attendance = db.prepare(query).all(...params);
    res.json(attendance);
  } catch (error) {
    console.error('Attendance fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/attendance', authenticateToken, (req: any, res) => {
  try {
    const { studentId, classId, subjectId, date, status, notes } = req.body;

    const attendanceId = uuidv4();
    db.prepare(`
      INSERT OR REPLACE INTO attendance 
      (id, student_id, class_id, subject_id, date, status, marked_by, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(attendanceId, studentId, classId, subjectId, date, status, req.user.userId, notes);

    const attendance = db.prepare('SELECT * FROM attendance WHERE id = ?').get(attendanceId);
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Attendance creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Exams routes
app.get('/api/exams', authenticateToken, (_req: any, res: any) => {
  try {
    const exams = db.prepare(`
      SELECT e.*, et.name as exam_type_name, c.name as class_name, s.name as subject_name 
      FROM exams e 
      JOIN exam_types et ON e.exam_type_id = et.id 
      JOIN classes c ON e.class_id = c.id 
      JOIN subjects s ON e.subject_id = s.id 
      ORDER BY e.date DESC
    `).all();

    res.json(exams);
  } catch (error) {
    console.error('Exams fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reports routes
app.get('/api/reports/attendance-summary', authenticateToken, (req: any, res) => {
  try {
    const { startDate, endDate, classId } = req.query;
    
    let query = `
      SELECT 
        s.id,
        s.name,
        s.roll_number,
        c.name as class_name,
        COUNT(a.id) as total_days,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 
          2
        ) as attendance_percentage
      FROM students s
      JOIN classes c ON s.class = c.name
      LEFT JOIN attendance a ON s.id = a.student_id AND a.class_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) {
      query += ' AND a.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND a.date <= ?';
      params.push(endDate);
    }
    if (classId) {
      query += ' AND c.id = ?';
      params.push(classId);
    }

    query += ' GROUP BY s.id, s.name, s.roll_number, c.name ORDER BY s.name';

    const report = db.prepare(query).all(...params);
    res.json(report);
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (_req: any, res: any) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log('📊 Database initialized and ready');
});

export default app;
