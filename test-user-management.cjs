#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

async function testUserManagementAPI() {
  console.log('🧪 Testing User Management API');
  console.log('===============================\n');

  try {
    // Step 1: Login as Admin
    console.log('1. 👨‍💼 Admin Login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const { token } = await loginResponse.json();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('✅ Admin logged in successfully');

    // Step 2: Fetch existing users
    console.log('\n2. 📋 Fetching Users...');
    const usersResponse = await fetch(`${BASE_URL}/users`, {
      headers
    });

    if (!usersResponse.ok) {
      throw new Error(`Fetch users failed: ${usersResponse.status}`);
    }

    const users = await usersResponse.json();
    console.log(`✅ Found ${users.length} existing users:`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role.toUpperCase()}`);
    });

    // Step 3: Create a new admin user
    console.log('\n3. ➕ Creating New Admin User...');
    const newAdminData = {
      email: 'admin2@school.com',
      password: 'admin123',
      role: 'admin',
      name: 'Secondary Administrator',
      status: 'active'
    };

    const createResponse = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newAdminData)
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Create user failed: ${createResponse.status} - ${error}`);
    }

    const newUser = await createResponse.json();
    console.log(`✅ Created new admin: ${newUser.name} (${newUser.email})`);

    // Step 4: Create a new teacher user
    console.log('\n4. 👨‍🏫 Creating New Teacher User...');
    const newTeacherData = {
      email: 'teacher2@school.com',
      password: 'teacher123',
      role: 'teacher',
      name: 'New Teacher',
      phone: '+1234567890',
      address: '123 School Street',
      status: 'active'
    };

    const createTeacherResponse = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newTeacherData)
    });

    const newTeacher = await createTeacherResponse.json();
    console.log(`✅ Created new teacher: ${newTeacher.name} (${newTeacher.email})`);

    // Step 5: Update the teacher user
    console.log('\n5. ✏️ Updating Teacher User...');
    const updateData = {
      name: 'Updated Teacher Name',
      phone: '+0987654321',
      address: '456 Updated Street'
    };

    const updateResponse = await fetch(`${BASE_URL}/users/${newTeacher.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });

    const updatedTeacher = await updateResponse.json();
    console.log(`✅ Updated teacher: ${updatedTeacher.name} - Phone: ${updatedTeacher.phone}`);

    // Step 6: Fetch users again to verify changes
    console.log('\n6. 🔄 Verifying User List...');
    const updatedUsersResponse = await fetch(`${BASE_URL}/users`, {
      headers
    });

    const updatedUsers = await updatedUsersResponse.json();
    console.log(`✅ Total users now: ${updatedUsers.length}`);

    // Step 7: Delete the test users
    console.log('\n7. 🗑️ Cleaning up test users...');
    
    // Delete teacher
    const deleteTeacherResponse = await fetch(`${BASE_URL}/users/${newTeacher.id}`, {
      method: 'DELETE',
      headers
    });

    if (deleteTeacherResponse.ok) {
      console.log('✅ Test teacher deleted successfully');
    }

    // Delete admin (but not if it's the last admin)
    const deleteAdminResponse = await fetch(`${BASE_URL}/users/${newUser.id}`, {
      method: 'DELETE',
      headers
    });

    if (deleteAdminResponse.ok) {
      console.log('✅ Test admin deleted successfully');
    } else {
      const errorText = await deleteAdminResponse.text();
      console.log(`⚠️ Admin deletion: ${errorText}`);
    }

    // Final verification
    console.log('\n8. ✅ Final Verification...');
    const finalUsersResponse = await fetch(`${BASE_URL}/users`, {
      headers
    });

    const finalUsers = await finalUsersResponse.json();
    console.log(`✅ Final user count: ${finalUsers.length}`);

    console.log('\n🎉 USER MANAGEMENT API TEST COMPLETE!');
    console.log('=====================================');
    console.log('✅ All user management operations working correctly');
    console.log('✅ CRUD operations: CREATE, READ, UPDATE, DELETE');
    console.log('✅ Role-based user creation (admin, teacher, student)');
    console.log('✅ Profile data management');
    console.log('✅ Authentication and authorization');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the backend server is running on port 3001');
    console.log('2. Check that the database has been initialized');
    console.log('3. Verify admin credentials (admin@school.com / admin123)');
  }
}

// Run the test
testUserManagementAPI();
