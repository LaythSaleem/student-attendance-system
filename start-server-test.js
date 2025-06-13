#!/usr/bin/env node

console.log('🚀 Starting server test...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

try {
  console.log('Loading server.cjs...');
  require('./server.cjs');
} catch (error) {
  console.error('❌ Error starting server:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
}
