import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLoginPage from './AdminLoginPage';
import AdminControlCenter from './AdminControlCenter';

const AdminPortal = () => {
  const { user } = useAuth();

  // 1. Unauthenticated / Non-Admin Gate -> Show Admin Login Page
  if (!user || user.role !== 'admin') {
    return <AdminLoginPage />;
  }

  // 2. Authenticated Admin -> Show Neumorphic Admin Control Center
  return <AdminControlCenter />;
};

export default AdminPortal;
