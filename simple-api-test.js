const http = require('http');

// Simple Node.js test without external dependencies
function testAPI() {
  console.log('Testing API connection...');
  
  const options = {
    hostname: 'localhost',
    port: 3010,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response:', data);
      
      if (res.statusCode === 200) {
        testLogin();
      }
    });
  });

  req.on('error', (err) => {
    console.error('Error:', err.message);
  });

  req.end();
}

function testLogin() {
  console.log('\nTesting login...');
  
  const postData = JSON.stringify({
    email: 'admin@school.com',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Login Status: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Login Response:', data);
      
      if (res.statusCode === 200) {
        const result = JSON.parse(data);
        testUsers(result.token);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Login Error:', err.message);
  });

  req.write(postData);
  req.end();
}

function testUsers(token) {
  console.log('\nTesting users endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/users',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Users Status: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Users Response:', data.substring(0, 200) + '...');
      
      if (res.statusCode === 200) {
        console.log('✅ User Management API is working!');
      } else {
        console.log('❌ User Management API failed');
      }
    });
  });

  req.on('error', (err) => {
    console.error('Users Error:', err.message);
  });

  req.end();
}

testAPI();
