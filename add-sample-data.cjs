const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

// Get teacher ID
const teacher = db.prepare(`
  SELECT t.id FROM teachers t 
  JOIN users u ON t.user_id = u.id 
  WHERE u.email = ?
`).get('teacher@school.com');

if (!teacher) {
  console.error('Teacher user not found. Please run init-db.cjs first.');
  process.exit(1);
}

const teacherId = teacher.id;

console.log('Adding sample data...');

// Add academic year
const currentYear = new Date().getFullYear();
const academicYearInsert = db.prepare(`
  INSERT OR IGNORE INTO academic_years (name, start_date, end_date, is_current)
  VALUES (?, ?, ?, ?)
`);

academicYearInsert.run(
  `${currentYear}-${currentYear + 1}`,
  `${currentYear}-08-01`,
  `${currentYear + 1}-06-30`,
  1
);

// Add subjects
const subjects = [
  { name: 'Mathematics', code: 'MATH101' },
  { name: 'English Literature', code: 'ENG101' },
  { name: 'Computer Science', code: 'CS101' },
  { name: 'Physics', code: 'PHY101' },
  { name: 'Chemistry', code: 'CHEM101' }
];

const insertSubject = db.prepare(`
  INSERT OR IGNORE INTO subjects (id, name, code, description)
  VALUES (?, ?, ?, ?)
`);

subjects.forEach((subject, index) => {
  const subjectId = `subject_${index + 1}`;
  insertSubject.run(subjectId, subject.name, subject.code, `${subject.name} course`);
});

// Add classes
const classes = [
  { name: 'Grade 10', section: 'A' },
  { name: 'Grade 10', section: 'B' },
  { name: 'Grade 11', section: 'A' },
  { name: 'Advanced CS', section: 'CS' }
];

const insertClass = db.prepare(`
  INSERT OR IGNORE INTO classes (id, name, section, teacher_id, academic_year_id)
  VALUES (?, ?, ?, ?, ?)
`);

// Get academic year ID
const academicYearRow = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get();
const academicYearId = academicYearRow ? academicYearRow.id : 1;

classes.forEach((cls, index) => {
  const classId = `class_${index + 1}`;
  insertClass.run(classId, cls.name, cls.section, teacherId, academicYearId);
});

// Add students
const students = [
  // Grade 10A students
  { firstName: 'John', lastName: 'Doe', rollNumber: '10A001', email: 'john.doe@student.school.com', classId: 'class_1' },
  { firstName: 'Jane', lastName: 'Smith', rollNumber: '10A002', email: 'jane.smith@student.school.com', classId: 'class_1' },
  { firstName: 'Mike', lastName: 'Johnson', rollNumber: '10A003', email: 'mike.johnson@student.school.com', classId: 'class_1' },
  { firstName: 'Sarah', lastName: 'Williams', rollNumber: '10A004', email: 'sarah.williams@student.school.com', classId: 'class_1' },
  { firstName: 'David', lastName: 'Brown', rollNumber: '10A005', email: 'david.brown@student.school.com', classId: 'class_1' },
  
  // Grade 10B students
  { firstName: 'Emily', lastName: 'Davis', rollNumber: '10B001', email: 'emily.davis@student.school.com', classId: 'class_2' },
  { firstName: 'Chris', lastName: 'Miller', rollNumber: '10B002', email: 'chris.miller@student.school.com', classId: 'class_2' },
  { firstName: 'Lisa', lastName: 'Wilson', rollNumber: '10B003', email: 'lisa.wilson@student.school.com', classId: 'class_2' },
  { firstName: 'Tom', lastName: 'Moore', rollNumber: '10B004', email: 'tom.moore@student.school.com', classId: 'class_2' },
  { firstName: 'Anna', lastName: 'Taylor', rollNumber: '10B005', email: 'anna.taylor@student.school.com', classId: 'class_2' },
  
  // Grade 11A students
  { firstName: 'Alex', lastName: 'Anderson', rollNumber: '11A001', email: 'alex.anderson@student.school.com', classId: 'class_3' },
  { firstName: 'Maria', lastName: 'Thomas', rollNumber: '11A002', email: 'maria.thomas@student.school.com', classId: 'class_3' },
  { firstName: 'Ryan', lastName: 'Jackson', rollNumber: '11A003', email: 'ryan.jackson@student.school.com', classId: 'class_3' },
  { firstName: 'Sophie', lastName: 'White', rollNumber: '11A004', email: 'sophie.white@student.school.com', classId: 'class_3' },
  
  // Advanced CS students
  { firstName: 'Kevin', lastName: 'Harris', rollNumber: 'CS001', email: 'kevin.harris@student.school.com', classId: 'class_4' },
  { firstName: 'Rachel', lastName: 'Martin', rollNumber: 'CS002', email: 'rachel.martin@student.school.com', classId: 'class_4' },
  { firstName: 'James', lastName: 'Garcia', rollNumber: 'CS003', email: 'james.garcia@student.school.com', classId: 'class_4' }
];

