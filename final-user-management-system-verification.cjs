const http = require('http');

// Test the complete User Management API flow
async function verifyUserManagementSystem() {
  console.log('🔍 VERIFYING USER MANAGEMENT SYSTEM');
  console.log('=====================================\n');

  const baseURL = 'http://localhost:8888';
  
  // Test 1: Health Check
  console.log('1️⃣ Testing Health Endpoint...');
  try {
    const healthResponse = await makeRequest('GET', '/api/health');
    if (healthResponse.status === 200) {
      console.log('   ✅ Health endpoint: WORKING');
      console.log(`   📄 Response: ${healthResponse.data}`);
    } else {
      console.log('   ❌ Health endpoint: FAILED');
    }
  } catch (error) {
    console.log('   ❌ Health endpoint: ERROR -', error.message);
  }

  console.log();

  // Test 2: Users Endpoint (should require auth)
  console.log('2️⃣ Testing Users Endpoint (Protected)...');
  try {
    const usersResponse = await makeRequest('GET', '/api/users');
    if (usersResponse.status === 401 || usersResponse.data.includes('Unauthorized')) {
      console.log('   ✅ Users endpoint: CORRECTLY PROTECTED');
      console.log('   🔒 Authentication required (as expected)');
    } else {
      console.log('   ⚠️  Users endpoint: Unexpected response');
      console.log(`   📄 Response: ${usersResponse.data}`);
    }
  } catch (error) {
    console.log('   ❌ Users endpoint: ERROR -', error.message);
  }

  console.log();

  // Test 3: Auth Login Endpoint
  console.log('3️⃣ Testing Auth Login Endpoint...');
  try {
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@school.com',
      password: 'admin123'
    });
    
    if (loginResponse.status === 200) {
      console.log('   ✅ Login endpoint: WORKING');
      const loginData = JSON.parse(loginResponse.data);
      if (loginData.token) {
        console.log('   🎫 JWT token received');
        
        // Test 4: Authenticated Users Request
        console.log('\n4️⃣ Testing Authenticated Users Request...');
        try {
          const authUsersResponse = await makeRequest('GET', '/api/users', null, loginData.token);
          if (authUsersResponse.status === 200) {
            console.log('   ✅ Authenticated users request: WORKING');
            console.log('   👥 Users data received successfully');
          } else {
            console.log('   ❌ Authenticated users request: FAILED');
          }
        } catch (authError) {
          console.log('   ❌ Authenticated users request: ERROR -', authError.message);
        }
      }
    } else {
      console.log('   ❌ Login endpoint: FAILED');
    }
  } catch (error) {
    console.log('   ❌ Login endpoint: ERROR -', error.message);
  }

  console.log();
  console.log('=====================================');
  console.log('🎯 VERIFICATION COMPLETE');
  console.log('🌐 Frontend: http://localhost:8086');
  console.log('🔧 Backend:  http://localhost:8888');
  console.log('=====================================');
}

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8888,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Run verification
verifyUserManagementSystem().catch(console.error);
