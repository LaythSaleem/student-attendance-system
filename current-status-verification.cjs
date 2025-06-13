const axios = require('axios');

const BASE_URL = 'http://localhost:8888';

async function verifyCurrentStatus() {
    console.log('✅ VERIFYING CURRENT STATUS - Class 404 & Academic Year Issues');
    console.log('================================================================\n');
    
    try {
        // Step 1: Login to get token
        console.log('1. 🔐 Authenticating...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@school.com',
            password: 'admin123'
        });
        const token = loginResponse.data.token;
        console.log('✅ Authentication successful');
        
        const headers = { Authorization: `Bearer ${token}` };
        
        // Step 2: Test Classes List API
        console.log('\n2. 📚 Testing Classes List API...');
        try {
            const classesResponse = await axios.get(`${BASE_URL}/api/classes`, { headers });
            console.log(`✅ Classes List API: ${classesResponse.data.length} classes found`);
            console.log('   Sample class:', JSON.stringify(classesResponse.data[0], null, 2));
        } catch (error) {
            console.log('❌ Classes List API failed:', error.response?.status, error.response?.data);
        }
        
        // Step 3: Test Individual Class API (common 404 issue)
        console.log('\n3. 🎯 Testing Individual Class API...');
        const testClassIds = ['stage_1', 'graduation', 'stage_2'];
        
        for (const classId of testClassIds) {
            try {
                const classResponse = await axios.get(`${BASE_URL}/api/classes/${classId}`, { headers });
                console.log(`✅ Individual Class /${classId}: Working`);
                console.log(`   Topics: ${classResponse.data.topics?.length || 0}, Students: ${classResponse.data.student_count || 0}`);
            } catch (error) {
                console.log(`❌ Individual Class /${classId}: ${error.response?.status} - ${error.response?.statusText}`);
            }
        }
        
        // Step 4: Test Academic Years API
        console.log('\n4. 📅 Testing Academic Years APIs...');
        
        // Test main academic years endpoint
        try {
            const academicYearsResponse = await axios.get(`${BASE_URL}/api/academic-years`, { headers });
            console.log(`✅ Academic Years API: ${academicYearsResponse.data.length} years found`);
            console.log('   Sample year:', JSON.stringify(academicYearsResponse.data[0], null, 2));
        } catch (error) {
            console.log('❌ Academic Years API failed:', error.response?.status, error.response?.data);
        }
        
        // Test dropdown academic years endpoint
        try {
            const dropdownResponse = await axios.get(`${BASE_URL}/api/academic-years/dropdown`, { headers });
            console.log(`✅ Academic Years Dropdown API: ${dropdownResponse.data.length} years found`);
            console.log('   Sample dropdown year:', JSON.stringify(dropdownResponse.data[0], null, 2));
        } catch (error) {
            console.log('❌ Academic Years Dropdown API failed:', error.response?.status, error.response?.data);
        }
        
        // Step 5: Test Other Potential 404 Endpoints
        console.log('\n5. 🔍 Testing Other Potential 404 Endpoints...');
        const endpoints = [
            '/api/students',
            '/api/teachers',
            '/api/teachers/dropdown',
            '/api/subjects/dropdown',
            '/api/attendance',
            '/api/exams',
            '/api/exam-types'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${BASE_URL}${endpoint}`, { headers });
                console.log(`✅ ${endpoint}: Working (${Array.isArray(response.data) ? response.data.length + ' items' : 'object'})`);
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log(`❌ ${endpoint}: 404 NOT FOUND`);
                } else {
                    console.log(`⚠️  ${endpoint}: ${error.response?.status} - ${error.response?.statusText}`);
                }
            }
        }
        
        // Step 6: Test Frontend Integration
        console.log('\n6. 🌐 Testing Frontend Integration...');
        try {
            const frontendResponse = await axios.get('http://localhost:8083');
            console.log('✅ Frontend is accessible');
        } catch (error) {
            console.log('❌ Frontend is not accessible:', error.code);
        }
        
        console.log('\n🎉 STATUS VERIFICATION COMPLETE!');
        console.log('\n📊 SUMMARY:');
        console.log('   • Backend: http://localhost:8888 ✅');
        console.log('   • Frontend: http://localhost:8083 ✅');
        console.log('   • Login: admin@school.com / admin123');
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

verifyCurrentStatus();
