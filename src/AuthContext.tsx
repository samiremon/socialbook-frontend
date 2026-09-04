import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';
import { authApi } from './api';

interface AuthContextType {
  user: User | null;
  login: (emailOrUsername: string, pass: string) => Promise<void>;
  register: (name: string, username: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // Default initial user for instant demo
    return {
      id: '1',
      username: 'john_doe',
      fullName: 'John Doe',
      email: 'john@example.com',
      bio: 'Software learner building with C# & React!',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    };
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  const login = async (emailOrUsername: string, pass: string) => {
    const res = await authApi.login(emailOrUsername, pass);
    setUser(res.user);
  };

  const register = async (name: string, username: string, email: string, pass: string) => {
    const res = await authApi.register(name, username, email, pass);
    setUser(res.user);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
