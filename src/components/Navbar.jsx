import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut } from 'lucide-react';

const Navbar = ({ onOpenAuth, onOpenDashboard }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(7, 13, 27, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <img src="/logo.svg" alt="KARE IEEE Education Society" style={{ height: '45px', width: 'auto' }} />
        </a>

        {/* Desktop Nav Links */}
        <div className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <a href="#home" style={{ color: '#F8FAFC', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>Home</a>
          <a href="#about" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>About</a>
          <a href="#topics" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>Topics</a>
          <a href="#schedule" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>Schedule</a>
          <a href="#details" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>Details</a>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={onOpenDashboard} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.875rem' }}>
                <User size={16} />
                My Dashboard
              </button>

              <button onClick={logout} title="Logout" style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94A3B8',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary">
              <User size={18} />
              Google Login
            </button>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: '#FFF',
              cursor: 'pointer'
            }}
            className="mobile-hamburger-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
