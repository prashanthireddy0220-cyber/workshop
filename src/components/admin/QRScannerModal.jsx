import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { checkInParticipant } from '../../services/api';
import { X, QrCode, CheckCircle, AlertTriangle, UserCheck, RefreshCw } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onCheckInSuccess, selectedWorkshopId = 'AI_ML_2026' }) => {
  const [manualToken, setManualToken] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannerInstance, setScannerInstance] = useState(null);

  useEffect(() => {
    let scanner;
    if (isOpen) {
      setScanResult(null);
      setError('');
      
      const timer = setTimeout(() => {
        const qrRegion = document.getElementById('qr-reader');
        if (qrRegion) {
          try {
            scanner = new Html5QrcodeScanner('qr-reader', {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            }, false);

            scanner.render(
              async (decodedText) => {
                if (decodedText) {
                  scanner.pause(true);
                  handleProcessToken(decodedText, scanner);
                }
              },
              () => {}
            );
            setScannerInstance(scanner);
          } catch (e) {
            console.error('[Scanner Init Error]', e);
          }
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          try { scanner.clear(); } catch (e) {}
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetScannerForNextStudent = (scanner) => {
    setTimeout(() => {
      setScanResult(null);
      setError('');
      if (scanner) {
        try { scanner.resume(); } catch (e) {}
      }
    }, 3000); // 3-second continuous scan auto-reset
  };

  const handleProcessToken = async (tokenValue, scanner = scannerInstance) => {
    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      const res = await checkInParticipant({
        token: tokenValue,
        workshopId: selectedWorkshopId
      });

      if (res.data.success) {
        setScanResult({
          type: 'SUCCESS',
          message: res.data.message || '✓ Attendance Marked Successfully!',
          participant: res.data.participant
        });
        if (onCheckInSuccess) onCheckInSuccess();
        resetScannerForNextStudent(scanner);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.alreadyCheckedIn) {
        setScanResult({
          type: 'ALREADY_CHECKED_IN',
          message: 'Attendance already marked',
          participant: data.participant
        });
        resetScannerForNextStudent(scanner);
      } else {
        setError(data?.message || '✗ Check-in failed. Invalid QR code or workshop mismatch.');
        resetScannerForNextStudent(scanner);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken.trim()) {
      handleProcessToken(manualToken.trim());
      setManualToken('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px', background: '#0F172A', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '24px' }}>
        
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94A3B8',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <span className="badge badge-orange" style={{ marginBottom: '8px' }}>Venue Continuous Scanner</span>
          <h2 style={{ fontSize: '1.5rem', color: '#FFF', fontWeight: 800 }}>Workshop QR Gate Scanner</h2>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
            Point camera at student QR pass. Scans automatically and resets for the next student.
          </p>
        </div>

        {/* Scan Result Cards */}
        {scanResult && scanResult.type === 'SUCCESS' && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
            <CheckCircle size={44} color="#34D399" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ color: '#34D399', fontSize: '1.3rem', fontWeight: 800 }}>✓ Attendance Marked</h3>
            <p style={{ color: '#FFF', fontWeight: 700, fontSize: '1.1rem', marginTop: '6px', margin: '6px 0 0 0' }}>{scanResult.participant.name}</p>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
              Roll/ID: <strong style={{ color: '#38BDF8' }}>{scanResult.participant.studentId || scanResult.participant.registrationId}</strong> | Dept: {scanResult.participant.department} ({scanResult.participant.year})
            </p>
            <p style={{ color: '#34D399', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>
              Checked in at {new Date(scanResult.participant.checkedInAt || Date.now()).toLocaleTimeString()} • Ready for next scan in 3s...
            </p>
          </div>
        )}

        {scanResult && scanResult.type === 'ALREADY_CHECKED_IN' && (
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
            <AlertTriangle size={44} color="#F59E0B" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ color: '#F59E0B', fontSize: '1.25rem', fontWeight: 800 }}>Attendance Already Marked</h3>
            <p style={{ color: '#FFF', fontWeight: 700, fontSize: '1.05rem', marginTop: '6px', margin: '6px 0 0 0' }}>{scanResult.participant?.name}</p>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
              Registration ID: <strong style={{ color: '#38BDF8' }}>{scanResult.participant?.registrationId}</strong>
            </p>
            <p style={{ color: '#F59E0B', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>
              Already Present • Resetting scanner in 3s...
            </p>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '14px', padding: '16px', marginBottom: '20px', color: '#F87171', fontSize: '0.9rem', textAlign: 'center', fontWeight: 700 }}>
            {error}
          </div>
        )}

        {/* Camera QR Reader Container */}
        <div id="qr-reader" style={{ width: '100%', marginBottom: '20px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }} />

        {/* Manual Fallback Form */}
        <form onSubmit={handleManualSubmit} style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Or enter Registration ID (KLU-ML-2026-XXXX) or Ticket ID"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
            />
            <button type="submit" disabled={loading} className="btn-primary" style={{ flexShrink: 0 }}>
              <UserCheck size={18} /> {loading ? 'Verifying...' : 'Check-In'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default QRScannerModal;
