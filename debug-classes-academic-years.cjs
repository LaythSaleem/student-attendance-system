const axios = require('axios');

const BASE_URL = 'http://localhost:8888';

async function debugClassesAndAcademicYears() {
    console.log('🔍 Debugging Classes and Academic Years API Issues...\n');
    
    try {
        // Step 1: Login to get token
        console.log('1. Getting admin token...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@school.com',
            password: 'admin123'
        });
        const token = loginResponse.data.token;
        console.log('✅ Admin token obtained');
        
        // Step 2: Test Classes API
        console.log('\n2. Testing Classes API...');
        try {
            const classesResponse = await axios.get(`${BASE_URL}/api/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Classes API working');
            console.log(`   Found ${classesResponse.data.length} classes`);
            console.log('   Sample class:', JSON.stringify(classesResponse.data[0], null, 2));
        } catch (error) {
            console.log('❌ Classes API failed');
            console.log('   Status:', error.response?.status);
            console.log('   Error:', error.response?.data);
        }
        
        // Step 3: Test Individual Class API
        console.log('\n3. Testing Individual Class API...');
        try {
            const classResponse = await axios.get(`${BASE_URL}/api/classes/stage_1`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Individual class API working');
            console.log('   Class data:', JSON.stringify(classResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Individual class API failed');
            console.log('   Status:', error.response?.status);
            console.log('   Error:', error.response?.data);
        }
        
        // Step 4: Test Academic Years API
        console.log('\n4. Testing Academic Years API...');
        try {
            const academicYearsResponse = await axios.get(`${BASE_URL}/api/academic-years/dropdown`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Academic Years API working');
            console.log('   Academic years:', JSON.stringify(academicYearsResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Academic Years API failed');
            console.log('   Status:', error.response?.status);
            console.log('   Error:', error.response?.data);
        }
        
        // Step 5: Test Alternative Academic Years Endpoint
        console.log('\n5. Testing Alternative Academic Years Endpoint...');
        try {
            const altAcademicYearsResponse = await axios.get(`${BASE_URL}/api/academic-years`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Alternative Academic Years API working');
            console.log('   Academic years:', JSON.stringify(altAcademicYearsResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Alternative Academic Years API failed');
            console.log('   Status:', error.response?.status);
            console.log('   Error:', error.response?.data);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugClassesAndAcademicYears();