// Create student users, profiles, and enrollments
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, email, password_hash)
  VALUES (?, ?, ?)
`);

const insertStudent = db.prepare(`
  INSERT OR IGNORE INTO students (id, user_id, name, roll_number, class, section, parent_phone, address)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertStudentProfile = db.prepare(`
  INSERT OR IGNORE INTO student_profiles (
    id, student_id, date_of_birth, whatsapp_number, profile_picture, 
    status, parent_name, emergency_contact, blood_group, medical_conditions, admission_date
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertEnrollment = db.prepare(`
  INSERT OR IGNORE INTO student_enrollments (id, student_id, class_id, enrollment_date)
  VALUES (?, ?, ?, ?)
`);

students.forEach((student, index) => {
  const studentId = `student_${index + 1}`;
  const userId = `user_${studentId}`;
  const profileId = `profile_${studentId}`;
  
  // Create user account
  insertUser.run(userId, student.email, '$2b$10$example_hash');
  
  // Determine class name and section based on classId
  let className, section;
  switch (student.classId) {
    case 'class_1':
      className = 'Grade 10';
      section = 'A';
      break;
    case 'class_2':
      className = 'Grade 10';
      section = 'B';
      break;
    case 'class_3':
      className = 'Grade 11';
      section = 'A';
      break;
    case 'class_4':
      className = 'Advanced CS';
      section = 'CS';
      break;
    default:
      className = 'Unknown';
      section = 'X';
  }
  
  // Create student profile
  insertStudent.run(
    studentId,
    userId,
    `${student.firstName} ${student.lastName}`,
    student.rollNumber,
    className,
    section,
    '+1234567890',
    '123 Student St, City, State'
  );

  // Create extended student profile
  insertStudentProfile.run(
    profileId,
    studentId,
    '2008-01-15', // Default birth date
    '+1234567890', // WhatsApp number
    '', // Profile picture (empty for now)
    'active', // Status
    'Parent Name', // Parent name
    '+1234567899', // Emergency contact
    'A+', // Blood group
    '', // Medical conditions
    '2023-04-01' // Admission date
  );
  
  // Create enrollment
  insertEnrollment.run(`enrollment_${index + 1}`, studentId, student.classId, new Date().toISOString().split('T')[0]);
});

// Assign subjects to classes
const subjectIds = db.prepare('SELECT id, name FROM subjects').all();
const insertClassSubject = db.prepare(`
  INSERT OR IGNORE INTO class_subjects (class_id, subject_id, teacher_id)
  VALUES (?, ?, ?)
`);

// Assign subjects to classes
['class_1', 'class_2', 'class_3', 'class_4'].forEach(classId => {
  // Math to all classes
  const mathSubject = subjectIds.find(s => s.name === 'Mathematics');
  if (mathSubject) {
    insertClassSubject.run(classId, mathSubject.id, teacherId);
  }
  
  // English to all classes
  const engSubject = subjectIds.find(s => s.name === 'English Literature');
  if (engSubject) {
    insertClassSubject.run(classId, engSubject.id, teacherId);
  }
  
  // CS only to advanced class
  if (classId === 'class_4') {
    const csSubject = subjectIds.find(s => s.name === 'Computer Science');
    if (csSubject) {
      insertClassSubject.run(classId, csSubject.id, teacherId);
    }
    
    const physicsSubject = subjectIds.find(s => s.name === 'Physics');
    if (physicsSubject) {
      insertClassSubject.run(classId, physicsSubject.id, teacherId);
    }
  }
});

// Add sample topics for classes
console.log('Adding sample topics...');

const mathSubjectId = subjectIds.find(s => s.name === 'Mathematics')?.id;
const engSubjectId = subjectIds.find(s => s.name === 'English Literature')?.id;
const csSubjectId = subjectIds.find(s => s.name === 'Computer Science')?.id;
const physSubjectId = subjectIds.find(s => s.name === 'Physics')?.id;

const topics = [
  // Grade 10A Mathematics topics
  { name: 'Algebraic Expressions', description: 'Introduction to algebraic expressions and basic operations', class_id: 'class_1', subject_id: mathSubjectId, order_index: 1, status: 'completed' },
  { name: 'Linear Equations', description: 'Solving linear equations in one and two variables', class_id: 'class_1', subject_id: mathSubjectId, order_index: 2, status: 'completed' },
  { name: 'Quadratic Equations', description: 'Understanding and solving quadratic equations', class_id: 'class_1', subject_id: mathSubjectId, order_index: 3, status: 'in_progress' },
  { name: 'Geometry Basics', description: 'Fundamental geometric concepts and theorems', class_id: 'class_1', subject_id: mathSubjectId, order_index: 4, status: 'planned' },
  
  // Grade 10A English topics
  { name: 'Shakespeare Introduction', description: 'Introduction to William Shakespeare and his works', class_id: 'class_1', subject_id: engSubjectId, order_index: 1, status: 'completed' },
  { name: 'Poetry Analysis', description: 'Analyzing poetic devices and themes in modern poetry', class_id: 'class_1', subject_id: engSubjectId, order_index: 2, status: 'in_progress' },
  { name: 'Essay Writing', description: 'Developing essay writing skills and techniques', class_id: 'class_1', subject_id: engSubjectId, order_index: 3, status: 'planned' },
  
  // Grade 10B Mathematics topics
  { name: 'Number Systems', description: 'Understanding different number systems and their properties', class_id: 'class_2', subject_id: mathSubjectId, order_index: 1, status: 'completed' },
  { name: 'Probability', description: 'Introduction to probability and statistics', class_id: 'class_2', subject_id: mathSubjectId, order_index: 2, status: 'in_progress' },
  { name: 'Trigonometry', description: 'Basic trigonometric functions and identities', class_id: 'class_2', subject_id: mathSubjectId, order_index: 3, status: 'planned' },
  
  // Grade 11A topics
  { name: 'Calculus Introduction', description: 'Basic concepts of differential calculus', class_id: 'class_3', subject_id: mathSubjectId, order_index: 1, status: 'completed' },
  { name: 'Advanced Literature', description: 'Analysis of classical and modern literature', class_id: 'class_3', subject_id: engSubjectId, order_index: 1, status: 'in_progress' },
  
  // Advanced CS class topics
  { name: 'Object-Oriented Programming', description: 'Advanced OOP concepts and design patterns', class_id: 'class_4', subject_id: csSubjectId, order_index: 1, status: 'completed' },
  { name: 'Database Design', description: 'Relational database design and SQL', class_id: 'class_4', subject_id: csSubjectId, order_index: 2, status: 'in_progress' },
  { name: 'Web Development', description: 'Modern web development frameworks and practices', class_id: 'class_4', subject_id: csSubjectId, order_index: 3, status: 'planned' },
  
  // Physics topics for advanced class
  { name: 'Quantum Mechanics Intro', description: 'Basic principles of quantum mechanics', class_id: 'class_4', subject_id: physSubjectId, order_index: 1, status: 'completed' },
  { name: 'Thermodynamics', description: 'Laws of thermodynamics and applications', class_id: 'class_4', subject_id: physSubjectId, order_index: 2, status: 'planned' }
];

const insertTopic = db.prepare(`
  INSERT OR IGNORE INTO topics (id, name, description, class_id, subject_id, order_index, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

topics.forEach((topic, index) => {
  if (topic.subject_id) {
    const topicId = `topic_${index + 1}`;
    
    try {
      insertTopic.run(
        topicId, 
        topic.name, 
        topic.description, 
        topic.class_id, 
        topic.subject_id, 
        topic.order_index, 
        topic.status
      );
      console.log(`✓ Added topic: ${topic.name} for class ${topic.class_id}`);
    } catch (error) {
      console.error(`✗ Failed to insert topic ${topic.name}:`, error.message);
    }
  } else {
    console.log(`⚠ Skipping topic ${topic.name} - subject not found`);
  }
});

console.log('\n=== Sample Data Summary ===');
console.log(`✓ Added ${subjects.length} subjects`);
console.log(`✓ Added ${classes.length} classes`);
console.log(`✓ Added ${students.length} students`);
console.log(`✓ Added ${topics.filter(t => t.subject_id).length} topics`);
console.log('✓ All classes assigned to teacher@school.com');
console.log('✓ Sample data insertion complete!');

db.close();
