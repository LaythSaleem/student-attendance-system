const axios = require('axios');

const BASE_URL = 'http://localhost:8888';

async function debugStudentUpdate() {
    console.log('🔍 Debugging Student Update Issue...\n');
    
    try {
        // First, login as admin to get token
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@school.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Get list of students first
        console.log('\n2. Getting student list...');
        const studentsResponse = await axios.get(`${BASE_URL}/api/students`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const students = studentsResponse.data;
        console.log(`✅ Found ${students.length} students`);
        
        if (students.length === 0) {
            console.log('❌ No students found to update');
            return;
        }
        
        const studentToUpdate = students[0];
        console.log(`\n3. Attempting to update student: ${studentToUpdate.name} (ID: ${studentToUpdate.id})`);
        console.log('   Student data structure:', {
            id: studentToUpdate.id,
            name: studentToUpdate.name,
            rollNumber: studentToUpdate.rollNumber,
            email: studentToUpdate.email,
            class: studentToUpdate.class,
            section: studentToUpdate.section,
            parentPhone: studentToUpdate.parentPhone,
            address: studentToUpdate.address
        });
        
        // Try different update payloads using correct field names
        const updatePayloads = [
            // Minimal update with just name
            {
                name: (studentToUpdate.name || 'Unknown Student') + ' Updated'
            },
            // Full update with all expected fields
            {
                name: (studentToUpdate.name || 'Unknown Student') + ' Updated',
                rollNumber: studentToUpdate.rollNumber,
                class: studentToUpdate.class,
                section: studentToUpdate.section,
                parentPhone: studentToUpdate.parentPhone,
                address: studentToUpdate.address || '',
                email: studentToUpdate.email,
                status: studentToUpdate.status || 'active'
            }
        ];
        
        for (let i = 0; i < updatePayloads.length; i++) {
            console.log(`\n   Attempt ${i + 1}: ${i === 0 ? 'Minimal' : 'Full'} update payload`);
            console.log('   Payload:', JSON.stringify(updatePayloads[i], null, 2));
            
            try {
                const updateResponse = await axios.put(
                    `${BASE_URL}/api/students/${studentToUpdate.id}`,
                    updatePayloads[i],
                    {
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log('   ✅ Update successful!');
                console.log('   Response:', updateResponse.data);
                break;
                
            } catch (error) {
                console.log('   ❌ Update failed');
                console.log('   Status:', error.response?.status);
                console.log('   Error:', error.response?.data || error.message);
                
                if (error.response?.status === 500) {
                    console.log('   🔍 500 Internal Server Error - checking server logs...');
                }
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
    debugStudentUpdate();
}

module.exports = { debugStudentUpdate };
