import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Download, 
  Search, 
  Filter,
  Camera,
  User,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface AttendanceRecord {
  id: string;
  date: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  class_name: string;
  class_section: string;
  subject_name?: string;
  topic_name?: string;
  teacher_name: string;
  type: 'daily' | 'exam';
  status: 'present' | 'absent' | 'late' | 'excused';
  photo?: string;
  notes?: string;
  marked_at: string;
  exam_title?: string;
  arrival_time?: string;
}

interface StudentProfile {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  parentPhone?: string;
  address?: string;
  email?: string;
  dateOfBirth?: string;
  whatsappNumber?: string;
  profilePicture?: string;
  status?: string;
  parentName?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  admissionDate?: string;
  overallAttendancePercentage: number;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  overallPercentage: number;
}

interface MonthlyAttendance {
  month: string;
  totalDays: number;
  presentDays: number;
  attendancePercentage: number;
}

interface ExamResult {
  id: string;
  obtainedMarks: number;
  grade: string;
  remarks?: string;
  examTitle: string;
  totalMarks: number;
  examDate: string;
  topicName: string;
  className: string;
  examType: string;
}

interface StudentProfileData {
  student: StudentProfile;
  attendanceHistory: any[];
  attendanceStats: AttendanceStats;
  monthlyAttendance: MonthlyAttendance[];
  enrollments: any[];
  examResults: ExamResult[];
}

interface FilterOptions {
  type: 'all' | 'daily' | 'exam';
  stage: string;
  topic: string;
  teacher: string;
  startDate: string;
  endDate: string;
  status: 'all' | 'present' | 'absent' | 'late' | 'excused';
}

interface DropdownData {
  classes: Array<{ id: string; name: string; section: string; }>;
  topics: Array<{ id: string; name: string; class_id: string; }>;
  teachers: Array<{ id: string; name: string; }>;
}

const API_BASE = 'http://localhost:8888/api';

