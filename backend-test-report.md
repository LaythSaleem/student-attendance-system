# Backend API Test Report
Generated: 2025-06-12T03:20:56.225Z

## Summary
- Total Tests: 36
- Passed: 18
- Failed: 18
- Success Rate: 50%

## Test Results by Category
### Authentication
- Tests: 3
- Passed: 2
- Success Rate: 67%

- ✅ POST /api/auth/login (200)
- ✅ POST /api/auth/login (200)
- ❌ POST /api/auth/login (401)

### Students
- Tests: 3
- Passed: 1
- Success Rate: 33%

- ✅ GET /api/students (200)
- ❌ GET /api/students/student_1 (404)
- ❌ GET /api/students/student_1/profile (404)

### Teachers
- Tests: 6
- Passed: 2
- Success Rate: 33%

- ✅ GET /api/teachers (200)
- ✅ GET /api/teachers/dropdown (200)
- ❌ GET /api/teachers/teacher_1 (404)
- ❌ GET /api/teachers/teacher_1/dashboard (404)
- ❌ GET /api/teachers/teacher_1/classes (404)
- ❌ GET /api/teachers/classes/stage_1/students (404)

### Classes
- Tests: 3
- Passed: 3
- Success Rate: 100%

- ✅ GET /api/classes (200)
- ✅ GET /api/classes/stage_1 (200)
- ✅ GET /api/classes/stage_1/topics (200)

### Topics
- Tests: 2
- Passed: 1
- Success Rate: 50%

- ✅ GET /api/topics (200)
- ❌ GET /api/topics/stage_1 (404)

### Attendance
- Tests: 4
- Passed: 1
- Success Rate: 25%

- ✅ GET /api/attendance (200)
- ❌ GET /api/attendance/student_1 (404)
- ❌ GET /api/attendance/reports/summary (404)
- ❌ GET /api/attendance/reports/detailed (404)

### Exams
- Tests: 3
- Passed: 2
- Success Rate: 67%

- ✅ GET /api/exams (200)
- ✅ GET /api/exam-types (200)
- ❌ GET /api/exams/student_1/results (404)

### Reports
- Tests: 3
- Passed: 2
- Success Rate: 67%

- ✅ GET /api/reports/attendance-summary (200)
- ✅ GET /api/reports/attendance-detailed (200)
- ❌ GET /api/reports/student-performance (404)

### Dropdowns
- Tests: 3
- Passed: 2
- Success Rate: 67%

- ✅ GET /api/academic-years/dropdown (200)
- ❌ GET /api/subjects/dropdown (404)
- ✅ GET /api/teachers/dropdown (200)

### Users
- Tests: 2
- Passed: 1
- Success Rate: 50%

- ✅ GET /api/users (200)
- ❌ GET /api/users/1 (404)

### Student Portal
- Tests: 2
- Passed: 0
- Success Rate: 0%

- ❌ GET /api/students/my-classes (401)
- ❌ GET /api/students/my-attendance (401)

### System
- Tests: 2
- Passed: 1
- Success Rate: 50%

- ✅ GET /api/health (200)
- ❌ GET /api/stats (404)
