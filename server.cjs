// Express server for Scholar Track Pulse - SQLite Version
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

const app = express();
const PORT = 8888;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for photo uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user role
    const userRole = db.prepare('SELECT * FROM user_roles WHERE user_id = ?').get(user.id);

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

app.post('/api/auth/register', async (req, res) => {
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
app.get('/api/user/profile', authenticateToken, (req, res) => {
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
        s.created_at as createdAt,
        s.updated_at as updatedAt,
        u.email,
        sp.date_of_birth as dateOfBirth,
        sp.whatsapp_number as whatsappNumber,
        sp.profile_picture as profilePicture,
        sp.status,
        sp.parent_name as parentName,
        sp.emergency_contact as emergencyContact,
        sp.blood_group as bloodGroup,
        sp.medical_conditions as medicalConditions,
        sp.admission_date as admissionDate,
        COALESCE(ROUND(RANDOM() * 30 + 70, 1), 85.0) as attendanceRate
      FROM students s 
      LEFT JOIN users u ON s.user_id = u.id 
      LEFT JOIN student_profiles sp ON s.id = sp.student_id
      ORDER BY s.name
    `).all();

    res.json(students);
  } catch (error) {
    console.error('Students fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/students', authenticateToken, (req, res) => {
  try {
    const { 
      name, 
      rollNumber, 
      class: studentClass, 
      section, 
      parentPhone, 
      whatsappNumber,
      address, 
      dateOfBirth,
      email,
      profilePicture,
      status = 'active',
      parentName,
      emergencyContact,
      bloodGroup,
      medicalConditions
    } = req.body;

    // Create user account first if email is provided
    let userId = null;
    if (email) {
      userId = uuidv4();
      const hashedPassword = bcrypt.hashSync('student123', 10); // Default password
      db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
        .run(userId, email, hashedPassword);
      
      // Create user role
      const roleId = uuidv4();
      db.prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)')
        .run(roleId, userId, 'student');
    }

    const studentId = uuidv4();
    db.prepare(`
      INSERT INTO students (
        id, user_id, name, roll_number, class, section, parent_phone, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(studentId, userId, name, rollNumber, studentClass, section, parentPhone, address);

    // Create extended student profile
    db.prepare(`
      INSERT INTO student_profiles (
        id, student_id, date_of_birth, whatsapp_number, profile_picture, 
        status, parent_name, emergency_contact, blood_group, medical_conditions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), studentId, dateOfBirth, whatsappNumber, profilePicture || '', 
      status, parentName, emergencyContact, bloodGroup || '', medicalConditions || ''
    );

    const student = db.prepare(`
      SELECT s.*, sp.*, u.email
      FROM students s 
      LEFT JOIN student_profiles sp ON s.id = sp.student_id
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE s.id = ?
    `).get(studentId);

    res.status(201).json(student);
  } catch (error) {
    console.error('Student creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/students/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      rollNumber, 
      class: studentClass, 
      section, 
      parentPhone, 
      whatsappNumber,
      address, 
      dateOfBirth,
      email,
      profilePicture,
      status,
      parentName,
      emergencyContact,
      bloodGroup,
      medicalConditions
    } = req.body;

    // Get current student data first
    const currentStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!currentStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update student basic info with fallback to current values
    db.prepare(`
      UPDATE students SET 
        name = ?, roll_number = ?, class = ?, section = ?, 
        parent_phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || currentStudent.name, 
      rollNumber || currentStudent.roll_number, 
      studentClass || currentStudent.class, 
      section || currentStudent.section, 
      parentPhone || currentStudent.parent_phone, 
      address !== undefined ? address : currentStudent.address, 
      id
    );

    // Update extended profile only if any profile fields are provided
    if (dateOfBirth !== undefined || whatsappNumber !== undefined || profilePicture !== undefined || 
        status !== undefined || parentName !== undefined || emergencyContact !== undefined || 
        bloodGroup !== undefined || medicalConditions !== undefined) {
      
      // Get current profile data
      const currentProfile = db.prepare('SELECT * FROM student_profiles WHERE student_id = ?').get(id);
      
      db.prepare(`
        INSERT OR REPLACE INTO student_profiles (
          id, student_id, date_of_birth, whatsapp_number, profile_picture, 
          status, parent_name, emergency_contact, blood_group, medical_conditions
        ) VALUES (
          COALESCE((SELECT id FROM student_profiles WHERE student_id = ?), ?),
          ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `).run(
        id, uuidv4(), id, 
        dateOfBirth !== undefined ? dateOfBirth : (currentProfile?.date_of_birth || null),
        whatsappNumber !== undefined ? whatsappNumber : (currentProfile?.whatsapp_number || null),
        profilePicture !== undefined ? (profilePicture || '') : (currentProfile?.profile_picture || ''),
        status !== undefined ? status : (currentProfile?.status || 'active'),
        parentName !== undefined ? parentName : (currentProfile?.parent_name || null),
        emergencyContact !== undefined ? emergencyContact : (currentProfile?.emergency_contact || null),
        bloodGroup !== undefined ? (bloodGroup || '') : (currentProfile?.blood_group || ''),
        medicalConditions !== undefined ? (medicalConditions || '') : (currentProfile?.medical_conditions || '')
      );
    }

    // Update email if provided
    if (email) {
      const student = db.prepare('SELECT user_id FROM students WHERE id = ?').get(id);
      if (student.user_id) {
        db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, student.user_id);
      }
    }

    const updatedStudent = db.prepare(`
      SELECT s.*, sp.*, u.email
      FROM students s 
      LEFT JOIN student_profiles sp ON s.id = sp.student_id
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE s.id = ?
    `).get(id);

    res.json(updatedStudent);
  } catch (error) {
    console.error('Student update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/students/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    // Get student info first
    const student = db.prepare('SELECT user_id FROM students WHERE id = ?').get(id);
    
    // Delete student profile
    db.prepare('DELETE FROM student_profiles WHERE student_id = ?').run(id);
    
    // Delete student record
    db.prepare('DELETE FROM students WHERE id = ?').run(id);
    
    // Delete user account if exists
    if (student && student.user_id) {
      db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(student.user_id);
      db.prepare('DELETE FROM users WHERE id = ?').run(student.user_id);
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Student deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific student profile by ID
app.get('/api/students/:id/profile', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    const student = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.roll_number as rollNumber,
        s.class,
        s.section,
        s.parent_phone as parentPhone,
        s.address,
        s.created_at as createdAt,
        s.updated_at as updatedAt,
        u.email,
        sp.date_of_birth as dateOfBirth,
        sp.whatsapp_number as whatsappNumber,
        sp.profile_picture as profilePicture,
        sp.status,
        sp.parent_name as parentName,
        sp.emergency_contact as emergencyContact,
        sp.blood_group as bloodGroup,
        sp.medical_conditions as medicalConditions,
        sp.admission_date as admissionDate,
        COALESCE(ROUND(RANDOM() * 30 + 70, 1), 85.0) as attendanceRate
      FROM students s 
      LEFT JOIN users u ON s.user_id = u.id 
      LEFT JOIN student_profiles sp ON s.id = sp.student_id
      WHERE s.id = ?
    `).get(id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get attendance history for this student
    const attendanceHistory = db.prepare(`
      SELECT 
        a.id,
        a.date,
        a.status,
        a.notes,
        a.created_at as markedAt,
        c.name as className,
        c.section as classSection,
        s.name as subjectName,
        t.name as teacherName
      FROM attendance a
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      WHERE a.student_id = ?
      ORDER BY a.date DESC
      LIMIT 50
    `).all(id);

    // Calculate attendance stats
    const totalClasses = attendanceHistory.length;
    const presentClasses = attendanceHistory.filter(a => a.status === 'present').length;
    const absentClasses = attendanceHistory.filter(a => a.status === 'absent').length;
    const lateClasses = attendanceHistory.filter(a => a.status === 'late').length;
    const overallAttendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    // Add attendance percentage to student object
    student.overallAttendancePercentage = overallAttendancePercentage;

    // Get student enrollments
    const enrollments = db.prepare(`
      SELECT 
        e.id,
        e.enrollment_date as enrollmentDate,
        c.name as className,
        c.section as classSection,
        c.id as classId
      FROM student_enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE e.student_id = ?
    `).all(id);

    // Get exam results
    const examResults = db.prepare(`
      SELECT 
        er.id,
        er.obtained_marks as marks,
        er.grade,
        er.created_at as resultDate,
        e.title as examTitle,
        e.date as examDate,
        e.total_marks as totalMarks,
        t.name as topicName
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      LEFT JOIN topics t ON e.topic_id = t.id
      WHERE er.student_id = ?
      ORDER BY e.date DESC
    `).all(id);

    // Create monthly attendance summary
    const monthlyAttendance = db.prepare(`
      SELECT 
        strftime('%Y-%m', a.date) as month,
        COUNT(*) as totalClasses,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as presentClasses,
        ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1) as percentage
      FROM attendance a
      WHERE a.student_id = ?
      GROUP BY strftime('%Y-%m', a.date)
      ORDER BY month DESC
      LIMIT 12
    `).all(id);

    const attendanceStats = {
      totalClasses,
      presentClasses,
      absentClasses,
      lateClasses,
      overallAttendancePercentage
    };

    // Return data in the expected format
    res.json({
      student,
      attendanceHistory,
      attendanceStats,
      monthlyAttendance,
      enrollments,
      examResults
    });
  } catch (error) {
    console.error('Student profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Student-specific routes
app.get('/api/students/my-classes', authenticateToken, (req, res) => {
  try {
    // Students can see all available classes (same as admin/teacher view)
    const classes = db.prepare(`
      SELECT 
        c.*,
        t.name as teacher_name,
        t.subject as teacher_subject,
        ay.name as academic_year,
        COUNT(DISTINCT se.student_id) as total_students,
        COUNT(DISTINCT tp.id) as total_topics
      FROM classes c 
      LEFT JOIN teachers t ON c.teacher_id = t.id 
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN student_enrollments se ON c.id = se.class_id AND se.status = 'active'
      LEFT JOIN topics tp ON c.id = tp.class_id
      GROUP BY c.id
      ORDER BY c.name, c.section
    `).all();

    // Get topics for each class
    const classesWithTopics = classes.map(classItem => {
      const topics = db.prepare(`
        SELECT 
          id,
          name,
          description,
          status,
          order_index,
          created_at,
          updated_at
        FROM topics
        WHERE class_id = ?
        ORDER BY order_index, created_at
      `).all(classItem.id);

      return {
        ...classItem,
        topics: topics || []
      };
    });

    res.json(classesWithTopics);
  } catch (error) {
    console.error('Student classes fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's attendance for a specific class
app.get('/api/students/my-attendance', authenticateToken, (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    
    // Students can view attendance records without needing enrollment validation
    // This endpoint will show attendance for students who have attendance records
    let query = `
      SELECT 
        a.id,
        a.date,
        a.status,
        a.notes,
        a.created_at as marked_at,
        c.name as class_name,
        c.section as class_section,
        s.name as subject_name,
        t.name as teacher_name
      FROM attendance a
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      WHERE a.student_id IN (
        SELECT s.id FROM students s 
        JOIN users u ON s.user_id = u.id 
        WHERE u.id = ?
      )
    `;
    const params = [req.user.userId];

    if (classId) {
      query += ' AND a.class_id = ?';
      params.push(classId);
    }
    if (startDate) {
      query += ' AND a.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND a.date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY a.date DESC, a.created_at DESC';

    const attendance = db.prepare(query).all(...params);
    res.json(attendance);
  } catch (error) {
    console.error('Student attendance fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Teachers routes
app.get('/api/teachers', authenticateToken, (req, res) => {
  try {
    console.log('🎯 Fetching teachers with topic assignments...');
    
    const teachers = db.prepare(`
      SELECT 
        t.*,
        u.email as user_email
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.name
    `).all();

    // Get topic assignments for each teacher
    const teachersWithTopics = teachers.map(teacher => {
      const topics = db.prepare(`
        SELECT 
          tta.topic_id,
          tp.name as topic_name,
          tp.class_id,
          c.name as class_name
        FROM teacher_topic_assignments tta
        JOIN topics tp ON tta.topic_id = tp.id
        JOIN classes c ON tp.class_id = c.id
        WHERE tta.teacher_id = ? AND tta.status = 'active'
        ORDER BY c.name, tp.name
      `).all(teacher.id);

      return {
        ...teacher,
        topics
      };
    });

    console.log(`✅ Found ${teachers.length} teachers with topic assignments`);
    res.json(teachersWithTopics);
  } catch (error) {
    console.error('❌ Error fetching teachers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new teacher
app.post('/api/teachers', authenticateToken, async (req, res) => {
  try {
    const { name, email, password, phone, address, topicIds = [] } = req.body;
    
    console.log('🎯 Creating teacher with topic assignments:', { name, email, topicCount: topicIds.length });

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const teacherId = uuidv4();
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    const transaction = db.transaction(() => {
      // Create user account
      db.prepare(`
        INSERT INTO users (id, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(userId, email, hashedPassword);

      // Create user role
      db.prepare(`
        INSERT INTO user_roles (id, user_id, role, created_at)
        VALUES (?, ?, 'teacher', CURRENT_TIMESTAMP)
      `).run(uuidv4(), userId);

      // Create teacher profile
      db.prepare(`
        INSERT INTO teachers (id, user_id, name, phone, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(teacherId, userId, name, phone || null, address || null);

      // Create topic assignments
      if (topicIds && topicIds.length > 0) {
        const insertAssignment = db.prepare(`
          INSERT INTO teacher_topic_assignments (id, teacher_id, topic_id, created_at, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
        
        topicIds.forEach(topicId => {
          insertAssignment.run(uuidv4(), teacherId, topicId);
        });
      }
    });

    transaction();

    console.log('✅ Teacher created successfully with topic assignments');
    res.json({ message: 'Teacher created successfully', teacherId });
  } catch (error) {
    console.error('❌ Teacher creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update teacher
app.put('/api/teachers/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      email, 
      phone, 
      address,
      topicIds = []
    } = req.body;

    // Get teacher info first
    const teacher = db.prepare('SELECT user_id FROM teachers WHERE id = ?').get(id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Update teacher basic info
    db.prepare(`
      UPDATE teachers SET 
        name = ?, phone = ?, address = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, phone || '', address || '', id);

    // Update topic assignments
    // First, deactivate all current assignments
    db.prepare(`
      UPDATE teacher_topic_assignments 
      SET status = 'inactive', updated_at = datetime('now')
      WHERE teacher_id = ?
    `).run(id);

    // Then add new assignments
    if (topicIds && topicIds.length > 0) {
      const insertTopicAssignment = db.prepare(`
        INSERT OR REPLACE INTO teacher_topic_assignments (id, teacher_id, topic_id, status, created_at, updated_at)
        VALUES (?, ?, ?, 'active', datetime('now'), datetime('now'))
      `);
      
      topicIds.forEach(topicId => {
        const assignmentId = uuidv4();
        insertTopicAssignment.run(assignmentId, id, topicId);
      });
    }

    // Update email if provided and teacher has a user account
    if (email && teacher.user_id) {
      // Check if email already exists for another user
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, teacher.user_id);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      
      db.prepare(`
        UPDATE users SET email = ? WHERE id = ?
      `).run(email, teacher.user_id);
    }

    // Get updated teacher with topic assignments
    const updatedTeacher = db.prepare(`
      SELECT t.*, u.email 
      FROM teachers t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE t.id = ?
    `).get(id);

    // Get assigned topics
    const assignedTopics = db.prepare(`
      SELECT 
        tp.id as topic_id,
        tp.name as topic_name,
        c.id as class_id,
        c.name as class_name
      FROM teacher_topic_assignments tta
      JOIN topics tp ON tta.topic_id = tp.id
      JOIN classes c ON tp.class_id = c.id
      WHERE tta.teacher_id = ? AND tta.status = 'active'
      ORDER BY c.name, tp.name
    `).all(id);

    res.json({
      ...updatedTeacher,
      topics: assignedTopics
    });
  } catch (error) {
    console.error('Teacher update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete teacher
app.delete('/api/teachers/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    // Get teacher info first
    const teacher = db.prepare('SELECT user_id FROM teachers WHERE id = ?').get(id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Delete teacher record
    db.prepare('DELETE FROM teachers WHERE id = ?').run(id);
    
    // Delete user account if exists
    if (teacher.user_id) {
      db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(teacher.user_id);
      db.prepare('DELETE FROM users WHERE id = ?').run(teacher.user_id);
    }

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Teacher deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Topics dropdown endpoint (general topics)
app.get('/api/topics', authenticateToken, (req, res) => {
  try {
    const topics = db.prepare(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.class_id,
        c.name as class_name,
        c.section as class_section,
        'General' as subject_name
      FROM topics t
      JOIN classes c ON t.class_id = c.id
      ORDER BY c.name, c.section, t.order_index, t.name
    `).all();

    res.json(topics);
  } catch (error) {
    console.error('Topics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get topics for a specific class
app.get('/api/classes/:classId/topics', authenticateToken, (req, res) => {
  try {
    const { classId } = req.params;
    
    const topics = db.prepare(`
      SELECT 
        id,
        name,
        description,
        status,
        order_index,
        created_at,
        updated_at
      FROM topics
      WHERE class_id = ?
      ORDER BY order_index, created_at
    `).all(classId);

    res.json(topics);
  } catch (error) {
    console.error('Class topics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new topic for a specific class
app.post('/api/classes/:classId/topics', authenticateToken, (req, res) => {
  try {
    const { classId } = req.params;
    const { name, description, order_index, status } = req.body;
    
    console.log('🎯 Creating topic for class:', { classId, name, status });

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Topic name is required' });
    }

    // Verify class exists
    const classExists = db.prepare('SELECT id FROM classes WHERE id = ?').get(classId);
    if (!classExists) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const topicId = uuidv4();
    const topicData = {
      id: topicId,
      name: name.trim(),
      description: description?.trim() || '',
      class_id: classId,
      order_index: order_index || 1,
      status: status || 'planned'
    };

    db.prepare(`
      INSERT INTO topics (id, name, description, class_id, order_index, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(topicId, topicData.name, topicData.description, classId, topicData.order_index, topicData.status);

    const createdTopic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId);
    console.log('✅ Topic created successfully:', createdTopic.name);
    
    res.status(201).json(createdTopic);
  } catch (error) {
    console.error('❌ Topic creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a topic
app.put('/api/topics/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, order_index, status } = req.body;
    
    console.log('🎯 Updating topic:', { id, name, status });

    // Verify topic exists
    const existingTopic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
    if (!existingTopic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Topic name is required' });
    }

    db.prepare(`
      UPDATE topics SET 
        name = ?, 
        description = ?, 
        order_index = ?, 
        status = ?, 
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name.trim(), 
      description?.trim() || existingTopic.description, 
      order_index !== undefined ? order_index : existingTopic.order_index,
      status || existingTopic.status,
      id
    );

    const updatedTopic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
    console.log('✅ Topic updated successfully:', updatedTopic.name);
    
    res.json(updatedTopic);
  } catch (error) {
    console.error('❌ Topic update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a topic
app.delete('/api/topics/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🎯 Deleting topic:', id);

    // Verify topic exists
    const existingTopic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
    if (!existingTopic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Delete topic (CASCADE should handle related data)
    db.prepare('DELETE FROM topics WHERE id = ?').run(id);
    
    console.log('✅ Topic deleted successfully:', existingTopic.name);
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('❌ Topic deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Classes endpoint
app.get('/api/classes', authenticateToken, (req, res) => {
  try {
    const classes = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.section,
        c.academic_year_id as academic_year,
        c.created_at,
        c.description,
        c.capacity,
        t.name as teacher_name,
        t.id as teacher_id,
        COUNT(DISTINCT se.student_id) as student_count,
        COUNT(DISTINCT tp.id) as total_topics
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN student_enrollments se ON c.id = se.class_id
      LEFT JOIN topics tp ON c.id = tp.class_id
      GROUP BY c.id, c.name, c.section, c.academic_year_id, c.created_at, c.description, c.capacity, t.name, t.id
      ORDER BY c.name, c.section
    `).all();

    // Get topics for each class
    const classesWithTopics = classes.map(classItem => {
      const topics = db.prepare(`
        SELECT 
          id,
          name,
          description,
          status,
          order_index,
          created_at,
          updated_at
        FROM topics
        WHERE class_id = ?
        ORDER BY order_index, created_at
      `).all(classItem.id);

      return {
        ...classItem,
        topics: topics || []
      };
    });

    res.json(classesWithTopics);
  } catch (error) {
    console.error('Classes fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Individual class endpoint
app.get('/api/classes/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    const classData = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.section,
        c.academic_year_id as academic_year,
        c.created_at,
        c.description,
        c.capacity,
        t.name as teacher_name,
        t.id as teacher_id,
        COUNT(DISTINCT se.student_id) as student_count,
        COUNT(DISTINCT tp.id) as total_topics
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN student_enrollments se ON c.id = se.class_id
      LEFT JOIN topics tp ON c.id = tp.class_id
      WHERE c.id = ?
      GROUP BY c.id, c.name, c.section, c.academic_year_id, c.created_at, c.description, c.capacity, t.name, t.id
    `).get(id);

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get topics for this class
    const topics = db.prepare(`
      SELECT 
        id,
        name,
        description,
        status,
        order_index,
        created_at,
        updated_at
      FROM topics
      WHERE class_id = ?
      ORDER BY order_index, created_at
    `).all(id);

    const classWithTopics = {
      ...classData,
      topics: topics || []
    };

    res.json(classWithTopics);
  } catch (error) {
    console.error('Individual class fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create class endpoint
app.post('/api/classes', authenticateToken, (req, res) => {
  try {
    const { name, section, description, teacher_id, academic_year_id, capacity } = req.body;
    
    // Validate required fields
    if (!name || !section || !academic_year_id) {
      return res.status(400).json({ error: 'Name, section, and academic year are required' });
    }

    // Generate a unique ID for the class
    const { v4: uuidv4 } = require('uuid');
    const classId = uuidv4();

    const result = db.prepare(`
      INSERT INTO classes (id, name, section, description, teacher_id, academic_year_id, capacity, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(classId, name, section, description || '', teacher_id || null, academic_year_id, capacity || 30);

    if (result.changes > 0) {
      // Return the created class
      const newClass = db.prepare(`
        SELECT 
          c.id,
          c.name,
          c.section,
          c.academic_year_id as academic_year,
          c.created_at,
          c.description,
          c.capacity,
          t.name as teacher_name,
          t.id as teacher_id,
          0 as student_count,
          0 as total_topics
        FROM classes c
        LEFT JOIN teachers t ON c.teacher_id = t.id
        WHERE c.id = ?
      `).get(classId);

      res.status(201).json({
        ...newClass,
        topics: []
      });
    } else {
      res.status(500).json({ error: 'Failed to create class' });
    }
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update class endpoint
app.put('/api/classes/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, section, description, teacher_id, academic_year_id, capacity } = req.body;
    
    // Check if class exists
    const classExists = db.prepare('SELECT id FROM classes WHERE id = ?').get(id);
    if (!classExists) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Validate required fields
    if (!name || !section || !academic_year_id) {
      return res.status(400).json({ error: 'Name, section, and academic year are required' });
    }

    const result = db.prepare(`
      UPDATE classes 
      SET name = ?, section = ?, description = ?, teacher_id = ?, academic_year_id = ?, capacity = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, section, description || '', teacher_id || null, academic_year_id, capacity || 30, id);

    if (result.changes > 0) {
      // Return the updated class
      const updatedClass = db.prepare(`
        SELECT 
          c.id,
          c.name,
          c.section,
          c.academic_year_id as academic_year,
          c.created_at,
          c.description,
          c.capacity,
          t.name as teacher_name,
          t.id as teacher_id,
          COUNT(DISTINCT se.student_id) as student_count,
          COUNT(DISTINCT tp.id) as total_topics
        FROM classes c
        LEFT JOIN teachers t ON c.teacher_id = t.id
        LEFT JOIN student_enrollments se ON c.id = se.class_id
        LEFT JOIN topics tp ON c.id = tp.class_id
        WHERE c.id = ?
        GROUP BY c.id, c.name, c.section, c.academic_year_id, c.created_at, c.description, c.capacity, t.name, t.id
      `).get(id);

      res.json(updatedClass);
    } else {
      res.status(404).json({ error: 'Class not found or could not be updated' });
    }
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete class endpoint
app.delete('/api/classes/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if class exists
    const classExists = db.prepare('SELECT id FROM classes WHERE id = ?').get(id);
    if (!classExists) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Begin transaction to ensure data integrity
    const deleteClass = db.transaction(() => {
      // Delete related topics first (if any)
      db.prepare('DELETE FROM topics WHERE class_id = ?').run(id);
      
      // Delete student enrollments
      db.prepare('DELETE FROM student_enrollments WHERE class_id = ?').run(id);
      
      // Delete attendance records for this class
      db.prepare('DELETE FROM attendance WHERE class_id = ?').run(id);
      
      // Delete exam results for exams in this class
      const examIds = db.prepare('SELECT id FROM exams WHERE class_id = ?').all(id);
      for (const exam of examIds) {
        db.prepare('DELETE FROM exam_results WHERE exam_id = ?').run(exam.id);
      }
      
      // Delete exams for this class
      db.prepare('DELETE FROM exams WHERE class_id = ?').run(id);
      
      // Finally delete the class
      const result = db.prepare('DELETE FROM classes WHERE id = ?').run(id);
      
      return result;
    });

    const result = deleteClass();
    
    if (result.changes > 0) {
      res.json({ 
        message: 'Class deleted successfully',
        deletedId: id 
      });
    } else {
      res.status(404).json({ error: 'Class not found or could not be deleted' });
    }
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Attendance reports endpoint
app.get('/api/attendance', authenticateToken, (req, res) => {
  try {
    const { class_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        s.id as student_id,
        s.name as student_name,
        s.roll_number,
        c.name as class_name,
        c.section,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(a.id) as total_sessions,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(a.id), 0)), 2
        ) as attendance_percentage
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN attendance a ON s.id = a.student_id
      WHERE 1=1
    `;
    
    const params = [];
    if (class_id) {
      query += ' AND c.id = ?';
      params.push(class_id);
    }
    if (start_date) {
      query += ' AND DATE(a.date) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND DATE(a.date) <= ?';
      params.push(end_date);
    }
    
    query += `
      GROUP BY s.id, s.name, s.roll_number, c.name, c.section
      ORDER BY c.name, c.section, s.roll_number
    `;
    
    const reports = db.prepare(query).all(...params);
    res.json(reports);
  } catch (error) {
    console.error('Attendance reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Attendance reports endpoint (alternative path)
app.get('/api/reports/attendance-summary', authenticateToken, (req, res) => {
  try {
    const { class_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        s.id as student_id,
        s.name as student_name,
        s.roll_number,
        c.name as class_name,
        c.section,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(a.id) as total_sessions,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(a.id), 0)), 2
        ) as attendance_percentage
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN attendance a ON s.id = a.student_id
      WHERE 1=1
    `;
    
    const params = [];
    if (class_id) {
      query += ' AND c.id = ?';
      params.push(class_id);
    }
    if (start_date) {
      query += ' AND DATE(a.date) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND DATE(a.date) <= ?';
      params.push(end_date);
    }
    
    query += `
      GROUP BY s.id, s.name, s.roll_number, c.name, c.section
      ORDER BY c.name, c.section, s.roll_number
    `;
    
    const reports = db.prepare(query).all(...params);
    res.json(reports);
  } catch (error) {
    console.error('Attendance reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Detailed attendance reports endpoint (for AttendanceReportsPage)
app.get('/api/reports/attendance-detailed', authenticateToken, (req, res) => {
  try {
    const { type, classId, topicId, teacherId, startDate, endDate, status } = req.query;
    
    let query = `
      SELECT 
        a.id,
        a.date,
        a.status,
        a.photo,
        a.notes,
        a.created_at as marked_at,
        a.topic_id,
        s.id as student_id,
        s.name as student_name,
        s.roll_number,
        c.id as class_id,
        c.name as class_name,
        c.section as class_section,
        subj.name as subject_name,
        tech.name as teacher_name,
        tp.name as topic_name,
        u.email as marked_by_email,
        'daily' as type,
        NULL as exam_title,
        NULL as arrival_time
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN subjects subj ON a.subject_id = subj.id
      LEFT JOIN topics tp ON a.topic_id = tp.id
      LEFT JOIN users u ON a.marked_by = u.id
      LEFT JOIN teachers tech ON u.id = tech.user_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (type && type !== 'all') {
      if (type === 'daily') {
        // Already filtered to daily attendance above
      } else if (type === 'exam') {
        // For now, we'll just show daily attendance as exam attendance isn't fully implemented
      }
    }
    
    if (classId && classId !== 'all') {
      query += ' AND c.id = ?';
      params.push(classId);
    }
    
    if (topicId && topicId !== 'all') {
      query += ' AND tp.id = ?';
      params.push(topicId);
    }
    
    if (teacherId && teacherId !== 'all') {
      query += ' AND tech.id = ?';
      params.push(teacherId);
    }
    
    if (startDate) {
      query += ' AND DATE(a.date) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(a.date) <= ?';
      params.push(endDate);
    }
    
    if (status && status !== 'all') {
      query += ' AND a.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY a.date DESC, a.created_at DESC LIMIT 100';
    
    const detailedReports = db.prepare(query).all(...params);
    
    // Set teacher_name from the marked_by user if not already set
    const reportsWithTeacherNames = detailedReports.map(record => ({
      ...record,
      teacher_name: record.teacher_name || 'Unknown Teacher'
    }));
    
    console.log(`📊 Attendance detailed reports: Found ${reportsWithTeacherNames.length} records`);
    res.json(reportsWithTeacherNames);
  } catch (error) {
    console.error('Detailed attendance reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate Daily Attendance Report
app.get('/api/reports/daily-attendance', authenticateToken, (req, res) => {
  try {
    const { date, classId, teacherId } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    let query = `
      SELECT 
        s.name as student_name,
        s.roll_number,
        s.class,
        s.section,
        c.name as class_name,
        a.status,
        a.date,
        a.notes,
        t.name as teacher_name,
        CASE 
          WHEN a.status = 'present' THEN 1 
          ELSE 0 
        END as is_present
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND DATE(a.date) = ?
      LEFT JOIN classes c ON s.class = c.id OR (a.class_id = c.id)
      LEFT JOIN teachers t ON c.teacher_id = t.id
      WHERE 1=1
    `;
    
    const params = [targetDate];
    
    if (classId) {
      query += ` AND (s.class = ? OR a.class_id = ?)`;
      params.push(classId, classId);
    }
    
    if (teacherId) {
      query += ` AND t.id = ?`;
      params.push(teacherId);
    }
    
    query += ` ORDER BY s.class, s.section, s.roll_number`;
    
    const report = db.prepare(query).all(...params);
    
    // Calculate summary statistics
    const totalStudents = report.length;
    const presentStudents = report.filter(r => r.status === 'present').length;
    const absentStudents = report.filter(r => r.status === 'absent').length;
    const lateStudents = report.filter(r => r.status === 'late').length;
    const notMarkedStudents = report.filter(r => !r.status).length;
    
    const summary = {
      date: targetDate,
      totalStudents,
      presentStudents,
      absentStudents,
      lateStudents,
      notMarkedStudents,
      attendancePercentage: totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0
    };
    
    res.json({ summary, data: report });
  } catch (error) {
    console.error('Daily attendance report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate Weekly Attendance Summary
app.get('/api/reports/weekly-attendance', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate, classId, teacherId } = req.query;
    
    // Default to current week if no dates provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let query = `
      SELECT 
        s.id as student_id,
        s.name as student_name,
        s.roll_number,
        s.class,
        s.section,
        COUNT(a.id) as total_classes,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(a.id), 0)), 1
        ) as attendance_percentage
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id 
        AND DATE(a.date) BETWEEN ? AND ?
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE 1=1
    `;
    
    const params = [start, end];
    
    if (classId) {
      query += ` AND (s.class = ? OR a.class_id = ?)`;
      params.push(classId, classId);
    }
    
    if (teacherId) {
      query += ` AND c.teacher_id = ?`;
      params.push(teacherId);
    }
    
    query += ` GROUP BY s.id, s.name, s.roll_number, s.class, s.section
               ORDER BY s.class, s.section, s.roll_number`;
    
    const report = db.prepare(query).all(...params);
    
    // Calculate overall summary
    const totalStudents = report.length;
    const averageAttendance = report.length > 0 
      ? Math.round(report.reduce((sum, r) => sum + (r.attendance_percentage || 0), 0) / report.length)
      : 0;
    
    const summary = {
      startDate: start,
      endDate: end,
      totalStudents,
      averageAttendance,
      totalClasses: report.reduce((sum, r) => sum + r.total_classes, 0),
      totalPresent: report.reduce((sum, r) => sum + r.present_count, 0)
    };
    
    res.json({ summary, data: report });
  } catch (error) {
    console.error('Weekly attendance report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate Monthly Attendance Report
app.get('/api/reports/monthly-attendance', authenticateToken, (req, res) => {
  try {
    const { month, year, classId, teacherId } = req.query;
    
    const currentDate = new Date();
    const reportMonth = month || (currentDate.getMonth() + 1);
    const reportYear = year || currentDate.getFullYear();
    
    const startDate = `${reportYear}-${reportMonth.toString().padStart(2, '0')}-01`;
    const endDate = new Date(reportYear, reportMonth, 0).toISOString().split('T')[0];
    
    let query = `
      SELECT 
        s.id as student_id,
        s.name as student_name,
        s.roll_number,
        s.class,
        s.section,
        c.name as class_name,
        COUNT(a.id) as total_classes,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(a.id), 0)), 1
        ) as attendance_percentage,
        GROUP_CONCAT(DISTINCT DATE(a.date)) as attended_dates
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id 
        AND DATE(a.date) BETWEEN ? AND ?
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE 1=1
    `;
    
    const params = [startDate, endDate];
    
    if (classId) {
      query += ` AND (s.class = ? OR a.class_id = ?)`;
      params.push(classId, classId);
    }
    
    if (teacherId) {
      query += ` AND c.teacher_id = ?`;
      params.push(teacherId);
    }
    
    query += ` GROUP BY s.id, s.name, s.roll_number, s.class, s.section, c.name
               ORDER BY s.class, s.section, s.roll_number`;
    
    const report = db.prepare(query).all(...params);
    
    // Calculate monthly statistics
    const summary = {
      month: reportMonth,
      year: reportYear,
      startDate,
      endDate,
      totalStudents: report.length,
      averageAttendance: report.length > 0 
        ? Math.round(report.reduce((sum, r) => sum + (r.attendance_percentage || 0), 0) / report.length)
        : 0,
      totalClasses: report.reduce((sum, r) => sum + r.total_classes, 0),
      totalPresent: report.reduce((sum, r) => sum + r.present_count, 0),
      totalAbsent: report.reduce((sum, r) => sum + r.absent_count, 0)
    };
    
    res.json({ summary, data: report });
  } catch (error) {
    console.error('Monthly attendance report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate Student-wise Attendance Report
app.get('/api/reports/student-attendance/:studentId', authenticateToken, (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if no dates provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get student details
    const student = db.prepare(`
      SELECT s.*, sp.date_of_birth, sp.parent_name
      FROM students s 
      LEFT JOIN student_profiles sp ON s.id = sp.student_id 
      WHERE s.id = ?
    `).get(studentId);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get attendance records
    const attendanceRecords = db.prepare(`
      SELECT 
        a.date,
        a.status,
        a.notes,
        c.name as class_name,
        c.section,
        t.name as teacher_name,
        top.name as topic_name
      FROM attendance a
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN topics top ON a.topic_id = top.id
      WHERE a.student_id = ? AND DATE(a.date) BETWEEN ? AND ?
      ORDER BY a.date DESC
    `).all(studentId, start, end);
    
    // Calculate statistics
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
    
    const summary = {
      student,
      period: { startDate: start, endDate: end },
      statistics: {
        totalClasses,
        presentCount,
        absentCount,
        lateCount,
        attendancePercentage
      }
    };
    
    res.json({ summary, data: attendanceRecords });
  } catch (error) {
    console.error('Student attendance report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate Class Performance Report
app.get('/api/reports/class-performance', authenticateToken, (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let query = `
      SELECT 
        c.id as class_id,
        c.name as class_name,
        c.section,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT a.date) as total_class_days,
        COUNT(a.id) as total_attendance_records,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as total_present,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as total_absent,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as total_late,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(a.id), 0)), 1
        ) as class_attendance_percentage,
        t.name as teacher_name
      FROM classes c
      LEFT JOIN students s ON s.class = c.id
      LEFT JOIN attendance a ON s.id = a.student_id 
        AND a.class_id = c.id 
        AND DATE(a.date) BETWEEN ? AND ?
      LEFT JOIN teachers t ON c.teacher_id = t.id
      WHERE 1=1
    `;
    
    const params = [start, end];
    
    if (classId) {
      query += ` AND c.id = ?`;
      params.push(classId);
    }
    
    query += ` GROUP BY c.id, c.name, c.section, t.name
               ORDER BY c.name, c.section`;
    
    const report = db.prepare(query).all(...params);
    
    const summary = {
      period: { startDate: start, endDate: end },
      totalClasses: report.length,
      averageAttendance: report.length > 0 
        ? Math.round(report.reduce((sum, r) => sum + (r.class_attendance_percentage || 0), 0) / report.length)
        : 0
    };
    
    res.json({ summary, data: report });
  } catch (error) {
    console.error('Class performance report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate Export Data for CSV/Excel
app.get('/api/reports/export/:reportType', authenticateToken, async (req, res) => {
  try {
    const { reportType } = req.params;
    const { format = 'json', ...filters } = req.query;
    
    let reportData;
    
    switch (reportType) {
      case 'daily-attendance':
        const dailyResponse = await fetch(`${req.protocol}://${req.get('host')}/api/reports/daily-attendance?${new URLSearchParams(filters).toString()}`, {
          headers: { 'Authorization': req.headers.authorization }
        });
        reportData = await dailyResponse.json();
        break;
        
      case 'weekly-attendance':
        const weeklyResponse = await fetch(`${req.protocol}://${req.get('host')}/api/reports/weekly-attendance?${new URLSearchParams(filters).toString()}`, {
          headers: { 'Authorization': req.headers.authorization }
        });
        reportData = await weeklyResponse.json();
        break;
        
      case 'monthly-attendance':
        const monthlyResponse = await fetch(`${req.protocol}://${req.get('host')}/api/reports/monthly-attendance?${new URLSearchParams(filters).toString()}`, {
          headers: { 'Authorization': req.headers.authorization }
        });
        reportData = await monthlyResponse.json();
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(reportData.data, reportType);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data, reportType) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value || '';
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

// Exam types endpoint
app.get('/api/exam-types', authenticateToken, (req, res) => {
  try {
    const examTypes = [
      { id: 'midterm', name: 'Midterm Exam', description: 'Mid-semester examination' },
      { id: 'final', name: 'Final Exam', description: 'End-semester examination' },
      { id: 'quiz', name: 'Quiz', description: 'Short assessment' },
      { id: 'assignment', name: 'Assignment', description: 'Take-home assignment' },
      { id: 'practical', name: 'Practical', description: 'Laboratory/practical examination' },
      { id: 'viva', name: 'Viva Voce', description: 'Oral examination' }
    ];
    res.json(examTypes);
  } catch (error) {
    console.error('Exam types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Exams endpoint
app.get('/api/exams', authenticateToken, (req, res) => {
  try {
    const exams = db.prepare(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date as exam_date,
        e.start_time,
        e.end_time,
        e.total_marks,
        e.exam_type_id as exam_type,
        e.class_id,
        c.name as class_name,
        c.section as class_section,
        t.name as topic_name,
        COUNT(er.id) as result_count
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN topics t ON e.topic_id = t.id
      LEFT JOIN exam_results er ON e.id = er.exam_id
      GROUP BY e.id
      ORDER BY e.date DESC, e.start_time
    `).all();
    res.json(exams);
  } catch (error) {
    console.error('Exams fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users endpoint (for admin management)
app.get('/api/users', authenticateToken, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.created_at,
        ur.role,
        COALESCE(s.name, t.name, ap.name) as name,
        COALESCE(t.phone, s.parent_phone, '') as phone,
        COALESCE(t.address, s.address, '') as address,
        CASE 
          WHEN s.id IS NOT NULL THEN 'Student'
          WHEN t.id IS NOT NULL THEN 'Teacher'
          WHEN ap.id IS NOT NULL THEN 'Admin'
          ELSE 'Unknown'
        END as profile_type,
        'active' as status
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      LEFT JOIN admin_profiles ap ON u.id = ap.user_id
      ORDER BY u.created_at DESC
    `).all();
    res.json(users);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
app.post('/api/users', authenticateToken, (req, res) => {
  try {
    const { email, password, role, name, phone, address, status = 'active' } = req.body;

    // Validate required fields
    if (!email || !password || !role || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create user
    const userId = uuidv4();
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
      .run(userId, email, hashedPassword);

    // Create user role
    const roleId = uuidv4();
    db.prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)')
      .run(roleId, userId, role);

    // Create role-specific profile
    let profileId = uuidv4();
    
    if (role === 'admin') {
      db.prepare('INSERT INTO admin_profiles (id, user_id, name) VALUES (?, ?, ?)')
        .run(profileId, userId, name);
    } else if (role === 'teacher') {
      db.prepare('INSERT INTO teachers (id, user_id, name, phone, address, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
        .run(profileId, userId, name, phone || '', address || '');
    } else if (role === 'student') {
      // For students, create a basic student record
      db.prepare('INSERT INTO students (id, user_id, name, roll_number, class, section, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
        .run(profileId, userId, name, `STU${Date.now()}`, 'Unassigned', 'A');
    }

    // Fetch the created user
    const newUser = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.created_at,
        ur.role,
        COALESCE(s.name, t.name, ap.name) as name,
        COALESCE(t.phone, s.parent_phone, '') as phone,
        COALESCE(t.address, s.address, '') as address,
        'active' as status
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      LEFT JOIN admin_profiles ap ON u.id = ap.user_id
      WHERE u.id = ?
    `).get(userId);

    res.status(201).json(newUser);
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
app.put('/api/users/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, password } = req.body;

    // Get user's role
    const userWithRole = db.prepare(`
      SELECT u.*, ur.role 
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
    `).get(id);

    if (!userWithRole) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password if provided
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .run(hashedPassword, id);
    }

    // Update role-specific profile
    if (userWithRole.role === 'admin') {
      db.prepare('UPDATE admin_profiles SET name = ? WHERE user_id = ?')
        .run(name, id);
    } else if (userWithRole.role === 'teacher') {
      db.prepare('UPDATE teachers SET name = ?, phone = ?, address = ? WHERE user_id = ?')
        .run(name, phone || '', address || '', id);
    } else if (userWithRole.role === 'student') {
      db.prepare('UPDATE students SET name = ? WHERE user_id = ?')
        .run(name, id);
    }

    // Fetch updated user
    const updatedUser = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.created_at,
        ur.role,
        COALESCE(s.name, t.name, ap.name) as name,
        COALESCE(t.phone, s.parent_phone, '') as phone,
        COALESCE(t.address, s.address, '') as address,
        'active' as status
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      LEFT JOIN admin_profiles ap ON u.id = ap.user_id
      WHERE u.id = ?
    `).get(id);

    res.json(updatedUser);
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // Get user's role
    const userWithRole = db.prepare(`
      SELECT u.*, ur.role 
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
    `).get(id);

    if (!userWithRole) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deletion of the last admin
    if (userWithRole.role === 'admin') {
      const adminCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM user_roles 
        WHERE role = 'admin'
      `).get();
      
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    // Delete role-specific profile
    if (userWithRole.role === 'admin') {
      db.prepare('DELETE FROM admin_profiles WHERE user_id = ?').run(id);
    } else if (userWithRole.role === 'teacher') {
      // Delete teacher assignments first
      db.prepare('DELETE FROM teacher_assignments WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = ?)').run(id);
      db.prepare('DELETE FROM teachers WHERE user_id = ?').run(id);
    } else if (userWithRole.role === 'student') {
      // Delete student-related data
      db.prepare('DELETE FROM student_profiles WHERE student_id IN (SELECT id FROM students WHERE user_id = ?)').run(id);
      db.prepare('DELETE FROM student_enrollments WHERE student_id IN (SELECT id FROM students WHERE user_id = ?)').run(id);
      db.prepare('DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE user_id = ?)').run(id);
      db.prepare('DELETE FROM students WHERE user_id = ?').run(id);
    }

    // Delete user role and user
    db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dropdown endpoints
app.get('/api/teachers/dropdown', authenticateToken, (req, res) => {
  try {
    const teachers = db.prepare(`
      SELECT 
        t.id, 
        t.name, 
        u.email,
        '' as subject_specialization
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.name
    `).all();
    res.json(teachers);
  } catch (error) {
    console.error('Teachers dropdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/academic-years', authenticateToken, (req, res) => {
  try {
    const academicYears = db.prepare(`
      SELECT DISTINCT academic_year_id as id, academic_year_id as academic_year, academic_year_id as name
      FROM classes
      WHERE academic_year_id IS NOT NULL
      ORDER BY academic_year_id DESC
    `).all();
    
    // Add current year if not present
    const currentYear = new Date().getFullYear();
    const currentAcademicYear = `${currentYear}-${currentYear + 1}`;
    
    const yearExists = academicYears.some(year => year.academic_year === currentAcademicYear);
    if (!yearExists) {
      academicYears.unshift({ 
        id: currentAcademicYear,
        academic_year: currentAcademicYear,
        name: currentAcademicYear
      });
    }
    
    res.json(academicYears);
  } catch (error) {
    console.error('Academic years error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/academic-years/dropdown', authenticateToken, (req, res) => {
  try {
    const academicYears = db.prepare(`
      SELECT DISTINCT academic_year_id as id, academic_year_id as academic_year, academic_year_id as name
      FROM classes
      WHERE academic_year_id IS NOT NULL
      ORDER BY academic_year_id DESC
    `).all();
    
    // Add current year if not present
    const currentYear = new Date().getFullYear();
    const currentAcademicYear = `${currentYear}-${currentYear + 1}`;
    
    const yearExists = academicYears.some(year => year.academic_year === currentAcademicYear);
    if (!yearExists) {
      academicYears.unshift({ 
        id: currentAcademicYear,
        academic_year: currentAcademicYear,
        name: currentAcademicYear
      });
    }
    
    res.json(academicYears);
  } catch (error) {
    console.error('Academic years dropdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/teachers/available-topics', authenticateToken, (req, res) => {
  try {
    const { teacherId } = req.query;
    
    let query = `
      SELECT DISTINCT
        t.id,
        t.name,
        t.description,
        c.name as class_name,
        c.section as class_section,
        'General' as subject_name
      FROM topics t
      JOIN classes c ON t.class_id = c.id
    `;
    
    const params = [];
    if (teacherId) {
      query += `
        JOIN teacher_assignments ta ON c.id = ta.class_id
        WHERE ta.teacher_id = ?
      `;
      params.push(teacherId);
    }
    
    query += ' ORDER BY c.name, c.section, t.order_index, t.name';
    
    const topics = db.prepare(query).all(...params);
    res.json(topics);
  } catch (error) {
    console.error('Teacher available topics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Teacher-specific endpoints for Teacher Dashboard
app.get('/api/teachers/my-classes', authenticateToken, (req, res) => {
  try {
    // Get teacher's assigned classes based on the authenticated user
    const teacherClasses = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.section,
        c.academic_year_id as academic_year,
        c.description,
        c.capacity,
        t.name as teacher_name,
        t.id as teacher_id,
        COUNT(DISTINCT se.student_id) as student_count,
        COUNT(DISTINCT tp.id) as total_topics
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN student_enrollments se ON c.id = se.class_id
      LEFT JOIN topics tp ON c.id = tp.class_id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE u.id = ? OR t.id IS NULL
      GROUP BY c.id, c.name, c.section, c.academic_year_id, c.description, c.capacity, t.name, t.id
      ORDER BY c.name, c.section
    `).all(req.user.userId);

    res.json(teacherClasses);
  } catch (error) {
    console.error('Teacher classes fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/teachers/classes/:classId/students', authenticateToken, (req, res) => {
  try {
    const { classId } = req.params;
    
    const students = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.roll_number,
        s.class,
        s.section,
        se.status as enrollment_status,
        u.email
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE se.class_id = ? AND se.status = 'active'
      ORDER BY s.roll_number, s.name
    `).all(classId);

    res.json(students);
  } catch (error) {
    console.error('Class students fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/teachers/photo-attendance', authenticateToken, (req, res) => {
  try {
    const { classId, date, attendance } = req.body;
    
    if (!classId || !date || !Array.isArray(attendance)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const insertAttendance = db.prepare(`
      INSERT INTO attendance (
        id, student_id, class_id, date, status, photo, notes, marked_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const transaction = db.transaction((attendanceRecords) => {
      for (const record of attendanceRecords) {
        const attendanceId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        insertAttendance.run(
          attendanceId,
          record.studentId,
          classId,
          date,
          record.status,
          record.photo || null,
          record.notes || null,
          req.user.userId
        );
      }
    });

    transaction(attendance);

    res.json({ 
      message: 'Attendance submitted successfully',
      count: attendance.length 
    });
  } catch (error) {
    console.error('Photo attendance submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/teachers/recent-activity', authenticateToken, (req, res) => {
  try {
    const activities = db.prepare(`
      SELECT 
        'attendance' as type,
        'Attendance marked for ' || c.name || ' - ' || c.section as description,
        a.date,
        a.created_at,
        COUNT(a.id) as count
      FROM attendance a
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE (u.id = ? OR t.id IS NULL) AND a.marked_by = ?
      GROUP BY a.date, c.id, c.name, c.section
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all(req.user.userId, req.user.userId);

    res.json(activities);
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/teachers/attendance-reports', authenticateToken, (req, res) => {
  try {
    const { classId, date } = req.query;
    
    let query = `
      SELECT 
        a.id,
        a.date,
        a.status,
        a.photo,
        a.notes,
        a.created_at,
        s.name as student_name,
        s.roll_number,
        e.title as exam_title
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN exams e ON a.exam_id = e.id
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE (u.id = ? OR t.id IS NULL) AND a.exam_id IS NOT NULL
    `;
    
    const params = [req.user.userId];
    
    if (classId) {
      query += ' AND a.class_id = ?';
      params.push(classId);
    }
    
    if (date) {
      query += ' AND DATE(a.date) = ?';
      params.push(date);
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const records = db.prepare(query).all(...params);
    res.json(records);
  } catch (error) {
    console.error('Exam attendance reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance records for a specific class and date (for same-day editing)
app.get('/api/teachers/attendance-records', authenticateToken, (req, res) => {
  try {
    const { classId, date, topicId } = req.query;
    
    // Get only the most recent attendance record for each student for the specified date
    let query = `
      SELECT 
        a.id,
        a.student_id,
        a.status,
        a.photo,
        a.notes,
        a.created_at as marked_at,
        s.name as student_name,
        s.roll_number
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE (u.id = ? OR t.id IS NULL)
        AND a.id IN (
          SELECT a2.id 
          FROM attendance a2 
          WHERE a2.student_id = a.student_id 
            AND a2.class_id = a.class_id
            AND DATE(a2.date) = DATE(a.date)
          ORDER BY a2.created_at DESC 
          LIMIT 1
        )
    `;
    
    const params = [req.user.userId];
    
    if (classId) {
      query += ' AND c.id = ?';
      params.push(classId);
    }
    
    if (date) {
      query += ' AND DATE(a.date) = ?';
      params.push(date);
    }
    
    if (topicId) {
      query += ' AND a.topic_id = ?';
      params.push(topicId);
    }
    
    query += ' ORDER BY s.roll_number';
    
    const records = db.prepare(query).all(...params);
    console.log(`📊 Found ${records.length} most recent attendance records for classId=${classId}, date=${date}`);
    res.json(records);
  } catch (error) {
    console.error('Attendance records fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced Teacher Dashboard Endpoints

// Get teacher's assigned topics
app.get('/api/teachers/my-topics', authenticateToken, (req, res) => {
  try {
    const topics = db.prepare(`
      SELECT 
        t.id,
        t.name,
        t.description,
        c.name as class_name,
        c.section as class_section,
        COUNT(DISTINCT a.id) as completed_sessions,
        10 as total_sessions
      FROM topics t
      JOIN classes c ON t.class_id = c.id
      LEFT JOIN teachers tech ON c.teacher_id = tech.id
      LEFT JOIN users u ON tech.user_id = u.id
      LEFT JOIN attendance a ON t.id = a.topic_id
      WHERE (u.id = ? OR tech.id IS NULL)
      GROUP BY t.id, t.name, t.description, c.name, c.section
      ORDER BY c.name, t.order_index, t.name
    `).all(req.user.userId);

    res.json(topics);
  } catch (error) {
    console.error('Teacher topics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get upcoming exams for teacher's topics
app.get('/api/teachers/upcoming-exams', authenticateToken, (req, res) => {
  try {
    const upcomingExams = db.prepare(`
      SELECT 
        e.id,
        e.title,
        e.date,
        e.start_time as time,
        e.duration_minutes,
        t.name as topic_name,
        c.name as class_name
      FROM exams e
      JOIN topics t ON e.topic_id = t.id
      JOIN classes c ON t.class_id = c.id
      LEFT JOIN teachers tech ON c.teacher_id = tech.id
      LEFT JOIN users u ON tech.user_id = u.id
      WHERE (u.id = ? OR tech.id IS NULL) 
        AND e.date >= date('now')
      ORDER BY e.date, e.start_time
      LIMIT 10
    `).all(req.user.userId);

    // Format duration for display
    const formattedExams = upcomingExams.map(exam => ({
      ...exam,
      duration: exam.duration_minutes ? `${exam.duration_minutes} min` : null
    }));

    res.json(formattedExams);
  } catch (error) {
    console.error('Upcoming exams fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get weekly attendance data for teacher's classes
app.get('/api/teachers/weekly-attendance', authenticateToken, (req, res) => {
  try {
    // Generate last 7 days of data
    const weeklyData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = db.prepare(`
        SELECT 
          COUNT(DISTINCT a.student_id) as present_students,
          COUNT(DISTINCT se.student_id) as total_students
        FROM student_enrollments se
        JOIN classes c ON se.class_id = c.id
        LEFT JOIN teachers t ON c.teacher_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN attendance a ON se.student_id = a.student_id 
          AND a.class_id = c.id 
          AND DATE(a.date) = ?
          AND a.status = 'present'
        WHERE (u.id = ? OR t.id IS NULL) AND se.status = 'active'
      `).get(dateStr, req.user.userId);

      const totalStudents = dayData.total_students || 1;
      const presentStudents = dayData.present_students || 0;
      const attendanceRate = Math.round((presentStudents / totalStudents) * 100);

      weeklyData.push({
        date: dateStr,
        day: days[date.getDay()],
        attendance_rate: attendanceRate,
        total_students: totalStudents,
        present_students: presentStudents
      });
    }

    res.json(weeklyData);
  } catch (error) {
    console.error('Weekly attendance fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get students requiring attention (attendance below 75% this week)
app.get('/api/teachers/students-requiring-attention', authenticateToken, (req, res) => {
  try {
    const studentsRequiringAttention = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.roll_number,
        c.name as class_name,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(a.id) as total_sessions,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(a.id), 0)), 1
        ) as weekly_attendance_rate,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as missed_sessions
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN classes c ON se.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN attendance a ON s.id = a.student_id 
        AND a.class_id = c.id
        AND a.date >= date('now', '-7 days')
      WHERE (u.id = ? OR t.id IS NULL) 
        AND se.status = 'active'
      GROUP BY s.id, s.name, s.roll_number, c.name
      HAVING weekly_attendance_rate < 75 OR weekly_attendance_rate IS NULL
      ORDER BY weekly_attendance_rate ASC, missed_sessions DESC
      LIMIT 10
    `).all(req.user.userId);

    res.json(studentsRequiringAttention);
  } catch (error) {
    console.error('Students requiring attention fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update dashboard stats to include new metrics
app.get('/api/teachers/dashboard-stats', authenticateToken, (req, res) => {
  try {
    const stats = {
      totalClasses:  0,
      totalStudents: 0,
      assignedTopics: 0,
      todayAttendanceRate: 85.5,
      weeklyAttendanceRate: 82.3,
      upcomingExams: 0,
      pendingTasks: 3
    };

    // Get teacher's classes count
    const classesCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE u.id = ? OR t.id IS NULL
    `).get(req.user.userId);
    
    stats.totalClasses = classesCount?.count || 0;

    // Get total students across teacher's classes
    const studentsCount = db.prepare(`
      SELECT COUNT(DISTINCT se.student_id) as count
      FROM student_enrollments se
      JOIN classes c ON se.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE (u.id = ? OR t.id IS NULL) AND se.status = 'active'
    `).get(req.user.userId);
    
    stats.totalStudents = studentsCount?.count || 0;

    // Get assigned topics count
    const topicsCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM topics t
      JOIN classes c ON t.class_id = c.id
      LEFT JOIN teachers tech ON c.teacher_id = tech.id
      LEFT JOIN users u ON tech.user_id = u.id
      WHERE u.id = ? OR tech.id IS NULL
    `).get(req.user.userId);
    
    stats.assignedTopics = topicsCount?.count || 0;

    // Get upcoming exams count
    const examsCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM exams e
      JOIN topics t ON e.topic_id = t.id
      JOIN classes c ON t.class_id = c.id
      LEFT JOIN teachers tech ON c.teacher_id = tech.id
      LEFT JOIN users u ON tech.user_id = u.id
      WHERE (u.id = ? OR tech.id IS NULL) 
        AND e.date >= date('now')
    `).get(req.user.userId);
    
    stats.upcomingExams = examsCount?.count || 0;

    res.json(stats);
  } catch (error) {
    console.error('Enhanced dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Subjects dropdown endpoint
app.get('/api/subjects/dropdown', authenticateToken, (req, res) => {
  try {
    // For the medical college system, we'll provide common medical subjects
    const subjects = [
      { id: 'anatomy', name: 'Anatomy', description: 'Human anatomy and structure' },
      { id: 'physiology', name: 'Physiology', description: 'Human physiology and function' },
      { id: 'biochemistry', name: 'Biochemistry', description: 'Medical biochemistry' },
      { id: 'pathology', name: 'Pathology', description: 'Disease processes and diagnosis' },
      { id: 'pharmacology', name: 'Pharmacology', description: 'Drug action and therapeutics' },
      { id: 'microbiology', name: 'Microbiology', description: 'Medical microbiology and immunology' },
      { id: 'clinical_medicine', name: 'Clinical Medicine', description: 'Clinical practice and patient care' },
      { id: 'surgery', name: 'Surgery', description: 'Surgical procedures and techniques' },
      { id: 'pediatrics', name: 'Pediatrics', description: 'Child health and diseases' },
      { id: 'obstetrics_gynecology', name: 'Obstetrics & Gynecology', description: 'Women\'s health and reproductive medicine' },
      { id: 'psychiatry', name: 'Psychiatry', description: 'Mental health and behavioral disorders' },
      { id: 'general', name: 'General Medical Education', description: 'General medical topics and curriculum' }
    ];
    
    res.json(subjects);
  } catch (error) {
    console.error('Subjects dropdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log('📊 Database initialized and ready');
  console.log('✅ Server is now listening for connections');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else if (err.code === 'EACCES') {
    console.error(`❌ Permission denied on port ${PORT}`);
    process.exit(1);
  } else {
    console.error('❌ Unknown server error:', err.message);
    process.exit(1);
  }
});

server.on('listening', () => {
  const address = server.address();
  if (address) {
    console.log(`🔍 Server successfully bound to: ${address.address}:${address.port}`);
  }
});

// Test route to verify server is responding
app.get('/test', (req, res) => {
  console.log('✅ Test route hit');
  res.json({ message: 'Server is responding', timestamp: new Date().toISOString() });
});

// Get students with detailed attendance data for teacher's classes
app.get('/api/teachers/students-with-attendance', authenticateToken, (req, res) => {
  try {
    const { stage, search, limit = 50 } = req.query;
    
    // First, get the most recent enrollment for each student to avoid duplicates
    let query = `
      WITH LatestEnrollments AS (
        SELECT 
          se.student_id,
          se.class_id,
          se.enrollment_date,
          se.status,
          ROW_NUMBER() OVER (PARTITION BY se.student_id ORDER BY se.enrollment_date DESC) as rn
        FROM student_enrollments se
        WHERE se.status = 'active'
      ),
      StudentClassInfo AS (
        SELECT 
          s.id,
          s.name,
          s.roll_number,
          s.class as stage,
          s.section,
          c.name as class_name,
          le.enrollment_date,
          le.status as enrollment_status
        FROM students s
        JOIN LatestEnrollments le ON s.id = le.student_id AND le.rn = 1
        JOIN classes c ON le.class_id = c.id
        LEFT JOIN teachers t ON c.teacher_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE (u.id = ? OR t.id IS NULL)
      )
      SELECT 
        sci.id,
        sci.name,
        sci.roll_number,
        sci.stage,
        sci.section,
        sci.class_name,
        
        -- Attendance statistics for last 30 days using subqueries
        (SELECT COUNT(*) FROM attendance a1 
         JOIN LatestEnrollments le1 ON a1.student_id = le1.student_id AND a1.class_id = le1.class_id AND le1.rn = 1
         WHERE a1.student_id = sci.id AND a1.status = 'present' 
         AND a1.date >= date('now', '-30 days')) as present_count,
        
        (SELECT COUNT(*) FROM attendance a2 
         JOIN LatestEnrollments le2 ON a2.student_id = le2.student_id AND a2.class_id = le2.class_id AND le2.rn = 1
         WHERE a2.student_id = sci.id AND a2.status = 'late' 
         AND a2.date >= date('now', '-30 days')) as late_count,
        
        (SELECT COUNT(*) FROM attendance a3 
         JOIN LatestEnrollments le3 ON a3.student_id = le3.student_id AND a3.class_id = le3.class_id AND le3.rn = 1
         WHERE a3.student_id = sci.id AND a3.status = 'absent' 
         AND a3.date >= date('now', '-30 days')) as absent_count,
        
        (SELECT COUNT(*) FROM attendance a4 
         JOIN LatestEnrollments le4 ON a4.student_id = le4.student_id AND a4.class_id = le4.class_id AND le4.rn = 1
         WHERE a4.student_id = sci.id AND a4.date >= date('now', '-30 days')) as total_sessions,
        
        -- Attendance rate calculation
        ROUND(
          (SELECT COUNT(*) FROM attendance a5 
           JOIN LatestEnrollments le5 ON a5.student_id = le5.student_id AND a5.class_id = le5.class_id AND le5.rn = 1
           WHERE a5.student_id = sci.id AND a5.status = 'present' 
           AND a5.date >= date('now', '-30 days')) * 100.0 / 
          NULLIF((SELECT COUNT(*) FROM attendance a6 
                  JOIN LatestEnrollments le6 ON a6.student_id = le6.student_id AND a6.class_id = le6.class_id AND le6.rn = 1
                  WHERE a6.student_id = sci.id AND a6.date >= date('now', '-30 days')), 0), 1
        ) as attendance_rate,
        
        -- Latest photo from recent attendance
        (SELECT a7.photo FROM attendance a7 
         WHERE a7.student_id = sci.id AND a7.photo IS NOT NULL 
         ORDER BY a7.date DESC, a7.created_at DESC LIMIT 1) as latest_photo,
        
        -- Status based on attendance rate
        CASE 
          WHEN (SELECT COUNT(*) FROM attendance a8 
                JOIN LatestEnrollments le8 ON a8.student_id = le8.student_id AND a8.class_id = le8.class_id AND le8.rn = 1
                WHERE a8.student_id = sci.id AND a8.date >= date('now', '-30 days')) = 0 THEN 'No Data'
          WHEN ROUND(
            (SELECT COUNT(*) FROM attendance a9 
             JOIN LatestEnrollments le9 ON a9.student_id = le9.student_id AND a9.class_id = le9.class_id AND le9.rn = 1
             WHERE a9.student_id = sci.id AND a9.status = 'present' 
             AND a9.date >= date('now', '-30 days')) * 100.0 / 
            NULLIF((SELECT COUNT(*) FROM attendance a10 
                    JOIN LatestEnrollments le10 ON a10.student_id = le10.student_id AND a10.class_id = le10.class_id AND le10.rn = 1
                    WHERE a10.student_id = sci.id AND a10.date >= date('now', '-30 days')), 0), 1
          ) >= 75 THEN 'Good'
          WHEN ROUND(
            (SELECT COUNT(*) FROM attendance a11 
             JOIN LatestEnrollments le11 ON a11.student_id = le11.student_id AND a11.class_id = le11.class_id AND le11.rn = 1
             WHERE a11.student_id = sci.id AND a11.status = 'present' 
             AND a11.date >= date('now', '-30 days')) * 100.0 / 
            NULLIF((SELECT COUNT(*) FROM attendance a12 
                    JOIN LatestEnrollments le12 ON a12.student_id = le12.student_id AND a12.class_id = le12.class_id AND le12.rn = 1
                    WHERE a12.student_id = sci.id AND a12.date >= date('now', '-30 days')), 0), 1
          ) >= 50 THEN 'Average'
          ELSE 'Poor'
        END as status,
        
        -- Student enrollment info
        sci.enrollment_date,
        sci.enrollment_status
        
      FROM StudentClassInfo sci
      WHERE 1=1
    `;
    
    const params = [req.user.userId];
    
    // Apply filters
    if (search) {
      query += ' AND (sci.name LIKE ? OR sci.roll_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (stage) {
      query += ' AND sci.stage = ?';
      params.push(stage);
    }

    query += `
      ORDER BY sci.name
    `;
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    
    const studentsWithAttendance = db.prepare(query).all(...params);
    
    console.log(`📊 Students with attendance: Found ${studentsWithAttendance.length} students`);
    res.json(studentsWithAttendance);
  } catch (error) {
    console.error('Students with attendance fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Exam Attendance Endpoints
app.post('/api/teachers/exam-attendance', authenticateToken, (req, res) => {
  try {
    const { classId, examId, date, attendance } = req.body;
    
    if (!classId || !examId || !date || !Array.isArray(attendance)) {
      return res.status(400).json({ error: 'Missing required fields for exam attendance' });
    }

    // First, create exam attendance entries in a new table or reuse attendance table with exam_id
    const insertExamAttendance = db.prepare(`
      INSERT INTO attendance (
        id, student_id, class_id, date, status, photo, notes, marked_by, exam_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const transaction = db.transaction((attendanceRecords) => {
      for (const record of attendanceRecords) {
        insertExamAttendance.run(
          uuidv4(),
          record.studentId,
          classId,
          date,
          record.status,
          record.photo || null,
          record.notes || `Exam attendance - ${record.status}`,
          req.user.userId,
          examId
        );
      }
    });

    transaction(attendance);

    res.json({ 
      message: 'Exam attendance submitted successfully',
      count: attendance.length 
    });
  } catch (error) {
    console.error('Exam attendance submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/teachers/exam-attendance-records', authenticateToken, (req, res) => {
  try {
    const { classId, date, examId } = req.query;
    
    let query = `
      SELECT 
        a.id,
        a.student_id,
        a.status,
        a.photo,
        a.notes,
        a.created_at,
        s.name as student_name,
        s.roll_number,
        e.title as exam_title
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN exams e ON a.exam_id = e.id
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE (u.id = ? OR t.id IS NULL) AND a.exam_id IS NOT NULL
    `;
    
    const params = [req.user.userId];
    
    if (classId) {
      query += ' AND a.class_id = ?';
      params.push(classId);
    }
    
    if (date) {
      query += ' AND DATE(a.date) = ?';
      params.push(date);
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const records = db.prepare(query).all(...params);
    res.json(records);
  } catch (error) {
    console.error('Exam attendance reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate weekly attendance report (PDF)
app.post('/api/teachers/weekly-report', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate, classId } = req.body;
    
    // Create a simple text-based report for now (PDF generation would require additional dependencies)
    let query = `
      SELECT 
        s.name as student_name,
        s.roll_number,
        s.class,
        s.section,
        c.name as class_name,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(a.id) as total_days,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(a.id), 0)), 1
        ) as attendance_rate
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN classes c ON se.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN attendance a ON s.id = a.student_id 
        AND a.class_id = c.id 
        AND DATE(a.date) BETWEEN ? AND ?
      WHERE (u.id = ? OR t.id IS NULL) AND se.status = 'active'
    `;
    
    const params = [startDate, endDate, req.user.userId];
    
    if (classId && classId !== 'all') {
      query += ' AND c.id = ?';
      params.push(classId);
    }
    
    query += `
      GROUP BY s.id, s.name, s.roll_number, c.name, c.section
      ORDER BY c.name, s.roll_number
    `;
    
    const reportData = db.prepare(query).all(...params);
    
    // Generate CSV content
    let csvContent = 'Student Name,Roll Number,Class,Section,Present Days,Absent Days,Total Days,Attendance Rate\n';
    
    reportData.forEach(row => {
      csvContent += `"${row.student_name}","${row.roll_number}","${row.class_name}","${row.section}",${row.present_count},${row.absent_count},${row.total_days},${row.attendance_rate}%\n`;
    });
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=weekly-attendance-report-${startDate}-to-${endDate}.csv`);
    
    res.send(csvContent);
    
  } catch (error) {
    console.error('Weekly report generation error:', error);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});

module.exports = app;
