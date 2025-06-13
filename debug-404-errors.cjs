#!/usr/bin/env node

/**
 * Debug 404 Errors - Comprehensive Test
 */

const jwt = require('jsonwebtoken');
const API_BASE = 'http://localhost:8888/api';

// Generate a test JWT token
function generateTestToken() {
  return jwt.sign(
    { id: 1, email: 'admin@school.com', role: 'admin' },
    'your-secret-key',
    { expiresIn: '1h' }
  );
}

// Test all API endpoints
async function testAllEndpoints() {
  const token = generateTestToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const endpoints = [
    '/students',
    '/teachers',
    '/classes',
    '/teachers/available-topics',
    '/exams',
    '/attendance',
    '/academic-years/dropdown',
    '/exam-types',
    '/subjects',
    '/settings',
    '/users'
  ];

  console.log('🔍 Testing API Endpoints for 404 Errors...\n');

  for (const endpoint of endpoints) {
    try {
      const url = `${API_BASE}${endpoint}`;
      console.log(`Testing: ${url}`);
      
      const response = await fetch(url, { headers });
      
      if (response.status === 404) {
        console.log(`❌ 404 ERROR: ${endpoint}`);
        const errorText = await response.text();
        console.log(`   Response: ${errorText}`);
      } else if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS: ${endpoint} (${Array.isArray(data) ? data.length + ' items' : 'object'})`);
      } else {
        console.log(`⚠️  ${response.status}: ${endpoint}`);
        const errorText = await response.text();
        console.log(`   Response: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`💥 NETWORK ERROR: ${endpoint} - ${error.message}`);
    }
    console.log('');
  }
}

// Test specific patterns that might cause "stages topics not found"
async function testSpecificPatterns() {
  const token = generateTestToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('\n🎯 Testing Specific "Stages Topics" Patterns...\n');

  const patterns = [
    '/stages/topics',
    '/stages',
    '/topics',
    '/classes/stages',
    '/classes/topics',
    '/teachers/stages',
    '/medical-stages',
    '/medical/stages',
    '/curriculum/stages'
  ];

  for (const pattern of patterns) {
    try {
      const url = `${API_BASE}${pattern}`;
      console.log(`Testing pattern: ${url}`);
      
      const response = await fetch(url, { headers });
      
      if (response.status === 404) {
        console.log(`❌ 404 NOT FOUND: ${pattern}`);
      } else {
        console.log(`✅ Found: ${pattern} (${response.status})`);
      }
    } catch (error) {
      console.log(`💥 Error: ${pattern} - ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting 404 Error Debug Session...\n');
  
  await testAllEndpoints();
  await testSpecificPatterns();
  
  console.log('\n✅ Debug session complete!');
}

main().catch(console.error);
