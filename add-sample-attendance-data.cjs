// Add sample attendance data for testing
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found');
  process.exit(1);
}

const db = new Database(dbPath);

async function addSampleAttendanceData() {
  console.log('📊 Adding sample attendance data for testing...\n');

  try {
    // Get some students and classes
    const students = db.prepare(`
      SELECT s.id, s.name, s.roll_number, se.class_id
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      WHERE se.status = 'active'
      LIMIT 10
    `).all();

    console.log(`Found ${students.length} students to add attendance for`);

    if (students.length === 0) {
      console.log('❌ No active student enrollments found');
      return;
    }

    // Create attendance records for the last 30 days
    const today = new Date();
    const attendanceInsert = db.prepare(`
      INSERT INTO attendance (student_id, class_id, date, status, photo, notes, marked_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    let totalRecords = 0;

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      students.forEach((student, index) => {
        // Create varied attendance patterns
        let status;
        let photo = null;
        let notes = '';

        const rand = Math.random();
        
        // Student patterns (some students have better attendance than others)
        if (index % 3 === 0) {
          // Good student (90% present)
          if (rand < 0.9) {
            status = 'present';
            photo = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/sample_photo_${student.id}_${i}`;
          } else if (rand < 0.95) {
            status = 'late';
            photo = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/sample_photo_${student.id}_${i}`;
            notes = 'Arrived 10 minutes late';
          } else {
            status = 'absent';
            notes = 'Sick leave';
          }
        } else if (index % 3 === 1) {
          // Average student (70% present)
          if (rand < 0.7) {
            status = 'present';
            photo = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/sample_photo_${student.id}_${i}`;
          } else if (rand < 0.8) {
            status = 'late';
            photo = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/sample_photo_${student.id}_${i}`;
            notes = 'Traffic delay';
          } else {
            status = 'absent';
            notes = 'Family function';
          }
        } else {
          // Struggling student (40% present)
          if (rand < 0.4) {
            status = 'present';
            photo = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/sample_photo_${student.id}_${i}`;
          } else if (rand < 0.5) {
            status = 'late';
            photo = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/sample_photo_${student.id}_${i}`;
            notes = 'Frequently late';
          } else {
            status = 'absent';
            notes = 'Unexcused absence';
          }
        }

        try {
          attendanceInsert.run(student.id, student.class_id, dateStr, status, photo, notes);
          totalRecords++;
        } catch (err) {
          // Ignore duplicate entries
          if (!err.message.includes('UNIQUE constraint failed')) {
            console.error(`Error adding attendance for ${student.name}:`, err.message);
          }
        }
      });
    }

    console.log(`✅ Added ${totalRecords} attendance records`);

    // Show summary
    const summary = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM attendance WHERE date >= date('now', '-30 days')), 1) as percentage
      FROM attendance 
      WHERE date >= date('now', '-30 days')
      GROUP BY status
      ORDER BY count DESC
    `).all();

    console.log('\n📈 Attendance Summary (Last 30 days):');
    summary.forEach(row => {
      console.log(`  ${row.status.toUpperCase()}: ${row.count} records (${row.percentage}%)`);
    });

    // Show student-wise summary
    console.log('\n👥 Student-wise Attendance Rates:');
    const studentSummary = db.prepare(`
      SELECT 
        s.name,
        s.roll_number,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
        COUNT(*) as total,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END) + 
           COUNT(CASE WHEN a.status = 'late' THEN 1 END)) * 100.0 / COUNT(*), 1
        ) as attendance_rate
      FROM students s
      JOIN attendance a ON s.id = a.student_id
      WHERE a.date >= date('now', '-30 days')
      GROUP BY s.id, s.name, s.roll_number
      ORDER BY attendance_rate DESC
    `).all();

    studentSummary.forEach(student => {
      const status = student.attendance_rate >= 75 ? 'Good' : 
                    student.attendance_rate >= 50 ? 'Average' : 'Poor';
      console.log(`  ${student.name} (${student.roll_number}): ${student.attendance_rate}% - ${status}`);
      console.log(`    Present: ${student.present}, Late: ${student.late}, Absent: ${student.absent}, Total: ${student.total}`);
    });

    console.log('\n🎉 Sample attendance data added successfully!');
    console.log('💡 Now you can test the "My Students" section with real attendance data.');

  } catch (error) {
    console.error('❌ Error adding sample attendance data:', error);
  } finally {
    db.close();
  }
}

addSampleAttendanceData();
