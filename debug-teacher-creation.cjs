const axios = require('axios');

const BASE_URL = 'http://localhost:8888';

async function debugTeacherCreation() {
    console.log('🔍 Debugging Teacher Creation Issue...\n');
    
    try {
        // First, login as admin to get token
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@school.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Test teacher creation with different payloads
        const teacherPayloads = [
            // Minimal payload (what the frontend was probably sending)
            {
                name: 'Test Teacher Minimal',
                email: 'test.minimal@teacher.com'
            },
            // Full payload with required password field
            {
                name: 'Test Teacher Full',
                email: 'test.full@teacher.com',
                password: 'teacher123',
                phone: '+1234567890',
                address: '123 Teacher Street',
                topicIds: []
            }
        ];
        
        for (let i = 0; i < teacherPayloads.length; i++) {
            console.log(`\n${i + 1}. Attempting ${i === 0 ? 'minimal' : 'full'} teacher creation...`);
            console.log('   Payload:', JSON.stringify(teacherPayloads[i], null, 2));
            
            try {
                const createResponse = await axios.post(
                    `${BASE_URL}/api/teachers`,
                    teacherPayloads[i],
                    {
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log('   ✅ Teacher creation successful!');
                console.log('   Response:', createResponse.data);
                
                // Clean up - delete the created teacher
                if (createResponse.data.teacherId) {
                    try {
                        await axios.delete(`${BASE_URL}/api/teachers/${createResponse.data.teacherId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        console.log('   🧹 Cleaned up test teacher');
                    } catch (cleanupError) {
                        console.log('   ⚠️ Could not clean up test teacher');
                    }
                }
                
            } catch (error) {
                console.log('   ❌ Teacher creation failed');
                console.log('   Status:', error.response?.status);
                console.log('   Error:', error.response?.data || error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

if (require.main === module) {
    debugTeacherCreation();
}

module.exports = { debugTeacherCreation };
