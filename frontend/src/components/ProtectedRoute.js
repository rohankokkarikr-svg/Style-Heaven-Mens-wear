import React, { Navigate } from 'react';
import { Navigate as NavRedirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Protects any route behind authentication */
export function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? children : <NavRedirect to="/login" replace />;
}

/** Only allows admin-role users */
export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <NavRedirect to="/login" replace />;
  if (!isAdmin)         return <NavRedirect to="/"      replace />;
  return children;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-dark-600 border-t-gold-500
                        rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    </div>
  );
}
