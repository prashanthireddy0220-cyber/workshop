import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  UserCheck,
  Users,
  Award,
  Image as ImageIcon,
  Megaphone,
  Globe,
  Settings,
  LogOut,
  X,
  Shield
} from 'lucide-react';

const AdminSidebar = ({ activeTab, onSelectTab, isMobileOpen, onCloseMobile }) => {
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workshops', label: 'Workshops', icon: BookOpen },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'students', label: 'Students / Participants', icon: Users },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'content', label: 'Website Content', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 990
          }}
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '270px',
        background: '#070D1B',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: window.innerWidth < 1024 ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)'
      }}>

        {/* Brand Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.svg" alt="KARE IEEE" style={{ height: '36px', width: 'auto' }} />
          </div>

          <button
            onClick={onCloseMobile}
            style={{
              display: window.innerWidth < 1024 ? 'flex' : 'none',
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Admin Role Tag */}
        <div style={{ padding: '14px 20px 6px 20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            padding: '6px 12px',
            borderRadius: '10px',
            color: '#F97316',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <Shield size={14} /> ADMIN CONTROL PANEL
          </div>
        </div>

        {/* Navigation List */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  marginBottom: '4px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  background: isActive ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)' : 'transparent',
                  color: isActive ? '#F97316' : '#94A3B8',
                  borderLeft: isActive ? '3px solid #F97316' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                <IconComponent size={18} color={isActive ? '#F97316' : '#94A3B8'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Logout Button */}
        <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '11px 16px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#F87171',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; }}
          >
            <LogOut size={16} /> Exit Admin Portal
          </button>
        </div>

      </aside>
    </>
  );
};

export default AdminSidebar;
