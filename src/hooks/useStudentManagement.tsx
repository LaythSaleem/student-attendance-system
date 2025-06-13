import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = 'https://student-attendance-system-4d0g.onrender.com/api';

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

export interface Student {
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

export const useStudentManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('auth_token');
  };

  // API headers with authentication
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  });

  // Fetch all students
  const {
    data: students = [],
    isLoading: studentsLoading,
    error: studentsError,
    refetch: refetchStudents
  } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/students`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      return response.json();
    }
  });

  // Create new student
  const createStudentMutation = useMutation({
    mutationFn: async (studentData: StudentFormData) => {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(studentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create student');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setLoading(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
    }
  });

  // Update student
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, studentData }: { id: string; studentData: StudentFormData }) => {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/students/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(studentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update student');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setLoading(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
    }
  });

  // Delete student
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/students/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete student');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setLoading(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
    }
  });

  // Helper functions
  const createStudent = async (studentData: StudentFormData) => {
    return createStudentMutation.mutateAsync(studentData);
  };

  const updateStudent = async (id: string, studentData: StudentFormData) => {
    return updateStudentMutation.mutateAsync({ id, studentData });
  };

  const deleteStudent = async (id: string) => {
    return deleteStudentMutation.mutateAsync(id);
  };

  // WhatsApp integration
  const sendWhatsAppMessage = (phoneNumber: string, customMessage?: string) => {
    const defaultMessage = "Hello! This is a message from the school administration.";
    const message = encodeURIComponent(customMessage || defaultMessage);
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Statistics
  const getStudentStats = () => {
    const totalStudents = students.length;
    const activeStudents = students.filter((s: any) => s.status === 'active').length;
    const inactiveStudents = students.filter((s: any) => s.status === 'inactive').length;
    const graduatedStudents = students.filter((s: any) => s.status === 'graduated').length;
    const averageAttendance = students.length > 0 
      ? students.reduce((sum: number, student: any) => sum + (student.attendanceRate || 0), 0) / students.length 
      : 0;

    return {
      totalStudents,
      activeStudents,
      inactiveStudents,
      graduatedStudents,
      averageAttendance: Math.round(averageAttendance * 10) / 10
    };
  };

  // Filter students by class
  const getStudentsByClass = (classId: string) => {
    return students.filter((student: any) => student.class === classId);
  };

  // Search students
  const searchStudents = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return students.filter((student: any) => 
      student.name.toLowerCase().includes(lowercaseQuery) ||
      student.rollNumber.toLowerCase().includes(lowercaseQuery) ||
      student.email.toLowerCase().includes(lowercaseQuery)
    );
  };

  return {
    // Data
    students,
    loading: loading || studentsLoading,
    error: error || studentsError?.message,
    
    // Statistics
    stats: getStudentStats(),
    
    // Actions
    createStudent,
    updateStudent,
    deleteStudent,
    refetchStudents,
    
    // Helpers
    sendWhatsAppMessage,
    getStudentsByClass,
    searchStudents,
    
    // Mutation states
    isCreating: createStudentMutation.isPending,
    isUpdating: updateStudentMutation.isPending,
    isDeleting: deleteStudentMutation.isPending
  };
};
