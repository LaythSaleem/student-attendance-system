import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { ClassFormData } from '@/hooks/useClassesManagement';
import { useDropdownData } from '@/hooks/useDropdownData';

interface AddClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (classData: ClassFormData) => Promise<void>;
  isLoading: boolean;
}

export function AddClassDialog({ isOpen, onClose, onSubmit, isLoading }: AddClassDialogProps) {
  const { teachers, academicYears } = useDropdownData();
  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    section: '',
    description: '',
    teacher_id: '',
    academic_year_id: '',
    capacity: 50  // Default capacity for medical college
  });

  const resetForm = () => {
    setFormData({
      name: '',
      section: '',
      description: '',
      teacher_id: '',
      academic_year_id: '',
      capacity: 50  // Default capacity for medical college
    });
  };

  const handleInputChange = (field: keyof ClassFormData, value: string | number) => {
    // Convert special values back to empty strings for backend compatibility
    const processedValue = value === 'unassigned' ? '' : value;
    setFormData((prev: ClassFormData) => ({ ...prev, [field]: processedValue }));
  };

  const handleSubmit = async () => {
    // Enhanced validation with debugging
    console.log('AddClassDialog: Form submission started', formData);
    
    if (!formData.name.trim() || !formData.section.trim()) {
      console.error('AddClassDialog: Missing required fields - name or section');
      return;
    }

    if (!formData.academic_year_id) {
      console.error('AddClassDialog: Missing academic year');
      return;
    }

    try {
      console.log('AddClassDialog: Calling onSubmit with data:', formData);
      await onSubmit(formData);
      console.log('AddClassDialog: Class created successfully');
      resetForm();
    } catch (error) {
      console.error('AddClassDialog: Class creation failed:', error);
      // Error is handled by parent, but we log it for debugging
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Medical Stage</DialogTitle>
          <DialogDescription>
            Create a new medical stage or class with curriculum information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="class-name">Stage/Class Name *</Label>
              <Input
                id="class-name"
                placeholder="e.g., Stage 7, Internship, Advanced Surgery"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="section">Year/Section *</Label>
              <Input
                id="section"
                placeholder="e.g., Seventh Year, Residency Year 1"
                value={formData.section}
                onChange={(e) => handleInputChange('section', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Medical Curriculum Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., Advanced clinical practice and specialization in medical subspecialties"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="teacher">Medical Faculty</Label>
              <Select value={formData.teacher_id || 'unassigned'} onValueChange={(value) => handleInputChange('teacher_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medical faculty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No faculty assigned</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} {teacher.subject && `(${teacher.subject})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="capacity">Student Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="100"
                placeholder="e.g., 50"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="academic-year">Medical Academic Year</Label>
            <Select value={formData.academic_year_id} onValueChange={(value) => handleInputChange('academic_year_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select medical academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name} {year.is_current ? '(Current)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !formData.name.trim() || !formData.section.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Medical Stage
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
