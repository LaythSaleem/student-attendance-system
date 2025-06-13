const fs = require('fs');
const Database = require('better-sqlite3');

// Test the students with attendance query directly
const db = new Database('./database.sqlite');

try {
  console.log('🔍 Testing Students with Attendance Query...\n');

  // First, check if we have teachers
  const teachers = db.prepare(`SELECT id, name FROM teachers LIMIT 5`).all();
  console.log('📋 Available Teachers:');
  teachers.forEach(teacher => {
    console.log(`  - ${teacher.id}: ${teacher.name}`);
  });

  if (teachers.length === 0) {
    console.log('❌ No teachers found in database');
    process.exit(1);
  }

  const teacherId = teachers[0].id;
  console.log(`\n🎯 Testing with Teacher ID: ${teacherId}\n`);

  // Test the actual query from the API (fixed version)
  const query = `
    SELECT DISTINCT
      s.id,
      s.name,
      s.roll_number,
      c.name as stage,
      c.section,
      c.name || ' - ' || c.section as class_name,
      COALESCE(att_stats.present_count, 0) as present_count,
      COALESCE(att_stats.late_count, 0) as late_count,
      COALESCE(att_stats.absent_count, 0) as absent_count,
      COALESCE(att_stats.total_sessions, 0) as total_sessions,
      CASE 
        WHEN COALESCE(att_stats.total_sessions, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(att_stats.present_count, 0) + COALESCE(att_stats.late_count, 0)) * 100.0 / att_stats.total_sessions, 2)
      END as attendance_rate,
      latest_photo.photo as latest_photo,
      CASE 
        WHEN COALESCE(att_stats.total_sessions, 0) = 0 THEN 'No Data'
        WHEN ROUND((COALESCE(att_stats.present_count, 0) + COALESCE(att_stats.late_count, 0)) * 100.0 / att_stats.total_sessions, 2) >= 75 THEN 'Good'
        WHEN ROUND((COALESCE(att_stats.present_count, 0) + COALESCE(att_stats.late_count, 0)) * 100.0 / att_stats.total_sessions, 2) >= 50 THEN 'Average'
        ELSE 'Poor'
      END as status,
      e.enrollment_date,
      e.status as enrollment_status
    FROM students s
    INNER JOIN student_enrollments e ON s.id = e.student_id
    INNER JOIN classes c ON e.class_id = c.id
    LEFT JOIN (
      SELECT 
        student_id,
        COUNT(*) as total_sessions,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count
      FROM attendance 
      WHERE date >= date('now', '-30 days')
      GROUP BY student_id
    ) att_stats ON s.id = att_stats.student_id
    LEFT JOIN (
      SELECT DISTINCT
        student_id,
        FIRST_VALUE(photo) OVER (
          PARTITION BY student_id 
          ORDER BY date DESC, created_at DESC
        ) as photo
      FROM attendance 
      WHERE photo IS NOT NULL 
        AND date >= date('now', '-30 days')
    ) latest_photo ON s.id = latest_photo.student_id
    WHERE c.teacher_id = ?
    ORDER BY s.name
    LIMIT 50
  `;

  const students = db.prepare(query).all(teacherId);
  
  console.log(`📊 Query Results (${students.length} students):`);
  
  if (students.length === 0) {
    console.log('❌ No students found for this teacher');
    
    // Check if teacher has classes
    const classes = db.prepare(`SELECT id, name, section FROM classes WHERE teacher_id = ?`).all(teacherId);
    console.log(`\n📚 Teacher's Classes (${classes.length}):`);
    classes.forEach(cls => {
      console.log(`  - ${cls.id}: ${cls.name} - ${cls.section}`);
    });

    if (classes.length > 0) {
      // Check if classes have students
      const enrollments = db.prepare(`
        SELECT e.*, s.name as student_name, c.name as class_name 
        FROM student_enrollments e 
        JOIN students s ON e.student_id = s.id 
        JOIN classes c ON e.class_id = c.id 
        WHERE c.teacher_id = ?
      `).all(teacherId);
      console.log(`\n👥 Student Enrollments (${enrollments.length}):`);
      enrollments.forEach(enr => {
        console.log(`  - ${enr.student_name} in ${enr.class_name}`);
      });
    }
  } else {
    students.forEach((student, index) => {
      console.log(`\n${index + 1}. ${student.name} (${student.roll_number})`);
      console.log(`   Stage: ${student.stage} - ${student.section}`);
      console.log(`   Attendance: ${student.attendance_rate}% (${student.present_count}P/${student.late_count}L/${student.absent_count}A)`);
      console.log(`   Status: ${student.status}`);
      console.log(`   Photo: ${student.latest_photo ? 'Yes' : 'No'}`);
    });
  }

  console.log('\n✅ Test completed successfully!');

} catch (error) {
  console.error('❌ Error testing query:', error);
} finally {
  db.close();
}
