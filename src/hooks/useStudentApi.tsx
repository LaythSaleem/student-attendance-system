import { useState } from 'react';

const API_BASE = 'https://student-attendance-system-4d0g.onrender.com/api';

interface Class {
  id: string;
  name: string;
  section: string;
  description?: string;
  capacity: number;
  teacher_name: string;
  teacher_subject?: string;
  academic_year?: string;
  total_students: number;
  student_count: number; // Added to match backend API response
  total_topics: number;
  topics: Topic[];
  created_at: string;
  updated_at: string;
}

interface Topic {
  id: string;
  name: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'completed';
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  marked_at: string;
  class_name: string;
  class_section: string;
  subject_name?: string;
  teacher_name?: string;
}

export const useStudentApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Get student's classes
  const getMyClasses = async (): Promise<Class[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`${API_BASE}/students/my-classes`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get student's attendance records
  const getMyAttendance = async (
    classId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceRecord[]> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (classId) params.append('classId', classId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const data = await fetchWithAuth(`${API_BASE}/students/my-attendance?${params.toString()}`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get user profile
  const getUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`${API_BASE}/user/profile`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getMyClasses,
    getMyAttendance,
    getUserProfile
  };
};
