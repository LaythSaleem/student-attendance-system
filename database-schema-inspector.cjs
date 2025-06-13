#!/usr/bin/env node
const Database = require('better-sqlite3');

console.log('🗄️ DATABASE SCHEMA ANALYSIS');
console.log('='.repeat(60));

try {
  const db = new Database('./database.sqlite');

  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

  console.log(`📋 TABLES FOUND: ${tables.length}`);
  tables.forEach(table => console.log(`  • ${table.name}`));

  console.log('\n🔍 TABLE STRUCTURES:');

  tables.forEach(table => {
    console.log(`\n[${table.name.toUpperCase()}]`);
    
    try {
      const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
      columns.forEach(col => {
        const constraints = [];
        if (col.notnull) constraints.push('NOT NULL');
        if (col.pk) constraints.push('PRIMARY KEY');
        if (col.dflt_value) constraints.push(`DEFAULT ${col.dflt_value}`);
        
        console.log(`  ${col.name} - ${col.type} ${constraints.join(' ')}`);
      });
      
      // Get row count
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      console.log(`  📊 Records: ${count.count}`);
      
      // Sample a few records if table has data
      if (count.count > 0 && count.count <= 5) {
        console.log(`  📝 Sample Data:`);
        const sample = db.prepare(`SELECT * FROM ${table.name} LIMIT 3`).all();
        sample.forEach((row, index) => {
          console.log(`    ${index + 1}. ${JSON.stringify(row)}`);
        });
      } else if (count.count > 0) {
        console.log(`  📝 Sample Data:`);
        const sample = db.prepare(`SELECT * FROM ${table.name} LIMIT 2`).all();
        sample.forEach((row, index) => {
          const keys = Object.keys(row);
          const preview = keys.slice(0, 3).map(key => `${key}: ${row[key]}`).join(', ');
          console.log(`    ${index + 1}. ${preview}${keys.length > 3 ? '...' : ''}`);
        });
      }
      
    } catch (error) {
      console.log(`  ❌ Error analyzing table: ${error.message}`);
    }
  });

  // Check for foreign key relationships
  console.log('\n🔗 FOREIGN KEY RELATIONSHIPS:');
  tables.forEach(table => {
    try {
      const fks = db.prepare(`PRAGMA foreign_key_list(${table.name})`).all();
      if (fks.length > 0) {
        console.log(`\n${table.name}:`);
        fks.forEach(fk => {
          console.log(`  ${fk.from} → ${fk.table}.${fk.to}`);
        });
      }
    } catch (error) {
      // Skip foreign key errors
    }
  });

  // Check indexes
  console.log('\n📇 INDEXES:');
  tables.forEach(table => {
    try {
      const indexes = db.prepare(`PRAGMA index_list(${table.name})`).all();
      if (indexes.length > 0) {
        console.log(`\n${table.name}:`);
        indexes.forEach(idx => {
          console.log(`  ${idx.name} (${idx.unique ? 'UNIQUE' : 'NON-UNIQUE'})`);
        });
      }
    } catch (error) {
      // Skip index errors
    }
  });

  db.close();
  console.log('\n✅ Database analysis complete!');
  
} catch (error) {
  console.log(`❌ Database error: ${error.message}`);
}
