import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  setUserRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRoleState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    const savedRole = localStorage.getItem('user_role');

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setUserRoleState(savedRole || userData.role);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('user_role');
      }
    }

    setInitialized(true);
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      
      // Save to localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('user_role', data.user.role);

      // Update state
      setUser(data.user);
      setUserRoleState(data.user.role);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_role');
    setUser(null);
    setUserRoleState(null);
  };

  const setUserRole = (role: string) => {
    localStorage.setItem('user_role', role);
    setUserRoleState(role);
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    userRole,
    loading,
    initialized,
    signIn,
    signOut,
    setUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useMinimalAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useMinimalAuth must be used within an AuthProvider');
  }
  return context;
}

// API helper function
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('user_role');
      window.location.reload();
    }
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
