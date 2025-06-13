# Scholar Track Pulse - Student Attendance Management System

A comprehensive attendance management system built with React, TypeScript, and SQLite, featuring innovative photo-based attendance tracking.

## 🌟 Key Features

### 📱 **Photo-Based Attendance**
- Students marked present **only** when their photo is captured
- Real-time camera integration with live preview
- Automatic absent marking for skipped students
- Visual verification and audit trail

### 👥 **Multi-Role Dashboard**
- **Admin Portal**: Complete system management
- **Teacher Dashboard**: Class management and attendance tracking
- **Student Portal**: Personal attendance records and schedules

### 📊 **Analytics & Reporting**
- Real-time attendance statistics
- Comprehensive reports and trends
- Export functionality for data analysis
- Parent and student communication tools

### 🏫 **Class Management**
- Class creation and student enrollment
- Subject assignments and teacher allocation
- Academic year and semester management
- Flexible scheduling system

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern web browser with camera support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd "Attendence App"

# Install dependencies
npm install

# Initialize database with sample data
npm run init-db
npm run add-sample-data

# Start the full development environment
npm run dev:full
```

### Access the Application

- **Frontend**: http://localhost:8080+ (port may vary)
- **Backend API**: http://localhost:3001
- **Database**: SQLite file in project root

## 🔐 Default Login Credentials

### Teacher Account
```
Email: teacher@school.com
Password: teacher123
```

### Admin Account
```
Email: admin@school.com
Password: admin123
```

## 📚 Documentation

- **[Teacher Dashboard Guide](./TEACHER_DASHBOARD_GUIDE.md)** - Complete guide for photo-based attendance
- **[SQLite Version README](./README-SQLITE.md)** - Technical implementation details
- **[Copilot Instructions](./.github/copilot-instructions.md)** - Development guidelines

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **TanStack Query** - Server state management
- **React Router** - Client-side routing

### Backend
- **Express.js** - Node.js web framework
- **SQLite** - Lightweight database with better-sqlite3
- **JWT** - Secure authentication
- **bcrypt** - Password hashing
- **UUID** - Unique identifier generation

### Camera Integration
- **WebRTC API** - Browser camera access
- **Canvas API** - Image processing and capture
- **Media Devices API** - Camera permission management

## 📱 Photo-Based Attendance System

### How It Works

1. **Teacher Login**: Access dashboard with class overview
2. **Select Class**: Choose class and date for attendance
3. **Camera Activation**: Browser requests camera permissions
4. **Student-by-Student**:
   - Student details displayed
   - Live camera feed active
   - **Take Photo** → Present ✅
   - **Skip** → Absent ❌
   - **Mark Late** → Late ⏰
5. **Progress Tracking**: Real-time completion status
6. **Submit Attendance**: Save all records to database

### Benefits

- **Accuracy**: Visual verification prevents proxy attendance
- **Efficiency**: Quick process with immediate feedback
- **Audit Trail**: Photo evidence for attendance records
- **Engagement**: Students are accountable for physical presence
- **Analytics**: Rich data for attendance pattern analysis

## 🗂️ Database Schema

### Core Tables
- `users` - User authentication and roles
- `teachers` - Teacher profiles and information
- `students` - Student records and details
- `classes` - Class definitions and assignments
- `subjects` - Subject catalog
- `attendance` - Attendance records with photo data
- `student_enrollments` - Class enrollment tracking
- `academic_years` - Academic period management

### Sample Data Included
- **4 Classes**: Grade 10A, 10B, 11A, Advanced CS
- **17 Students**: Distributed across classes
- **5 Subjects**: Math, English, CS, Physics, Chemistry
- **Teacher Profile**: Complete with class assignments

## 🎯 Development

### Available Scripts

```bash
# Development
npm run dev              # Frontend only
npm run dev:server       # Backend only  
npm run dev:full         # Full stack (recommended)

# Database
npm run init-db          # Initialize/reset database
npm run add-sample-data  # Add test data

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # ESLint checking
```

### Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── assets/             # Static assets

server.cjs              # Express.js backend
database.sqlite         # SQLite database
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### Teacher Routes
- `GET /api/teachers/my-classes` - Get assigned classes
- `GET /api/teachers/class/:id/students` - Get class students
- `GET /api/teachers/dashboard-stats` - Dashboard analytics
- `POST /api/teachers/photo-attendance` - Submit attendance
- `GET /api/teachers/recent-activity` - Recent activities

#### Admin Routes
- `GET /api/students` - All students
- `GET /api/teachers` - All teachers
- `GET /api/classes` - All classes
- `GET /api/attendance` - Attendance records

## 🎨 UI/UX Features

### Modern Design
- **Dark/Light Mode** - Automatic theme switching
- **Responsive Layout** - Works on desktop and tablets
- **Accessible Components** - WCAG compliant interfaces
- **Loading States** - Smooth user experience
- **Error Handling** - Graceful error messages

### Camera Interface
- **Live Preview** - Real-time video feed
- **Photo Capture** - Canvas-based image processing
- **Progress Indicators** - Visual attendance completion
- **Student Cards** - Clear student information display

## 🔧 Configuration

### Environment Variables
```env
PORT=3001                # Backend server port
JWT_SECRET=your_secret   # JWT signing secret
DB_PATH=./database.sqlite # Database file location
```

### Camera Settings
- **Resolution**: Minimum 720p recommended
- **Frame Rate**: 30fps for smooth preview
- **Permissions**: Camera access required
- **Fallback**: Graceful degradation without camera

## 🚨 Troubleshooting

### Common Issues

**Camera not working:**
- Check browser permissions
- Ensure camera not in use by other apps
- Try different browser

**Database errors:**
- Run `npm run init-db` to reset
- Check file permissions
- Verify SQLite installation

**Build failures:**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify TypeScript configuration

**API connection issues:**
- Confirm backend server is running
- Check port availability
- Verify CORS settings

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Ensure responsive design
- Test camera functionality

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React team for excellent framework
- shadcn/ui for beautiful components
- SQLite team for reliable database
- Open source community for inspiration

---

**Scholar Track Pulse** - Making attendance tracking accurate, efficient, and engaging through innovative photo-based verification technology.
  },
})
```