export function AttendanceReportsPage() {
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dropdownData, setDropdownData] = useState<DropdownData>({ classes: [], topics: [], teachers: [] });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AttendanceRecord | null>(null);
  const [studentProfileData, setStudentProfileData] = useState<StudentProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    stage: 'all',
    topic: 'all',
    teacher: 'all',
    startDate: '',
    endDate: '',
    status: 'all'
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch dropdown data for filters
  const fetchDropdownData = async () => {
    try {
      const [classesRes, teachersRes] = await Promise.all([
        fetch(`${API_BASE}/classes`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/teachers`, { headers: getAuthHeaders() })
      ]);

      if (classesRes.ok && teachersRes.ok) {
        const [classesData, teachersData] = await Promise.all([
          classesRes.json(),
          teachersRes.json()
        ]);

        // Fetch topics for all classes
        const topicsPromises = classesData.map((cls: any) =>
          fetch(`${API_BASE}/classes/${cls.id}/topics`, { headers: getAuthHeaders() })
            .then(res => res.ok ? res.json() : [])
            .then(topics => topics.map((topic: any) => ({ ...topic, class_id: cls.id })))
        );

        const allTopics = (await Promise.all(topicsPromises)).flat();

        setDropdownData({
          classes: classesData,
          topics: allTopics,
          teachers: teachersData
        });
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load filter options');
    }
  };

  // Fetch attendance reports based on filters
  const fetchAttendanceReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.stage !== 'all') params.append('classId', filters.stage);
      if (filters.topic !== 'all') params.append('topicId', filters.topic);
      if (filters.teacher !== 'all') params.append('teacherId', filters.teacher);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status !== 'all') params.append('status', filters.status);

      const response = await fetch(`${API_BASE}/reports/attendance-detailed?${params.toString()}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAttendanceRecords(data);
    } catch (error) {
      console.error('Error fetching attendance reports:', error);
      toast.error('Failed to fetch attendance reports');
    } finally {
      setLoading(false);
    }
  };

  // Get filtered topics based on selected stage
  const getFilteredTopics = () => {
    if (filters.stage === 'all') return dropdownData.topics;
    return dropdownData.topics.filter(topic => topic.class_id === filters.stage);
  };

  // Fetch complete student profile
  const fetchStudentProfile = async (studentId: string) => {
    setIsLoadingProfile(true);
    try {
      const response = await fetch(`${API_BASE}/students/${studentId}/profile`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStudentProfileData(data);
    } catch (error) {
      console.error('Error fetching student profile:', error);
      toast.error('Failed to fetch student profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      present: 'bg-green-100 text-green-800 border-green-200',
      absent: 'bg-red-100 text-red-800 border-red-200',
      late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      excused: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    const icons = {
      present: <CheckCircle className="h-3 w-3" />,
      absent: <XCircle className="h-3 w-3" />,
      late: <Clock className="h-3 w-3" />,
      excused: <AlertCircle className="h-3 w-3" />
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants]} flex items-center gap-1`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Photo thumbnail component
  const PhotoThumbnail = ({ photo, student }: { photo?: string; student: AttendanceRecord }) => {
    if (!photo) return <span className="text-gray-400 text-sm">No photo</span>;

    return (
      <div className="flex items-center gap-2">
        <img
          src={photo}
          alt={`${student.student_name} attendance`}
          className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            setSelectedPhoto(photo);
            setSelectedStudent(student);
            setIsPhotoDialogOpen(true);
          }}
        />
        <Camera className="h-4 w-4 text-gray-500" />
      </div>
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Date', 'Student Name', 'Roll Number', 'Class', 'Subject', 'Topic', 
      'Teacher', 'Type', 'Status', 'Arrival Time', 'Notes', 'Marked At'
    ];

    const csvData = attendanceRecords.map(record => [
      record.date,
      record.student_name,
      record.roll_number,
      `${record.class_name} - ${record.class_section}`,
      record.subject_name || '',
      record.topic_name || '',
      record.teacher_name,
      record.type,
      record.status,
      record.arrival_time || '',
      record.notes || '',
      new Date(record.marked_at).toLocaleString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Statistics calculations
  const getStatistics = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;
    const excused = attendanceRecords.filter(r => r.status === 'excused').length;
    const withPhoto = attendanceRecords.filter(r => r.photo).length;

    return { total, present, absent, late, excused, withPhoto };
  };

  const stats = getStatistics();

  useEffect(() => {
    fetchDropdownData();
    fetchAttendanceReports();
  }, []);

  useEffect(() => {
    if (filters.stage !== 'all') {
      // Reset topic when stage changes
      setFilters(prev => ({ ...prev, topic: 'all' }));
    }
  }, [filters.stage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive attendance tracking and analytics with photo verification
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={attendanceRecords.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excused</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.excused}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Photo</CardTitle>
            <Camera className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.withPhoto}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter attendance records by type, stage, topic, teacher, and date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Attendance Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="daily">Daily Attendance</SelectItem>
                  <SelectItem value="exam">Exam Attendance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stage Filter */}
            <div className="space-y-2">
              <Label>Medical Stage</Label>
              <Select value={filters.stage} onValueChange={(value) => setFilters(prev => ({ ...prev, stage: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {dropdownData.classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Topic Filter */}
            <div className="space-y-2">
              <Label>Topic</Label>
              <Select 
                value={filters.topic} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, topic: value }))}
                disabled={filters.stage === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {getFilteredTopics().map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher Filter */}
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select value={filters.teacher} onValueChange={(value) => setFilters(prev => ({ ...prev, teacher: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {dropdownData.teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Apply Filters Button */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={fetchAttendanceReports} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records ({attendanceRecords.length})</CardTitle>
          <CardDescription>
            Detailed attendance records with photo verification and student profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading attendance records...</div>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No attendance records found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Stage & Topic</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{new Date(record.date).toLocaleDateString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(record.marked_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.student_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Roll: {record.roll_number}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {record.class_name} - {record.class_section}
                          </div>
                          {record.topic_name && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {record.topic_name}
                            </div>
                          )}
                          {record.subject_name && (
                            <div className="text-xs text-muted-foreground">
                              {record.subject_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {record.teacher_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.type === 'exam' ? 'default' : 'secondary'}>
                          {record.type === 'exam' ? 'Exam' : 'Daily'}
                        </Badge>
                        {record.exam_title && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {record.exam_title}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={record.status} />
                        {record.arrival_time && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Arrived: {record.arrival_time}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <PhotoThumbnail photo={record.photo} student={record} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            setSelectedStudent(record);
                            setIsStudentProfileOpen(true);
                            await fetchStudentProfile(record.student_id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Enlargement Dialog */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attendance Photo</DialogTitle>
            <DialogDescription>
              {selectedStudent && (
                <>Photo captured for {selectedStudent.student_name} on {new Date(selectedStudent.date).toLocaleDateString()}</>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedPhoto && (
            <div className="flex justify-center">
              <img
                src={selectedPhoto}
                alt="Attendance photo"
                className="max-w-full max-h-96 rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Profile Dialog */}
      <Dialog open={isStudentProfileOpen} onOpenChange={setIsStudentProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Complete Student Profile
            </DialogTitle>
            <DialogDescription>
              Comprehensive student information, attendance history, and academic performance
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingProfile ? (
            <div className="flex justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading student profile...</div>
            </div>
          ) : studentProfileData ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="academics">Academics</TabsTrigger>
                <TabsTrigger value="contact">Contact Info</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Student Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Full Name</Label>
                          <p className="text-sm text-muted-foreground">{studentProfileData.student.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Roll Number</Label>
                          <p className="text-sm text-muted-foreground">{studentProfileData.student.rollNumber}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Class</Label>
                          <p className="text-sm text-muted-foreground">{studentProfileData.student.class} - {studentProfileData.student.section}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Badge variant={studentProfileData.student.status === 'active' ? 'default' : 'secondary'}>
                            {studentProfileData.student.status || 'Active'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {studentProfileData.student.dateOfBirth && (
                          <div>
                            <Label className="text-sm font-medium">Date of Birth</Label>
                            <p className="text-sm text-muted-foreground">
                              {new Date(studentProfileData.student.dateOfBirth).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {studentProfileData.student.bloodGroup && (
                          <div>
                            <Label className="text-sm font-medium">Blood Group</Label>
                            <p className="text-sm text-muted-foreground">{studentProfileData.student.bloodGroup}</p>
                          </div>
                        )}
                        {studentProfileData.student.admissionDate && (
                          <div>
                            <Label className="text-sm font-medium">Admission Date</Label>
                            <p className="text-sm text-muted-foreground">
                              {new Date(studentProfileData.student.admissionDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <div>
                          <Label className="text-sm font-medium">Overall Attendance</Label>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={studentProfileData.student.overallAttendancePercentage} 
                              className="flex-1 h-2"
                            />
                            <span className="text-sm font-medium">{studentProfileData.student.overallAttendancePercentage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {studentProfileData.student.medicalConditions && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <Label className="text-sm font-medium text-yellow-800">Medical Conditions</Label>
                        <p className="text-sm text-yellow-700 mt-1">{studentProfileData.student.medicalConditions}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Current Enrollments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Current Enrollments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {studentProfileData.enrollments.length > 0 ? (
                      <div className="space-y-2">
                        {studentProfileData.enrollments.map((enrollment: any) => (
                          <div key={enrollment.id} className="flex justify-between items-center p-3 border rounded-md">
                            <div>
                              <div className="font-medium">{enrollment.className} - {enrollment.classSection}</div>
                              <div className="text-sm text-muted-foreground">
                                Teacher: {enrollment.teacherName || 'Not assigned'}
                              </div>
                              {enrollment.subjects && (
                                <div className="text-sm text-muted-foreground">
                                  Subjects: {enrollment.subjects}
                                </div>
                              )}
                            </div>
                            <Badge variant={enrollment.enrollmentStatus === 'active' ? 'default' : 'secondary'}>
                              {enrollment.enrollmentStatus}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No active enrollments found.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{studentProfileData.attendanceStats.totalDays}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-600">Present</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{studentProfileData.attendanceStats.presentDays}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-600">Absent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{studentProfileData.attendanceStats.absentDays}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-yellow-600">Late</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">{studentProfileData.attendanceStats.lateDays}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Attendance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Attendance Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {studentProfileData.monthlyAttendance.length > 0 ? (
                      <div className="space-y-2">
                        {studentProfileData.monthlyAttendance.map((month: MonthlyAttendance) => (
                          <div key={month.month} className="flex justify-between items-center p-3 border rounded-md">
                            <div>
                              <div className="font-medium">{new Date(month.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</div>
                              <div className="text-sm text-muted-foreground">
                                {month.presentDays} present out of {month.totalDays} days
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{month.attendancePercentage}%</div>
                              <Progress 
                                value={month.attendancePercentage} 
                                className="w-16 h-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No attendance data available.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Academics Tab */}
              <TabsContent value="academics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Recent Exam Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {studentProfileData.examResults.length > 0 ? (
                      <div className="space-y-3">
                        {studentProfileData.examResults.slice(0, 10).map((result: ExamResult) => (
                          <div key={result.id} className="p-3 border rounded-md">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium">{result.examTitle}</div>
                                <div className="text-sm text-muted-foreground">
                                  {result.topicName} • {result.className} • {result.examType}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(result.examDate).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">
                                  {result.obtainedMarks}/{result.totalMarks}
                                </div>
                                <Badge variant={result.grade ? 'default' : 'secondary'}>
                                  {result.grade || 'No Grade'}
                                </Badge>
                                {result.remarks && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {result.remarks}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No exam results available.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contact Info Tab */}
              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {studentProfileData.student.email && (
                          <div>
                            <Label className="text-sm font-medium">Email</Label>
                            <p className="text-sm text-muted-foreground">{studentProfileData.student.email}</p>
                          </div>
                        )}
                        {studentProfileData.student.parentPhone && (
                          <div>
                            <Label className="text-sm font-medium">Parent Phone</Label>
                            <p className="text-sm text-muted-foreground">{studentProfileData.student.parentPhone}</p>
                          </div>
                        )}
                        {studentProfileData.student.whatsappNumber && (
                          <div>
                            <Label className="text-sm font-medium">WhatsApp</Label>
                            <p className="text-sm text-muted-foreground">{studentProfileData.student.whatsappNumber}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {studentProfileData.student.parentName && (
                          <div>
                            <Label className="text-sm font-medium">Parent Name</Label>
                            <p className="text-sm text-muted-foreground">{studentProfileData.student.parentName}</p>
                          </div>
                        )}
                        {studentProfileData.student.emergencyContact && (
                          <div>
                            <Label className="text-sm font-medium">Emergency Contact</Label>
                            <p className="text-sm text-muted-foreground">{studentProfileData.student.emergencyContact}</p>
                          </div>
                        )}
                        {studentProfileData.student.address && (
                          <div>
                            <Label className="text-sm font-medium">Address</Label>
                            <p className="text-sm text-muted-foreground">{studentProfileData.student.address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : selectedStudent ? (
            // Fallback to simple view if profile data fails to load
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{selectedStudent.student_name}</h3>
                <p className="text-sm text-muted-foreground">Roll: {selectedStudent.roll_number}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Class:</span>
                  <span className="text-sm">{selectedStudent.class_name} - {selectedStudent.class_section}</span>
                </div>
                
                {selectedStudent.topic_name && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Topic:</span>
                    <span className="text-sm">{selectedStudent.topic_name}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">{new Date(selectedStudent.date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <StatusBadge status={selectedStudent.status} />
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Teacher:</span>
                  <span className="text-sm">{selectedStudent.teacher_name}</span>
                </div>
                
                {selectedStudent.notes && (
                  <div>
                    <span className="text-sm font-medium">Notes:</span>
                    <p className="text-sm text-muted-foreground mt-1">{selectedStudent.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedStudent) {
                      fetchStudentProfile(selectedStudent.student_id);
                    }
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Load Full Profile
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
