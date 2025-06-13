import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useTeacherDashboard } from '@/hooks/useTeacherApi';
import ReportGenerator from '@/components/ReportGenerator';
import { 
  Camera, 
  Users, 
  BookOpen, 
  TrendingUp, 
  UserCheck, 
  UserX, 
  Clock,
  FileText,
  Plus,
  Loader2
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  role?: string;
}

interface Props {
  user: User;
  signOut: () => void;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  student_name: string;
  roll_number: string;
  status: 'present' | 'absent' | 'late';
  photo?: string;
  timestamp: string;
}

const TeacherDashboard = ({ signOut }: Props) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAttendanceMode, setIsAttendanceMode] = useState(false);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [capturedPhotos, setCapturedPhotos] = useState<{[key: string]: string}>({});
  const [attendanceMarked, setAttendanceMarked] = useState<{[key: string]: 'present' | 'absent' | 'late'}>({});
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const {
    classes,
    students,
    dashboardStats,
    recentActivity,
    loading,
    error,
    loadClassStudents,
    submitPhotoAttendance
  } = useTeacherDashboard();

  // Get current student for attendance
  const currentStudent = students[currentStudentIndex];

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
      alert('Camera access denied. Please enable camera permissions.');
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

        // Mark student as present
        setAttendanceMarked(prev => ({
          ...prev,
          [studentId]: 'present'
        }));

        // Add to attendance record
        const student = students.find(s => s.id === studentId);
        if (student) {
          const record: AttendanceRecord = {
            id: Date.now().toString(),
            studentId: student.id,
            student_name: student.name,
            roll_number: student.roll_number,
            status: 'present',
            photo: photoData,
            timestamp: new Date().toISOString()
          };
          setAttendanceRecords(prev => [...prev, record]);
        }

        // Move to next student
        if (currentStudentIndex < students.length - 1) {
          setCurrentStudentIndex(prev => prev + 1);
        }
      }
    }
  };

  const markAbsent = (studentId: string) => {
    setAttendanceMarked(prev => ({
      ...prev,
      [studentId]: 'absent'
    }));

    const student = students.find(s => s.id === studentId);
    if (student) {
      const record: AttendanceRecord = {
        id: Date.now().toString(),
        studentId: student.id,
        student_name: student.name,
        roll_number: student.roll_number,
        status: 'absent',
        timestamp: new Date().toISOString()
      };
      setAttendanceRecords(prev => [...prev, record]);
    }

    // Move to next student
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(prev => prev + 1);
    }
  };

  const submitAttendance = async () => {
    if (!selectedClass || attendanceRecords.length === 0) {
      alert('Please select a class and mark attendance for at least one student.');
      return;
    }

    const attendanceData = {
      classId: selectedClass,
      date: selectedDate,
      attendanceRecords: attendanceRecords.map(record => ({
        studentId: record.studentId,
        status: record.status,
        photo: record.photo,
        notes: ''
      }))
    };

    const success = await submitPhotoAttendance(attendanceData);
    
    if (success) {
      alert('Attendance submitted successfully!');
      setIsAttendanceMode(false);
      setAttendanceRecords([]);
      setCapturedPhotos({});
      setAttendanceMarked({});
      setCurrentStudentIndex(0);
      stopCamera();
    } else {
      alert('Failed to submit attendance. Please try again.');
    }
  };

  // Load students when class is selected
  useEffect(() => {
    if (selectedClass) {
      loadClassStudents(selectedClass);
      setCurrentStudentIndex(0);
      setAttendanceRecords([]);
      setCapturedPhotos({});
      setAttendanceMarked({});
    }
  }, [selectedClass, loadClassStudents]);

  // Stats calculations
  const totalStudents = students.length;
  const presentStudents = Object.values(attendanceMarked).filter(status => status === 'present').length;
  const absentStudents = Object.values(attendanceMarked).filter(status => status === 'absent').length;
  const notMarked = totalStudents - presentStudents - absentStudents;

  if (loading) {
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
                  <p className="text-sm text-gray-600">Demo Teacher • Mathematics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Active Classes: {classes.length}
              </Badge>
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.totalClasses || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Active this semester
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.totalStudents || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all classes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.todayAttendancePercentage || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    Current day average
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.pendingTasks || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Items to complete
                  </p>
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
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <Plus className="h-6 w-6" />
                    <span>Schedule Exam</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <FileText className="h-6 w-6" />
                    <span>Generate Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{activity.count} students</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Photo-Based Attendance</span>
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
                            {cls.name} - {cls.section} ({cls.subject_name})
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
                          if (checked && selectedClass && students.length > 0) {
                            startCamera();
                          } else {
                            stopCamera();
                          }
                        }}
                        disabled={!selectedClass || students.length === 0}
                      />
                      <span className="text-sm">
                        {isAttendanceMode ? 'Camera Active' : 'Camera Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Show message if no class selected */}
                {!selectedClass && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Please select a class to begin taking attendance.</p>
                  </div>
                )}

                {/* Camera Preview */}
                {isAttendanceMode && selectedClass && currentStudent && (
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
                            <p className="text-lg">{currentStudent.name} ({currentStudent.roll_number})</p>
                            <p className="text-sm text-gray-600">
                              Student {currentStudentIndex + 1} of {students.length}
                            </p>
                            <div className="flex space-x-2 justify-center">
                              <Button onClick={() => capturePhoto(currentStudent.id)}>
                                <Camera className="h-4 w-4 mr-2" />
                                Capture Photo
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => markAbsent(currentStudent.id)}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Mark Absent
                              </Button>
                            </div>
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
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{presentStudents}</div>
                              <div className="text-sm text-green-600">Present</div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">{absentStudents}</div>
                              <div className="text-sm text-red-600">Absent</div>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xl font-bold text-gray-600">{notMarked}</div>
                            <div className="text-sm text-gray-600">Not Marked</div>
                          </div>
                          <Progress 
                            value={totalStudents > 0 ? ((presentStudents + absentStudents) / totalStudents) * 100 : 0}
                            className="w-full h-2"
                          />
                          <p className="text-sm text-center text-gray-600">
                            {totalStudents > 0 ? Math.round(((presentStudents + absentStudents) / totalStudents) * 100) : 0}% Complete
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Student List */}
                {selectedClass && students.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Student List ({students.length} students)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
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
                                  <Badge className="bg-green-100 text-green-800">Present</Badge>
                                )}
                                {status === 'absent' && (
                                  <Badge variant="destructive">Absent</Badge>
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
                        <Button onClick={submitAttendance} size="lg" className="px-8">
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

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Classes</CardTitle>
                <CardDescription>Manage your assigned classes</CardDescription>
              </CardHeader>
              <CardContent>
                {classes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                      <Card key={cls.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">{cls.name} - {cls.section}</CardTitle>
                          <CardDescription>{cls.subject_name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Students:</span>
                              <span className="font-medium">{cls.student_count}</span>
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

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <ReportGenerator userRole="teacher" teacherId="current-teacher" />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Settings</CardTitle>
                <CardDescription>Manage your preferences and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Auto-mark absent after timeout</Label>
                      <p className="text-sm text-gray-600">Automatically mark students absent if not captured within time limit</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Save attendance photos</Label>
                      <p className="text-sm text-gray-600">Store captured photos for record keeping</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Notification reminders</Label>
                      <p className="text-sm text-gray-600">Get reminders for pending attendance</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Camera Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Photo Quality</Label>
                  <Select defaultValue="high">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Fast processing)</SelectItem>
                      <SelectItem value="medium">Medium (Balanced)</SelectItem>
                      <SelectItem value="high">High (Best quality)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Camera Position</Label>
                  <Select defaultValue="user">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Front Camera</SelectItem>
                      <SelectItem value="environment">Rear Camera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeacherDashboard;
