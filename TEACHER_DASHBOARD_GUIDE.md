# Teacher Dashboard - Photo-Based Attendance System

## Overview
The Teacher Dashboard provides comprehensive functionality for teachers to manage their classes, mark attendance using photo capture, view analytics, and generate reports. The key feature is the **photo-based attendance system** where students are marked present only if their photo is captured.

## Features

### 1. Dashboard Overview
- **Class Statistics**: Total classes assigned, total students, attendance percentage
- **Recent Activity**: Latest attendance submissions and class activities
- **Quick Actions**: Direct access to attendance marking and class management

### 2. Photo-Based Attendance
The attendance system requires photo capture for marking students as present:

#### How It Works:
1. **Select Class**: Choose the class for attendance marking
2. **Select Date**: Choose the date (defaults to today)
3. **Start Attendance Mode**: Activate camera for photo capture
4. **Student-by-Student Process**:
   - Student appears on screen with their details
   - Camera feed shows live video
   - **Take Photo**: Capture student's photo → Automatically marked as **PRESENT**
   - **Skip Photo**: No photo taken → Automatically marked as **ABSENT**
   - **Mark Late**: Take photo + special status → Marked as **LATE**

#### Attendance Logic:
- ✅ **Present**: Photo captured successfully
- ❌ **Absent**: No photo taken (skipped)
- ⏰ **Late**: Photo captured with late status
- 📷 **Photo Required**: Students cannot be marked present without a photo

#### Progress Tracking:
- Real-time progress bar showing completion percentage
- Student counter (e.g., "Student 3 of 25")
- Attendance summary showing present/absent/late counts

### 3. Class Management
- **View All Classes**: See all assigned classes with student counts
- **Class Details**: View students enrolled in each class
- **Subject Assignments**: See subjects taught in each class

### 4. Reports & Analytics
- **Attendance Reports**: Generate detailed attendance reports by date range
- **Class Performance**: View attendance trends and analytics
- **Export Data**: Download reports in CSV format

### 5. Settings
- **Profile Management**: Update teacher profile information
- **Camera Settings**: Configure camera preferences for attendance
- **Notification Preferences**: Set up alerts and reminders

## Getting Started

### Login Credentials
```
Email: teacher@school.com
Password: teacher123
```

### Marking Attendance - Step by Step

1. **Access Dashboard**:
   - Navigate to http://localhost:8085/teacher-login
   - Login with teacher credentials
   - You'll see the main dashboard with overview stats

2. **Start Attendance**:
   - Click on "Attendance" tab
   - Select your class from the dropdown
   - Choose the date (today is selected by default)
   - Click "Start Taking Attendance"

3. **Photo Capture Process**:
   - Allow camera permissions when prompted
   - The first student will appear with their details
   - Position the student in front of the camera
   - Click "📷 Take Photo" to capture and mark present
   - OR click "⏭ Skip (Mark Absent)" to mark absent
   - Continue for all students in the class

4. **Complete Attendance**:
   - Progress bar shows completion status
   - Review attendance summary
   - Click "Submit Attendance" to save all records
   - Attendance data is immediately available in reports

### Sample Data
The system comes with pre-loaded sample data:
- **4 Classes**: Grade 10A, Grade 10B, Grade 11A, Advanced Computer Science
- **17 Students**: Distributed across the classes
- **Teacher Profile**: Complete teacher profile linked to all classes

## Technical Features

### Camera Integration
- **WebRTC API**: Direct browser camera access
- **Photo Capture**: Canvas-based image processing
- **Privacy First**: Photos processed locally, only essential data stored

### Real-time Updates
- **Live Progress**: Instant feedback during attendance marking
- **Dynamic Statistics**: Dashboard stats update in real-time
- **Responsive UI**: Works on desktop and tablet devices

### Data Management
- **SQLite Database**: Local database with full data persistence
- **Transaction Safety**: Attendance submissions are atomic operations
- **Backup & Recovery**: Database can be easily backed up and restored

### API Endpoints
- `GET /api/teachers/my-classes` - Get teacher's assigned classes
- `GET /api/teachers/class/:classId/students` - Get students for a class
- `GET /api/teachers/dashboard-stats` - Get dashboard statistics
- `POST /api/teachers/photo-attendance` - Submit photo-based attendance
- `GET /api/teachers/recent-activity` - Get recent teacher activity

## Photo-Based Attendance Benefits

### 1. Verification & Accuracy
- **Visual Confirmation**: Ensures student is physically present
- **Fraud Prevention**: Prevents proxy attendance
- **Audit Trail**: Photo evidence for attendance records

### 2. Engagement & Accountability
- **Student Awareness**: Students know attendance is being tracked
- **Teacher Efficiency**: Quick and accurate attendance marking
- **Parent Transparency**: Visual proof of attendance for parent queries

### 3. Analytics & Insights
- **Attendance Patterns**: Track student attendance trends
- **Class Participation**: Monitor engagement levels
- **Intervention Triggers**: Identify students needing support

## Troubleshooting

### Camera Issues
- **Permission Denied**: Ensure browser has camera permissions
- **No Camera Found**: Check if camera is connected and not used by other apps
- **Poor Quality**: Ensure good lighting and camera positioning

### Performance
- **Slow Loading**: Check internet connection and server status
- **Photo Upload Issues**: Verify sufficient storage space
- **Browser Compatibility**: Use modern browsers (Chrome, Firefox, Safari)

### Data Issues
- **Missing Students**: Verify class enrollments are correct
- **Attendance Not Saving**: Check server connection and try again
- **Report Errors**: Refresh the page and regenerate reports

## System Requirements

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Camera Requirements
- Webcam (built-in or external)
- Camera permissions enabled
- Minimum 720p resolution recommended

### Network
- Stable internet connection for API calls
- Local server running on port 3001
- Frontend server on port 8080+

## Quick Commands

### Development
```bash
# Start full stack (recommended)
npm run dev:full

# Start backend only
npm run dev:server

# Start frontend only
npm run dev

# Add sample data
npm run add-sample-data

# Reset database
npm run init-db
```

### Production
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Support

For technical issues or feature requests, please check:
1. Server logs for API errors
2. Browser console for frontend issues
3. Database integrity with SQLite tools
4. Camera permissions and device status

The Teacher Dashboard is designed to make attendance tracking efficient, accurate, and engaging through innovative photo-based verification technology.
