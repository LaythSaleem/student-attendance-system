// Simple test script to verify application components
const fs = require('fs');
const path = require('path');

console.log('🔍 Scholar Track Pulse - Component Verification');
console.log('==============================================');

// Check if essential files exist
const files = [
    'server.cjs',
    'package.json', 
    'database.sqlite',
    'src/pages/AdminDashboard.tsx',
    'src/components/SystemSettingsPage.tsx'
];

console.log('\n📁 Checking essential files...');
files.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
    }
});

// Check package.json scripts
console.log('\n📜 Available npm scripts:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
Object.entries(packageJson.scripts).forEach(([name, script]) => {
    console.log(`   ${name}: ${script}`);
});

console.log('\n🚀 To start the application:');
console.log('1. Backend: npm run dev:server');
console.log('2. Frontend: npm run dev');
console.log('3. Both: npm run dev:full');
console.log('\n🌐 URLs:');
console.log('   Frontend: http://localhost:8080');
console.log('   Backend:  http://localhost:3001');
