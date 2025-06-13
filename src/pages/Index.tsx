import { useMinimalAuth } from '@/hooks/useMinimalAuth';
import LandingPage from './LandingPage.tsx';
import AdminDashboard from './AdminDashboard.tsx';
import { TeacherDashboardNew } from '@/components/TeacherDashboardNew';
import StudentDashboard from './StudentDashboard.tsx';

const Index = () => {
  const { user, userRole, loading, initialized, signOut } = useMinimalAuth();

  console.log('🏠 Index render:', { user: !!user, userRole, loading, initialized });

  // Show loading while not initialized or still loading
  if (!initialized || loading) {
    console.log('📍 Showing loading...', { initialized, loading });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-xs text-gray-400 mt-2">
            Init: {initialized ? 'true' : 'false'}, Loading: {loading ? 'true' : 'false'}
          </p>
        </div>
      </div>
    );
  }

  // Show landing page if no user
  if (!user) {
    console.log('👤 No user, showing landing page');
    return <LandingPage />;
  }

  // Show basic authenticated view
  console.log('✅ User authenticated, showing role-based view');
  
  // If user has no role, show role setup interface
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Welcome!</h1>
                <p className="text-gray-600">You are signed in as: {user.email}</p>
              </div>
              <button 
                onClick={signOut}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h2 className="font-semibold text-yellow-800 mb-2">Role Setup Required</h2>
              <p className="text-yellow-700 text-sm mb-3">
                Your account doesn't have a role assigned yet. Please contact an administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has a role - route to appropriate dashboard
  console.log('✅ User authenticated with role, routing to dashboard:', userRole);
  
  switch (userRole) {
    case 'admin':
      return <AdminDashboard user={user} signOut={signOut} />;
    case 'teacher':
      return <TeacherDashboardNew user={user} onSignOut={signOut} />;
    case 'student':
      return <StudentDashboard user={user} signOut={signOut} />;
    default:
      // Fallback - this shouldn't happen but just in case
      console.warn('⚠️ Unknown role:', userRole);
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Unknown Role</h1>
                  <p className="text-gray-600">You are signed in as: {user.email}</p>
                  <p className="text-sm text-red-600 font-medium">Role: {userRole}</p>
                </div>
                <button 
                  onClick={signOut} 
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <h2 className="font-semibold text-red-800 mb-2">Unrecognized Role</h2>
                <p className="text-red-700 text-sm mb-3">
                  Your role "{userRole}" is not recognized by the system. Please contact an administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
  }
};

export default Index;
