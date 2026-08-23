import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertTriangle, LogOut, ShieldCheck, UserCheck, Lock } from 'lucide-react';

const GoogleKLUAuth = ({ onAuthSuccess }) => {
  const { user, handleGoogleLogin, logout, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const onSignInClick = async () => {
    setLoading(true);
    setLocalError('');
    try {
      await handleGoogleLogin();
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      if (err.message !== 'Sign-in cancelled.') {
        setLocalError(err.message || 'Please sign in using your KLU (@klu.ac.in) Google account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{
      padding: '24px',
      borderRadius: '20px',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserCheck size={20} color="#F97316" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
            KLU Google Authentication
          </h3>
        </div>
        {user && (
          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#34D399', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
            <CheckCircle2 size={14} /> Verified Student
          </span>
        )}
      </div>

      {!user ? (
        <div>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginBottom: '18px', lineHeight: 1.5 }}>
            Sign in with your official university account (<strong style={{ color: '#F97316' }}>@klu.ac.in</strong>) to register for the workshop.
          </p>

          {(localError || error) && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#F87171',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={18} flexShrink={0} />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={onSignInClick}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '12px 18px',
              background: '#FFFFFF',
              color: '#1E293B',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(255, 255, 255, 0.15)',
              cursor: loading ? 'wait' : 'pointer',
              marginBottom: '14px',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            {loading ? 'Opening Google Account Chooser...' : 'Sign in with Google Account (@klu.ac.in)'}
          </button>

          <div style={{
            fontSize: '0.78rem',
            color: '#64748B',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <ShieldCheck size={14} color="#34D399" />
            <span>Strictly restricted to <strong>@klu.ac.in</strong> accounts</span>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '14px',
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
              alt={user.name || 'Student Profile'}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                border: '2px solid #F97316',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#34D399" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  KLU Account Verified
                </span>
              </div>
              <h4 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 700, margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.displayName || user.name}
              </h4>
              <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <strong style={{ color: '#F97316' }}>{user.email}</strong>
              </p>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94A3B8',
                borderRadius: '10px',
                padding: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#F87171'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#94A3B8'; }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleKLUAuth;
