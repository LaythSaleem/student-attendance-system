import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "./ui/textarea"
import { useStudentManagement } from "@/hooks/useStudentManagement"
import { AddStudentDialog } from "./AddStudentDialog"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Camera,
  MessageCircle,
  Phone,
  MapPin,
  Calendar,
  User,
  IdCard,
  GraduationCap,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  RefreshCw
} from "lucide-react"

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  parentPhone: string;
  whatsappNumber: string;
  address: string;
  dateOfBirth: string;
  email: string;
  profilePicture?: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  attendanceRate: number;
  admissionDate: string;
  bloodGroup?: string;
  parentName: string;
  emergencyContact: string;
  medicalConditions?: string;
}

interface StudentFormData {
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  parentPhone: string;
  whatsappNumber: string;
  address: string;
  dateOfBirth: string;
  email: string;
  profilePicture?: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  parentName: string;
  emergencyContact: string;
  bloodGroup: string;
  medicalConditions: string;
}

export function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Use the student management hook
  const {
    students,
    loading,
    error,
    stats,
    createStudent,
    updateStudent,
    deleteStudent,
    sendWhatsAppMessage,
    isCreating,
    isUpdating
  } = useStudentManagement();

  // Initialize form data
  const [formData, setFormData] = useState<StudentFormData>({
    name: "",
    rollNumber: "",
    class: "",
    section: "",
    parentPhone: "",
    whatsappNumber: "",
    address: "",
    dateOfBirth: "",
    email: "",
    profilePicture: "",
    status: "active",
    parentName: "",
    emergencyContact: "",
    bloodGroup: "",
    medicalConditions: ""
  });

  // Filter students based on search and class
  const getFilteredStudents = () => {
    if (!students || students.length === 0) return [];
    
    let filtered = students || [];
    
    // Apply search filter
    if (searchTerm) {
      const lowercaseQuery = searchTerm.toLowerCase();
      filtered = filtered.filter((student: Student) => 
        student.name.toLowerCase().includes(lowercaseQuery) ||
        student.rollNumber.toLowerCase().includes(lowercaseQuery) ||
        student.email.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    // Apply class filter
    if (selectedClass !== "all") {
      filtered = filtered.filter((student: Student) => student.class === selectedClass);
    }
    
    return filtered;
  };

  const filteredStudents = getFilteredStudents();

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
      setIsCameraOpen(true);
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
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoData);
        setFormData(prev => ({ ...prev, profilePicture: photoData }));
        stopCamera();
      }
    }
  };

  // Form handling
  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      rollNumber: "",
      class: "",
      section: "",
      parentPhone: "",
      whatsappNumber: "",
      address: "",
      dateOfBirth: "",
      email: "",
      profilePicture: "",
      status: "active",
      parentName: "",
      emergencyContact: "",
      bloodGroup: "",
      medicalConditions: ""
    });
    setCapturedPhoto("");
  };

  const handleSubmit = async (studentData: any) => {
    try {
      await createStudent(studentData);
      toast.success('Student added successfully!');
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student. Please try again.');
    }
  };

  const handleUpdateSubmit = async () => {
    if (!selectedStudent) return;
    
    try {
      const studentData = {
        ...formData,
        profilePicture: capturedPhoto || formData.profilePicture
      };
      
      await updateStudent(selectedStudent.id, studentData);
      
      toast.success('Student updated successfully!');
      resetForm();
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      stopCamera();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student. Please try again.');
    }
  };

  const handleDelete = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await deleteStudent(studentId);
        toast.success('Student deleted successfully!');
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error('Failed to delete student. Please try again.');
      }
    }
  };

  const handleWhatsAppMessage = (phone: string, customMessage?: string) => {
    try {
      const message = customMessage || "Hello! This is a message from the school administration.";
      sendWhatsAppMessage(phone, message);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      toast.error('Failed to open WhatsApp. Please check the number.');
    }
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      class: student.class,
      section: student.section,
      parentPhone: student.parentPhone,
      whatsappNumber: student.whatsappNumber,
      address: student.address,
      dateOfBirth: student.dateOfBirth,
      email: student.email,
      profilePicture: student.profilePicture || "",
      status: student.status,
      parentName: student.parentName,
      emergencyContact: student.emergencyContact,
      bloodGroup: student.bloodGroup || "",
      medicalConditions: student.medicalConditions || ""
    });
    setCapturedPhoto(student.profilePicture || "");
    setIsEditDialogOpen(true);
  };

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (rate >= 75) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading students...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600 text-center">
              <p>Error loading students: {error}</p>
              <Button onClick={() => window.location.reload()} className="mt-2">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Students</h2>
              <p className="text-gray-600">Manage student records and information</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>

          {/* Add Student Dialog */}
          <AddStudentDialog
            isOpen={isAddDialogOpen}
            onClose={() => setIsAddDialogOpen(false)}
            onSubmit={handleSubmit}
            isLoading={isCreating}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeStudents.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.inactiveStudents.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Inactive</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-purple-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.averageAttendance}%</p>
                    <p className="text-sm text-gray-600">Avg Attendance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search students by name or roll number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filter by Class
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Select Class</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedClass("all")}>
                      All Classes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedClass("9")}>
                      Class 9
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedClass("10")}>
                      Class 10
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedClass("11")}>
                      Class 11
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedClass("12")}>
                      Class 12
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>Student Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student: Student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={student.profilePicture} />
                            <AvatarFallback>
                              {student.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{student.rollNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {student.class}-{student.section}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            {student.parentPhone}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleWhatsAppMessage(student.whatsappNumber)}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              WhatsApp
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getAttendanceColor(student.attendanceRate)}>
                          {student.attendanceRate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(student.status)}>
                          {student.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {student.status === 'inactive' && <XCircle className="h-3 w-3 mr-1" />}
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewStudent(student)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Student
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleWhatsAppMessage(student.whatsappNumber)}>
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Send WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(student.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Student View Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              {selectedStudent && (
                <>
                  <DialogHeader>
                    <DialogTitle>Student Details</DialogTitle>
                    <DialogDescription>
                      Complete information for {selectedStudent.name}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Student Header */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={selectedStudent.profilePicture} />
                        <AvatarFallback className="text-lg">
                          {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">{selectedStudent.name}</h3>
                        <p className="text-gray-500">Roll Number: {selectedStudent.rollNumber}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            Class {selectedStudent.class}-{selectedStudent.section}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(selectedStudent.status)}>
                            {selectedStudent.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Student Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Personal Information</Label>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>Born: {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>Blood Group: {selectedStudent.bloodGroup}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{selectedStudent.address}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Academic Information</Label>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <GraduationCap className="h-4 w-4 text-gray-400" />
                              <span>Admission Date: {new Date(selectedStudent.admissionDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <IdCard className="h-4 w-4 text-gray-400" />
                              <span>Email: {selectedStudent.email}</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium">Attendance Rate</div>
                              <Badge variant="outline" className={getAttendanceColor(selectedStudent.attendanceRate)}>
                                {selectedStudent.attendanceRate}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Contact Information</Label>
                          <div className="mt-2 space-y-2">
                            <div>
                              <div className="text-sm font-medium">Parent/Guardian: {selectedStudent.parentName}</div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{selectedStudent.parentPhone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-green-600 hover:text-green-700"
                                onClick={() => handleWhatsAppMessage(selectedStudent.whatsappNumber)}
                              >
                                <MessageCircle className="h-4 w-4" />
                                Send WhatsApp
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>Emergency: {selectedStudent.emergencyContact}</span>
                            </div>
                          </div>
                        </div>

                        {selectedStudent.medicalConditions && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Medical Information</Label>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded border">
                                {selectedStudent.medicalConditions}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                      Close
                    </Button>
                    <Button onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditStudent(selectedStudent);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Student
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Student Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Student</DialogTitle>
                <DialogDescription>
                  Update student information and photo.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Form Fields (same as Add form) */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Full Name *</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                        placeholder="Enter student name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-rollNumber">Roll Number *</Label>
                      <Input
                        id="edit-rollNumber"
                        value={formData.rollNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('rollNumber', e.target.value)}
                        placeholder="Enter roll number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-class">Class *</Label>
                      <Select value={formData.class} onValueChange={(value) => handleInputChange('class', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Class 1</SelectItem>
                          <SelectItem value="2">Class 2</SelectItem>
                          <SelectItem value="3">Class 3</SelectItem>
                          <SelectItem value="4">Class 4</SelectItem>
                          <SelectItem value="5">Class 5</SelectItem>
                          <SelectItem value="6">Class 6</SelectItem>
                          <SelectItem value="7">Class 7</SelectItem>
                          <SelectItem value="8">Class 8</SelectItem>
                          <SelectItem value="9">Class 9</SelectItem>
                          <SelectItem value="10">Class 10</SelectItem>
                          <SelectItem value="11">Class 11</SelectItem>
                          <SelectItem value="12">Class 12</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-section">Section *</Label>
                      <Select value={formData.section} onValueChange={(value) => handleInputChange('section', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Section A</SelectItem>
                          <SelectItem value="B">Section B</SelectItem>
                          <SelectItem value="C">Section C</SelectItem>
                          <SelectItem value="D">Section D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="graduated">Graduated</SelectItem>
                          <SelectItem value="transferred">Transferred</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-parentPhone">Parent Phone *</Label>
                      <Input
                        id="edit-parentPhone"
                        value={formData.parentPhone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('parentPhone', e.target.value)}
                        placeholder="+1 234-567-8900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-whatsappNumber">WhatsApp Number *</Label>
                      <Input
                        id="edit-whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('whatsappNumber', e.target.value)}
                        placeholder="+1 234-567-8900"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-address">Address *</Label>
                    <Textarea
                      id="edit-address"
                      value={formData.address}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('address', e.target.value)}
                      placeholder="Enter complete address"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Right Column - Photo and Preview (same as Add form) */}
                <div className="space-y-4">
                  <div>
                    <Label>Student Photo</Label>
                    <Card className="p-4">
                      {!isCameraOpen && !capturedPhoto && (
                        <div className="text-center">
                          <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                            <User className="h-24 w-24 text-gray-400" />
                          </div>
                          <Button onClick={startCamera} className="gap-2">
                            <Camera className="h-4 w-4" />
                            Capture Photo
                          </Button>
                        </div>
                      )}

                      {isCameraOpen && (
                        <div className="text-center">
                          <video
                            ref={videoRef}
                            autoPlay
                            muted
                            className="w-48 h-48 mx-auto rounded-lg mb-4"
                          />
                          <div className="flex gap-2 justify-center">
                            <Button onClick={capturePhoto} className="gap-2">
                              <Camera className="h-4 w-4" />
                              Take Photo
                            </Button>
                            <Button variant="outline" onClick={stopCamera}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {capturedPhoto && (
                        <div className="text-center">
                          <img
                            src={capturedPhoto}
                            alt="Student photo"
                            className="w-48 h-48 mx-auto rounded-lg object-cover mb-4"
                          />
                          <div className="flex gap-2 justify-center">
                            <Button variant="outline" onClick={() => {
                              setCapturedPhoto("");
                              setFormData(prev => ({ ...prev, profilePicture: "" }));
                            }}>
                              <RefreshCw className="h-4 w-4" />
                              Retake
                            </Button>
                            <Button onClick={startCamera} variant="outline">
                              <Camera className="h-4 w-4" />
                              New Photo
                            </Button>
                          </div>
                        </div>
                      )}

                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </Card>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  resetForm();
                  setIsEditDialogOpen(false);
                  stopCamera();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateSubmit} disabled={isUpdating || !formData.name || !formData.rollNumber}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Student...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Student
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
