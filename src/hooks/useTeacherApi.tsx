import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8888/api';

interface Class {
  id: string;
  name: string;
  section: string;
  subject_name: string;
  total_students: number;
  student_count: number; // Added to match backend API response
}

interface Student {
  id: string;
  name: string;
  roll_number: string;
  class: string;
  section: string;
  enrollment_status: string;
}

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  todayAttendancePercentage: number;
  pendingTasks: number;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late';
  photo?: string;
  notes?: string;
}

interface RecentActivity {
  type: string;
  description: string;
  date: string;
  created_at: string;
  count: number;
}

export const useTeacherApi = () => {
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

  // Get teacher's classes
  const getMyClasses = async (): Promise<Class[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`${API_BASE}/teachers/my-classes`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get students for a specific class
  const getClassStudents = async (classId: string): Promise<Student[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`${API_BASE}/teachers/classes/${classId}/students`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get dashboard statistics
  const getDashboardStats = async (): Promise<DashboardStats | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`${API_BASE}/teachers/dashboard-stats`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Submit photo-based attendance
  const submitPhotoAttendance = async (
    attendanceRecords: AttendanceRecord[],
    classId: string,
    date: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await fetchWithAuth(`${API_BASE}/teachers/photo-attendance`, {
        method: 'POST',
        body: JSON.stringify({
          attendanceRecords,
          classId,
          date
        })
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit attendance');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get recent activity
  const getRecentActivity = async (): Promise<RecentActivity[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`${API_BASE}/teachers/recent-activity`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent activity');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get attendance records
  const getAttendanceRecords = async (
    date?: string,
    classId?: string,
    studentId?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (classId) params.append('classId', classId);
      if (studentId) params.append('studentId', studentId);

      const data = await fetchWithAuth(`${API_BASE}/attendance?${params.toString()}`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance records');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Generate attendance report
  const generateAttendanceReport = async (
    startDate?: string,
    endDate?: string,
    classId?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (classId) params.append('classId', classId);

      const data = await fetchWithAuth(`${API_BASE}/reports/attendance-summary?${params.toString()}`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getMyClasses,
    getClassStudents,
    getDashboardStats,
    submitPhotoAttendance,
    getRecentActivity,
    getAttendanceRecords,
    generateAttendanceReport
  };
};

// Hook for managing teacher dashboard state
export const useTeacherDashboard = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
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
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [classesData, statsData, activityData] = await Promise.all([
        fetchWithAuth(`${API_BASE}/teachers/my-classes`),
        fetchWithAuth(`${API_BASE}/teachers/dashboard-stats`),
        fetchWithAuth(`${API_BASE}/teachers/recent-activity`)
      ]);

      setClasses(classesData);
      setDashboardStats(statsData);
      setRecentActivity(activityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClassStudents = async (classId: string) => {
    try {
      setLoading(true);
      setError(null);
      const studentsData = await fetchWithAuth(`${API_BASE}/teachers/classes/${classId}/students`);
      setStudents(studentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitPhotoAttendance = async (attendanceData: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchWithAuth(`${API_BASE}/teachers/photo-attendance`, {
        method: 'POST',
        body: JSON.stringify(attendanceData),
      });
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit attendance');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    classes,
    students,
    dashboardStats,
    recentActivity,
    loading,
    error,
    loadDashboardData,
    loadClassStudents,
    submitPhotoAttendance
  };
};
