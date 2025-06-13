import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { OverviewPage } from '@/components/OverviewPage';
import { StudentsPage } from '@/components/StudentsPage';
import { StudentProfile } from '@/components/StudentProfile';
import { TeachersPage } from '@/components/TeachersPage';
import { ClassesPage } from '@/components/ClassesPage';
import { ExamsPage } from '@/components/ExamsPage';
import { AttendanceReportsPage } from '@/components/AttendanceReportsPage';
import UserManagementPage from '@/components/UserManagementPage';
import ReportGenerator from '@/components/ReportGenerator';

interface User {
  id: string;
  email: string;
  role?: string;
}

interface Props {
  user: User;
  signOut: () => void;
}

const AdminDashboard = ({ user, signOut }: Props) => {
  const [currentPage, setCurrentPage] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const getPageTitle = () => {
    if (selectedStudentId) return 'Student Profile';
    switch (currentPage) {
      case 'overview': return 'Dashboard Overview';
      case 'students': return 'Student Management';
      case 'teachers': return 'Teacher Management';
      case 'classes': return 'Class Management';
      case 'attendance-reports': return 'Attendance Reports & Analytics';
      case 'generate-reports': return 'Generate Reports';
      case 'exams': return 'Exam Management';
      case 'user-management': return 'User Management';
      default: return 'Dashboard';
    }
  };

  const getPageDescription = () => {
    if (selectedStudentId) return 'View comprehensive student details and attendance history';
    switch (currentPage) {
      case 'overview': return 'Monitor your school\'s performance and activities';
      case 'students': return 'Manage student records and enrollment';
      case 'teachers': return 'Oversee teaching staff and assignments';
      case 'classes': return 'Configure classes and academic structure';
      case 'attendance-reports': return 'Track attendance with photo verification and generate comprehensive reports';
      case 'generate-reports': return 'Generate and export detailed attendance, performance, and administrative reports';
      case 'exams': return 'Schedule exams and manage results';
      case 'user-management': return 'Manage user accounts, roles, and permissions';
      default: return '';
    }
  };

  const renderContent = () => {
    if (selectedStudentId) {
      return <StudentProfile studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} />;
    }

    switch (currentPage) {
      case 'overview':
        return <OverviewPage onPageChange={handlePageChange} />;
      case 'students':
        return <StudentsPage />;
      case 'teachers':
        return <TeachersPage />;
      case 'classes':
        return <ClassesPage />;
      case 'attendance-reports':
        return <AttendanceReportsPage />;
      case 'generate-reports':
        return <ReportGenerator userRole="admin" />;
      case 'exams':
        return <ExamsPage />;
      case 'user-management':
        return <UserManagementPage />;
      default:
        return <OverviewPage onPageChange={handlePageChange} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        user={user}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onSignOut={signOut}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getPageTitle()}
          description={getPageDescription()}
          onMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
