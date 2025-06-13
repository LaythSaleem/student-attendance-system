#!/usr/bin/env node

// TypeScript Configuration Verification Script
// Verifies that the recommended TypeScript compiler options have been applied

const fs = require('fs');
const path = require('path');

console.log('🔧 Verifying TypeScript Configuration Improvements');
console.log('=' .repeat(55));

const configFiles = [
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json'
];

let allConfigsValid = true;

configFiles.forEach(configFile => {
    const configPath = path.join(__dirname, configFile);
    
    console.log(`\n📄 Checking ${configFile}:`);
    
    try {
        const content = fs.readFileSync(configPath, 'utf8');
        
        // Check for specific configurations using string matching
        // This is more reliable than parsing JSONC
        
        if (content.includes('"strict": true')) {
            console.log('  ✅ strict: enabled');
        } else {
            console.log('  ❌ strict: not enabled');
            allConfigsValid = false;
        }
        
        if (content.includes('"forceConsistentCasingInFileNames": true')) {
            console.log('  ✅ forceConsistentCasingInFileNames: enabled');
        } else {
            console.log('  ❌ forceConsistentCasingInFileNames: not enabled');
            allConfigsValid = false;
        }
        
        // Check for other important options
        const importantOptions = [
            '"noUnusedLocals": true',
            '"noUnusedParameters": true',
            '"noFallthroughCasesInSwitch": true'
        ];
        
        importantOptions.forEach(option => {
            const optionName = option.match(/"([^"]+)":/)[1];
            if (content.includes(option)) {
                console.log(`  ✅ ${optionName}: enabled`);
            } else {
                console.log(`  ⚠️  ${optionName}: not enabled`);
            }
        });
        
        // Special check for tsconfig.node.json - verify valid lib configuration
        if (configFile === 'tsconfig.node.json') {
            if (content.includes('"lib": ["ES2022"]')) {
                console.log('  ✅ lib: valid ES2022 (fixed from invalid ES2023)');
            } else if (content.includes('"lib": ["ES2023"]')) {
                console.log('  ❌ lib: invalid ES2023 found');
                allConfigsValid = false;
            } else {
                console.log('  ⚠️  lib: configuration not found');
            }
        }
        
    } catch (error) {
        console.log(`  ❌ Error reading ${configFile}: ${error.message}`);
        allConfigsValid = false;
    }
});

console.log('\n📊 Summary:');
if (allConfigsValid) {
    console.log('✅ All TypeScript configuration improvements have been applied successfully!');
    console.log('📈 Benefits:');
    console.log('  • Stricter type checking reduces potential runtime errors');
    console.log('  • Consistent file name casing prevents cross-platform issues');
    console.log('  • Enhanced linting catches more potential issues during development');
} else {
    console.log('❌ Some TypeScript configuration issues were found');
    process.exit(1);
}

console.log('\n🚀 TypeScript configuration is now optimized for better development experience!');
