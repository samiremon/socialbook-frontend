import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';
import { authApi } from './api';

export const JOHN_SAMPLE_USER: User = {
  id: '1',
  username: 'john_doe',
  fullName: 'John Doe',
  email: 'john@example.com',
  bio: 'Software engineer building modern apps with ASP.NET & React! Welcome to my OpenSocial profile 🚀',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
  isActive: true,
  isDemo: true,
};

interface AuthContextType {
  user: User | null;
  login: (emailOrUsername: string, pass: string) => Promise<void>;
  register: (name: string, username: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  exploreAsJohn: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('user');
    if (saved && saved !== 'null' && saved !== 'undefined') {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      } catch {}
    }
    // Default initial user for instant demo account view
    return JOHN_SAMPLE_USER;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.setItem('user', JSON.stringify(JOHN_SAMPLE_USER));
    }
  }, [user]);

  const login = async (emailOrUsername: string, pass: string) => {
    const res = await authApi.login(emailOrUsername, pass);
    let userData = res.user;
    // Always fetch fresh profile details to guarantee uploaded avatar is in sync
    try {
      const freshUser = await authApi.getFreshProfile(String(userData.id));
      if (freshUser) {
        userData = { ...userData, ...freshUser };
      }
    } catch {}
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const register = async (name: string, username: string, email: string, pass: string) => {
    const res = await authApi.register(name, username, email, pass);
    setUser(res.user);
  };

  const logout = () => {
    authApi.logout();
    localStorage.removeItem('token');
    localStorage.setItem('user', JSON.stringify(JOHN_SAMPLE_USER));
    setUser(JOHN_SAMPLE_USER);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  const exploreAsJohn = () => {
    const demoUser = { ...JOHN_SAMPLE_USER, isDemo: true };
    localStorage.setItem('user', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, exploreAsJohn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
