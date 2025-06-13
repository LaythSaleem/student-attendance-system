import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = 'http://localhost:8888/api';

// Types
export interface Topic {
  id: string;
  name: string;
  description: string;
  class_id: string;
  order_index: number;
  status: 'planned' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ClassData {
  id: string;
  name: string;
  section: string;
  description: string;
  teacher_id: string;
  teacher_name: string;
  academic_year_id: string;
  capacity: number;
  total_students: number;
  student_count: number; // Added to match backend API response
  total_topics: number;
  topics: Topic[];
  created_at: string;
  updated_at: string;
}

export interface ClassFormData {
  name: string;
  section: string;
  description: string;
  teacher_id: string;
  academic_year_id: string;
  capacity: number;
}

export interface TopicFormData {
  name: string;
  description: string;
  order_index: number;
  status: 'planned' | 'in_progress' | 'completed';
}

interface ClassesStats {
  totalClasses: number;
  totalStudents: number;
  totalTopics: number;
  averageStudentsPerClass: number;
}

// Hook implementation
export const useClassesManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get authentication token
  const getAuthToken = () => {
    const token = localStorage.getItem('auth_token');
    console.log('useClassesManagement: Getting auth token:', token ? 'Token found' : 'No token');
    return token;
  };

  // Helper function for authenticated requests
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    console.log('useClassesManagement: Making request to:', url);
    console.log('useClassesManagement: Auth token present:', !!token);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    console.log('useClassesManagement: Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('useClassesManagement: Request failed:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('useClassesManagement: Response data:', data);
    return data;
  };

  // Fetch classes
  const {
    data: classes = [],
    isLoading: classesLoading,
    error: classesError,
    refetch: refetchClasses
  } = useQuery({
    queryKey: ['classes'],
    queryFn: () => {
      console.log('useClassesManagement: Fetching classes...');
      return fetchWithAuth(`${API_BASE}/classes`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  console.log('useClassesManagement: Query state:', {
    classes: classes?.length,
    classesLoading,
    classesError: classesError?.message
  });

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: (classData: ClassFormData) => {
      console.log('useClassesManagement: Creating class mutation with data:', classData);
      return fetchWithAuth(`${API_BASE}/classes`, {
        method: 'POST',
        body: JSON.stringify(classData),
      });
    },
    onSuccess: (data) => {
      console.log('useClassesManagement: Create class mutation successful:', data);
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (error) => {
      console.error('useClassesManagement: Create class mutation error:', error);
    }
  });

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: ({ id, classData }: { id: string; classData: ClassFormData }) =>
      fetchWithAuth(`${API_BASE}/classes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(classData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('useClassesManagement: Deleting class with ID:', id);
      return fetchWithAuth(`${API_BASE}/classes/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, variables) => {
      console.log('useClassesManagement: Delete class mutation successful for ID:', variables);
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (error) => {
      console.error('useClassesManagement: Delete class mutation error:', error);
    }
  });

  // Topic mutations
  const createTopicMutation = useMutation({
    mutationFn: ({ classId, topicData }: { classId: string; topicData: TopicFormData }) =>
      fetchWithAuth(`${API_BASE}/classes/${classId}/topics`, {
        method: 'POST',
        body: JSON.stringify(topicData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const updateTopicMutation = useMutation({
    mutationFn: ({ id, topicData }: { id: string; topicData: Partial<TopicFormData> }) =>
      fetchWithAuth(`${API_BASE}/topics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(topicData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`${API_BASE}/topics/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const reorderTopicsMutation = useMutation({
    mutationFn: ({ classId, topics }: { classId: string; topics: { id: string; order_index: number }[] }) =>
      fetchWithAuth(`${API_BASE}/classes/${classId}/topics/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ topics }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  // Action functions
  const createClass = async (classData: ClassFormData) => {
    setLoading(true);
    setError(null);
    console.log('useClassesManagement: Creating class with data:', classData);
    try {
      const result = await createClassMutation.mutateAsync(classData);
      console.log('useClassesManagement: Class created successfully:', result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create class';
      console.error('useClassesManagement: Class creation error:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateClass = async (id: string, classData: ClassFormData) => {
    setLoading(true);
    setError(null);
    try {
      await updateClassMutation.mutateAsync({ id, classData });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update class';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteClass = async (id: string) => {
    setLoading(true);
    setError(null);
    console.log('useClassesManagement: Deleting class with ID:', id);
    try {
      const result = await deleteClassMutation.mutateAsync(id);
      console.log('useClassesManagement: Class deleted successfully');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete class';
      console.error('useClassesManagement: Class deletion error:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createTopic = async (classId: string, topicData: TopicFormData) => {
    setLoading(true);
    setError(null);
    console.log('useClassesManagement: Creating topic for class:', classId, 'with data:', topicData);
    try {
      const result = await createTopicMutation.mutateAsync({ classId, topicData });
      console.log('useClassesManagement: Topic created successfully:', result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create topic';
      console.error('useClassesManagement: Topic creation error:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTopic = async (id: string, topicData: Partial<TopicFormData>) => {
    setLoading(true);
    setError(null);
    try {
      await updateTopicMutation.mutateAsync({ id, topicData });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update topic';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTopic = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteTopicMutation.mutateAsync(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete topic';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reorderTopics = async (classId: string, topics: { id: string; order_index: number }[]) => {
    setLoading(true);
    setError(null);
    try {
      await reorderTopicsMutation.mutateAsync({ classId, topics });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder topics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const searchClasses = (searchTerm: string) => {
    return classes.filter((cls: ClassData) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getClassesStats = (): ClassesStats => {
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum: number, cls: ClassData) => sum + (cls.student_count || 0), 0);
    const totalTopics = classes.reduce((sum: number, cls: ClassData) => sum + (cls.total_topics || 0), 0);
    const averageStudentsPerClass = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;

    return {
      totalClasses,
      totalStudents,
      totalTopics,
      averageStudentsPerClass,
    };
  };

  const getClassesByTeacher = (teacherId: string) => {
    return classes.filter((cls: ClassData) => cls.teacher_id === teacherId);
  };

  return {
    // Data
    classes,
    loading: loading || classesLoading,
    error: error || classesError?.message,
    
    // Statistics
    stats: getClassesStats(),
    
    // Class actions
    createClass,
    updateClass,
    deleteClass,
    refetchClasses,
    
    // Topic actions
    createTopic,
    updateTopic,
    deleteTopic,
    reorderTopics,
    
    // Helpers
    searchClasses,
    getClassesByTeacher,
    
    // Mutation states
    isCreatingClass: createClassMutation.isPending,
    isUpdatingClass: updateClassMutation.isPending,
    isDeletingClass: deleteClassMutation.isPending,
    isCreatingTopic: createTopicMutation.isPending,
    isUpdatingTopic: updateTopicMutation.isPending,
    isDeletingTopic: deleteTopicMutation.isPending,
    isReorderingTopics: reorderTopicsMutation.isPending
  };
};
