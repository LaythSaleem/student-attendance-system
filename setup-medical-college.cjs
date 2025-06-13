// Medical College Data - 6 Stages + Graduation
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Medical College Stages and Topics Data
const medicalCollegeData = {
  // Academic Year for Medical College
  academicYear: {
    id: 'medical_2024_2025',
    name: '2024-2025 Medical Academic Year',
    start_date: '2024-09-01',
    end_date: '2025-06-30',
    is_current: true
  },

  // Medical College Stages (Classes)
  stages: [
    {
      id: 'stage_1',
      name: 'Stage 1',
      section: 'First Year',
      description: 'Foundation of Medical Sciences',
      topics: [
        'Human Anatomy',
        'Human Physiology', 
        'Medical Biochemistry',
        'Medical Histology',
        'Medical Ethics',
        'Communication Skills',
        'Introduction to Clinical Medicine',
        'Basic Life Support (BLS)'
      ]
    },
    {
      id: 'stage_2', 
      name: 'Stage 2',
      section: 'Second Year',
      description: 'Basic Medical Sciences',
      topics: [
        'Pathology',
        'Pharmacology',
        'Microbiology',
        'Immunology',
        'Medical Genetics',
        'Epidemiology',
        'Biostatistics',
        'Research Methodology'
      ]
    },
    {
      id: 'stage_3',
      name: 'Stage 3', 
      section: 'Third Year',
      description: 'Clinical Foundation',
      topics: [
        'Internal Medicine',
        'Surgery',
        'Pediatrics',
        'Obstetrics & Gynecology',
        'Psychiatry',
        'Dermatology',
        'Ophthalmology',
        'ENT (Otolaryngology)'
      ]
    },
    {
      id: 'stage_4',
      name: 'Stage 4',
      section: 'Fourth Year', 
      description: 'Advanced Clinical Practice',
      topics: [
        'Advanced Internal Medicine',
        'Advanced Surgery',
        'Emergency Medicine',
        'Radiology',
        'Anesthesiology',
        'Orthopedics',
        'Neurology',
        'Cardiology'
      ]
    },
    {
      id: 'stage_5',
      name: 'Stage 5',
      section: 'Fifth Year',
      description: 'Specialized Clinical Training',
      topics: [
        'Clinical Rotations',
        'Intensive Care Medicine',
        'Oncology',
        'Endocrinology',
        'Nephrology',
        'Gastroenterology',
        'Pulmonology',
        'Infectious Diseases'
      ]
    },
    {
      id: 'stage_6',
      name: 'Stage 6',
      section: 'Sixth Year',
      description: 'Pre-Graduation Clinical Experience',
      topics: [
        'Advanced Clinical Rotations',
        'Medical Research Project',
        'Community Medicine',
        'Medical Administration',
        'Quality Assurance',
        'Patient Safety',
        'Medical Jurisprudence',
        'Preparation for Medical Licensing'
      ]
    },
    {
      id: 'graduation',
      name: 'Graduation',
      section: 'Final Year',
      description: 'Medical Degree Completion',
      topics: [
        'Comprehensive Medical Examination',
        'Clinical Skills Assessment', 
        'Medical Thesis Defense',
        'Professional Ethics Review',
        'Medical License Preparation',
        'Residency Application Process',
        'Career Planning',
        'Medical Oath Ceremony'
      ]
    }
  ]
};

