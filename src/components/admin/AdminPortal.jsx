import React, { Component } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLoginPage from './AdminLoginPage';
import AdminControlCenter from './AdminControlCenter';

class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Admin Portal Error]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0F172A',
          color: '#FFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%'
          }}>
            <h2 style={{ color: '#F87171', fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>
              Admin Portal Recovery
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '20px' }}>
              An issue occurred while rendering the admin control view. Click below to reload the admin portal.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              style={{
                background: '#F97316',
                color: '#FFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reload Admin Portal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminPortalContent = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <AdminLoginPage />;
  }

  return <AdminControlCenter />;
};

const AdminPortal = () => {
  return (
    <AdminErrorBoundary>
      <AdminPortalContent />
    </AdminErrorBoundary>
  );
};

export default AdminPortal;
