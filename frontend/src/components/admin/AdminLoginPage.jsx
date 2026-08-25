import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, User, Eye, EyeOff, ShieldAlert, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

const AdminLoginPage = () => {
  const { handleAdminLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter valid admin username and password credentials.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await handleAdminLogin(username.trim(), password.trim());
      window.location.hash = '#dashboard';
    } catch (err) {
      setErrorMsg(err.message || 'Access Denied: Invalid admin username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 50% 20%, #0F172A 0%, #070D1B 60%, #030712 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      color: '#F8FAFC',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Decorative Ambient Spotlights */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.12) 0%, rgba(15, 23, 42, 0) 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0) 70%)',
        pointerEvents: 'none'
      }} />

      {/* Main Glassmorphic Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(249, 115, 22, 0.25)',
        borderRadius: '28px',
        padding: '42px 36px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(249, 115, 22, 0.15)',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 22px',
            background: 'rgba(249, 115, 22, 0.08)',
            borderRadius: '18px',
            border: '1px solid rgba(249, 115, 22, 0.22)',
            marginBottom: '18px'
          }}>
            <img src="/logo.svg" alt="KARE IEEE Education Society" style={{ height: '46px', width: 'auto' }} />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(249, 115, 22, 0.15)',
            color: '#F97316',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '10px'
          }}>
            <Shield size={12} /> RESTRICTED ADMIN ACCESS
          </div>

          <h1 style={{ fontSize: '1.65rem', color: '#FFFFFF', fontWeight: 800, margin: '4px 0 0 0', letterSpacing: '-0.02em' }}>
            IEEE Admin Portal
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '6px', lineHeight: 1.5 }}>
            Manage workshops, registrations, venue attendance & website content
          </p>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#F87171',
            fontSize: '0.86rem'
          }}>
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit}>
          
          {/* Username Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.02em' }}>
              ADMIN USERNAME
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
                style={{
                  width: '100%',
                  padding: '13px 16px 13px 44px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  color: '#FFFFFF',
                  fontSize: '0.94rem',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#F97316'; e.target.style.background = 'rgba(249, 115, 22, 0.04)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.target.style.background = 'rgba(255, 255, 255, 0.04)'; }}
              />
              <User size={18} color="#F97316" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.02em' }}>
              ADMIN PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                style={{
                  width: '100%',
                  padding: '13px 48px 13px 44px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  color: '#FFFFFF',
                  fontSize: '0.94rem',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#F97316'; e.target.style.background = 'rgba(249, 115, 22, 0.04)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.target.style.background = 'rgba(255, 255, 255, 0.04)'; }}
              />
              <Lock size={18} color="#F97316" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me Option */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#94A3B8' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#F97316', width: '16px', height: '16px' }}
              />
              <span>Remember session credentials</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 25px rgba(249, 115, 22, 0.35)',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.75 : 1
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'none'; }}
          >
            <Lock size={18} />
            {loading ? 'Authenticating Credentials...' : 'Sign In to Admin Dashboard'}
          </button>
        </form>

        {/* Back Link */}
        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <a
            href="/"
            style={{
              color: '#94A3B8',
              fontSize: '0.85rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#F97316'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
          >
            <ArrowLeft size={16} /> Return to Public IEEE Website
          </a>
        </div>

      </div>
    </div>
  );
};

export default AdminLoginPage;
