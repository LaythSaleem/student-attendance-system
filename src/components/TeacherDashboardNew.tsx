import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  BookOpen, 
  Camera, 
  FileText, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  Download
} from 'lucide-react';

const API_BASE = 'https://scholar-track-pulse.onrender.com/api';

interface User {
  id: string;
  email: string;
  role?: string;
}

interface TeacherDashboardProps {
  user: User;
  onSignOut: () => void;
}

interface Student {
  id: string;
  name: string;
  roll_number: string;
  class: string;
  section: string;
  email?: string;
  enrollment_status?: string;
}

interface Class {
  id: string;
  name: string;
  section: string;
  academic_year: string;
  student_count: number;
  total_topics: number;
  teacher_name?: string;
}

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  assignedTopics: number;
  todayAttendanceRate: number;
  weeklyAttendanceRate: number;
  upcomingExams: number;
  pendingTasks: number;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  status: 'present' | 'absent' | 'late';
  photo?: string;
  timestamp: string;
  notes?: string;
  class_name?: string;
  marked_at?: string;
}

interface RecentActivity {
  type: string;
  description: string;
  date: string;
  count: number;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  class_name: string;
  class_section: string;
  total_sessions?: number;
  completed_sessions?: number;
}

interface UpcomingExam {
  id: string;
  title: string;
  date: string;
  time: string;
  topic_name: string;
  class_name: string;
  duration?: string;
}

interface WeeklyAttendanceData {
  date: string;
  day: string;
  attendance_rate: number;
  total_students: number;
  present_students: number;
}

interface StudentRequiringAttention {
  id: string;
  name: string;
  roll_number: string;
  class_name: string;
  weekly_attendance_rate: number;
  missed_sessions: number;
}

interface StudentWithAttendance {
  id: string;
  name: string;
  roll_number: string;
  stage: string;
  section: string;
  class_name: string;
  present_count: number;
  late_count: number;
  absent_count: number;
  total_sessions: number;
  attendance_rate: number;
  latest_photo: string | null;
  status: 'Good' | 'Average' | 'Poor' | 'No Data';
  enrollment_date: string;
  enrollment_status: string;
}

