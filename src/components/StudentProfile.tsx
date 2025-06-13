import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Award,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Download,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface StudentProfileProps {
  studentId: string;
  onBack: () => void;
}

interface StudentProfileData {
  student: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
    email: string;
    parentPhone: string;
    whatsappNumber: string;
    address: string;
    dateOfBirth: string;
    profilePicture: string;
    status: string;
    parentName: string;
    emergencyContact: string;
    bloodGroup: string;
    medicalConditions: string;
    admissionDate: string;
    overallAttendancePercentage: number;
  };
  attendanceHistory: Array<{
    id: string;
    date: string;
    status: string;
    notes: string;
    markedAt: string;
    className: string;
    classSection: string;
    subjectName: string;
    subjectCode: string;
    teacherName: string;
    markedBy: string;
  }>;
  attendanceStats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    overallPercentage: number;
  };
  monthlyAttendance: Array<{
    month: string;
    totalDays: number;
    presentDays: number;
    attendancePercentage: number;
  }>;
  enrollments: Array<{
    id: string;
    enrollmentDate: string;
    enrollmentStatus: string;
    classId: string;
    className: string;
    classSection: string;
    teacherName: string;
    subjects: string;
  }>;
  examResults: Array<{
    id: string;
    obtainedMarks: number;
    grade: string;
    remarks: string;
    examTitle: string;
    totalMarks: number;
    examDate: string;
    subjectName: string;
    className: string;
    examType: string;
  }>;
}

export function StudentProfile({ studentId, onBack }: StudentProfileProps) {
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchStudentProfile(studentId);
    }
  }, [studentId]);

  const fetchStudentProfile = async (id: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/students/${id}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch student profile: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching student profile:', error);
      toast.error('Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'excused':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'present':
        return 'default';
      case 'absent':
        return 'destructive';
      case 'late':
        return 'secondary';
      case 'excused':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const exportAttendanceReport = () => {
    if (!profileData) return;
    
    // Create CSV content
    const headers = ['Date', 'Class', 'Subject', 'Status', 'Teacher', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...profileData.attendanceHistory.map(record => [
        record.date,
        `${record.className} ${record.classSection}`,
        record.subjectName || 'N/A',
        record.status,
        record.teacherName || 'N/A',
        `"${record.notes || ''}"`
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profileData.student.name}_attendance_report.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Attendance report downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Student Not Found</h2>
          <p className="text-gray-600 mb-4">The requested student profile could not be loaded.</p>
          <Button onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  const { student, attendanceHistory, attendanceStats, monthlyAttendance, enrollments, examResults } = profileData;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Students
          </Button>
          <h1 className="text-2xl font-bold">Student Profile</h1>
        </div>
        <Button onClick={exportAttendanceReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Student Header Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={student.profilePicture} />
              <AvatarFallback className="text-lg bg-blue-100 text-blue-700">
                {student.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{student.name}</h2>
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                  {student.status}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Roll:</span> {student.rollNumber}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Class:</span> {student.class} {student.section}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Email:</span> {student.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Parent:</span> {student.parentPhone}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">DOB:</span> {student.dateOfBirth ? formatDate(student.dateOfBirth) : 'N/A'}
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Attendance:</span> 
                  <Badge variant={student.overallAttendancePercentage >= 75 ? 'default' : 'destructive'}>
                    {student.overallAttendancePercentage}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="details">Personal Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{attendanceStats.presentDays}</div>
                <p className="text-sm text-gray-600">Present Days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{attendanceStats.absentDays}</div>
                <p className="text-sm text-gray-600">Absent Days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{attendanceStats.lateDays}</div>
                <p className="text-sm text-gray-600">Late Days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{attendanceStats.totalDays}</div>
                <p className="text-sm text-gray-600">Total Days</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Attendance (Last 10 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceHistory.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(record.status)}
                      <div>
                        <p className="font-medium">{formatDate(record.date)}</p>
                        <p className="text-sm text-gray-600">
                          {record.className} {record.classSection} - {record.subjectName || 'General'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusBadgeVariant(record.status)}>
                        {record.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        by {record.teacherName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Current Enrollments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        {enrollment.className} {enrollment.classSection}
                      </h4>
                      <Badge variant={enrollment.enrollmentStatus === 'active' ? 'default' : 'secondary'}>
                        {enrollment.enrollmentStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Teacher: {enrollment.teacherName}</p>
                    <p className="text-sm text-gray-600">Subjects: {enrollment.subjects}</p>
                    <p className="text-xs text-gray-500">Enrolled: {formatDate(enrollment.enrollmentDate)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance History Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Complete Attendance History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {attendanceHistory.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(record.status)}
                      <div>
                        <p className="font-medium">{formatDate(record.date)}</p>
                        <p className="text-sm text-gray-600">
                          {record.className} {record.classSection}
                          {record.subjectName && ` - ${record.subjectName}`}
                        </p>
                        {record.notes && (
                          <p className="text-xs text-gray-500 mt-1">{record.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusBadgeVariant(record.status)}>
                        {record.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {record.teacherName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(record.markedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {attendanceHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attendance records found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Attendance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyAttendance.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{formatMonth(month.month)}</h4>
                      <p className="text-sm text-gray-600">
                        {month.presentDays} of {month.totalDays} days present
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {month.attendancePercentage}%
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            month.attendancePercentage >= 75 ? 'bg-green-500' : 
                            month.attendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${month.attendancePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {monthlyAttendance.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attendance data available for analysis</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6">
          {/* Exam Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recent Exam Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {examResults.map((result) => (
                  <div key={result.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{result.examTitle}</h4>
                      <Badge variant={result.grade ? 'default' : 'outline'}>
                        {result.grade || 'Pending'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Subject:</span> {result.subjectName}
                      </div>
                      <div>
                        <span className="text-gray-600">Marks:</span> {result.obtainedMarks}/{result.totalMarks}
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span> {formatDate(result.examDate)}
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span> {result.examType}
                      </div>
                    </div>
                    {result.remarks && (
                      <p className="text-sm text-gray-600 mt-2">{result.remarks}</p>
                    )}
                  </div>
                ))}
                {examResults.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No exam results available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="mt-1">{student.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                  <p className="mt-1">{student.dateOfBirth ? formatDate(student.dateOfBirth) : 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Blood Group</label>
                  <p className="mt-1">{student.bloodGroup || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Medical Conditions</label>
                  <p className="mt-1">{student.medicalConditions || 'None reported'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Admission Date</label>
                  <p className="mt-1">{student.admissionDate ? formatDate(student.admissionDate) : 'Not available'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email Address</label>
                  <p className="mt-1">{student.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">WhatsApp Number</label>
                  <p className="mt-1">{student.whatsappNumber || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Parent Name</label>
                  <p className="mt-1">{student.parentName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Parent Phone</label>
                  <p className="mt-1">{student.parentPhone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                  <p className="mt-1">{student.emergencyContact || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="mt-1">{student.address || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
