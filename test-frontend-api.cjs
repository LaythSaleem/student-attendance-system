// Test script to verify frontend API integration
const http = require('http');

console.log('🧪 TESTING FRONTEND-BACKEND INTEGRATION');
console.log('=====================================\n');

// Test the classes API endpoint that the frontend uses
function testClassesAPI() {
  return new Promise((resolve, reject) => {
    // First login to get token
    const loginData = JSON.stringify({
      email: 'admin@school.com',
      password: 'admin123'
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 8888,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const loginReq = http.request(loginOptions, (loginRes) => {
      let loginBody = '';
      loginRes.on('data', (chunk) => {
        loginBody += chunk;
      });

      loginRes.on('end', () => {
        try {
          const loginResponse = JSON.parse(loginBody);
          const token = loginResponse.token;

          if (!token) {
            console.log('❌ Login failed');
            reject('No token received');
            return;
          }

          console.log('✅ Login successful, testing classes API...\n');

          // Now test classes endpoint
          const classesOptions = {
            hostname: 'localhost',
            port: 8888,
            path: '/api/classes',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          };

          const classesReq = http.request(classesOptions, (classesRes) => {
            let classesBody = '';
            classesRes.on('data', (chunk) => {
              classesBody += chunk;
            });

            classesRes.on('end', () => {
              try {
                const classes = JSON.parse(classesBody);
                
                console.log('📊 CLASSES API RESPONSE:');
                console.log('========================\n');

                if (Array.isArray(classes) && classes.length > 0) {
                  let totalStudents = 0;
                  let totalTopics = 0;

                  classes.forEach((cls, index) => {
                    console.log(`${index + 1}. ${cls.name} - ${cls.section}`);
                    console.log(`   student_count: ${cls.student_count || 0}`);
                    console.log(`   total_students: ${cls.total_students || 0}`); 
                    console.log(`   total_topics: ${cls.total_topics || 0}`);
                    console.log(`   teacher_name: ${cls.teacher_name || 'None'}\n`);
                    
                    totalStudents += (cls.student_count || 0);
                    totalTopics += (cls.total_topics || 0);
                  });

                  console.log('📈 CALCULATED STATISTICS:');
                  console.log('=========================');
                  console.log(`Total Classes: ${classes.length}`);
                  console.log(`Total Students: ${totalStudents}`);
                  console.log(`Total Topics: ${totalTopics}`);
                  console.log(`Average Students/Class: ${classes.length > 0 ? Math.round(totalStudents / classes.length) : 0}`);

                  console.log('\n✅ INTEGRATION TEST PASSED!');
                  console.log('📋 Frontend should now display correct statistics');
                  
                  resolve();
                } else {
                  console.log('❌ No classes found in response');
                  reject('Empty classes array');
                }
              } catch (error) {
                console.log('❌ Failed to parse classes response:', error.message);
                reject(error);
              }
            });
          });

          classesReq.on('error', (error) => {
            console.log('❌ Classes request failed:', error.message);
            reject(error);
          });

          classesReq.end();
        } catch (error) {
          console.log('❌ Failed to parse login response:', error.message);
          reject(error);
        }
      });
    });

    loginReq.on('error', (error) => {
      console.log('❌ Login request failed:', error.message);
      reject(error);
    });

    loginReq.write(loginData);
    loginReq.end();
  });
}

// Run the test
testClassesAPI().catch(error => {
  console.log('❌ Test failed:', error);
  process.exit(1);
});
