<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Scholar Track Pulse - SQLite Version

This is a comprehensive Student Attendance Management System built with React, TypeScript, Vite, and SQLite. It's an exact replica of the original Supabase-based system but using SQLite for the database.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Backend**: Express.js, SQLite (better-sqlite3)
- **Authentication**: JWT-based authentication
- **State Management**: TanStack Query
- **Routing**: React Router DOM

## Architecture
- **Database**: SQLite database with comprehensive schema for students, teachers, classes, attendance, exams
- **API**: RESTful API with Express.js serving the React frontend
- **Authentication**: JWT tokens with role-based access (admin, teacher, student)
- **UI Components**: Consistent design system using shadcn/ui components

## Key Features
1. **Multi-role Authentication**: Admin, Teacher, Student portals
2. **Student Management**: Complete CRUD operations for student records
3. **Teacher Management**: Teacher profiles and class assignments
4. **Attendance Tracking**: Real-time attendance marking and reporting
5. **Exam Management**: Scheduling, grading, and result tracking
6. **Reports & Analytics**: Comprehensive attendance and performance reports
7. **Class Management**: Class creation, student enrollment, subject assignments

## Database Schema
The SQLite database includes tables for:
- users, user_roles, admin_profiles
- teachers, students, classes, subjects
- student_enrollments, class_subjects
- attendance, exams, exam_results
- announcements, academic_years

## Development Guidelines
- Use TypeScript for all new code
- Follow shadcn/ui component patterns
- Implement proper error handling with try-catch blocks
- Use TanStack Query for API state management
- Ensure responsive design with Tailwind CSS
- Maintain consistent code formatting and structure

## API Endpoints
- `/api/auth/*` - Authentication routes
- `/api/students/*` - Student management
- `/api/teachers/*` - Teacher management
- `/api/classes/*` - Class management
- `/api/attendance/*` - Attendance tracking
- `/api/exams/*` - Exam management
- `/api/reports/*` - Report generation

## Running the Application
- `npm run dev:full` - Runs both frontend and backend concurrently
- `npm run dev` - Frontend only (port 8080)
- `npm run dev:server` - Backend only (port 3001)
- `npm run init-db` - Initialize/reset database

## Default Credentials
- Admin: admin@school.com / admin123
- Teacher: teacher@school.com / teacher123

When adding new features, ensure they match the exact functionality and UI/UX of the original Scholar Track Pulse application.