function setupMedicalCollegeSystem() {
  console.log('🏥 Setting up Medical College System...');
  console.log('===================================\n');

  try {
    // Start transaction
    db.exec('BEGIN TRANSACTION');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    db.exec('DELETE FROM topics');
    db.exec('DELETE FROM student_enrollments');
    db.exec('DELETE FROM classes');
    // Don't delete existing academic years, just add our medical one

    // Insert Academic Year
    console.log('📅 Creating medical academic year...');
    const { academicYear } = medicalCollegeData;
    
    db.prepare(`
      INSERT OR REPLACE INTO academic_years (id, name, start_date, end_date, is_current)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      academicYear.id,
      academicYear.name, 
      academicYear.start_date,
      academicYear.end_date,
      academicYear.is_current ? 1 : 0
    );

    // Get a teacher for assignment (or create default)
    let teacherId = db.prepare('SELECT id FROM teachers LIMIT 1').get()?.id;
    if (!teacherId) {
      console.log('👨‍🏫 Creating default medical professor...');
      teacherId = uuidv4();
      
      // Create teacher user
      const teacherUserId = uuidv4();
      db.prepare(`
        INSERT INTO users (id, email, password_hash)
        VALUES (?, ?, ?)
      `).run(teacherUserId, 'professor@medical.edu', '$2a$10$hashedpassword');
      
      db.prepare(`
        INSERT INTO user_roles (id, user_id, role)
        VALUES (?, ?, ?)
      `).run(uuidv4(), teacherUserId, 'teacher');
      
      db.prepare(`
        INSERT INTO teachers (id, user_id, name, subject, department)
        VALUES (?, ?, ?, ?, ?)
      `).run(teacherId, teacherUserId, 'Dr. Medical Professor', 'Medicine', 'Medical Sciences');
    }

    // Insert Medical Stages (Classes) and Topics
    console.log('🏥 Creating medical college stages...');
    
    const { stages } = medicalCollegeData;
    
    stages.forEach((stage, index) => {
      console.log(`   📚 Creating ${stage.name} - ${stage.section}...`);
      
      // Insert Stage (Class)
      db.prepare(`
        INSERT INTO classes (id, name, section, description, teacher_id, academic_year_id, capacity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        stage.id,
        stage.name,
        stage.section, 
        stage.description,
        teacherId,
        academicYear.id,
        50 // Default capacity for medical college
      );

      // Insert Topics for this Stage
      stage.topics.forEach((topicName, topicIndex) => {
        const topicId = `${stage.id}_topic_${topicIndex + 1}`;
        
        // Determine topic status based on stage
        let status = 'planned';
        if (index < 2) status = 'completed'; // First 2 stages completed
        else if (index < 4) status = 'in_progress'; // Next 2 stages in progress
        // Last stages remain planned
        
        db.prepare(`
          INSERT INTO topics (id, name, description, class_id, order_index, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          topicId,
          topicName,
          `${topicName} - ${stage.name} curriculum`,
          stage.id,
          topicIndex + 1,
          status
        );
      });

      console.log(`   ✅ ${stage.name}: ${stage.topics.length} topics created`);
    });

    // Commit transaction
    db.exec('COMMIT');

    // Generate summary
    console.log('\n🎉 Medical College System Setup Complete!');
    console.log('==========================================');
    
    const summary = {
      stages: stages.length,
      totalTopics: stages.reduce((sum, stage) => sum + stage.topics.length, 0),
      academicYear: academicYear.name
    };
    
    console.log(`📊 Summary:`);
    console.log(`   • ${summary.stages} Medical Stages Created`);
    console.log(`   • ${summary.totalTopics} Total Topics Created`);
    console.log(`   • Academic Year: ${summary.academicYear}`);
    console.log(`   • Assigned Professor: Dr. Medical Professor`);
    
    console.log('\n📋 Medical Stages Created:');
    stages.forEach((stage, index) => {
      console.log(`   ${index + 1}. ${stage.name} - ${stage.section} (${stage.topics.length} topics)`);
    });

    console.log('\n🌐 Access the system at: http://localhost:8080');
    console.log('🔑 Login as admin: admin@school.com / admin123');

  } catch (error) {
    db.exec('ROLLBACK');
    console.error('❌ Error setting up medical college system:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run the setup
if (require.main === module) {
  setupMedicalCollegeSystem();
}

module.exports = { setupMedicalCollegeSystem, medicalCollegeData };
