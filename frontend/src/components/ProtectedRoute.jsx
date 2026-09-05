import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem('sanctum_token');
  const userRole = localStorage.getItem('user_role');

  if (!token) {
    // If not authenticated, redirect based on requested role
    if (role === 'admin') return <Navigate to="/admin/login" replace />;
    if (role === 'teknisi') return <Navigate to="/teknisi/login" replace />;
    return <Navigate to="/admin/login" replace />;
  }

  if (role && userRole && role !== userRole) {
    // If trying to access admin with technician token, or vice versa
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'teknisi') return <Navigate to="/teknisi/tugas" replace />;
  }

  return children;
};
