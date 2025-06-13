import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStudentManagement } from "@/hooks/useStudentManagement"
import { useDropdownData } from "@/hooks/useDropdownData"
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
  RefreshCw,
  AlertCircle
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
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  whatsappNumber: string;
  profilePicture?: string;
}

export function StudentsPage() {
  const { classes } = useDropdownData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    status: "active",
    whatsappNumber: "",
    profilePicture: ""
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
  const checkCameraPermissions = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state === 'granted' || result.state === 'prompt';
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      return true;
    }
  };

  const startCamera = async () => {
    setIsStartingCamera(true);
    setCameraError("");
    
    try {
      // Check if camera permissions are available
      const hasPermission = await checkCameraPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      const constraints = {
        video: {
          width: { ideal: 640, min: 480 },
          height: { ideal: 480, min: 360 },
          facingMode: 'user',
          aspectRatio: 1 // Square aspect ratio for profile photos
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      // Set camera open state first to ensure video element is rendered
      setIsCameraOpen(true);
      
      // Use requestAnimationFrame to ensure DOM is updated before setting video source
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            resolve();
          }, 50); // Small delay to ensure render
        });
      });
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        
        // Set video properties
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        
        // Wait for video to load and start playing
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Video loading timeout'));
          }, 10000); // 10 second timeout
          
          const cleanup = () => {
            clearTimeout(timeoutId);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
          };
          
          const onLoadedMetadata = () => {
            console.log('Video metadata loaded');
          };
          
          const onCanPlay = () => {
            console.log('Video can play');
            cleanup();
            resolve();
          };
          
          const onError = (e: any) => {
            console.error('Video error:', e);
            cleanup();
            reject(new Error('Video failed to load'));
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('canplay', onCanPlay);
          video.addEventListener('error', onError);
        });
      }
      
      toast.success('Camera ready! Position yourself in the frame and click "Take Photo"');
      
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      // Clean up on error
      setIsCameraOpen(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      
      let errorMessage = 'Failed to access camera. ';
      
      if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
        errorMessage += 'Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported in this browser.';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'Camera took too long to start. Please try again.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      setCameraError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsStartingCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    setIsCameraOpen(false);
    setCameraError("");
  };

  const compressImage = (canvas: HTMLCanvasElement, quality: number = 0.8): string => {
    // Try different compression levels
    let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    
    // If the image is still too large (>1MB), reduce quality further
    while (compressedDataUrl.length > 1048576 && quality > 0.1) {
      quality -= 0.1;
      compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    
    return compressedDataUrl;
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready. Please try again.');
      return;
    }

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 image data with compression
      const photoData = compressImage(canvas, 0.8);
      
      if (photoData && photoData !== 'data:,') {
        setCapturedPhoto(photoData);
        setFormData(prev => ({ ...prev, profilePicture: photoData }));
        stopCamera();
        toast.success('Photo captured successfully!');
      } else {
        throw new Error('Failed to capture photo data');
      }
      
    } catch (error: any) {
      console.error('Error capturing photo:', error);
      toast.error('Failed to capture photo. Please try again.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Please select an image under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setCapturedPhoto(result);
        setFormData(prev => ({ ...prev, profilePicture: result }));
        toast.success('Photo uploaded successfully!');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read the selected file');
    };
    reader.readAsDataURL(file);
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
      status: "active",
      whatsappNumber: "",
      profilePicture: ""
    });
    setCapturedPhoto("");
    setCameraError("");
    stopCamera();
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
        profilePicture: capturedPhoto || formData.profilePicture,
        // Add default values for backend compatibility
        section: "A",
        parentPhone: formData.whatsappNumber,
        address: "",
        dateOfBirth: "",
        email: `${formData.rollNumber}@student.school.com`,
        parentName: "",
        emergencyContact: "",
        bloodGroup: "",
        medicalConditions: ""
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
      status: student.status,
      whatsappNumber: student.whatsappNumber,
      profilePicture: student.profilePicture || ""
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
                      Filter by Medical Stage
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Select Medical Stage</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedClass("all")}>
                      All Medical Stages
                    </DropdownMenuItem>
                    {classes.map((cls) => (
                      <DropdownMenuItem key={cls.id} onClick={() => setSelectedClass(cls.id)}>
                        {cls.name} - {cls.section}
                      </DropdownMenuItem>
                    ))}
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Essential Fields - Left Column */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                      Essential Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                          Student Name *
                        </Label>
                        <Input
                          id="edit-name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter full student name"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-rollNumber" className="text-sm font-medium text-gray-700">
                          Roll Number *
                        </Label>
                        <Input
                          id="edit-rollNumber"
                          value={formData.rollNumber}
                          onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                          placeholder="Enter roll number"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-class" className="text-sm font-medium text-gray-700">
                          Medical Stage *
                        </Label>
                        <Select value={formData.class} onValueChange={(value) => handleInputChange('class', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select medical stage" />
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

                      <div>
                        <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700">
                          Status
                        </Label>
                        <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                          <SelectTrigger className="mt-1">
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

                      <div>
                        <Label htmlFor="edit-whatsappNumber" className="text-sm font-medium text-gray-700">
                          WhatsApp Number
                        </Label>
                        <Input
                          id="edit-whatsappNumber"
                          value={formData.whatsappNumber}
                          onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                          placeholder="+1 234-567-8900"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Student Preview */}
                  {formData.name && (
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-3">Student Preview</h4>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={capturedPhoto} />
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {formData.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{formData.name}</div>
                          <div className="text-xs text-gray-600">
                            {formData.rollNumber && `Roll: ${formData.rollNumber}`}
                            {formData.class && ` • ${classes.find(c => c.id === formData.class)?.name || formData.class}`}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {formData.status}
                            </Badge>
                            {capturedPhoto && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                ✓ Photo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Photo Capture - Right Column */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Student Photo
                  </h3>
                  
                  <Card className="p-4">
                    {cameraError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <p className="text-sm">{cameraError}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setCameraError("");
                            startCamera();
                          }}
                          className="text-red-700 border-red-300 hover:bg-red-50"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Try Again
                        </Button>
                      </div>
                    )}

                    {!isCameraOpen && !capturedPhoto && !cameraError && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h5 className="text-sm font-medium text-blue-800 mb-2">Camera Tips:</h5>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>• Ensure good lighting for better photo quality</li>
                          <li>• Face the camera directly for ID photos</li>
                          <li>• Browser will ask for camera permission</li>
                          <li>• Photos are processed locally and securely</li>
                        </ul>
                      </div>
                    )}

                    {!isCameraOpen && !capturedPhoto && (
                      <div className="text-center">
                        <div className="w-full aspect-square max-w-[300px] mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                          <div className="text-center">
                            <User className="h-20 w-20 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No photo captured</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            onClick={startCamera} 
                            className="gap-2 w-full" 
                            disabled={isStartingCamera}
                          >
                            {isStartingCamera ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Starting Camera...
                              </>
                            ) : (
                              <>
                                <Camera className="h-4 w-4" />
                                Capture Photo with Camera
                              </>
                            )}
                          </Button>
                          
                          <div className="text-center text-xs text-gray-500 my-2">or</div>
                          
                          <Button 
                            variant="outline" 
                            onClick={() => fileInputRef.current?.click()}
                            className="gap-2 w-full"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Photo from Device
                          </Button>
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}

                    {isCameraOpen && (
                      <div className="text-center">
                        <div className="relative">
                          <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full aspect-square max-w-[300px] mx-auto rounded-lg mb-4 object-cover bg-gray-100"
                          />
                          {/* Loading overlay while camera initializes */}
                          {isStartingCamera && (
                            <div className="absolute inset-0 max-w-[300px] mx-auto bg-gray-900 bg-opacity-75 flex items-center justify-center rounded-lg">
                              <div className="text-white text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                <p className="text-sm">Initializing camera...</p>
                              </div>
                            </div>
                          )}
                          {/* Camera overlay for better positioning */}
                          {!isStartingCamera && (
                            <div className="absolute inset-0 max-w-[300px] mx-auto">
                              <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                Position your face in the frame
                              </div>
                              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                Press Space or Enter to capture
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={capturePhoto} 
                            className="gap-2 flex-1"
                            disabled={isStartingCamera}
                          >
                            <Camera className="h-4 w-4" />
                            Take Photo
                          </Button>
                          <Button variant="outline" onClick={stopCamera} className="flex-1">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {capturedPhoto && (
                      <div className="text-center">
                        <div className="relative">
                          <img
                            src={capturedPhoto}
                            alt="Student photo"
                            className="w-full aspect-square max-w-[300px] mx-auto rounded-lg object-cover mb-4 border-2 border-green-200"
                          />
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            ✓ Photo Captured
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => {
                            setCapturedPhoto("");
                            setFormData(prev => ({ ...prev, profilePicture: "" }));
                            toast.info('Photo removed. You can capture a new one.');
                          }} className="flex-1">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Remove Photo
                          </Button>
                          <Button onClick={startCamera} variant="outline" className="flex-1">
                            <Camera className="h-4 w-4 mr-1" />
                            Retake
                          </Button>
                        </div>
                      </div>
                    )}

                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </Card>
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
