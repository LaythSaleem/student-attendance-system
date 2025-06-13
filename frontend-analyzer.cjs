#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🔍 FRONTEND COMPONENT ANALYSIS');
console.log('='.repeat(60));

// Find all React components
function findComponents(dir, components = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      findComponents(fullPath, components);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      components.push(fullPath);
    }
  }
  
  return components;
}

const components = findComponents('./src');
console.log(`📋 FOUND ${components.length} COMPONENTS:`);

const componentsByType = {
  pages: [],
  components: [],
  hooks: [],
  utils: [],
  ui: []
};

components.forEach(comp => {
  const relativePath = comp.replace('./src/', '');
  if (relativePath.includes('pages/')) {
    componentsByType.pages.push(relativePath);
  } else if (relativePath.includes('hooks/')) {
    componentsByType.hooks.push(relativePath);
  } else if (relativePath.includes('ui/')) {
    componentsByType.ui.push(relativePath);
  } else if (relativePath.includes('lib/')) {
    componentsByType.utils.push(relativePath);
  } else {
    componentsByType.components.push(relativePath);
  }
});

// Analyze each component type
Object.entries(componentsByType).forEach(([type, files]) => {
  if (files.length > 0) {
    console.log(`\n📂 ${type.toUpperCase()} (${files.length}):`);
    files.forEach(file => console.log(`  • ${file}`));
  }
});

// Analyze hooks and their functionality
console.log('\n🔗 HOOKS ANALYSIS:');
console.log('-'.repeat(40));

const hookFiles = components.filter(comp => comp.includes('hooks/'));
hookFiles.forEach(hookFile => {
  try {
    const content = fs.readFileSync(hookFile, 'utf8');
    const hookName = path.basename(hookFile, path.extname(hookFile));
    
    console.log(`\n📎 ${hookName}:`);
    
    // Check for key patterns
    const patterns = [
      { name: 'useState', pattern: /useState/g },
      { name: 'useEffect', pattern: /useEffect/g },
      { name: 'useQuery', pattern: /useQuery/g },
      { name: 'useMutation', pattern: /useMutation/g },
      { name: 'API Calls', pattern: /fetch\(|axios\./g },
      { name: 'Error Handling', pattern: /try\s*{|catch\s*\(/g }
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern.pattern);
      const count = matches ? matches.length : 0;
      if (count > 0) {
        console.log(`  ✅ ${pattern.name}: ${count}`);
      }
    });
    
    // Extract exported functions/hooks
    const exports = content.match(/export\s+(function|const|interface|type)\s+(\w+)/g);
    if (exports) {
      console.log(`  📤 Exports: ${exports.map(e => e.split(' ').pop()).join(', ')}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error analyzing ${hookFile}: ${error.message}`);
  }
});

// Analyze component dependencies
console.log('\n📦 COMPONENT DEPENDENCIES:');
console.log('-'.repeat(40));

const allComponents = components.filter(comp => comp.endsWith('.tsx'));
const dependencyMap = {};

allComponents.forEach(comp => {
  try {
    const content = fs.readFileSync(comp, 'utf8');
    const imports = content.match(/import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g);
    
    if (imports) {
      const compName = path.basename(comp, '.tsx');
      dependencyMap[compName] = [];
      
      imports.forEach(imp => {
        const match = imp.match(/from\s+['"`]([^'"`]+)['"`]/);
        if (match) {
          const dep = match[1];
          if (dep.startsWith('@/') || dep.startsWith('./') || dep.startsWith('../')) {
            dependencyMap[compName].push(dep);
          }
        }
      });
    }
  } catch (error) {
    // Skip errors
  }
});

// Show components with most dependencies
const sortedDeps = Object.entries(dependencyMap)
  .sort(([,a], [,b]) => b.length - a.length)
  .slice(0, 10);

console.log('\n🔗 COMPONENTS WITH MOST DEPENDENCIES:');
sortedDeps.forEach(([comp, deps]) => {
  console.log(`  📄 ${comp}: ${deps.length} dependencies`);
  if (deps.length > 0) {
    deps.slice(0, 3).forEach(dep => console.log(`    • ${dep}`));
    if (deps.length > 3) {
      console.log(`    • ... and ${deps.length - 3} more`);
    }
  }
});

// Check for UI consistency
console.log('\n🎨 UI COMPONENT USAGE:');
console.log('-'.repeat(40));

const uiComponents = [
  'Button', 'Card', 'Dialog', 'Input', 'Table', 'Badge', 
  'Alert', 'Select', 'Textarea', 'Checkbox', 'Switch'
];

const uiUsage = {};
allComponents.forEach(comp => {
  try {
    const content = fs.readFileSync(comp, 'utf8');
    uiComponents.forEach(ui => {
      if (content.includes(ui)) {
        if (!uiUsage[ui]) uiUsage[ui] = [];
        uiUsage[ui].push(path.basename(comp, '.tsx'));
      }
    });
  } catch (error) {
    // Skip errors
  }
});

Object.entries(uiUsage)
  .sort(([,a], [,b]) => b.length - a.length)
  .forEach(([ui, comps]) => {
    console.log(`  🎯 ${ui}: Used in ${comps.length} components`);
  });

// Check for error boundaries and loading states
console.log('\n⚡ ERROR HANDLING & LOADING STATES:');
console.log('-'.repeat(40));

const patterns = [
  { name: 'Loading States', pattern: /loading|isLoading|pending/gi },
  { name: 'Error States', pattern: /error|isError|catch/gi },
  { name: 'Try-Catch', pattern: /try\s*{[\s\S]*?catch/g },
  { name: 'Conditional Rendering', pattern: /\?\s*\(/g }
];

patterns.forEach(pattern => {
  let totalCount = 0;
  allComponents.forEach(comp => {
    try {
      const content = fs.readFileSync(comp, 'utf8');
      const matches = content.match(pattern.pattern);
      if (matches) totalCount += matches.length;
    } catch (error) {
      // Skip errors
    }
  });
  console.log(`  📊 ${pattern.name}: ${totalCount} instances across all components`);
});

console.log('\n✅ Frontend analysis complete!');

// Write detailed report
const report = `# Frontend Component Analysis Report
Generated: ${new Date().toISOString()}

## Component Overview
- Total Components: ${components.length}
- Pages: ${componentsByType.pages.length}
- Components: ${componentsByType.components.length}
- Hooks: ${componentsByType.hooks.length}
- UI Components: ${componentsByType.ui.length}
- Utils: ${componentsByType.utils.length}

## Components by Type
${Object.entries(componentsByType).map(([type, files]) => 
  `### ${type.toUpperCase()}\n${files.map(file => `- ${file}`).join('\n')}`
).join('\n\n')}

## UI Component Usage
${Object.entries(uiUsage)
  .sort(([,a], [,b]) => b.length - a.length)
  .map(([ui, comps]) => `- ${ui}: ${comps.length} components`)
  .join('\n')}

## Components with Most Dependencies
${sortedDeps.map(([comp, deps]) => `- ${comp}: ${deps.length} dependencies`).join('\n')}
`;

fs.writeFileSync('frontend-analysis.md', report);
console.log('📄 Report saved to: frontend-analysis.md');
