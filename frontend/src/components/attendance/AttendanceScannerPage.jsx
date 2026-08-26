import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { io } from 'socket.io-client';
import {
  volunteerLoginApi,
  getVolunteerMeApi,
  getCurrentAttendanceSessionApi,
  scanAttendanceApi
} from '../../services/api';
import {
  QrCode,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Lock,
  Unlock,
  LogOut,
  User,
  AlertCircle,
  Volume2,
  Users
} from 'lucide-react';

// Web Audio API Audio Alert Helpers
const playSuccessBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn('[Audio Beep Error]', e);
  }
};

const playWarningBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.setValueAtTime(220, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn('[Audio Warning Error]', e);
  }
};

const AttendanceScannerPage = () => {
  // Volunteer Authentication State
  const [volunteer, setVolunteer] = useState(() => {
    const saved = localStorage.getItem('volunteerInfo');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Attendance Session & Live Count State
  const [sessionState, setSessionState] = useState({
    status: 'CLOSED',
    sessionName: 'IEEE Workshop Attendance',
    presentCount: 0,
    volunteersOnline: 0,
    sessionId: null
  });

  const [scanResult, setScanResult] = useState(null); // { type: 'success'|'warning'|'error', message, participant }
  const [manualInput, setManualInput] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);

  const socketRef = useRef(null);

  // 1. Initial Session Check & Volunteer Profile Verification
  const fetchSessionInfo = async () => {
    try {
      const res = await getCurrentAttendanceSessionApi();
      if (res.data?.success) {
        setSessionState(prev => ({
          ...prev,
          status: res.data.status || 'CLOSED',
          sessionName: res.data.sessionName || 'IEEE Workshop Attendance',
          presentCount: res.data.presentCount || 0,
          volunteersOnline: res.data.volunteersOnline || 0,
          sessionId: res.data.sessionId || null
        }));
      }
    } catch (err) {
      console.warn('[Fetch Session Error]', err);
    }
  };

  useEffect(() => {
    fetchSessionInfo();

    // Verify saved volunteer token
    const token = localStorage.getItem('volunteerToken');
    if (token && !volunteer) {
      getVolunteerMeApi()
        .then(res => {
          if (res.data?.success && res.data.volunteer) {
            setVolunteer(res.data.volunteer);
            localStorage.setItem('volunteerInfo', JSON.stringify(res.data.volunteer));
          }
        })
        .catch(() => {
          localStorage.removeItem('volunteerToken');
          localStorage.removeItem('volunteerInfo');
          setVolunteer(null);
        });
    }
  }, []);

  // 2. Socket.IO Real-Time Synchronization Connection
  useEffect(() => {
    const getSocketUrl = () => {
      let envUrl = import.meta.env.VITE_API_URL;
      if (!envUrl) {
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          envUrl = 'https://workshop-9be7.onrender.com';
        } else {
          envUrl = 'http://localhost:5001';
        }
      }
      let url = envUrl.trim().replace(/\/+$/, '');
      return url.replace(/\/api\/?$/, '');
    };

    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (volunteer) {
        socket.emit('volunteer_connected', {
          id: volunteer.id || volunteer._id,
          name: volunteer.name,
          email: volunteer.email
        });
      }
    });

    // Handle real-time attendance update (from any volunteer's scan)
    socket.on('attendance_updated', (data) => {
      if (data) {
        setSessionState(prev => ({
          ...prev,
          presentCount: data.presentCount !== undefined ? data.presentCount : prev.presentCount
        }));
      }
    });

    // Handle session start/close events from Admin
    socket.on('attendance_session_changed', (data) => {
      if (data) {
        setSessionState(prev => ({
          ...prev,
          status: data.status,
          sessionName: data.session?.sessionName || prev.sessionName,
          presentCount: data.session?.presentCount !== undefined ? data.session.presentCount : (data.status === 'ACTIVE' ? prev.presentCount : 0)
        }));
        if (data.status === 'ACTIVE') {
          setScanResult(null);
          setCameraActive(true);
        }
      }
    });

    // Handle live volunteers online count updates
    socket.on('volunteer_presence_updated', (data) => {
      if (data && data.volunteersOnline !== undefined) {
        setSessionState(prev => ({ ...prev, volunteersOnline: data.volunteersOnline }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [volunteer]);

  // 3. Camera QR Scanner Initialization
  useEffect(() => {
    if (!volunteer || sessionState.status !== 'ACTIVE' || !cameraActive) return;

    let scanner = null;
    const timer = setTimeout(() => {
      const element = document.getElementById('volunteer-qr-reader');
      if (element) {
        element.innerHTML = '';
        scanner = new Html5QrcodeScanner(
          'volunteer-qr-reader',
          {
            fps: 12,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        scanner.render(
          (decodedText) => {
            if (!scanLoading) {
              handleScanSubmit(decodedText);
            }
          },
          () => {} // silent scan frame failure
        );
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch(err => console.warn('[Scanner Clear Warning]', err));
      }
    };
  }, [volunteer, sessionState.status, cameraActive]);

  // 4. Handle Volunteer Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await volunteerLoginApi(loginForm.email, loginForm.password);
      if (res.data.success) {
        const vol = res.data.volunteer;
        const token = res.data.token;
        localStorage.setItem('volunteerToken', token);
        localStorage.setItem('volunteerInfo', JSON.stringify(vol));
        setVolunteer(vol);
        fetchSessionInfo();

        if (socketRef.current) {
          socketRef.current.emit('volunteer_connected', {
            id: vol.id,
            name: vol.name,
            email: vol.email
          });
        }
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // 5. Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('volunteerToken');
    localStorage.removeItem('volunteerInfo');
    setVolunteer(null);
    setScanResult(null);
  };

  // 6. Execute Attendance QR Scan API Call
  const handleScanSubmit = async (tokenPayload) => {
    if (!tokenPayload || !tokenPayload.trim()) return;
    setScanLoading(true);
    setScanResult(null);

    try {
      const res = await scanAttendanceApi(tokenPayload.trim());

      if (res.data.success) {
        playSuccessBeep();
        const participant = res.data.participant;
        setSessionState(prev => ({ ...prev, presentCount: res.data.presentCount || prev.presentCount + 1 }));
        setScanResult({
          type: 'success',
          title: '✓ ATTENDANCE MARKED',
          message: res.data.message || 'Attendance Marked Successfully',
          participant
        });
      }
    } catch (err) {
      const data = err.response?.data;

      if (data?.alreadyCheckedIn) {
        playWarningBeep();
        setScanResult({
          type: 'warning',
          title: 'ALREADY PRESENT',
          message: data.message || 'Participant has already been marked present for this session.',
          participant: data.participant
        });
      } else if (err.response?.status === 400 && data?.message?.includes('closed')) {
        playWarningBeep();
        setScanResult({
          type: 'error',
          title: 'ATTENDANCE CLOSED',
          message: 'Attendance is currently closed by the administrator.',
          participant: null
        });
      } else {
        playWarningBeep();
        setScanResult({
          type: 'error',
          title: 'INVALID QR CODE',
          message: data?.message || 'Invalid QR code or participant not found.',
          participant: null
        });
      }
    } finally {
      setScanLoading(false);
      setManualInput('');
    }
  };

  // 7. Manual Input Submit
  const handleManualFormSubmit = (e) => {
    e.preventDefault();
    handleScanSubmit(manualInput);
  };

  // =========================================================================
  // VIEW 1: VOLUNTEER LOGIN SCREEN (If not authenticated)
  // =========================================================================
  if (!volunteer) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 20%, #0F172A 0%, #070D1B 80%)',
        color: '#F8FAFC',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '28px',
          padding: '40px 36px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Header Icon & Title */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.1) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#38BDF8'
            }}>
              <QrCode size={32} />
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
              ATTENDANCE VOLUNTEER LOGIN
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '6px', fontWeight: 600 }}>
              KARE IEEE • Live Attendance Portal
            </p>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#F87171',
              borderRadius: '14px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={18} />
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Email / Username
              </label>
              <input
                type="text"
                name="volunteer_identity_no_autofill"
                autoComplete="off"
                placeholder="volunteer@example.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: '#0B132B',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Password
              </label>
              <input
                type="password"
                name="volunteer_password_no_autofill"
                autoComplete="new-password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: '#0B132B',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: loginLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)',
                marginTop: '6px'
              }}
            >
              {loginLoading ? 'Logging in...' : 'LOGIN'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.78rem', color: '#64748B' }}>
            Authorized attendance volunteer credentials required. Contact Admin if you need an account.
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LOGGED-IN LIVE ATTENDANCE SCANNER PORTAL
  // =========================================================================
  const isSessionActive = sessionState.status === 'ACTIVE';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0F172A 0%, #070D1B 100%)',
      color: '#F8FAFC',
      fontFamily: "'Inter', sans-serif",
      padding: '20px 16px 40px 16px'
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* ==========================================================================
           HEADER BANNER (Volunteer Name, Status, Live Present Count)
           ========================================================================== */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                LIVE ATTENDANCE
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} color="#38BDF8" />
              <span>Volunteer: <strong style={{ color: '#FFF' }}>{volunteer.name || volunteer.email}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Status Badge */}
            <span style={{
              background: isSessionActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isSessionActive ? '#4ADE80' : '#F87171',
              border: isSessionActive ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {isSessionActive ? <Unlock size={14} /> : <Lock size={14} />}
              Status: {sessionState.status}
            </span>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Logout Volunteer"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94A3B8',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* ==========================================================================
           LIVE ATTENDANCE COUNT METRIC CARD (NO LIMIT DISPLAYED)
           ========================================================================== */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '24px',
          padding: '20px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Present Count
            </div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px', lineHeight: 1 }}>
              Present: {sessionState.presentCount}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>
              Session Name
            </div>
            <div style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: 800, marginTop: '4px' }}>
              {sessionState.sessionName}
            </div>
          </div>
        </div>

        {/* ==========================================================================
           ATTENDANCE CLOSED DISPLAY (When Admin closes attendance)
           ========================================================================== */}
        {!isSessionActive && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '24px',
            padding: '36px 24px',
            marginBottom: '24px',
            textAlign: 'center',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)'
          }}>
            <Lock size={48} color="#F87171" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F87171', margin: 0 }}>
              ATTENDANCE CURRENTLY CLOSED
            </h2>
            <p style={{ color: '#CBD5E1', fontSize: '0.92rem', marginTop: '10px', fontWeight: 600 }}>
              Please wait for the administrator to start attendance again.
            </p>
          </div>
        )}

        {/* ==========================================================================
           LATEST SCAN RESULT PANEL (Success / Duplicate / Invalid)
           ========================================================================== */}
        {scanResult && (
          <div style={{
            background: scanResult.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : scanResult.type === 'warning' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: scanResult.type === 'success' ? '1px solid rgba(34, 197, 94, 0.4)' : scanResult.type === 'warning' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '24px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{
                fontSize: '1.05rem',
                fontWeight: 900,
                color: scanResult.type === 'success' ? '#4ADE80' : scanResult.type === 'warning' ? '#FBBF24' : '#F87171',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {scanResult.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
                {scanResult.title}
              </span>
            </div>

            {scanResult.participant ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem', background: 'rgba(0, 0, 0, 0.2)', padding: '14px', borderRadius: '16px', marginTop: '10px' }}>
                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Participant Name</span>
                  <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1rem', marginTop: '2px' }}>{scanResult.participant.name}</div>
                </div>

                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Participant ID</span>
                  <div style={{ color: '#F97316', fontWeight: 800, fontFamily: 'monospace', fontSize: '0.98rem', marginTop: '2px' }}>{scanResult.participant.registrationId}</div>
                </div>

                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Student ID / Dept</span>
                  <div style={{ color: '#38BDF8', fontWeight: 700, marginTop: '2px' }}>
                    {scanResult.participant.studentId || scanResult.participant.registrationId} ({scanResult.participant.department || 'CSE'})
                  </div>
                </div>

                <div>
                  <span style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Status</span>
                  <div style={{ color: scanResult.type === 'success' ? '#4ADE80' : '#FBBF24', fontWeight: 800, marginTop: '2px' }}>
                    {scanResult.type === 'success' ? '✓ PRESENT' : 'ALREADY PRESENT'}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#F87171', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                {scanResult.message}
              </p>
            )}
          </div>
        )}

        {/* ==========================================================================
           LIVE CAMERA QR SCANNER & MANUAL SCANNER
           ========================================================================== */}
        {isSessionActive && (
          <>
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 15px 35px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QrCode size={18} color="#0EA5E9" /> LIVE CAMERA SCANNER
                </span>
                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#38BDF8',
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {cameraActive ? 'Pause Camera' : 'Start Camera'}
                </button>
              </div>

              {cameraActive ? (
                <div id="volunteer-qr-reader" style={{ width: '100%', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.12)' }} />
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>
                  Camera paused. Click "Start Camera" above or use manual entry below.
                </div>
              )}
            </div>

            {/* Manual QR / ID Backup Form */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '20px 24px',
              marginBottom: '24px'
            }}>
              <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Manual Participant ID / QR Entry
              </span>
              <form onSubmit={handleManualFormSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Enter Participant ID (e.g. IEEE1024 or Roll No)"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: '#0B132B',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={scanLoading || !manualInput.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  {scanLoading ? 'Scanning...' : 'MARK PRESENT'}
                </button>
              </form>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default AttendanceScannerPage;
