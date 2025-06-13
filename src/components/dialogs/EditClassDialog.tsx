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
import { ClassFormData, ClassData } from '@/hooks/useClassesManagement';
import { useDropdownData } from '@/hooks/useDropdownData';

interface EditClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData | null;
  onSubmit: (classData: ClassFormData) => Promise<void>;
  isLoading: boolean;
}

export function EditClassDialog({ isOpen, onClose, classData, onSubmit, isLoading }: EditClassDialogProps) {
  const { teachers, academicYears } = useDropdownData();
  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    section: '',
    description: '',
    teacher_id: '',
    academic_year_id: '',
    capacity: 30
  });

  const resetForm = () => {
    if (classData) {
      setFormData({
        name: classData.name || '',
        section: classData.section || '',
        description: classData.description || '',
        teacher_id: classData.teacher_id || '',
        academic_year_id: classData.academic_year_id || '',
        capacity: classData.capacity || 30
      });
    }
  };

  const handleInputChange = (field: keyof ClassFormData, value: string | number) => {
    // Convert special values back to empty strings for backend compatibility
    const processedValue = value === 'unassigned' ? '' : value;
    setFormData((prev: ClassFormData) => ({ ...prev, [field]: processedValue }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.section.trim()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error is handled by parent
    }
  };

  useEffect(() => {
    if (isOpen && classData) {
      resetForm();
    }
  }, [isOpen, classData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Medical Stage</DialogTitle>
          <DialogDescription>
            Update medical stage information and settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-class-name">Stage/Class Name *</Label>
              <Input
                id="edit-class-name"
                placeholder="e.g., Stage 7, Internship"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-section">Year/Section *</Label>
              <Input
                id="edit-section"
                placeholder="e.g., Seventh Year"
                value={formData.section}
                onChange={(e) => handleInputChange('section', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">Medical Curriculum Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Medical curriculum description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-teacher">Medical Faculty</Label>
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
              <Label htmlFor="edit-capacity">Student Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                min="1"
                max="100"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-academic-year">Medical Academic Year</Label>
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
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Medical Stage
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
