'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  enrolledCourses: string[]; // course names or IDs
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from cookies/localStorage on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = Cookies.get('accessToken');
        const storedUser = localStorage.getItem('premier_user');

        if (token && storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);

          // Optionally sync/fetch latest profile from server
          const { data } = await api.get('/auth/profile');
          const mappedUser: User = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
            enrolledCourses: data.enrollments?.map((e: any) => e.course.name) || [],
          };
          setUser(mappedUser);
          localStorage.setItem('premier_user', JSON.stringify(mappedUser));
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = data;

      // Set cookie expiry (7 days matching JWT)
      Cookies.set('accessToken', accessToken, { expires: 7 });

      // Fetch profile to get enrollments
      const profileRes = await api.get('/auth/profile');
      const profile = profileRes.data;

      const loggedInUser: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        enrolledCourses: profile.enrollments?.map((e: any) => e.course.name) || [],
      };

      setUser(loggedInUser);
      localStorage.setItem('premier_user', JSON.stringify(loggedInUser));
      return true;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // In this setup, students submit an admission form. 
      // If we need a sign up endpoint, we hit it, otherwise we simulate/support it.
      // Let's call the public admission route or auth register if one exists.
      // For this workflow, students are approved by admin. If there is a direct registration:
      await api.post('/auth/register', { name, email, password });
      return await login(email, password);
    } catch (err) {
      console.error('Signup error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout failure
    }
    setUser(null);
    Cookies.remove('accessToken');
    localStorage.removeItem('premier_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
