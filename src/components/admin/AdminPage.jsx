import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLoginPage from './AdminLoginPage';
import AdminControlCenter from './AdminControlCenter';

const AdminPage = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <AdminLoginPage />;
  }

  return <AdminControlCenter />;
};

export default AdminPage;
