import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  getAttendanceStatusApi,
  scanAttendanceApi,
  getAttendanceStatsApi
} from '../../services/api';
import {
  QrCode,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  RefreshCw,
  Search,
  Users,
  Lock,
  Unlock,
  LogOut,
  Sparkles
} from 'lucide-react';

const AttendanceScannerPage = () => {
  const { user, logout } = useAuth();

  const [statusInfo, setStatusInfo] = useState({
    eventName: 'Intelligent Yield Prediction & AI/ML Workshop',
    attendanceOpen: true,
    attendanceLimit: 200,
    currentAttendance: 0,
    remainingAttendanceSlots: 200
  });

  const [recentScans, setRecentScans] = useState([]);
  const [lastScannedParticipant, setLastScannedParticipant] = useState(null);
  const [scanResultMsg, setScanResultMsg] = useState({ type: '', text: '' });

  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);

  // 1. Fetch Live Status & Recent Scans
  const fetchStatusAndStats = async () => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        getAttendanceStatusApi().catch(() => ({ data: {} })),
        getAttendanceStatsApi().catch(() => ({ data: {} }))
      ]);

      if (statusRes.data?.success) {
        setStatusInfo({
          eventName: statusRes.data.eventName || 'Intelligent Yield Prediction & AI/ML Workshop',
          attendanceOpen: statusRes.data.attendanceOpen !== false,
          attendanceLimit: statusRes.data.attendanceLimit || 200,
          currentAttendance: statusRes.data.currentAttendance || 0,
          remainingAttendanceSlots: statusRes.data.remainingAttendanceSlots !== undefined ? statusRes.data.remainingAttendanceSlots : 200
        });
      }

      if (statsRes.data?.success && statsRes.data.recentScans) {
        setRecentScans(statsRes.data.recentScans);
      }
    } catch (err) {
      console.error('[Attendance Page Fetch Error]', err);
    }
  };

  useEffect(() => {
    fetchStatusAndStats();
    const interval = setInterval(fetchStatusAndStats, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // 2. Initialize Camera Scanner
  useEffect(() => {
    if (!cameraActive || !statusInfo.attendanceOpen) return;

    let scanner = null;
    const timer = setTimeout(() => {
      const element = document.getElementById('attend-qr-reader');
      if (element) {
        element.innerHTML = '';
        scanner = new Html5QrcodeScanner('attend-qr-reader', {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        }, false);

        scanner.render(handleScanSuccess, handleScanError);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch(err => console.warn('[QR Scanner Clear Warning]', err));
      }
    };
  }, [cameraActive, statusInfo.attendanceOpen]);

  // Handle successful QR scan
  const handleScanSuccess = async (decodedText) => {
    if (loading) return;
    executeScan(decodedText);
  };

  const handleScanError = () => {
    // Silent camera frame scan iteration
  };

  // 3. Process Scan API call
  const executeScan = async (tokenValue) => {
    if (!tokenValue || !tokenValue.trim()) return;
    setLoading(true);
    setScanResultMsg({ type: '', text: '' });

    try {
      const res = await scanAttendanceApi(tokenValue.trim());
      if (res.data.success) {
        const participant = res.data.participant;
        setLastScannedParticipant(participant);
        setScanResultMsg({
          type: 'success',
          text: `✓ Attendance Marked: ${participant.name} (${participant.registrationId}) - PRESENT`
        });
        fetchStatusAndStats();
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.alreadyCheckedIn) {
        setLastScannedParticipant(data.participant);
        setScanResultMsg({
          type: 'warning',
          text: `⚠️ Duplicate Scan: ${data.participant?.name || 'Participant'} has already checked in!`
        });
      } else {
        setScanResultMsg({
          type: 'error',
          text: data?.message || '✗ Invalid QR code or scanning error.'
        });
      }
    } finally {
      setLoading(false);
      setManualToken('');
    }
  };

  // Manual fallback form submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    executeScan(manualToken);
  };

  // 4. Role Authorization Check Gate
  const isAuthorized = user && (user.role === 'admin' || user.role === 'attendance_team');

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#070D1B', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '24px', padding: '36px', maxWidth: '440px', textAlign: 'center' }}>
          <Shield size={48} color="#F97316" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Authentication Required</h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '8px' }}>
            Please sign in with your authorized attendance team or admin account to access the scanning portal.
          </p>
          <a href="/admin" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px', padding: '12px 24px' }}>
            Sign In to Portal
          </a>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div style={{ minHeight: '100vh', background: '#070D1B', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '24px', padding: '36px', maxWidth: '460px', textAlign: 'center' }}>
          <XCircle size={52} color="#F87171" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F87171' }}>Access Denied</h2>
          <p style={{ color: '#94A3B8', fontSize: '0.92rem', marginTop: '8px', lineHeight: 1.5 }}>
            The <code>/attend</code> portal is strictly reserved for authorized Attendance Team Members and Administrators.
          </p>
          <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '12px', fontSize: '0.85rem', color: '#CBD5E1' }}>
            Logged in as: <strong>{user.email}</strong> ({user.role})
          </div>
          <a href="/" className="btn-secondary" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px' }}>
            Return to Main Website
          </a>
        </div>
      </div>
    );
  }

  // 5. Main Attendance Portal UI
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 10%, #0F172A 0%, #070D1B 70%, #030712 100%)',
      color: '#F8FAFC',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      padding: '20px 16px 40px 16px'
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Top Header Bar */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#F97316', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              IEEE EDUCATION SOCIETY
            </span>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFF', margin: '2px 0 0 0' }}>
              EVENT ATTENDANCE
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: statusInfo.attendanceOpen ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: statusInfo.attendanceOpen ? '#4ADE80' : '#F87171',
              border: statusInfo.attendanceOpen ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {statusInfo.attendanceOpen ? <Unlock size={12} /> : <Lock size={12} />}
              {statusInfo.attendanceOpen ? 'ACTIVE' : 'CLOSED'}
            </span>

            <button
              onClick={logout}
              title="Logout"
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94A3B8', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Live Attendance Counter Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '20px',
          padding: '18px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Today's Attendance
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
              {statusInfo.currentAttendance} <span style={{ fontSize: '1.1rem', color: '#64748B', fontWeight: 700 }}>/ {statusInfo.attendanceLimit}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>Remaining Slots</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ADE80', marginTop: '2px' }}>
              {statusInfo.remainingAttendanceSlots}
            </div>
          </div>
        </div>

        {/* Closed Banner if Attendance is Disabled */}
        {!statusInfo.attendanceOpen && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            padding: '18px',
            marginBottom: '20px',
            textAlign: 'center',
            color: '#F87171',
            fontWeight: 800
          }}>
            <Lock size={32} style={{ margin: '0 auto 8px auto' }} />
            Attendance is currently closed.
          </div>
        )}

        {/* Notification Alert Message */}
        {scanResultMsg.text && (
          <div style={{
            background: scanResultMsg.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : scanResultMsg.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: scanResultMsg.type === 'success' ? '1px solid rgba(34, 197, 94, 0.4)' : scanResultMsg.type === 'warning' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            color: scanResultMsg.type === 'success' ? '#4ADE80' : scanResultMsg.type === 'warning' ? '#FBBF24' : '#F87171',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '20px',
            fontSize: '0.92rem',
            fontWeight: 700,
            textAlign: 'center'
          }}>
            {scanResultMsg.text}
          </div>
        )}

        {/* QR Scanner Container */}
        {statusInfo.attendanceOpen && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <QrCode size={16} color="#F97316" /> Camera QR Scanner
              </span>
              <button
                onClick={() => setCameraActive(!cameraActive)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#38BDF8', padding: '6px 12px', borderRadius: '14px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {cameraActive ? 'Pause Camera' : 'Open Camera'}
              </button>
            </div>

            {cameraActive ? (
              <div id="attend-qr-reader" style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }} />
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '0.88rem' }}>
                Camera paused. Click "Open Camera" above or use manual entry below.
              </div>
            )}
          </div>
        )}

        {/* Manual Search Backup Form */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#94A3B8', marginBottom: '10px', textTransform: 'uppercase' }}>
            Manual Search / Backup Entry
          </span>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Participant ID (REG-KLU-5775-XXXX) or Email"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              disabled={loading || !statusInfo.attendanceOpen}
            />
            <button
              type="submit"
              disabled={loading || !manualToken.trim() || !statusInfo.attendanceOpen}
              className="btn-primary"
              style={{ flexShrink: 0, padding: '0 20px' }}
            >
              <UserCheck size={18} /> {loading ? 'Scanning...' : 'Check-In'}
            </button>
          </form>
        </div>

        {/* Last Scanned Participant Details Card */}
        {lastScannedParticipant && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#4ADE80', fontWeight: 800, textTransform: 'uppercase' }}>Participant Scanned</span>
                <h3 style={{ fontSize: '1.2rem', color: '#FFF', fontWeight: 800, margin: '2px 0 0 0' }}>{lastScannedParticipant.name}</h3>
              </div>
              <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                ✓ PRESENT
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#94A3B8' }}>Participant ID:</span>
                <div style={{ color: '#F97316', fontWeight: 800, fontFamily: 'monospace' }}>{lastScannedParticipant.registrationId}</div>
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>Email:</span>
                <div style={{ color: '#38BDF8', fontWeight: 600, wordBreak: 'break-all' }}>{lastScannedParticipant.email}</div>
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>Dept & Year:</span>
                <div style={{ color: '#FFF', fontWeight: 600 }}>{lastScannedParticipant.department} ({lastScannedParticipant.year})</div>
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>Scanned Time:</span>
                <div style={{ color: '#E2E8F0' }}>{new Date(lastScannedParticipant.checkedInAt).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Scans Feed */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="#38BDF8" /> Recent Attendance Scans
          </h3>

          {recentScans.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.85rem', textAlign: 'center', margin: 0, padding: '16px' }}>
              No attendance scans recorded yet today.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentScans.map((scan, idx) => (
                <div
                  key={scan._id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#4ADE80" />
                    <div>
                      <div style={{ fontWeight: 700, color: '#FFF' }}>{scan.participantName || scan.registrationId}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{scan.registrationId} • {scan.department || 'IEEE Participant'}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 600 }}>
                    {new Date(scan.checkedInAt || scan.scannedAt || scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AttendanceScannerPage;
