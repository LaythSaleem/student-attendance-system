const http = require('http');

async function testAPI() {
  console.log('🔍 Testing API connection to localhost:8888...');
  
  const testEndpoints = [
    '/api/health',
    '/api/teachers/my-classes'
  ];

  for (const endpoint of testEndpoints) {
    console.log(`\n📡 Testing ${endpoint}...`);
    
    try {
      const result = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'localhost',
          port: 8888,
          path: endpoint,
          method: 'GET',
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        };

        // Add auth header for protected endpoints
        if (endpoint !== '/api/health') {
          options.headers['Authorization'] = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNjFlYTgzZi1iZWI1LTQxZTMtOGY0OC1mODY5MmI2OTQ3ZDAiLCJlbWFpbCI6ImFkbWluQHNjaG9vbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NDk4MjcyMDUsImV4cCI6MTc0OTkxMzYwNX0.EVMfXWPQ8u19uSVB0NQy_B59JD3j_Aug2vTSN9-PqF0';
        }

        const req = http.request(options, (res) => {
          console.log(`✅ Status: ${res.statusCode}`);
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log(`📄 Response: ${data}`);
            resolve({ status: res.statusCode, data });
          });
        });

        req.on('error', (err) => {
          console.error(`❌ Error: ${err.message}`);
          reject(err);
        });

        req.on('timeout', () => {
          console.error('❌ Request timeout');
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.end();
      });
      
    } catch (error) {
      console.error(`❌ Failed to test ${endpoint}: ${error.message}`);
    }
  }
}

testAPI().then(() => {
  console.log('\n✅ API test completed');
}).catch(err => {
  console.error('❌ API test failed:', err);
});
