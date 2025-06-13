import { Button } from '@/components/ui/button';

interface User {
  id: string;
  email: string;
  role?: string;
}

interface Props {
  user: User;
  signOut: () => void;
}

const StudentDashboard = ({ user, signOut }: Props) => {
  return (
    <div className="min-h-screen bg-gray-50" data-component="StudentDashboard">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Student Portal</h2>
          <p className="text-gray-600">
            Student dashboard functionality will be implemented here. This will include:
          </p>
          <ul className="mt-4 list-disc list-inside text-gray-600 space-y-2">
            <li>View attendance records</li>
            <li>Check exam schedules</li>
            <li>View grades and results</li>
            <li>Access course materials</li>
            <li>Submit assignments</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
