#!/usr/bin/env node
const fs = require('fs');

console.log('🔍 BACKEND SERVER CODE ANALYSIS');
console.log('='.repeat(60));

try {
  const serverCode = fs.readFileSync('./server.cjs', 'utf8');
  
  // Extract all API routes
  const routePatterns = [
    /app\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g
  ];
  
  const endpoints = new Set();
  
  routePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(serverCode)) !== null) {
      const method = match[1].toUpperCase();
      const path = match[2];
      endpoints.add(`${method} ${path}`);
    }
  });
  
  // Sort endpoints by category
  const endpointsByCategory = {};
  Array.from(endpoints).sort().forEach(endpoint => {
    const [method, path] = endpoint.split(' ');
    const category = path.split('/')[2] || 'root'; // Get first part after /api/
    
    if (!endpointsByCategory[category]) {
      endpointsByCategory[category] = [];
    }
    endpointsByCategory[category].push(`${method} ${path}`);
  });
  
  console.log('📋 IMPLEMENTED API ENDPOINTS:');
  console.log('-'.repeat(40));
  
  let totalEndpoints = 0;
  Object.entries(endpointsByCategory).forEach(([category, routes]) => {
    console.log(`\n📂 ${category.toUpperCase()}:`);
    routes.forEach(route => {
      console.log(`  ✅ ${route}`);
      totalEndpoints++;
    });
  });
  
  console.log(`\n📊 Total Endpoints: ${totalEndpoints}`);
  
  // Check for middleware and authentication
  console.log('\n🔒 SECURITY ANALYSIS:');
  console.log('-'.repeat(40));
  
  const securityFeatures = [
    { name: 'JWT Authentication', pattern: /jwt|token/gi },
    { name: 'CORS Configuration', pattern: /cors/gi },
    { name: 'Body Parsing', pattern: /express\.json|bodyParser/gi },
    { name: 'Error Handling', pattern: /try\s*{|catch\s*\(/gi },
    { name: 'Input Validation', pattern: /validation|validate|sanitize/gi },
    { name: 'Password Hashing', pattern: /bcrypt|hash/gi }
  ];
  
  securityFeatures.forEach(feature => {
    const matches = serverCode.match(feature.pattern);
    const count = matches ? matches.length : 0;
    const status = count > 0 ? '✅' : '❌';
    console.log(`${status} ${feature.name}: ${count} instances`);
  });
  
  // Check database operations
  console.log('\n💾 DATABASE OPERATIONS:');
  console.log('-'.repeat(40));
  
  const dbOperations = [
    { name: 'SELECT Queries', pattern: /SELECT/gi },
    { name: 'INSERT Queries', pattern: /INSERT/gi },
    { name: 'UPDATE Queries', pattern: /UPDATE/gi },
    { name: 'DELETE Queries', pattern: /DELETE/gi },
    { name: 'Prepared Statements', pattern: /\.prepare\(/gi },
    { name: 'Transactions', pattern: /transaction|BEGIN|COMMIT/gi }
  ];
  
  dbOperations.forEach(operation => {
    const matches = serverCode.match(operation.pattern);
    const count = matches ? matches.length : 0;
    console.log(`📊 ${operation.name}: ${count} instances`);
  });
  
  // Check for error handling patterns
  console.log('\n⚠️  ERROR HANDLING:');
  console.log('-'.repeat(40));
  
  const errorPatterns = [
    { name: 'Try-Catch Blocks', pattern: /try\s*{[\s\S]*?catch\s*\(/g },
    { name: 'Error Responses', pattern: /res\.(status\(4\d\d\)|status\(5\d\d\))/g },
    { name: 'Console Errors', pattern: /console\.(error|log)/gi },
    { name: 'Throw Statements', pattern: /throw\s+/gi }
  ];
  
  errorPatterns.forEach(pattern => {
    const matches = serverCode.match(pattern.pattern);
    const count = matches ? matches.length : 0;
    console.log(`🔍 ${pattern.name}: ${count} instances`);
  });
  
  // Write analysis to file
  const analysis = `# Backend Server Code Analysis
Generated: ${new Date().toISOString()}

## Implemented Endpoints (${totalEndpoints} total)
${Object.entries(endpointsByCategory).map(([category, routes]) => 
  `### ${category.toUpperCase()}\n${routes.map(route => `- ${route}`).join('\n')}`
).join('\n\n')}

## Security Features
${securityFeatures.map(feature => {
  const matches = serverCode.match(feature.pattern);
  const count = matches ? matches.length : 0;
  return `- ${feature.name}: ${count} instances`;
}).join('\n')}

## Database Operations
${dbOperations.map(operation => {
  const matches = serverCode.match(operation.pattern);
  const count = matches ? matches.length : 0;
  return `- ${operation.name}: ${count} instances`;
}).join('\n')}

## Error Handling
${errorPatterns.map(pattern => {
  const matches = serverCode.match(pattern.pattern);
  const count = matches ? matches.length : 0;
  return `- ${pattern.name}: ${count} instances`;
}).join('\n')}
`;
  
  fs.writeFileSync('backend-analysis.md', analysis);
  console.log('\n📄 Analysis saved to: backend-analysis.md');
  
} catch (error) {
  console.log(`❌ Error analyzing server code: ${error.message}`);
}
