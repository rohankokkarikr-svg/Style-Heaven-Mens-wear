import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage and auto-sync with database
  useEffect(() => {
    const stored = localStorage.getItem('sh_user');
    const token = localStorage.getItem('sh_token');
    if (stored && token) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role) parsed.role = parsed.role.trim().toLowerCase();
        setUser(parsed);
      } catch (e) {}
    }

    // Always fetch fresh profile from DB to reflect role changes made in Supabase
    if (token) {
      authAPI.me()
        .then(({ data }) => {
          if (data) {
            const normalized = { ...data, role: (data.role || 'user').trim().toLowerCase() };
            setUser(normalized);
            localStorage.setItem('sh_user', JSON.stringify(normalized));
          }
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem('sh_token');
            localStorage.removeItem('sh_user');
            setUser(null);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (phone, password) => {
    const { data } = await authAPI.login({ phone, password });
    const normalizedUser = {
      ...data.user,
      role: (data.user?.role || 'user').trim().toLowerCase(),
    };
    localStorage.setItem('sh_token', data.token);
    localStorage.setItem('sh_user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    toast.success(`Welcome back, ${normalizedUser.name}! 👑`);
    return normalizedUser;
  };

  const signup = async (name, phone, password, role = 'user', store_name, artisan_type, upi_id, upi_qr_code) => {
    const { data } = await authAPI.signup({ name, phone, password, role, store_name, artisan_type, upi_id, upi_qr_code });
    const normalizedUser = {
      ...data.user,
      role: (data.user?.role || 'user').trim().toLowerCase(),
    };
    localStorage.setItem('sh_token', data.token);
    localStorage.setItem('sh_user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    toast.success('Account created! Welcome to KalaStyle AI ✨');
    return normalizedUser;
  };

  const logout = () => {
    localStorage.removeItem('sh_token');
    localStorage.removeItem('sh_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const currentRole = (user?.role || '').trim().toLowerCase();
  const isAdmin = currentRole === 'admin';
  const isArtisan = currentRole === 'artisan';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAdmin, isArtisan, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
