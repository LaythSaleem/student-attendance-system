# 🚀 User Management - Quick Start Guide

## Overview
The User Management page provides administrators with complete control over user accounts in the Scholar Track Pulse system.

## Access Instructions

### 1. **Login as Administrator**
```
Email: admin@school.com
Password: admin123
```

### 2. **Navigate to User Management**
- Click the **"User Management"** item in the sidebar (Shield icon)
- The page will load showing all existing users

## Features Available

### 📋 **View Users**
- See all users in a table format
- View user details: name, email, role, status, creation date
- Real-time search across user data
- Filter by role (All, Admin, Teacher, Student)

### ➕ **Create New User**
1. Click **"Add User"** button
2. Fill out the form:
   - **Email**: User's login email
   - **Password**: Initial password
   - **Role**: admin, teacher, or student
   - **Name**: Full name
   - **Phone**: Contact number (for teachers)
   - **Address**: Physical address
   - **Status**: Active or Inactive
3. Click **"Create User"**

### ✏️ **Edit Existing User**
1. Find the user in the table
2. Click the **Edit** button (pencil icon)
3. Modify any fields as needed
4. Click **"Save Changes"**

### 👁️ **View User Details**
1. Click the **View** button (eye icon)
2. See comprehensive user profile information
3. Review account creation and update dates

### 🗑️ **Delete User**
1. Click the **Delete** button (trash icon)
2. Confirm the deletion in the dialog
3. Note: You cannot delete the last admin user

## User Roles

### **Admin**
- Full system access
- Can manage all users, students, teachers, classes
- Access to all reports and analytics

### **Teacher** 
- Can mark attendance for assigned classes
- View student information
- Access teaching dashboard

### **Student**
- View own attendance records
- Access student portal
- View academic information

## Security Features

- ✅ **Password Protection**: All passwords are securely hashed
- ✅ **Admin Protection**: Cannot delete the last admin
- ✅ **Authentication Required**: Must be logged in as admin
- ✅ **Input Validation**: All forms have validation
- ✅ **Role-based Access**: Proper permission checking

## Tips for Success

1. **Search Users**: Use the search box to quickly find users
2. **Filter by Role**: Use the role dropdown to view specific user types
3. **Default Passwords**: New users get default passwords (student123, teacher123, admin123)
4. **Profile Auto-creation**: User profiles are automatically created based on role
5. **Status Management**: Use Active/Inactive status to control user access

## Troubleshooting

### User Creation Fails
- Check if email already exists
- Ensure all required fields are filled
- Verify you're logged in as admin

### Cannot Delete User
- Cannot delete the last admin user
- Check user has no critical dependencies
- Ensure you have admin permissions

### User Not Showing
- Check if user is filtered by role
- Clear search terms
- Refresh the page

## API Integration

The User Management page uses these API endpoints:
- `GET /api/users` - Fetch all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

All endpoints require admin authentication via JWT token.

---

**🎉 Ready to manage users! The User Management system is fully operational and production-ready.**
