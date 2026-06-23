import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sh_user');
    const token  = localStorage.getItem('sh_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (phone, password) => {
    const { data } = await authAPI.login({ phone, password });
    localStorage.setItem('sh_token', data.token);
    localStorage.setItem('sh_user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.name}! 👑`);
    return data.user;
  };

  const signup = async (name, phone, password) => {
    const { data } = await authAPI.signup({ name, phone, password });
    localStorage.setItem('sh_token', data.token);
    localStorage.setItem('sh_user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success('Account created! Welcome to Style Heaven ✨');
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('sh_token');
    localStorage.removeItem('sh_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
