import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Calendar, Clock, Users, GraduationCap, MoreHorizontal, Edit, Trash2, UserCheck, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface ExamType {
  id: string;
  name: string;
  description: string;
  weight: number;
}

interface Stage {
  id: string;
  name: string;
  description?: string;
  topics: Topic[];
}

interface Topic {
  id: string;
  name: string;
  description?: string;
}

interface Exam {
  id: string;
  exam_type_id: string;
  class_id: string;
  topic_id?: string;
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  exam_type_name: string;
  class_name: string;
  class_section?: string;
  topic_name?: string;
  total_attendance?: number;
  present_count?: number;
}

interface ExamFormData {
  exam_type_id: string;
  class_id: string;
  topic_id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
}

interface Student {
  id: string;
  name: string;
  roll_number: string;
  class: string;
  section: string;
  attendance_status?: 'present' | 'absent' | 'late' | 'excused';
  arrival_time?: string;
  attendance_notes?: string;
}

const API_BASE = 'http://localhost:8888/api';

export function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState<ExamFormData>({
    exam_type_id: '',
    class_id: '',
    topic_id: 'none', // Use 'none' instead of empty string
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    duration_minutes: 120,
    total_marks: 100,
    pass_marks: 40
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/exams`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to fetch exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExamTypes = async () => {
    try {
      const response = await fetch(`${API_BASE}/exam-types`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setExamTypes(data);
    } catch (error) {
      console.error('Error fetching exam types:', error);
      toast.error('Failed to fetch exam types.');
    }
  };

  const fetchStagesWithTopics = async () => {
    try {
      const response = await fetch(`${API_BASE}/teachers/available-topics`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStages(data);
    } catch (error) {
      console.error('Error fetching stages and topics:', error);
      toast.error('Failed to fetch stages and topics.');
    }
  };

  const fetchExamStudents = async (examId: string) => {
    try {
      const response = await fetch(`${API_BASE}/exams/${examId}/students`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching exam students:', error);
      toast.error('Failed to fetch students for attendance.');
    }
  };

  const createExam = async (examData: ExamFormData) => {
    // Convert "none" topic_id to null for backend
    const processedData = {
      ...examData,
      topic_id: examData.topic_id === 'none' ? null : examData.topic_id
    };
    
    const response = await fetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(processedData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create exam');
    }
    
    return response.json();
  };

  const updateExam = async (id: string, examData: Partial<ExamFormData>) => {
    // Convert "none" topic_id to null for backend
    const processedData = {
      ...examData,
      topic_id: examData.topic_id === 'none' ? null : examData.topic_id
    };
    
    const response = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(processedData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update exam');
    }
    
    return response.json();
  };

  const deleteExam = async (id: string) => {
    const response = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete exam');
    }
    
    return response.json();
  };

  const submitExamAttendance = async (examId: string, attendanceRecords: any[]) => {
    const response = await fetch(`${API_BASE}/exams/${examId}/attendance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ attendanceRecords })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit attendance');
    }
    
    return response.json();
  };

  useEffect(() => {
    fetchExams();
    fetchExamTypes();
    fetchStagesWithTopics();
  }, []);

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.topic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.exam_type_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      exam_type_id: '',
      class_id: '',
      topic_id: 'none', // Use 'none' instead of empty string
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      duration_minutes: 120,
      total_marks: 100,
      pass_marks: 40
    });
  };

  const handleAddSubmit = async () => {
    try {
      await createExam(formData);
      
      toast.success('Exam created successfully!');
      
      resetForm();
      setIsAddDialogOpen(false);
      fetchExams();
    } catch (error) {
      console.error('Error adding exam:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add exam. Please try again.');
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedExam) return;
    
    try {
      await updateExam(selectedExam.id, formData);
      
      toast.success('Exam updated successfully!');
      setIsEditDialogOpen(false);
      resetForm();
      fetchExams();
    } catch (error) {
      console.error('Error updating exam:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update exam');
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This will also delete all attendance records.')) {
      return;
    }

    try {
      await deleteExam(examId);
      
      toast.success('Exam deleted successfully!');
      
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete exam. Please try again.');
    }
  };

  const handleEdit = (exam: Exam) => {
    setSelectedExam(exam);
    setFormData({
      exam_type_id: exam.exam_type_id,
      class_id: exam.class_id,
      topic_id: exam.topic_id || 'none', // Convert null/undefined to 'none'
      title: exam.title,
      description: exam.description || '',
      date: exam.date,
      start_time: exam.start_time || '',
      end_time: exam.end_time || '',
      duration_minutes: exam.duration_minutes,
      total_marks: exam.total_marks,
      pass_marks: exam.pass_marks
    });
    setIsEditDialogOpen(true);
  };

  const handleAttendance = async (exam: Exam) => {
    setSelectedExam(exam);
    await fetchExamStudents(exam.id);
    setIsAttendanceDialogOpen(true);
  };

  const handleAttendanceSubmit = async () => {
    if (!selectedExam) return;

    try {
      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        attendance_status: student.attendance_status || 'absent',
        arrival_time: student.arrival_time || null,
        notes: student.attendance_notes || ''
      }));

      await submitExamAttendance(selectedExam.id, attendanceRecords);
      
      toast.success('Exam attendance recorded successfully!');
      setIsAttendanceDialogOpen(false);
      fetchExams(); // Refresh to show updated attendance counts
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit attendance');
    }
  };

  const updateStudentAttendance = (studentId: string, field: string, value: any) => {
    setStudents(students.map(student => 
      student.id === studentId 
        ? { ...student, [field]: value }
        : student
    ));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedStage = stages.find(stage => stage.id === formData.class_id);

  // Calculate statistics
  const totalExams = exams.length;
  const scheduledExams = exams.filter(exam => exam.status === 'scheduled').length;
  const completedExams = exams.filter(exam => exam.status === 'completed').length;
  const totalStudentsAttended = exams.reduce((sum, exam) => sum + (exam.present_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exam Management</h2>
          <p className="text-muted-foreground">
            Schedule exams and track attendance
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Exam</DialogTitle>
              <DialogDescription>
                Create a new exam schedule with date, stage, and topic
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-exam-type">Exam Type *</Label>
                <Select value={formData.exam_type_id} onValueChange={(value) => setFormData({ ...formData, exam_type_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-stage">Stage *</Label>
                <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value, topic_id: 'none' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select medical stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStage && (
                <div className="space-y-2">
                  <Label htmlFor="add-topic">Topic</Label>
                  <Select value={formData.topic_id} onValueChange={(value) => setFormData({ ...formData, topic_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific topic</SelectItem>
                      {selectedStage.topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="add-title">Exam Title *</Label>
                <Input
                  id="add-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter exam title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-description">Description</Label>
                <Textarea
                  id="add-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter exam description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-date">Date *</Label>
                  <Input
                    id="add-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-duration">Duration (min)</Label>
                  <Input
                    id="add-duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 120 })}
                    placeholder="120"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-start-time">Start Time</Label>
                  <Input
                    id="add-start-time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-end-time">End Time</Label>
                  <Input
                    id="add-end-time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-total-marks">Total Marks</Label>
                  <Input
                    id="add-total-marks"
                    type="number"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) || 100 })}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-pass-marks">Pass Marks</Label>
                  <Input
                    id="add-pass-marks"
                    type="number"
                    value={formData.pass_marks}
                    onChange={(e) => setFormData({ ...formData, pass_marks: parseInt(e.target.value) || 40 })}
                    placeholder="40"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSubmit} disabled={!formData.exam_type_id || !formData.class_id || !formData.title || !formData.date}>
                Schedule Exam
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExams}</div>
            <p className="text-xs text-muted-foreground">
              All scheduled exams
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledExams}</div>
            <p className="text-xs text-muted-foreground">
              Upcoming exams
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedExams}</div>
            <p className="text-xs text-muted-foreground">
              Finished exams
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudentsAttended}</div>
            <p className="text-xs text-muted-foreground">
              Students attended
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Exams</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading exams...</div>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No exams found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by scheduling your first exam.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Exam
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Details</TableHead>
                  <TableHead>Stage & Topic</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{exam.title}</div>
                        <div className="text-sm text-muted-foreground">{exam.exam_type_name}</div>
                        {exam.description && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            {exam.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{exam.class_name}</div>
                        {exam.topic_name && (
                          <div className="text-sm text-muted-foreground flex items-center">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {exam.topic_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{new Date(exam.date).toLocaleDateString()}</div>
                        {exam.start_time && (
                          <div className="text-sm text-muted-foreground">
                            {exam.start_time} - {exam.end_time || 'TBD'}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {exam.duration_minutes} minutes
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{exam.total_marks}</div>
                        <div className="text-sm text-muted-foreground">
                          Pass: {exam.pass_marks}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {exam.present_count || 0} / {exam.total_attendance || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Present / Total
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(exam.status)}>
                        {exam.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAttendance(exam)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Mark Attendance
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(exam)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Exam
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(exam.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Exam
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Exam Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
            <DialogDescription>
              Update exam details and schedule
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-exam-type">Exam Type *</Label>
              <Select value={formData.exam_type_id} onValueChange={(value) => setFormData({ ...formData, exam_type_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-stage">Stage *</Label>
              <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value, topic_id: 'none' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medical stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStage && (
              <div className="space-y-2">
                <Label htmlFor="edit-topic">Topic</Label>
                <Select value={formData.topic_id} onValueChange={(value) => setFormData({ ...formData, topic_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific topic</SelectItem>
                    {selectedStage.topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-title">Exam Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter exam title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter exam description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (min)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 120 })}
                  placeholder="120"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-time">Start Time</Label>
                <Input
                  id="edit-start-time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-time">End Time</Label>
                <Input
                  id="edit-end-time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-total-marks">Total Marks</Label>
                <Input
                  id="edit-total-marks"
                  type="number"
                  value={formData.total_marks}
                  onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) || 100 })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-pass-marks">Pass Marks</Label>
                <Input
                  id="edit-pass-marks"
                  type="number"
                  value={formData.pass_marks}
                  onChange={(e) => setFormData({ ...formData, pass_marks: parseInt(e.target.value) || 40 })}
                  placeholder="40"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={!formData.exam_type_id || !formData.class_id || !formData.title || !formData.date}>
              Update Exam
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exam Attendance Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark Exam Attendance</DialogTitle>
            <DialogDescription>
              {selectedExam && (
                <>Record attendance for {selectedExam.title} - {selectedExam.class_name}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No students found for this exam.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Attendance Status</TableHead>
                    <TableHead>Arrival Time</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.roll_number}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.class} - {student.section}</TableCell>
                      <TableCell>
                        <Select 
                          value={student.attendance_status || 'absent'} 
                          onValueChange={(value) => updateStudentAttendance(student.id, 'attendance_status', value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={student.arrival_time || ''}
                          onChange={(e) => updateStudentAttendance(student.id, 'arrival_time', e.target.value)}
                          className="w-[120px]"
                          disabled={student.attendance_status === 'absent'}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={student.attendance_notes || ''}
                          onChange={(e) => updateStudentAttendance(student.id, 'attendance_notes', e.target.value)}
                          placeholder="Notes..."
                          className="w-[150px]"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAttendanceSubmit} disabled={students.length === 0}>
              Save Attendance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
