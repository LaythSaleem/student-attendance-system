import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsGrid } from "@/components/StatsGrid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  GraduationCap, 
  School, 
  CheckSquare,
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  BookOpen
} from "lucide-react"

const API_BASE = 'http://localhost:8888/api';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalTopics: number;
  attendanceRate: number;
  activeExams: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  time: string;
  status: string;
}

interface OverviewPageProps {
  onPageChange?: (page: string) => void;
}

export function OverviewPage({ onPageChange }: OverviewPageProps = {}) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalTopics: 0,
    attendanceRate: 0,
    activeExams: 0
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch students
      const studentsResponse = await fetch(`${API_BASE}/students`, {
        headers: getAuthHeaders()
      });
      const students = studentsResponse.ok ? await studentsResponse.json() : [];
      
      // Fetch teachers
      const teachersResponse = await fetch(`${API_BASE}/teachers`, {
        headers: getAuthHeaders()
      });
      const teachers = teachersResponse.ok ? await teachersResponse.json() : [];
      
      // Fetch classes
      const classesResponse = await fetch(`${API_BASE}/classes`, {
        headers: getAuthHeaders()
      });
      const classes = classesResponse.ok ? await classesResponse.json() : [];
      
      // Fetch topics
      const topicsResponse = await fetch(`${API_BASE}/teachers/available-topics`, {
        headers: getAuthHeaders()
      });
      const topics = topicsResponse.ok ? await topicsResponse.json() : [];
      
      // Fetch exams
      const examsResponse = await fetch(`${API_BASE}/exams`, {
        headers: getAuthHeaders()
      });
      const exams = examsResponse.ok ? await examsResponse.json() : [];
      
      // Calculate attendance rate (mock for now)
      const attendanceRate = 92.5;
      
      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalTopics: topics.length,
        attendanceRate,
        activeExams: exams.length
      });

      // Generate recent activities based on actual data
      const newActivities: RecentActivity[] = [
        {
          id: '1',
          type: 'attendance',
          message: `Daily attendance updated for ${classes.length} classes`,
          time: '5 minutes ago',
          status: 'success'
        },
        {
          id: '2', 
          type: 'student',
          message: `${students.length} students currently enrolled`,
          time: '1 hour ago',
          status: 'info'
        },
        {
          id: '3',
          type: 'exam',
          message: `${exams.length} exams scheduled in system`,
          time: '2 hours ago',
          status: 'warning'
        },
        {
          id: '4',
          type: 'teacher',
          message: `${teachers.length} teachers managing ${topics.length} topics`,
          time: '3 hours ago',
          status: 'info'
        }
      ];
      
      setActivities(newActivities);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const dashboardStats = [
    {
      title: "Total Students",
      value: loading ? "Loading..." : stats.totalStudents.toString(),
      change: { value: 12, type: 'increase' as const, period: "from last month" },
      icon: <Users className="h-5 w-5" />,
      description: "Active enrollments"
    },
    {
      title: "Total Teachers",
      value: loading ? "Loading..." : stats.totalTeachers.toString(),
      change: { value: 2, type: 'increase' as const, period: "from last month" },
      icon: <GraduationCap className="h-5 w-5" />,
      description: "Teaching staff"
    },
    {
      title: "Active Classes",
      value: loading ? "Loading..." : stats.totalClasses.toString(),
      change: { value: 0, type: 'neutral' as const, period: "no change" },
      icon: <School className="h-5 w-5" />,
      description: "Current semester"
    },
    {
      title: "Topics Available",
      value: loading ? "Loading..." : stats.totalTopics.toString(),
      change: { value: 8, type: 'increase' as const, period: "this week" },
      icon: <BookOpen className="h-5 w-5" />,
      description: "Course topics"
    }
  ];

  const upcomingEvents = [
    {
      title: "Parent-Teacher Meeting",
      date: "June 15, 2025",
      time: "10:00 AM",
      type: "meeting"
    },
    {
      title: "Final Exams Start",
      date: "June 20, 2025",
      time: "9:00 AM",
      type: "exam"
    },
    {
      title: "Summer Break Begins",
      date: "July 1, 2025",
      time: "All Day",
      type: "holiday"
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attendance': return <CheckSquare className="h-4 w-4" />;
      case 'student': return <Users className="h-4 w-4" />;
      case 'exam': return <Calendar className="h-4 w-4" />;
      case 'teacher': return <GraduationCap className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, Admin!</h2>
            <p className="text-blue-100">
              Here's what's happening at your school today.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Today</p>
            <p className="text-lg font-semibold">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={dashboardStats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activities
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchDashboardData}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full">
                  View All Activities
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {event.date}
                    </p>
                    <p className="text-xs text-gray-500">
                      {event.time}
                    </p>
                    <Badge 
                      variant="outline" 
                      className="mt-2 text-xs"
                    >
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  View Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => onPageChange?.('students')}
            >
              <Users className="h-6 w-6" />
              Add Student
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => onPageChange?.('teachers')}
            >
              <GraduationCap className="h-6 w-6" />
              Add Teacher
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => onPageChange?.('attendance-reports')}
            >
              <CheckSquare className="h-6 w-6" />
              Mark Attendance
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => onPageChange?.('exams')}
            >
              <Calendar className="h-6 w-6" />
              Schedule Exam
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
