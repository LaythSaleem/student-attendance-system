# Scholar Track Pulse - SQLite Edition

A comprehensive Student Attendance Management System built with React, TypeScript, and SQLite. This is an exact replica of the original Supabase-based system, now using SQLite for offline-first functionality.

## 🚀 Features

### Multi-Role Authentication
- **Admin Portal**: Complete system administration
- **Teacher Portal**: Class and attendance management  
- **Student Portal**: View attendance and academic records

### Core Functionality
- **Student Management**: CRUD operations, enrollment tracking
- **Teacher Management**: Profile management, class assignments
- **Class Management**: Create classes, assign subjects and teachers
- **Attendance Tracking**: Real-time marking with detailed reports
- **Exam Management**: Schedule exams, record results, generate reports
- **Analytics & Reports**: Comprehensive attendance and performance analytics

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI Framework**: shadcn/ui, Tailwind CSS, Radix UI
- **Backend**: Express.js with SQLite
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT-based with role management
- **State Management**: TanStack Query
- **Routing**: React Router DOM

## 📦 Installation

1. **Clone and setup:**
   ```bash
   cd "/Users/macbookshop/Desktop/Attendence App"
   npm install
   ```

2. **Initialize database:**
   ```bash
   npm run init-db
   ```

3. **Start the application:**
   ```bash
   npm run dev:full
   ```

## 🎯 Usage

### Access Points
- **Frontend**: http://localhost:8080
- **API Server**: http://localhost:3001

### Default Login Credentials
- **Admin**: admin@school.com / admin123
- **Teacher**: teacher@school.com / teacher123

### Available Scripts
- `npm run dev` - Frontend development server
- `npm run dev:server` - Backend API server
- `npm run dev:full` - Full stack development (recommended)
- `npm run build` - Production build
- `npm run init-db` - Initialize/reset database

## 📊 Database Schema

The SQLite database includes comprehensive tables for:

### Core Entities
- `users` - Authentication data
- `user_roles` - Role assignments (admin/teacher/student)
- `students` - Student profiles and information
- `teachers` - Teacher profiles and subjects
- `classes` - Class definitions and sections

### Academic Management
- `subjects` - Course subjects and codes
- `student_enrollments` - Class enrollment tracking
- `attendance` - Daily attendance records
- `exams` - Exam scheduling and details
- `exam_results` - Student grades and results

### System Management
- `academic_years` - Academic year definitions
- `announcements` - System announcements
- `attendance_reports` - Generated report cache

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/user/profile` - Get user profile

### Management
- `GET/POST /api/students` - Student management
- `GET /api/teachers` - Teacher management
- `GET /api/classes` - Class management
- `GET/POST /api/attendance` - Attendance tracking
- `GET /api/exams` - Exam management

### Reporting
- `GET /api/reports/attendance-summary` - Attendance analytics

## 🎨 UI Components

Built with shadcn/ui for consistent design:
- Responsive layout with Tailwind CSS
- Accessible components with Radix UI
- Dark/light theme support
- Mobile-first design approach

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- SQL injection protection
- CORS configuration

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Progressive web app ready

## 🧪 Development

### Project Structure
```
src/
├── components/ui/      # shadcn/ui components
├── hooks/             # Custom React hooks
├── pages/             # Route components
├── lib/               # Utilities and helpers
├── database/          # SQLite schema and initialization
└── server/            # Express.js API server
```

### Adding New Features
1. Follow TypeScript best practices
2. Use shadcn/ui component patterns
3. Implement proper error handling
4. Add API endpoints with validation
5. Update database schema if needed

## 📄 License

This project is built as an educational example and exact replica of the Scholar Track Pulse system with SQLite integration.

---

**Note**: This SQLite version provides the exact same functionality as the original Supabase version but with offline-first capabilities and simpler deployment requirements.
