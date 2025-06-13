import { StudentDashboard } from '@/components/StudentDashboard';

export function TestStudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentDashboard 
        onBack={() => {
          console.log('Back button clicked');
          alert('Back button functionality - integrate with your routing');
        }}
      />
    </div>
  );
}
