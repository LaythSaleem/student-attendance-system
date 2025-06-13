import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Users,
  BookOpen,
  BarChart3,
  UserCheck,
  UserX,
  Clock,
  Download,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  FileText,
  TrendingUp
} from 'lucide-react';

const API_BASE = 'http://localhost:8888/api';

interface User {
  id: string;
  email: string;
  role?: string;
  name?: string;
}

interface TeacherDashboardProps {
  user: User;
  onSignOut: () => void;
}

interface Student {
  id: string;
  name: string;
  roll_number: string;
  email?: string;
  class?: string;
  section?: string;
  profile_picture?: string;
}

interface Class {
  id: string;
  name: string;
  section: string;
  subject_name?: string;
  student_count: number;
  total_topics: number;
  academic_year?: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  status: 'present' | 'absent' | 'late';
  photo?: string;
  date: string;
  timestamp: string;
  notes?: string;
}

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  todayAttendanceRate: number;
  weeklyAttendanceRate: number;
  pendingTasks: number;
  recentActivity: any[];
}

export function TeacherDashboard({ user, onSignOut }: TeacherDashboardProps) {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
  // Attendance states
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAttendanceMode, setIsAttendanceMode] = useState(false);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<{[key: string]: string}>({});
  const [attendanceMarked, setAttendanceMarked] = useState<{[key: string]: 'present' | 'absent' | 'late'}>({});
  
  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Helper functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // API functions
  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/teachers/my-classes`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classId: string) => {
    try {
      const response = await fetch(`${API_BASE}/teachers/classes/${classId}/students`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/teachers/dashboard-stats`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  const fetchAttendanceReports = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClass && selectedClass !== 'all') params.append('classId', selectedClass);
      if (selectedDate) params.append('date', selectedDate);
      
      const response = await fetch(`${API_BASE}/teachers/attendance-reports?${params}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data);
      }
    } catch (err) {
      console.error('Failed to fetch attendance reports:', err);
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = (studentId: string) => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        
        setCapturedPhotos(prev => ({
          ...prev,
          [studentId]: photoData
        }));

        markAttendance(studentId, 'present', photoData);
      }
    }
  };

  const markAttendance = (studentId: string, status: 'present' | 'absent' | 'late', photo?: string) => {
    setAttendanceMarked(prev => ({
      ...prev,
      [studentId]: status
    }));

    const student = students.find(s => s.id === studentId);
    if (student) {
      const record: AttendanceRecord = {
        id: Date.now().toString(),
        student_id: student.id,
        student_name: student.name,
        roll_number: student.roll_number,
        status,
        photo,
        date: selectedDate,
        timestamp: new Date().toISOString(),
        notes: ''
      };
      
      setAttendanceRecords(prev => [
        ...prev.filter(r => r.student_id !== studentId), // Remove existing record for this student
        record
      ]);
    }

    // Move to next student
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(prev => prev + 1);
    } else {
      // All students completed
      setIsAttendanceMode(false);
      stopCamera();
    }
  };

  const submitAttendance = async () => {
    if (attendanceRecords.length === 0) {
      setError('No attendance records to submit.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/teachers/photo-attendance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          classId: selectedClass,
          date: selectedDate,
          attendance: attendanceRecords.map(record => ({
            studentId: record.student_id,
            status: record.status,
            photo: record.photo,
            notes: record.notes
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit attendance');
      }

      setError(null);
      setAttendanceRecords([]);
      setCapturedPhotos({});
      setAttendanceMarked({});
      setCurrentStudentIndex(0);
      
      // Refresh dashboard stats
      fetchDashboardStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchTeacherClasses();
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedClass !== 'all') {
      fetchClassStudents(selectedClass);
      setCurrentStudentIndex(0);
      setAttendanceRecords([]);
      setCapturedPhotos({});
      setAttendanceMarked({});
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchAttendanceReports();
  }, [selectedClass, selectedDate]);

  // Calculate stats
  const currentStudent = students[currentStudentIndex];
  const totalStudents = students.length;
  const presentStudents = Object.values(attendanceMarked).filter(status => status === 'present').length;
  const absentStudents = Object.values(attendanceMarked).filter(status => status === 'absent').length;
  const lateStudents = Object.values(attendanceMarked).filter(status => status === 'late').length;
  const notMarked = totalStudents - presentStudents - absentStudents - lateStudents;
  const attendanceProgress = totalStudents > 0 ? ((presentStudents + absentStudents + lateStudents) / totalStudents) * 100 : 0;

  if (loading && classes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
                  <p className="text-sm text-gray-600">{user.name || user.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Active Classes: {classes.length}
              </Badge>
              <Button onClick={onSignOut} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setError(null)}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              My Students
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <Camera className="h-4 w-4 mr-2" />
              Daily Attendance
            </TabsTrigger>
            <TabsTrigger value="exam-attendance">
              <UserCheck className="h-4 w-4 mr-2" />
              Exam Attendance
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* 1. Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classes.length}</div>
                  <p className="text-xs text-muted-foreground">Active this semester</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {classes.reduce((total, cls) => total + cls.student_count, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all classes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.todayAttendanceRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">Current day average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.pendingTasks || 0}</div>
                  <p className="text-xs text-muted-foreground">Items to complete</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="h-20 flex-col space-y-2"
                    onClick={() => setActiveTab('attendance')}
                  >
                    <Camera className="h-6 w-6" />
                    <span>Take Attendance</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col space-y-2"
                    onClick={() => setActiveTab('exam-attendance')}
                  >
                    <UserCheck className="h-6 w-6" />
                    <span>Exam Attendance</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col space-y-2"
                    onClick={() => setActiveTab('reports')}
                  >
                    <FileText className="h-6 w-6" />
                    <span>Generate Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* My Classes Overview */}
            <Card>
              <CardHeader>
                <CardTitle>My Classes</CardTitle>
                <CardDescription>Quick overview of your assigned classes</CardDescription>
              </CardHeader>
              <CardContent>
                {classes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((cls) => (
                      <Card key={cls.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{cls.name}</CardTitle>
                          <CardDescription>Section: {cls.section}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Students:</span>
                              <span className="font-medium">{cls.student_count}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Topics:</span>
                              <span className="font-medium">{cls.total_topics}</span>
                            </div>
                            <Separator />
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => {
                                  setSelectedClass(cls.id);
                                  setActiveTab('attendance');
                                }}
                              >
                                <Camera className="h-4 w-4 mr-1" />
                                Take Attendance
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No classes assigned yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. My Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Students</CardTitle>
                <CardDescription>
                  Students across all your assigned classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Class Filter */}
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="class-filter">Filter by Class:</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - {cls.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Students List */}
                  {students.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Roll Number</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Recent Attendance</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar>
                                    <AvatarFallback>
                                      {student.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{student.name}</div>
                                    {student.email && (
                                      <div className="text-sm text-gray-500">{student.email}</div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{student.roll_number}</TableCell>
                              <TableCell>
                                {student.class} - {student.section}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">85%</Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      {selectedClass && selectedClass !== 'all' ? 'No students in selected class.' : 'Select a class to view students.'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Daily Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Photo-Based Daily Attendance</span>
                </CardTitle>
                <CardDescription>
                  Capture student photos to mark attendance. Students without photos will be marked absent.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Class Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="class-select">Select Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - {cls.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-select">Date</Label>
                    <Input
                      id="date-select"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Attendance Mode</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isAttendanceMode}
                        onCheckedChange={(checked: boolean) => {
                          setIsAttendanceMode(checked);
                          if (checked && selectedClass && selectedClass !== 'all' && students.length > 0) {
                            startCamera();
                          } else {
                            stopCamera();
                          }
                        }}
                        disabled={!selectedClass || selectedClass === 'all' || students.length === 0}
                      />
                      <span className="text-sm">
                        {isAttendanceMode ? 'Camera Active' : 'Camera Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Camera Preview and Controls */}
                {isAttendanceMode && selectedClass && selectedClass !== 'all' && currentStudent ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Camera View</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-64 bg-gray-100 rounded-lg"
                          />
                          <canvas ref={canvasRef} className="hidden" />
                          <div className="text-center space-y-2">
                            <p className="font-medium">Ready to capture:</p>
                            <p className="text-lg">{currentStudent.name}</p>
                            <p className="text-sm text-gray-600">
                              Roll Number: {currentStudent.roll_number}
                            </p>
                            <p className="text-sm text-gray-600">
                              Student {currentStudentIndex + 1} of {students.length}
                            </p>
                          </div>
                          <div className="flex space-x-2 justify-center">
                            <Button 
                              onClick={() => capturePhoto(currentStudent.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Take Photo (Present)
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => markAttendance(currentStudent.id, 'late')}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Mark Late
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => markAttendance(currentStudent.id, 'absent')}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Mark Absent
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Attendance Progress */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Attendance Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{presentStudents}</div>
                              <div className="text-sm text-green-600">Present</div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">{absentStudents}</div>
                              <div className="text-sm text-red-600">Absent</div>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-yellow-600">{lateStudents}</div>
                              <div className="text-sm text-yellow-600">Late</div>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xl font-bold text-gray-600">{notMarked}</div>
                            <div className="text-sm text-gray-600">Not Marked</div>
                          </div>
                          <Progress value={attendanceProgress} className="w-full" />
                          <p className="text-sm text-center text-gray-600">
                            {Math.round(attendanceProgress)}% Complete
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  (!selectedClass || selectedClass === 'all') && (
                    <div className="text-center py-8">
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Class</h3>
                      <p className="text-gray-600">Please select a class to begin taking attendance.</p>
                    </div>
                  )
                )}

                {/* Student List with Status */}
                {selectedClass && selectedClass !== 'all' && students.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Student List ({students.length} students)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {students.map((student, index) => {
                          const status = attendanceMarked[student.id];
                          const isCurrent = index === currentStudentIndex && isAttendanceMode;
                          return (
                            <div
                              key={student.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isCurrent 
                                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                                  : status === 'present' 
                                    ? 'bg-green-50 border-green-200' 
                                    : status === 'absent' 
                                      ? 'bg-red-50 border-red-200'
                                      : status === 'late'
                                        ? 'bg-yellow-50 border-yellow-200' 
                                        : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                  {capturedPhotos[student.id] ? (
                                    <AvatarImage src={capturedPhotos[student.id]} />
                                  ) : (
                                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-sm text-gray-600">{student.roll_number}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {status === 'present' && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Present
                                  </Badge>
                                )}
                                {status === 'absent' && (
                                  <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Absent
                                  </Badge>
                                )}
                                {status === 'late' && (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Late
                                  </Badge>
                                )}
                                {!status && isCurrent && (
                                  <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                                )}
                                {!status && !isCurrent && (
                                  <Badge variant="outline">Pending</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Submit Attendance */}
                {attendanceRecords.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-center space-x-4">
                        <Button 
                          onClick={submitAttendance} 
                          size="lg" 
                          className="px-8"
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Submit Attendance ({attendanceRecords.length} records)
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setAttendanceRecords([]);
                            setCapturedPhotos({});
                            setAttendanceMarked({});
                            setCurrentStudentIndex(0);
                            setIsAttendanceMode(false);
                            stopCamera();
                          }}
                        >
                          Reset
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Exam Attendance Tab */}
          <TabsContent value="exam-attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5" />
                  <span>Exam Attendance</span>
                </CardTitle>
                <CardDescription>
                  Take attendance for exams and special events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Exam Attendance</h3>
                  <p className="text-gray-600 mb-4">
                    Use the same photo-based system for exam attendance tracking.
                  </p>
                  <Button onClick={() => setActiveTab('attendance')}>
                    Use Daily Attendance System
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Reports</CardTitle>
                <CardDescription>Generate and view attendance reports for your classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Reports</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Today's Attendance Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Weekly Attendance Summary
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Monthly Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Student-wise Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Custom Report</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Date Range</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="date" />
                          <Input type="date" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Class</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name} - {cls.section}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Attendance Records */}
                {attendanceRecords.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Attendance Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Student</TableHead>
                              <TableHead>Roll Number</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Photo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendanceRecords.slice(0, 10).map((record) => (
                              <TableRow key={record.id}>
                                <TableCell>{record.date}</TableCell>
                                <TableCell>{record.student_name}</TableCell>
                                <TableCell>{record.roll_number}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      record.status === 'present' ? 'default' :
                                      record.status === 'late' ? 'secondary' : 'destructive'
                                    }
                                  >
                                    {record.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {record.photo ? (
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={record.photo} />
                                      <AvatarFallback>
                                        {record.student_name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ) : (
                                    <span className="text-gray-400">No photo</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
