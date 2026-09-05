/**
 * Style Heaven Mens — Mobile Auth Context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import storage from '../services/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user session on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = await storage.getUser();
        const storedToken = await storage.getToken();
        if (storedUser && storedToken) {
          setUser(storedUser);
          setToken(storedToken);
        }
      } catch (e) {
        console.warn('Failed to restore session from storage', e);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (phone, password) => {
    const { data } = await authAPI.login({ phone, password });
    if (data?.token && data?.user) {
      await storage.setToken(data.token);
      await storage.setUser(data.user);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    }
    throw new Error('Invalid response from server');
  };

  const signup = async (userData) => {
    const { data } = await authAPI.signup(userData);
    if (data?.token && data?.user) {
      await storage.setToken(data.token);
      await storage.setUser(data.user);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    }
    throw new Error('Invalid response from server');
  };

  const logout = async () => {
    await storage.removeToken();
    await storage.removeUser();
    setUser(null);
    setToken(null);
  };

  const updateUser = async (updatedData) => {
    const newUser = { ...user, ...updatedData };
    await storage.setUser(newUser);
    setUser(newUser);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isArtisan = user?.role === 'artisan';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isArtisan,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
