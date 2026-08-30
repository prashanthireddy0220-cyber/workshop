import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldAlert, ShieldCheck } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { handleGoogleLogin, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const onGoogleSignIn = async () => {
    setLoading(true);
    setLocalError('');
    try {
      await handleGoogleLogin();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      if (err.message !== 'Sign-in cancelled.') {
        setLocalError(err.message || 'Please sign in using your KLU (@klu.ac.in) Google account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(5, 10, 20, 0.82)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="modal-content" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.96) 0%, rgba(10, 15, 30, 0.98) 100%)',
        border: '1px solid rgba(249, 115, 22, 0.25)',
        borderRadius: '24px',
        padding: '36px 32px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(249, 115, 22, 0.12)',
        position: 'relative'
      }}>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            color: '#94A3B8',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.color = '#FFF'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = '#94A3B8'; }}
        >
          <X size={20} />
        </button>

        {/* Header Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 20px',
            background: 'rgba(249, 115, 22, 0.08)',
            borderRadius: '16px',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            marginBottom: '16px'
          }}>
            <img src="/logo-white.svg" alt="KARE IEEE Education Society" style={{ height: '44px', width: 'auto' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#FFFFFF', fontWeight: 800, margin: '6px 0 0 0', letterSpacing: '-0.02em' }}>
            Google Authentication
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '6px', margin: '6px 0 0 0' }}>
            Sign in using your official <strong style={{ color: '#F97316' }}>@klu.ac.in</strong> account
          </p>
        </div>

        {/* Error Notification Alert */}
        {(localError || error) && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#F87171',
            fontSize: '0.85rem'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Main Google OAuth Sign In Button */}
        <div style={{ marginBottom: '10px' }}>
          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '14px 20px',
              background: '#FFFFFF',
              color: '#1E293B',
              border: 'none',
              borderRadius: '14px',
              fontSize: '0.96rem',
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 8px 25px rgba(255, 255, 255, 0.15)',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'none'; }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            {loading ? 'Opening Google Account Chooser...' : 'Sign in with Google (@klu.ac.in)'}
          </button>

          <div style={{
            marginTop: '20px',
            fontSize: '0.78rem',
            color: '#64748B',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <ShieldCheck size={16} color="#34D399" />
            <span>Only official <strong>@klu.ac.in</strong> Google accounts are accepted</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
