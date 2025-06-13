#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

console.log('🔄 Updating attendance table to support photo attendance...');

try {
  // Add photo column to attendance table if it doesn't exist
  try {
    db.prepare('ALTER TABLE attendance ADD COLUMN photo TEXT').run();
    console.log('✅ Added photo column to attendance table');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✅ Photo column already exists in attendance table');
    } else {
      throw error;
    }
  }

  // Add topic_id column to attendance table if it doesn't exist for topic-based filtering
  try {
    db.prepare('ALTER TABLE attendance ADD COLUMN topic_id TEXT REFERENCES topics(id)').run();
    console.log('✅ Added topic_id column to attendance table');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✅ Topic_id column already exists in attendance table');
    } else {
      throw error;
    }
  }

  console.log('\n🎉 Database update completed successfully!');
  console.log('📋 Attendance table now supports:');
  console.log('   • Photo storage for visual verification');
  console.log('   • Topic-based attendance tracking');
  console.log('   • Enhanced reporting capabilities');

} catch (error) {
  console.error('❌ Error updating database:', error);
  process.exit(1);
} finally {
  db.close();
}
