import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Camera, User, Save, RefreshCw, Loader2, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { useDropdownData } from "@/hooks/useDropdownData";

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentData: any) => Promise<void>;
  isLoading?: boolean;
}

interface StudentFormData {
  name: string;
  rollNumber: string;
  class: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  whatsappNumber: string;
  profilePicture: string;
}

export function AddStudentDialog({ isOpen, onClose, onSubmit, isLoading = false }: AddStudentDialogProps) {
  const { classes } = useDropdownData();
  const [formData, setFormData] = useState<StudentFormData>({
    name: "",
    rollNumber: "",
    class: "",
    status: "active",
    whatsappNumber: "",
    profilePicture: ""
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup camera when dialog closes or component unmounts
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);

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
          
          const onCanPlay = async () => {
            console.log('Video can play');
            try {
              await video.play();
              console.log('Video playing successfully');
              cleanup();
              resolve();
            } catch (playError) {
              console.error('Error playing video:', playError);
              cleanup();
              reject(playError);
            }
          };
          
          const onError = (error: any) => {
            console.error('Video error:', error);
            cleanup();
            reject(error);
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('canplay', onCanPlay);
          video.addEventListener('error', onError);
          
          // Force load if not already loading
          if (video.readyState >= 2) {
            onCanPlay();
          }
        });
      } else {
        throw new Error('Video element not available after DOM update');
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

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push('Student name is required');
    if (!formData.rollNumber.trim()) errors.push('Roll number is required');
    if (!formData.class) errors.push('Class selection is required');
    
    // Validate roll number format (alphanumeric, 3-10 characters)
    if (formData.rollNumber && !/^[A-Za-z0-9]{3,10}$/.test(formData.rollNumber)) {
      errors.push('Roll number must be 3-10 alphanumeric characters');
    }
    
    // Validate WhatsApp number if provided
    if (formData.whatsappNumber && !/^\+?[\d\s\-\(\)]{8,15}$/.test(formData.whatsappNumber)) {
      errors.push('Please enter a valid WhatsApp number');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    const formErrors = validateForm();
    if (formErrors.length > 0) {
      toast.error(formErrors.join(' '));
      return;
    }

    // Warn if no photo is captured but don't block submission
    if (!capturedPhoto) {
      const confirmed = window.confirm(
        'No student photo has been captured. Students with photos have better identification and security. Do you want to continue without a photo?'
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      const studentData = {
        ...formData,
        profilePicture: capturedPhoto || formData.profilePicture,
        // Add default values for missing fields
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
      
      await onSubmit(studentData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student. Please try again.');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Add keyboard support for photo capture
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isCameraOpen) return;
      
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        capturePhoto();
      } else if (event.code === 'Escape') {
        event.preventDefault();
        stopCamera();
      }
    };

    if (isCameraOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isCameraOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Student
          </DialogTitle>
          <DialogDescription>
            Fill in the essential student information and capture their photo.
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
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Student Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full student name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="rollNumber" className="text-sm font-medium text-gray-700">
                    Roll Number *
                  </Label>
                  <Input
                    id="rollNumber"
                    value={formData.rollNumber}
                    onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                    placeholder="Enter roll number"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="class" className="text-sm font-medium text-gray-700">
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
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
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
                  <Label htmlFor="whatsappNumber" className="text-sm font-medium text-gray-700">
                    WhatsApp Number
                  </Label>
                  <Input
                    id="whatsappNumber"
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
                      aria-label="Upload student photo from device"
                      title="Upload student photo from device"
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

              <canvas ref={canvasRef} className="hidden" />

              {/* File upload as fallback */}
              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-700">
                  Or upload a photo (JPG, PNG, max 5MB)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="mt-2"
                  ref={fileInputRef}
                  aria-label="Upload student photo file"
                  title="Upload student photo file (JPG, PNG, max 5MB)"
                />
              </div>
            </Card>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !formData.name || !formData.rollNumber || !formData.class}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding Student...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Add Student
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
