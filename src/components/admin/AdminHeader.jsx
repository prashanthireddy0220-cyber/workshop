import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, QrCode, RefreshCw, LogOut, ShieldCheck, User } from 'lucide-react';

const AdminHeader = ({ title, onOpenMobileSidebar, onRefresh, onLaunchScanner }) => {
  const { user, logout } = useAuth();

  return (
    <header style={{
      height: '70px',
      background: 'rgba(7, 13, 27, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 900
    }}>

      {/* Left: Mobile Hamburger & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onOpenMobileSidebar}
          style={{
            display: 'none',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#FFFFFF',
            padding: '8px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
          className="admin-hamburger-btn"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2 style={{ fontSize: '1.25rem', color: '#FFFFFF', fontWeight: 800, margin: 0 }}>
            {title}
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            KARE IEEE Education Society Control Panel
          </span>
        </div>
      </div>

      {/* Right: Actions & Admin Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Launch QR Scanner */}
        {onLaunchScanner && (
          <button
            onClick={onLaunchScanner}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)'
            }}
          >
            <QrCode size={16} /> <span className="desktop-only-text">Venue QR Scanner</span>
          </button>
        )}

        {/* Refresh Data Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh System Data"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94A3B8',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} /> <span className="desktop-only-text">Refresh</span>
          </button>
        )}

        {/* Admin Profile Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#F97316',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            fontWeight: 800,
            fontSize: '0.85rem'
          }}>
            A
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
              {user?.displayName || user?.name || 'IEEE Admin'}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#F97316', fontWeight: 600 }}>
              Authorized Admin
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};

export default AdminHeader;
