#!/usr/bin/env node

/**
 * Fix Invalid Base64 Image Data in Attendance Records
 * Replaces invalid sample photos with valid base64 image data
 */

const Database = require('better-sqlite3');

async function fixInvalidImageData() {
  console.log('🔧 FIXING INVALID BASE64 IMAGE DATA IN ATTENDANCE RECORDS');
  console.log('='.repeat(60));

  try {
    const db = new Database('./database.sqlite');

    // First, let's see how many records have invalid image data
    const invalidPhotos = db.prepare(`
      SELECT COUNT(*) as count 
      FROM attendance 
      WHERE photo IS NOT NULL AND photo LIKE 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/%'
    `).get();

    console.log(`🔍 Found ${invalidPhotos.count} records with invalid base64 image data`);

    if (invalidPhotos.count === 0) {
      console.log('✅ No invalid image data found. All records are clean.');
      return;
    }

    // Generate a simple valid base64 encoded image (1x1 pixel transparent PNG)
    const validBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    // Alternative: A simple 10x10 red square JPEG
    const redSquareBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAKAAoDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDX4AAAA=';

    // Update all invalid photo records
    const updateResult = db.prepare(`
      UPDATE attendance 
      SET photo = ?
      WHERE photo IS NOT NULL AND photo LIKE 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/%'
    `).run(redSquareBase64);

    console.log(`✅ Updated ${updateResult.changes} attendance records with valid image data`);

    // Generate valid base64 for sample students using a gradient pattern
    const studentPhotos = {
      // Different colored squares for different students
      'gradient_blue': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABbSURBVBiVY/z//z8DJYCJgUIwqrBQFf7//58oRf///2+gSiEjI+M/cgU4Cv7//08wCxgYGBj+//+PVyF2hSNVIVqF2BSOVIXYFf7//58gBf///8etEBuAqhAAbM4eDwmKKzIAAAAASUVORK5CYII=',
      'gradient_green': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABbSURBVBiVY2RgYPjPQAFgYmCgEIwqpFjh////8SpkZGT8j1UhI+P//1gVMjL+/49TISPj//9YFf7//58gBQwMDAz///8nqJCRkfE/QYX///9Hq5CR8f9/rAoBoUEeDwmyTiEAAAAASUVORK5CYII=',
      'gradient_red': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABbSURBVBiVY/wPBQwMDJQAJgZKwKhCihX+//+fIAUMDAz///8nqJCR8f9/tAoZGf//x6qQkfH/f6wKGRn//8epkJHx/3+sCv///09QISMj438CCv///49VISDEhzweDwl7TiEAAAAASUVORK5CYII='
    };

    // Update records with different photo patterns for variety
    const updatePatterned = db.prepare(`
      UPDATE attendance 
      SET photo = 
        CASE 
          WHEN SUBSTR(student_id, -1, 1) IN ('0', '1', '2') THEN ?
          WHEN SUBSTR(student_id, -1, 1) IN ('3', '4', '5') THEN ?
          ELSE ?
        END
      WHERE photo = ? AND status = 'present'
    `);

    updatePatterned.run(
      studentPhotos.gradient_blue,
      studentPhotos.gradient_green, 
      studentPhotos.gradient_red,
      redSquareBase64
    );

    console.log('🎨 Applied different photo patterns based on student IDs');

    // Verify the fix
    const verifyResult = db.prepare(`
      SELECT COUNT(*) as count 
      FROM attendance 
      WHERE photo IS NOT NULL AND photo LIKE 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/%'
    `).get();

    if (verifyResult.count === 0) {
      console.log('✅ All invalid base64 image data has been fixed successfully!');
    } else {
      console.log(`⚠️  ${verifyResult.count} records still have invalid image data`);
    }

    // Show summary of current photo data
    const photoSummary = db.prepare(`
      SELECT 
        status,
        COUNT(*) as total_records,
        COUNT(photo) as records_with_photos,
        ROUND(COUNT(photo) * 100.0 / COUNT(*), 1) as photo_percentage
      FROM attendance 
      GROUP BY status
      ORDER BY status
    `).all();

    console.log('\n📊 Attendance Photo Data Summary:');
    photoSummary.forEach(row => {
      console.log(`   ${row.status.toUpperCase()}: ${row.records_with_photos}/${row.total_records} records have photos (${row.photo_percentage}%)`);
    });

    db.close();

    console.log('\n🎉 Base64 image data fix completed successfully!');
    console.log('🌐 You can now test the application without image decoding errors');

  } catch (error) {
    console.error('❌ Error fixing image data:', error);
    process.exit(1);
  }
}

// Run the fix
fixInvalidImageData();
