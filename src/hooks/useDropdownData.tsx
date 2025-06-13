import { useState, useEffect } from 'react';

const API_BASE = 'https://scholar-track-pulse.onrender.com/api';

interface Teacher {
  id: string;
  name: string;
  subject?: string;
}

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: number;
}

interface Class {
  id: string;
  name: string;
  section: string;
}

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

export const useDropdownData = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE}/teachers/dropdown`);
      setTeachers(data);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch teachers');
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE}/academic-years/dropdown`);
      // Filter out academic years with null ID
      const validAcademicYears = data.filter((year: AcademicYear) => year.id !== null);
      setAcademicYears(validAcademicYears);
    } catch (err) {
      console.error('Failed to fetch academic years:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch academic years');
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE}/classes`);
      setClasses(data);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
    }
  };

  const fetchAllDropdownData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchTeachers(),
        fetchAcademicYears(),
        fetchClasses()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dropdown data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDropdownData();
  }, []);

  return {
    teachers,
    academicYears,
    classes,
    loading,
    error,
    refetch: fetchAllDropdownData
  };
};
