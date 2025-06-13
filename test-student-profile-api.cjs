const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🧪 Testing Student Profile API Query...');

try {
  // Test the main student query from the API
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
      sp.admission_date as admissionDate
    FROM students s 
    LEFT JOIN users u ON s.user_id = u.id 
    LEFT JOIN student_profiles sp ON s.id = sp.student_id
    WHERE s.id = ?
  `).get('student_1');

  console.log('✅ Student data:', JSON.stringify(student, null, 2));

  // Test attendance stats
  const attendanceStats = db.prepare(`
    SELECT 
      COUNT(*) as totalDays,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentDays,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absentDays,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as lateDays,
      SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excusedDays
    FROM attendance 
    WHERE student_id = ?
  `).get('student_1');

  console.log('✅ Attendance stats:', attendanceStats);

  // Test monthly attendance
  const monthlyAttendance = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      COUNT(*) as totalDays,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentDays,
      ROUND(
        (SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 
        2
      ) as attendancePercentage
    FROM attendance 
    WHERE student_id = ?
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month DESC
    LIMIT 12
  `).all('student_1');

  console.log('✅ Monthly attendance:', monthlyAttendance);

  // Test enrollments
  const enrollments = db.prepare(`
    SELECT 
      se.id,
      se.enrollment_date as enrollmentDate,
      se.status as enrollmentStatus,
      c.id as classId,
      c.name as className,
      c.section as classSection,
      t.name as teacherName,
      GROUP_CONCAT(s.name, ', ') as subjects
    FROM student_enrollments se
    JOIN classes c ON se.class_id = c.id
    LEFT JOIN teachers t ON c.teacher_id = t.id
    LEFT JOIN class_subjects cs ON c.id = cs.class_id
    LEFT JOIN subjects s ON cs.subject_id = s.id
    WHERE se.student_id = ?
    GROUP BY se.id, c.id
    ORDER BY se.enrollment_date DESC
  `).all('student_1');

  console.log('✅ Enrollments:', enrollments);

} catch (error) {
  console.error('❌ Error testing queries:', error);
}

db.close();