export function TeacherDashboardNew({ user, onSignOut }: TeacherDashboardProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'daily-attendance' | 'exam-attendance' | 'reports'>('overview');
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [assignedTopics, setAssignedTopics] = useState<Topic[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState<WeeklyAttendanceData[]>([]);
  const [studentsRequiringAttention, setStudentsRequiringAttention] = useState<StudentRequiringAttention[]>([]);
  const [studentsWithAttendance, setStudentsWithAttendance] = useState<StudentWithAttendance[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Camera and attendance state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<{[key: string]: string}>({});
  const [attendanceMarked, setAttendanceMarked] = useState<{[key: string]: 'present' | 'absent'}>({});
  const [isAttendanceSession, setIsAttendanceSession] = useState(false);
  
  // Exam attendance specific state
  const [examCapturedPhotos, setExamCapturedPhotos] = useState<{[key: string]: string}>({});
  const [examAttendanceMarked, setExamAttendanceMarked] = useState<{[key: string]: 'present' | 'absent'}>({});
  const [isExamAttendanceSession, setIsExamAttendanceSession] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [examCurrentStudentIndex, setExamCurrentStudentIndex] = useState(0);
  
  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Student filtering state
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Photo preview state
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  
  // Student profile state
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentWithAttendance | null>(null);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Helper functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
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
      setLoading(true);
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
    } finally {
      setLoading(false);
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

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch(`${API_BASE}/teachers/recent-activity`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
    }
  };

  const fetchAssignedTopics = async () => {
    try {
      const response = await fetch(`${API_BASE}/teachers/my-topics`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignedTopics(data);
      }
    } catch (err) {
      console.error('Failed to fetch assigned topics:', err);
    }
  };

  const fetchUpcomingExams = async () => {
    try {
      const response = await fetch(`${API_BASE}/teachers/upcoming-exams`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUpcomingExams(data);
      }
    } catch (err) {
      console.error('Failed to fetch upcoming exams:', err);
    }
  };

  const fetchWeeklyAttendanceData = async () => {
    try {
      const response = await fetch(`${API_BASE}/teachers/weekly-attendance`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setWeeklyAttendanceData(data);
      }
    } catch (err) {
      console.error('Failed to fetch weekly attendance data:', err);
    }
  };

  const fetchStudentsRequiringAttention = async () => {
    try {
      const response = await fetch(`${API_BASE}/teachers/students-requiring-attention`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudentsRequiringAttention(data);
      }
    } catch (err) {
      console.error('Failed to fetch students requiring attention:', err);
    }
  };

  const fetchStudentsWithAttendance = async () => {
    try {
      const params = new URLSearchParams();
      if (studentSearchTerm) params.append('search', studentSearchTerm);
      if (selectedStage && selectedStage !== 'all') params.append('stage', selectedStage);
      
      const response = await fetch(`${API_BASE}/teachers/students-with-attendance?${params}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudentsWithAttendance(data);
      }
    } catch (err) {
      console.error('Failed to fetch students with attendance:', err);
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
      setIsCameraActive(true);
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
    setIsCameraActive(false);
  };

  // End attendance session function
  const endAttendanceSession = () => {
    setIsAttendanceSession(false);
    setCurrentStudentIndex(0);
    stopCamera();
  };

  const capturePhoto = (studentId: string) => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      // Optimize canvas size for smaller payload
      const maxWidth = 640;
      const maxHeight = 480;
      const aspectRatio = video.videoWidth / video.videoHeight;
      
      let canvasWidth = video.videoWidth;
      let canvasHeight = video.videoHeight;
      
      if (canvasWidth > maxWidth) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth / aspectRatio;
      }
      
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * aspectRatio;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      if (context) {
        context.drawImage(video, 0, 0, canvasWidth, canvasHeight);
        // Increased compression (lower quality) for smaller file size
        const photoData = canvas.toDataURL('image/jpeg', 0.6);
        
        setCapturedPhotos(prev => ({
          ...prev,
          [studentId]: photoData
        }));

        // Mark student as present (photo = present)
        setAttendanceMarked(prev => ({
          ...prev,
          [studentId]: 'present'
        }));
      }
    }
  };

  const markAbsent = (studentId: string) => {
    // No photo = absent
    setAttendanceMarked(prev => ({
      ...prev,
      [studentId]: 'absent'
    }));
  };

  // Load existing attendance for the same day/topic
  const loadExistingAttendance = async () => {
    if (!selectedClass || selectedClass === 'all' || !selectedDate) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/teachers/attendance-records?classId=${selectedClass}&date=${selectedDate}${selectedTopic ? `&topicId=${selectedTopic}` : ''}`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const existingRecords = await response.json();
        
        if (existingRecords.length > 0) {
          const loadedAttendance: Record<string, 'present' | 'absent'> = {};
          const loadedPhotos: Record<string, string> = {};
          
          existingRecords.forEach((record: any) => {
            loadedAttendance[record.student_id] = record.status;
            if (record.photo) {
              loadedPhotos[record.student_id] = record.photo;
            }
          });
          
          setAttendanceMarked(loadedAttendance);
          setCapturedPhotos(loadedPhotos);
          
          setSuccessMessage(`📊 Loaded existing attendance for ${selectedDate}. Found ${existingRecords.length} students with previous records. You can continue editing.`);
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          setSuccessMessage(`📅 Starting fresh attendance session for ${selectedDate}. No previous records found.`);
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      }
    } catch (err) {
      console.error('Failed to load existing attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Modified start attendance session to load existing data
  const startAttendanceSession = () => {
    if (!selectedClass || selectedClass === 'all') {
      setError('Please select a specific class first');
      return;
    }
    
    setIsAttendanceSession(true);
    setCurrentStudentIndex(0);
    
    // Load existing attendance instead of clearing
    loadExistingAttendance();
    startCamera();
  };

  // Modified submit attendance to keep session active
  const submitAttendance = async () => {
    if (Object.keys(attendanceMarked).length === 0) {
      setError('No attendance records to submit.');
      return;
    }

    try {
      setLoading(true);
      
      const attendanceData = Object.entries(attendanceMarked).map(([studentId, status]) => ({
        studentId,
        status,
        photo: capturedPhotos[studentId] || null,
        notes: status === 'present' ? 'Present with photo' : 'Absent - no photo'
      }));

      const response = await fetch(`${API_BASE}/teachers/photo-attendance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          classId: selectedClass,
          date: selectedDate,
          topicId: selectedTopic || null,
          attendance: attendanceData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit attendance');
      }

      alert('Attendance saved successfully! You can continue editing.');
      // Keep session active - don't clear data or end session
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  // New function to finalize and end session
  const finalizeAttendance = () => {
    setAttendanceMarked({});
    setCapturedPhotos({});
    endAttendanceSession();
    alert('Attendance session completed successfully!');
  };

  // Exam Attendance Functions
  const captureExamPhoto = (studentId: string) => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      // Optimize canvas size for smaller payload
      const maxWidth = 640;
      const maxHeight = 480;
      const aspectRatio = video.videoWidth / video.videoHeight;
      
      let canvasWidth = video.videoWidth;
      let canvasHeight = video.videoHeight;
      
      if (canvasWidth > maxWidth) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth / aspectRatio;
      }
      
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * aspectRatio;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      if (context) {
        context.drawImage(video, 0, 0, canvasWidth, canvasHeight);
        const photoData = canvas.toDataURL('image/jpeg', 0.6);
        
        setExamCapturedPhotos(prev => ({
          ...prev,
          [studentId]: photoData
        }));

        // Mark student as present for exam
        setExamAttendanceMarked(prev => ({
          ...prev,
          [studentId]: 'present'
        }));
      }
    }
  };

  const markExamAbsent = (studentId: string) => {
    setExamAttendanceMarked(prev => ({
      ...prev,
      [studentId]: 'absent'
    }));
  };

  const loadExistingExamAttendance = async () => {
    if (!selectedClass || selectedClass === 'all' || !selectedDate || !selectedExam) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/teachers/exam-attendance-records?classId=${selectedClass}&date=${selectedDate}&examId=${selectedExam}`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const existingRecords = await response.json();
        
        if (existingRecords.length > 0) {
          const loadedAttendance: Record<string, 'present' | 'absent'> = {};
          const loadedPhotos: Record<string, string> = {};
          
          existingRecords.forEach((record: any) => {
            loadedAttendance[record.student_id] = record.status;
            if (record.photo) {
              loadedPhotos[record.student_id] = record.photo;
            }
          });

          setExamAttendanceMarked(prev => ({ ...prev, ...loadedAttendance }));
          setExamCapturedPhotos(prev => ({ ...prev, ...loadedPhotos }));
          
          console.log(`Loaded existing exam attendance for ${existingRecords.length} students`);
        }
      }
    } catch (err) {
      console.error('Failed to load existing exam attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const startExamAttendanceSession = () => {
    setIsExamAttendanceSession(true);
    setExamCurrentStudentIndex(0);
    loadExistingExamAttendance();
    startCamera();
  };

  const endExamAttendanceSession = () => {
    setIsExamAttendanceSession(false);
    stopCamera();
  };

  const submitExamAttendance = async () => {
    if (Object.keys(examAttendanceMarked).length === 0) {
      setError('No exam attendance records to submit.');
      return;
    }

    try {
      setLoading(true);
      
      const attendanceData = Object.entries(examAttendanceMarked).map(([studentId, status]) => ({
        studentId,
        status,
        photo: examCapturedPhotos[studentId] || null,
        notes: status === 'present' ? 'Present with photo' : 'Absent - no photo'
      }));

      const response = await fetch(`${API_BASE}/teachers/exam-attendance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          classId: selectedClass,
          examId: selectedExam,
          date: selectedDate,
          attendance: attendanceData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit exam attendance');
      }

      alert('Exam attendance saved successfully! You can continue editing.');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit exam attendance');
    } finally {
      setLoading(false);
    }
  };

  const finalizeExamAttendance = () => {
    setExamAttendanceMarked({});
    setExamCapturedPhotos({});
    endExamAttendanceSession();
    alert('Exam attendance session completed successfully!');
  };

  // Missing Functions Implementation
  const viewStudentProfile = (student: StudentWithAttendance) => {
    setSelectedStudentProfile(student);
    setIsStudentProfileOpen(true);
  };

  const generateWeeklyReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const reportData = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        classId: selectedClass === 'all' ? null : selectedClass
      };
      
      const response = await fetch(`${API_BASE}/teachers/weekly-report`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reportData)
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `weekly-attendance-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccessMessage('Weekly report downloaded successfully!');
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating weekly report:', err);
      setError('Failed to generate weekly report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchTeacherClasses();
    fetchDashboardStats();
    fetchRecentActivity();
    fetchAssignedTopics();
    fetchUpcomingExams();
    fetchWeeklyAttendanceData();
    fetchStudentsRequiringAttention();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchAttendanceReports();
    }
  }, [activeTab, selectedClass, selectedDate]);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudentsWithAttendance();
    }
  }, [activeTab, studentSearchTerm, selectedStage]);

  const currentStudent = students[currentStudentIndex];

  // Render functions
  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-8">
        <Avatar>
          <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{user.email}</h3>
          <p className="text-sm text-gray-500">Teacher</p>
        </div>
      </div>

      <nav className="space-y-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
            activeTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="h-5 w-5" />
          <span>Dashboard Overview</span>
        </button>
        
        <button
          onClick={() => setActiveTab('students')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
            activeTab === 'students' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Users className="h-5 w-5" />
          <span>My Students</span>
        </button>
        
        <button
          onClick={() => setActiveTab('daily-attendance')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
            activeTab === 'daily-attendance' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Camera className="h-5 w-5" />
          <span>Daily Attendance</span>
        </button>
        
        <button
          onClick={() => setActiveTab('exam-attendance')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
            activeTab === 'exam-attendance' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <BookOpen className="h-5 w-5" />
          <span>Exam Attendance</span>
        </button>
        
        <button
          onClick={() => setActiveTab('reports')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
            activeTab === 'reports' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FileText className="h-5 w-5" />
          <span>Attendance Reports</span>
        </button>
      </nav>

      <div className="mt-auto pt-6">
        <Button 
          onClick={onSignOut}
          variant="outline" 
          className="w-full"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's your teaching summary and key metrics.</p>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Students</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dashboardStats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Across {dashboardStats?.totalClasses || 0} classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Topics</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{assignedTopics.length}</div>
            <p className="text-xs text-muted-foreground">Topics to teach</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dashboardStats?.weeklyAttendanceRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Last 7 days average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{upcomingExams.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled exams</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Attendance Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Weekly Attendance Overview</CardTitle>
            <CardDescription>Attendance statistics for the last 7 days</CardDescription>
          </div>
          <Button size="sm" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Generate Report</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Weekly Chart */}
            <div className="grid grid-cols-7 gap-2">
              {weeklyAttendanceData.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs font-medium text-gray-600 mb-2">{day.day}</div>
                  <div className="h-20 bg-gray-100 rounded-lg flex items-end justify-center p-1">
                    <div className="w-full relative">
                      <Progress 
                        value={day.attendance_rate} 
                        className="w-full h-16 [&>div]:bg-blue-500"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {day.attendance_rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {day.present_students}/{day.total_students}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Weekly Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {weeklyAttendanceData.reduce((sum, day) => sum + day.present_students, 0)}
                </div>
                <p className="text-sm text-gray-600">Total Present</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {weeklyAttendanceData.reduce((sum, day) => sum + (day.total_students - day.present_students), 0)}
                </div>
                <p className="text-sm text-gray-600">Total Absent</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {weeklyAttendanceData.length > 0 ? 
                    Math.round(weeklyAttendanceData.reduce((sum, day) => sum + day.attendance_rate, 0) / weeklyAttendanceData.length) 
                    : 0}%
                </div>
                <p className="text-sm text-gray-600">Average Rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Assigned Topics */}
      <Card>
        <CardHeader>
          <CardTitle>My Assigned Topics</CardTitle>
          <CardDescription>Topics you're responsible for teaching</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedTopics.map((topic) => (
              <Card key={topic.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{topic.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {topic.class_name} - {topic.class_section}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{topic.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{topic.completed_sessions || 0}/{topic.total_sessions || 0}</span>
                    </div>
                    <Progress 
                      value={topic.total_sessions ? ((topic.completed_sessions || 0) / topic.total_sessions) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {assignedTopics.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No topics assigned yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Exams */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Exams</CardTitle>
          <CardDescription>Scheduled exams for your topics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{exam.title}</h3>
                    <p className="text-sm text-gray-600">{exam.topic_name} • {exam.class_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(exam.date).toLocaleDateString()} at {exam.time}
                      {exam.duration && ` • ${exam.duration}`}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-purple-600">
                  {Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                </Badge>
              </div>
            ))}
          </div>
          
          {upcomingExams.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No upcoming exams scheduled</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Requiring Attention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Students Requiring Attention</span>
            <Badge variant="destructive">{studentsRequiringAttention.length}</Badge>
          </CardTitle>
          <CardDescription>Students with attendance below 75% this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {studentsRequiringAttention.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-red-100 text-red-600">
                      {student.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-gray-600">{student.roll_number} • {student.class_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-red-600">
                    {student.weekly_attendance_rate}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {student.missed_sessions} missed
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {studentsRequiringAttention.length === 0 && (
            <div className="text-center py-8 text-green-600">
              <CheckCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="font-medium">All students are doing well!</p>
              <p className="text-sm text-gray-500">No students with attendance below 75%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest teaching activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{activity.description}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                </div>
                <Badge variant="secondary" className="flex-shrink-0">{activity.count}</Badge>
              </div>
            ))}
          </div>
          
          {recentActivity.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-600">View student attendance data and performance across all your classes</p>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Students</CardTitle>
          <CardDescription>Search and filter students by name, ID, or stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student-search">Search Students</Label>
              <Input
                id="student-search"
                placeholder="Search by name or student ID..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-filter">Filter by Stage</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {Array.from(new Set(classes.map(cls => cls.name))).map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={fetchStudentsWithAttendance} className="w-full md:w-auto">
              <Users className="h-4 w-4 mr-2" />
              Load Students with Attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      {studentsWithAttendance.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance Overview</CardTitle>
            <CardDescription>
              Showing {studentsWithAttendance.length} students with 30-day attendance data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Student</th>
                    <th className="text-left p-3 font-medium">Stage</th>
                    <th className="text-left p-3 font-medium">Latest Photo</th>
                    <th className="text-left p-3 font-medium">Attendance Rate</th>
                    <th className="text-left p-3 font-medium">Present/Late/Absent</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsWithAttendance.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500">ID: {student.roll_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {student.stage} - {student.section}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {student.latest_photo ? (
                          <Avatar className="h-8 w-8">
                            <img 
                              src={student.latest_photo} 
                              alt={`${student.name} photo`}
                              className="object-cover"
                            />
                            <AvatarFallback>
                              {student.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <span className="text-gray-400 text-sm">No photo</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {student.attendance_rate ? student.attendance_rate.toFixed(1) : '0.0'}%
                            </span>
                          </div>
                          <Progress 
                            value={student.attendance_rate || 0} 
                            className="w-20 h-2"
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center space-x-4">
                            <span className="text-green-600">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              {student.present_count}
                            </span>
                            <span className="text-yellow-600">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {student.late_count}
                            </span>
                            <span className="text-red-600">
                              <XCircle className="h-3 w-3 inline mr-1" />
                              {student.absent_count}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Total: {student.total_sessions} sessions
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant={
                            student.status === 'Good' ? 'default' :
                            student.status === 'Average' ? 'secondary' : 
                            'destructive'
                          }
                          className={
                            student.status === 'Good' ? 'bg-green-100 text-green-800' :
                            student.status === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {student.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewStudentProfile(student)}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Profile
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Student Data</h3>
            <p className="text-gray-500 mb-4">
              Use the filter above to search and load students with attendance data.
            </p>
            <Button onClick={fetchStudentsWithAttendance} variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Load All Students
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderDailyAttendance = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Attendance</h1>
        <p className="text-gray-600">Take attendance using camera capture - Photo = Present, No Photo = Absent</p>
      </div>

      {/* Enhanced Attendance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Settings</CardTitle>
          <CardDescription>Select filters to find and mark attendance for your students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date-select">Date</Label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="stage-select">Stage</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {Array.from(new Set(classes.map(cls => cls.name))).map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="class-select">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes
                    .filter(cls => selectedStage === 'all' || cls.name === selectedStage)
                    .map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="topic-select">Topic (Optional)</Label>
              <Select value={selectedTopic || 'all'} onValueChange={(value) => setSelectedTopic(value === 'all' ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {assignedTopics
                    .filter(topic => 
                      selectedStage === 'all' || 
                      selectedClass === 'all' || 
                      topic.class_name === selectedStage ||
                      classes.find(c => c.id === selectedClass)?.name === topic.class_name
                    )
                    .map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name} ({topic.class_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-4">
            {!isAttendanceSession ? (
              <Button 
                onClick={startAttendanceSession}
                disabled={!selectedClass || selectedClass === 'all' || loading}
                className="flex items-center space-x-2"
              >
                <Camera className="h-4 w-4" />
                <span>Start Attendance Session</span>
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  onClick={endAttendanceSession}
                  variant="outline"
                >
                  End Session
                </Button>
                <Button 
                  onClick={submitAttendance}
                  disabled={Object.keys(attendanceMarked).length === 0 || loading}
                  className="flex items-center space-x-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Attendance</span>
                </Button>
                <Button 
                  onClick={finalizeAttendance}
                  disabled={Object.keys(attendanceMarked).length === 0}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <span>Finalize Attendance</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Camera and Attendance Taking */}
      {isAttendanceSession && selectedClass && selectedClass !== 'all' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Camera View - Enhanced */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Camera View</span>
                {currentStudent && (
                  <Badge variant="outline">
                    Student {currentStudentIndex + 1} of {students.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Enhanced Student Info Card */}
                {currentStudent && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          {capturedPhotos[currentStudent.id] ? (
                            <img 
                              src={capturedPhotos[currentStudent.id]} 
                              alt={currentStudent.name}
                              className="object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setPreviewPhoto(capturedPhotos[currentStudent.id])}
                            />
                          ) : (
                            <AvatarFallback className="text-lg font-bold bg-gray-200">
                              {currentStudent.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-blue-900">{currentStudent.name}</h3>
                          <p className="text-blue-700 font-medium">ID: {currentStudent.roll_number}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge variant={attendanceMarked[currentStudent.id] === 'present' ? 'default' : 
                                          attendanceMarked[currentStudent.id] === 'absent' ? 'destructive' : 'outline'}>
                              {attendanceMarked[currentStudent.id] === 'present' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {attendanceMarked[currentStudent.id] === 'absent' && <XCircle className="h-3 w-3 mr-1" />}
                              {attendanceMarked[currentStudent.id] || 'Not Marked'}
                            </Badge>
                            {capturedPhotos[currentStudent.id] && (
                              <Badge variant="secondary" className="text-green-700 bg-green-100">
                                <Camera className="h-3 w-3 mr-1" />
                                Photo Captured
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Camera Feed */}
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-80 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Camera will activate when session starts</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Enhanced Controls */}
                {currentStudent && (
                  <div className="flex space-x-4 justify-center">
                    <Button 
                      onClick={() => capturePhoto(currentStudent.id)}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                      disabled={!isCameraActive}
                      size="lg"
                    >
                      <Camera className="h-5 w-5" />
                      <span>Capture Photo (Present)</span>
                    </Button>
                    
                    <Button 
                      onClick={() => markAbsent(currentStudent.id)}
                      variant="destructive"
                      className="flex items-center space-x-2"
                      size="lg"
                    >
                      <XCircle className="h-5 w-5" />
                      <span>Mark Absent</span>
                    </Button>
                  </div>
                )}

                {/* Navigation Controls */}
                {students.length > 1 && (
                  <div className="flex justify-between items-center">
                    <Button
                      onClick={() => setCurrentStudentIndex(Math.max(0, currentStudentIndex - 1))}
                      disabled={currentStudentIndex === 0}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <span>← Previous</span>
                    </Button>
                    
                    <span className="text-sm text-gray-500 font-medium">
                      {currentStudentIndex + 1} / {students.length}
                    </span>
                    
                    <Button
                      onClick={() => setCurrentStudentIndex(Math.min(students.length - 1, currentStudentIndex + 1))}
                      disabled={currentStudentIndex === students.length - 1}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <span>Next →</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Attendance Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Progress</CardTitle>
              <CardDescription>Track session completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-3 bg-green-50 border-green-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {Object.values(attendanceMarked).filter(status => status === 'present').length}
                      </div>
                      <div className="text-xs text-green-600">Present</div>
                    </div>
                  </Card>
                  <Card className="p-3 bg-red-50 border-red-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-700">
                        {Object.values(attendanceMarked).filter(status => status === 'absent').length}
                      </div>
                      <div className="text-xs text-red-600">Absent</div>
                    </div>
                  </Card>
                </div>

                {/* Overall Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-gray-600">
                      {Object.keys(attendanceMarked).length} / {students.length}
                    </span>
                  </div>
                  <Progress 
                    value={(Object.keys(attendanceMarked).length / students.length) * 100} 
                    className="w-full h-3" 
                  />
                </div>

                {/* Enhanced Student List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Students</h4>
                  {students.map((student, index) => {
                    const status = attendanceMarked[student.id];
                    const isCurrent = index === currentStudentIndex;
                    const hasPhoto = capturedPhotos[student.id];
                    
                    return (
                      <Card
                        key={student.id}
                        className={`p-3 cursor-pointer transition-all ${
                          isCurrent ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 
                          status === 'present' ? 'bg-green-50 border-green-200' : 
                          status === 'absent' ? 'bg-red-50 border-red-200' : 
                          'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => setCurrentStudentIndex(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              {hasPhoto ? (
                                <img 
                                  src={hasPhoto} 
                                  alt={student.name}
                                  className="object-cover cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewPhoto(hasPhoto);
                                  }}
                                />
                              ) : (
                                <AvatarFallback className="text-xs">
                                  {student.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{student.name}</p>
                              <p className="text-xs text-gray-600">{student.roll_number}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {hasPhoto && (
                              <Camera className="h-4 w-4 text-green-600" />
                            )}
                            {status === 'present' && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {status === 'absent' && <XCircle className="h-5 w-5 text-red-600" />}
                            {!status && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Photo Preview Dialog */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setPreviewPhoto(null)}>
          <div className="relative max-w-4xl max-h-4xl p-4">
            <img 
              src={previewPhoto} 
              alt="Student Photo Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-75"
              size="sm"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Attendance Summary (when not in session) */}
      {!isAttendanceSession && Object.keys(attendanceMarked).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance Session</CardTitle>
            <CardDescription>Last attendance session summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(attendanceMarked).filter(status => status === 'present').length}
                </div>
                <div className="text-sm text-gray-600">Students Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(attendanceMarked).filter(status => status === 'absent').length}
                </div>
                <div className="text-sm text-gray-600">Students Absent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((Object.values(attendanceMarked).filter(status => status === 'present').length / 
                              Object.keys(attendanceMarked).length) * 100) || 0}%
                </div>
                <div className="text-sm text-gray-600">Attendance Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderExamAttendance = () => {
    const examCurrentStudent = students[examCurrentStudentIndex];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Attendance</h1>
          <p className="text-gray-600">Take attendance for exams using camera capture</p>
        </div>

        {/* Exam Selection and Session Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Exam Attendance Session</CardTitle>
            <CardDescription>Select exam and manage attendance session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="class-select">Class</Label>
                <Select value={selectedClass || 'all'} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="date-select">Date</Label>
                <Input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="exam-select">Exam</Label>
                <Select value={selectedExam || 'all'} onValueChange={(value) => setSelectedExam(value === 'all' ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {upcomingExams
                      .filter(exam => 
                        selectedClass === 'all' || 
                        exam.class_name === classes.find(c => c.id === selectedClass)?.name
                      )
                      .map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.title} ({exam.class_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-4">
              {!isExamAttendanceSession ? (
                <Button 
                  onClick={startExamAttendanceSession}
                  disabled={!selectedClass || selectedClass === 'all' || !selectedExam || loading}
                  className="flex items-center space-x-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>Start Exam Attendance Session</span>
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    onClick={endExamAttendanceSession}
                    variant="outline"
                  >
                    End Session
                  </Button>
                  <Button 
                    onClick={submitExamAttendance}
                    disabled={Object.keys(examAttendanceMarked).length === 0 || loading}
                    className="flex items-center space-x-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Save Exam Attendance</span>
                  </Button>
                  <Button 
                    onClick={finalizeExamAttendance}
                    disabled={Object.keys(examAttendanceMarked).length === 0}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                  >
                    <span>Finalize Exam Attendance</span>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Camera and Exam Attendance Taking */}
        {isExamAttendanceSession && selectedClass && selectedClass !== 'all' && selectedExam && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Camera View */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Camera View - Exam Attendance</span>
                  {examCurrentStudent && (
                    <Badge variant="outline">
                      Student {examCurrentStudentIndex + 1} of {students.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Student Info Card */}
                  {examCurrentStudent && (
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-16 w-16">
                            {examCapturedPhotos[examCurrentStudent.id] ? (
                              <img 
                                src={examCapturedPhotos[examCurrentStudent.id]} 
                                alt={examCurrentStudent.name}
                                className="object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setPreviewPhoto(examCapturedPhotos[examCurrentStudent.id])}
                              />
                            ) : (
                              <AvatarFallback className="text-lg font-bold bg-gray-200">
                                {examCurrentStudent.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-purple-900">{examCurrentStudent.name}</h3>
                            <p className="text-purple-700">Roll Number: {examCurrentStudent.roll_number}</p>
                            {selectedExam && (
                              <p className="text-purple-600 text-sm">
                                Exam: {upcomingExams.find(e => e.id === selectedExam)?.title}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              {examAttendanceMarked[examCurrentStudent.id] === 'present' && (
                                <Badge className="bg-green-100 text-green-800">Present</Badge>
                              )}
                              {examAttendanceMarked[examCurrentStudent.id] === 'absent' && (
                                <Badge className="bg-red-100 text-red-800">Absent</Badge>
                              )}
                              {examCapturedPhotos[examCurrentStudent.id] && (
                                <Badge className="bg-blue-100 text-blue-800">Photo Captured</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Camera Feed */}
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                        <div className="text-center text-white">
                          <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Camera not active</p>
                          <p className="text-sm opacity-75">Start a session to begin</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  {examCurrentStudent && isCameraActive && (
                    <div className="flex space-x-4 justify-center">
                      <Button 
                        onClick={() => captureExamPhoto(examCurrentStudent.id)}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <Camera className="h-5 w-5" />
                        <span>Capture Photo (Present)</span>
                      </Button>
                      
                      <Button 
                        onClick={() => markExamAbsent(examCurrentStudent.id)}
                        variant="destructive"
                        className="flex items-center space-x-2"
                        size="lg"
                      >
                        <XCircle className="h-5 w-5" />
                        <span>Mark Absent</span>
                      </Button>
                    </div>
                  )}

                  {/* Navigation Controls */}
                  {students.length > 1 && (
                    <div className="flex justify-between items-center">
                      <Button
                        onClick={() => setExamCurrentStudentIndex(Math.max(0, examCurrentStudentIndex - 1))}
                        disabled={examCurrentStudentIndex === 0}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <span>← Previous</span>
                      </Button>
                      
                      <span className="text-sm text-gray-500 font-medium">
                        {examCurrentStudentIndex + 1} / {students.length}
                      </span>
                      
                      <Button
                        onClick={() => setExamCurrentStudentIndex(Math.min(students.length - 1, examCurrentStudentIndex + 1))}
                        disabled={examCurrentStudentIndex === students.length - 1}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <span>Next →</span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Exam Attendance Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Attendance Progress</CardTitle>
                <CardDescription>Track exam session completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-3 bg-green-50 border-green-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {Object.values(examAttendanceMarked).filter(status => status === 'present').length}
                        </div>
                        <div className="text-xs text-green-600">Present</div>
                                           </div>
                    </Card>
                    <Card className="p-3 bg-red-50 border-red-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-700">
                          {Object.values(examAttendanceMarked).filter(status => status === 'absent').length}
                        </div>
                        <div className="text-xs text-red-600">Absent</div>
                      </div>
                    </Card>
                  </div>

                  {/* Overall Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Overall Progress</span>
                      <span className="text-gray-600">
                        {Object.keys(examAttendanceMarked).length} / {students.length}
                      </span>
                    </div>
                    <Progress 
                      value={(Object.keys(examAttendanceMarked).length / students.length) * 100} 
                      className="w-full h-3" 
                    />
                  </div>

                  {/* Student List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Students</h4>
                    {students.map((student, index) => {
                      const status = examAttendanceMarked[student.id];
                      const isCurrent = index === examCurrentStudentIndex;
                      const hasPhoto = examCapturedPhotos[student.id];
                      
                      return (
                        <Card
                          key={student.id}
                          className={`p-3 cursor-pointer transition-all ${
                            isCurrent 
                              ? 'border-purple-200 bg-purple-50 shadow-md' 
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => setExamCurrentStudentIndex(index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                {hasPhoto ? (
                                  <img 
                                    src={examCapturedPhotos[student.id]} 
                                    alt={student.name}
                                    className="object-cover"
                                  />
                                ) : (
                                  <AvatarFallback className="text-xs">
                                    {student.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.roll_number}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {status === 'present' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {status === 'absent' && <XCircle className="h-4 w-4 text-red-500" />}
                              {hasPhoto && <Camera className="h-4 w-4 text-blue-500" />}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Exam Attendance Summary */}
        {!isExamAttendanceSession && Object.keys(examAttendanceMarked).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Exam Attendance Session</CardTitle>
              <CardDescription>Last exam attendance session summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(examAttendanceMarked).filter(status => status === 'present').length}
                  </div>
                  <div className="text-sm text-gray-600">Students Present</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {Object.values(examAttendanceMarked).filter(status => status === 'absent').length}
                  </div>
                  <div className="text-sm text-gray-600">Students Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(examCapturedPhotos).length}
                  </div>
                  <div className="text-sm text-gray-600">Photos Captured</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo Preview Modal */}
        {previewPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setPreviewPhoto(null)}>
            <div className="max-w-4xl max-h-4xl p-4">
              <img 
                src={previewPhoto} 
                alt="Preview" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReports = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
        <p className="text-gray-600">View and analyze attendance data for your students</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="report-class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="report-date">Date</Label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={fetchAttendanceReports}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Generate Report</span>
            </Button>
            
            <Button 
              onClick={generateWeeklyReport}
              disabled={isGeneratingReport}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {isGeneratingReport && <Loader2 className="h-4 w-4 animate-spin" />}
              <Download className="h-4 w-4" />
              <span>Weekly Report (CSV)</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {attendanceRecords.length} records found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Student</th>
                  <th className="text-left p-3">Roll Number</th>
                  <th className="text-left p-3">Class</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Photo</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{record.student_name}</td>
                    <td className="p-3">{record.roll_number}</td>
                    <td className="p-3">{record.class_name || 'N/A'}</td>
                    <td className="p-3">{record.marked_at ? new Date(record.marked_at).toLocaleDateString() : new Date(record.timestamp).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Badge 
                        variant={record.status === 'present' ? 'default' : 'destructive'}
                      >
                        {record.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {record.photo ? (
                        <img 
                          src={record.photo} 
                          alt="Student" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400">No photo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading && !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {renderSidebar()}
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
              <Button 
                onClick={() => setError(null)} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">{successMessage}</p>
              <Button 
                onClick={() => setSuccessMessage(null)} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          )}

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'students' && renderStudents()}
          {activeTab === 'daily-attendance' && renderDailyAttendance()}
          {activeTab === 'exam-attendance' && renderExamAttendance()}
          {activeTab === 'reports' && renderReports()}
        </div>
      </div>

      {/* Student Profile Modal */}
      {selectedStudentProfile && (
        <Dialog open={isStudentProfileOpen} onOpenChange={setIsStudentProfileOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  {selectedStudentProfile.latest_photo ? (
                    <img 
                      src={selectedStudentProfile.latest_photo} 
                      alt={selectedStudentProfile.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <Users className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedStudentProfile.name}</h3>
                  <p className="text-sm text-gray-500">Roll Number: {selectedStudentProfile.roll_number}</p>
                </div>
              </DialogTitle>
              <DialogDescription>
                Complete student profile with attendance history, academic performance, and personal information
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{selectedStudentProfile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Roll Number:</span>
                    <span>{selectedStudentProfile.roll_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Stage:</span>
                    <span>{selectedStudentProfile.stage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedStudentProfile.status === 'Good' 
                        ? 'bg-green-100 text-green-700'
                        : selectedStudentProfile.status === 'Average'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedStudentProfile.status}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Attendance Statistics (30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Present:</span>
                    <span className="text-green-600 font-semibold">{selectedStudentProfile.present_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Late:</span>
                    <span className="text-yellow-600 font-semibold">{selectedStudentProfile.late_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Absent:</span>
                    <span className="text-red-600 font-semibold">{selectedStudentProfile.absent_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Attendance Rate:</span>
                    <span className={`font-semibold ${
                      (selectedStudentProfile.attendance_rate || 0) >= 75 
                        ? 'text-green-600' 
                        : (selectedStudentProfile.attendance_rate || 0) >= 50 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      {selectedStudentProfile.attendance_rate?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <Progress 
                      value={selectedStudentProfile.attendance_rate || 0}
                      className={`w-full h-2 ${
                        (selectedStudentProfile.attendance_rate || 0) >= 75 
                          ? '[&>div]:bg-green-500' 
                          : (selectedStudentProfile.attendance_rate || 0) >= 50 
                          ? '[&>div]:bg-yellow-500' 
                          : '[&>div]:bg-red-500'
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Attendance History */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Attendance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Detailed attendance history will be loaded here</p>
                  <p className="text-sm">Feature coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
