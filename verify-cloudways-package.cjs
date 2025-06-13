#!/usr/bin/env node

// Cloudways Deployment Package Verification
// Verifies that the deployment package is ready for Cloudways

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Cloudways Deployment Package');
console.log('=' .repeat(50));

const deployDir = './scholar-track-pulse-cloudways';
const zipFile = './scholar-track-pulse-cloudways.zip';

// Check if deployment directory exists
if (!fs.existsSync(deployDir)) {
    console.log('❌ Deployment directory not found');
    console.log('   Run: ./deploy-to-cloudways.sh');
    process.exit(1);
}

console.log('✅ Deployment directory exists');

// Check essential files
const essentialFiles = [
    'index.html',
    'production-server.js',
    'package.json',
    '.env',
    'README.md'
];

let allFilesPresent = true;
essentialFiles.forEach(file => {
    const filePath = path.join(deployDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} - Present`);
    } else {
        console.log(`❌ ${file} - Missing`);
        allFilesPresent = false;
    }
});

// Check directories
const essentialDirs = [
    'assets',
    'uploads',
    'logs'
];

essentialDirs.forEach(dir => {
    const dirPath = path.join(deployDir, dir);
    if (fs.existsSync(dirPath)) {
        console.log(`✅ ${dir}/ - Present`);
    } else {
        console.log(`❌ ${dir}/ - Missing`);
        allFilesPresent = false;
    }
});

// Check zip file
if (fs.existsSync(zipFile)) {
    const stats = fs.statSync(zipFile);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Deployment ZIP - ${sizeInMB} MB`);
} else {
    console.log('❌ Deployment ZIP not found');
    allFilesPresent = false;
}

// Verify package.json
try {
    const packagePath = path.join(deployDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (packageJson.main === 'production-server.js') {
        console.log('✅ Package.json main entry point correct');
    } else {
        console.log('❌ Package.json main entry point incorrect');
        allFilesPresent = false;
    }
    
    if (packageJson.scripts && packageJson.scripts.start) {
        console.log('✅ Start script defined');
    } else {
        console.log('❌ Start script missing');
        allFilesPresent = false;
    }
} catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    allFilesPresent = false;
}

// Check database
const dbPath = path.join(deployDir, 'database.sqlite');
if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    const sizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ Database file - ${sizeInKB} KB`);
} else {
    console.log('⚠️  Database file not found (will be created on first run)');
}

console.log('\n📊 Deployment Package Summary:');

if (allFilesPresent) {
    console.log('✅ All essential files present');
    console.log('✅ Package structure correct');
    console.log('✅ Ready for Cloudways deployment');
    
    console.log('\n🚀 Cloudways Deployment Steps:');
    console.log('1. Login to Cloudways dashboard');
    console.log('2. Create new Node.js application');
    console.log('3. Upload scholar-track-pulse-cloudways.zip');
    console.log('4. Extract files in public_html directory');
    console.log('5. Set Node.js version to 18+');
    console.log('6. Set startup file to: production-server.js');
    console.log('7. Run: npm install --production');
    console.log('8. Start the application');
    
    console.log('\n🌐 Your app will be available at:');
    console.log('   https://your-domain.cloudwaysapps.com');
    console.log('\n🔍 Health check endpoint:');
    console.log('   https://your-domain.cloudwaysapps.com/api/health');
    
} else {
    console.log('❌ Deployment package incomplete');
    console.log('   Please run: ./deploy-to-cloudways.sh');
    process.exit(1);
}

console.log('\n🎉 Scholar Track Pulse is ready for Cloudways deployment!');
