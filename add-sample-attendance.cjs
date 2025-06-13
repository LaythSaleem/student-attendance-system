#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const db = new Database(path.join(__dirname, 'database.sqlite'));

console.log('📝 Adding sample attendance data with photos...');

try {
  // Sample base64 encoded photo (small placeholder image)
  const samplePhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyADIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//Z';

  // Get some existing data
  const students = db.prepare('SELECT * FROM students LIMIT 5').all();
  const classes = db.prepare('SELECT * FROM classes LIMIT 3').all();
  const teachers = db.prepare('SELECT * FROM teachers LIMIT 2').all();
  const topics = db.prepare('SELECT * FROM topics LIMIT 3').all();

  if (students.length === 0 || classes.length === 0 || teachers.length === 0) {
    console.log('❌ No existing data found. Please run add-sample-data.cjs first.');
    process.exit(1);
  }

  // Add sample daily attendance records with photos
  const dailyAttendanceRecords = [];
  const dates = ['2025-06-09', '2025-06-10', '2025-06-11'];
  const statuses = ['present', 'absent', 'late', 'present', 'present'];

  dates.forEach(date => {
    students.forEach((student, index) => {
      const attendanceId = uuidv4();
      const status = statuses[index % statuses.length];
      const classItem = classes[index % classes.length];
      const topic = topics[index % topics.length];
      
      dailyAttendanceRecords.push({
        id: attendanceId,
        student_id: student.id,
        class_id: classItem.id,
        topic_id: topic.id,
        date: date,
        status: status,
        photo: status === 'present' ? samplePhoto : null,
        marked_by: teachers[0].user_id, // Use first teacher's user_id
        notes: status === 'late' ? 'Arrived 10 minutes late' : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
  });

  // Insert daily attendance records
  const insertAttendance = db.prepare(`
    INSERT INTO attendance (
      id, student_id, class_id, topic_id, date, status, photo, marked_by, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((records) => {
    for (const record of records) {
      insertAttendance.run(
        record.id,
        record.student_id, 
        record.class_id,
        record.topic_id,
        record.date,
        record.status,
        record.photo,
        record.marked_by,
        record.notes,
        record.created_at,
        record.updated_at
      );
    }
  });

  insertMany(dailyAttendanceRecords);
  
  console.log(`✅ Added ${dailyAttendanceRecords.length} daily attendance records`);

  // Create some sample exams for exam attendance
  const examTypes = db.prepare('SELECT * FROM exam_types LIMIT 2').all();
  if (examTypes.length > 0) {
    const examId1 = uuidv4();
    const examId2 = uuidv4();
    
    // Create sample exams
    db.prepare(`
      INSERT INTO exams (
        id, exam_type_id, class_id, topic_id, title, description, date, 
        start_time, end_time, duration_minutes, total_marks, pass_marks, 
        status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, datetime('now'), datetime('now'))
    `).run(
      examId1,
      examTypes[0].id,
      classes[0].id,
      topics[0].id,
      'Midterm Assessment',
      'Mid-semester evaluation',
      '2025-06-08',
      '09:00',
      '11:00',
      120,
      100,
      40,
      teachers[0].user_id
    );

    db.prepare(`
      INSERT INTO exams (
        id, exam_type_id, class_id, topic_id, title, description, date, 
        start_time, end_time, duration_minutes, total_marks, pass_marks, 
        status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, datetime('now'), datetime('now'))
    `).run(
      examId2,
      examTypes[1] ? examTypes[1].id : examTypes[0].id,
      classes[1] ? classes[1].id : classes[0].id,
      topics[1] ? topics[1].id : topics[0].id,
      'Practical Examination',
      'Hands-on practical assessment',
      '2025-06-09',
      '14:00',
      '16:00',
      120,
      50,
      25,
      teachers[1] ? teachers[1].user_id : teachers[0].user_id
    );

    console.log('✅ Created 2 sample exams');

    // Add exam attendance records
    const examAttendanceRecords = [];
    [examId1, examId2].forEach((examId, examIndex) => {
      students.slice(0, 3).forEach((student, studentIndex) => {
        const attendanceId = uuidv4();
        const status = ['present', 'absent', 'late'][studentIndex % 3];
        
        examAttendanceRecords.push({
          id: attendanceId,
          exam_id: examId,
          student_id: student.id,
          attendance_status: status,
          arrival_time: status === 'late' ? '09:15' : (status === 'present' ? '09:00' : null),
          notes: status === 'late' ? 'Arrived after exam started' : null,
          marked_by: teachers[examIndex % teachers.length].user_id,
          marked_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
    });

    // Insert exam attendance records
    const insertExamAttendance = db.prepare(`
      INSERT INTO exam_attendance (
        id, exam_id, student_id, attendance_status, arrival_time, notes, marked_by, marked_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertExamMany = db.transaction((records) => {
      for (const record of records) {
        insertExamAttendance.run(
          record.id,
          record.exam_id,
          record.student_id, 
          record.attendance_status,
          record.arrival_time,
          record.notes,
          record.marked_by,
          record.marked_at,
          record.created_at,
          record.updated_at
        );
      }
    });

    insertExamMany(examAttendanceRecords);
    console.log(`✅ Added ${examAttendanceRecords.length} exam attendance records`);
  }

  console.log('\n🎉 Sample attendance data with photos added successfully!');
  console.log('📊 Summary:');
  console.log(`   • ${dailyAttendanceRecords.length} daily attendance records`);
  console.log('   • 2 sample exams with attendance');
  console.log('   • Photo verification for present students');
  console.log('   • Multiple dates and status types');
  console.log('   • Topic-based attendance tracking');
  console.log('\n✅ Ready to test the Attendance Reports system!');

} catch (error) {
  console.error('❌ Error adding sample attendance data:', error);
  process.exit(1);
} finally {
  db.close();
}
