import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, CheckCircle, Users, Calendar } from 'lucide-react';
import { useStudentApi } from '@/hooks/useStudentApi';

interface Class {
  id: string;
  name: string;
  section: string;
  description?: string;
  capacity: number;
  teacher_name: string;
  teacher_subject?: string;
  academic_year?: string;
  total_students: number;
  student_count: number; // Added to match backend API response
  total_topics: number;
  topics: Topic[];
  created_at: string;
  updated_at: string;
}

interface Topic {
  id: string;
  name: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'completed';
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface StudentDashboardProps {
  onBack?: () => void;
}

export function StudentDashboard({ onBack }: StudentDashboardProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { loading, error, getMyClasses, getUserProfile } = useStudentApi();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesData, profileData] = await Promise.all([
        getMyClasses(),
        getUserProfile()
      ]);
      
      setClasses(classesData);
      setUserProfile(profileData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'; // Green
      case 'in_progress':
        return 'secondary'; // Blue
      case 'planned':
      default:
        return 'outline'; // Gray
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'planned':
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={loadData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          {userProfile && (
            <p className="text-gray-600 mt-1">
              Welcome back, {userProfile.email}!
            </p>
          )}
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Main
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Topics</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classes.reduce((total, cls) => total + cls.total_topics, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Topics</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classes.reduce((total, cls) => 
                    total + cls.topics.filter(topic => topic.status === 'completed').length, 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">My Classes</h2>
        
        {classes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Classes Available</h3>
              <p className="text-gray-500">
                There are currently no classes available to view.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {classes.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {classItem.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Section: {classItem.section}
                      </p>
                      {classItem.teacher_name && (
                        <p className="text-sm text-gray-600">
                          Teacher: {classItem.teacher_name}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {classItem.student_count} students
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {classItem.description && (
                    <p className="text-gray-600 text-sm">{classItem.description}</p>
                  )}
                  
                  {/* Topics Overview */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Topics</h4>
                      <span className="text-sm text-gray-500">
                        {classItem.total_topics} total
                      </span>
                    </div>
                    
                    {classItem.topics.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No topics yet</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {classItem.topics.map((topic) => (
                          <div key={topic.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(topic.status)}
                              <div>
                                <p className="font-medium text-sm text-gray-900">{topic.name}</p>
                                {topic.description && (
                                  <p className="text-xs text-gray-600">{topic.description}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant={getStatusBadgeVariant(topic.status)}>
                              {topic.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Class Info */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Capacity: {classItem.capacity}</span>
                      {classItem.academic_year && (
                        <span>Year: {classItem.academic_year}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
