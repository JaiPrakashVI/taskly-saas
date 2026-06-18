import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  viewDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted credentials on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('taskly_token');
    const savedUser = localStorage.getItem('taskly_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Login handler
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('taskly_token', newToken);
    localStorage.setItem('taskly_user', JSON.stringify(newUser));
  };

  // Logout handler (clears client session and contacts backend API)
  const logout = async () => {
    try {
      // Call backend logout endpoint (ignores failures to guarantee client-side logout succeeds)
      await api.post('/auth/logout').catch(() => {});
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('taskly_token');
      localStorage.removeItem('taskly_user');
    }
  };

  // Quick "View Demo" login option (zero typing required)
  const viewDemo = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/login', {
        email: 'demo@taskly.app',
        password: 'TasklyDemo@2026',
      });
      
      const { token: demoToken, user: demoUser } = response.data.data;
      login(demoToken, demoUser);
    } catch (error) {
      console.error('Demo login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, viewDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export type { User };
