const axios = require('axios');

const BASE_URL = 'http://localhost:8888';

async function testSubjectsEndpoint() {
    console.log('🧪 Testing Subjects Dropdown Endpoint');
    console.log('====================================\n');
    
    try {
        // Step 1: Login
        console.log('1. 🔐 Authenticating...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@school.com',
            password: 'admin123'
        });
        const token = loginResponse.data.token;
        console.log('✅ Authentication successful');
        
        // Step 2: Test subjects dropdown endpoint
        console.log('\n2. 📚 Testing subjects dropdown endpoint...');
        try {
            const subjectsResponse = await axios.get(`${BASE_URL}/api/subjects/dropdown`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Subjects dropdown endpoint working!');
            console.log(`   Found ${subjectsResponse.data.length} subjects:`);
            subjectsResponse.data.forEach((subject, index) => {
                console.log(`   ${index + 1}. ${subject.name} - ${subject.description}`);
            });
        } catch (error) {
            console.log('❌ Subjects dropdown endpoint failed:');
            console.log('   Status:', error.response?.status);
            console.log('   Error:', error.response?.data);
        }
        
        console.log('\n🎉 Test Complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSubjectsEndpoint();
