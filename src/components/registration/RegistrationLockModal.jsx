import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lockSeat, confirmPayment } from '../../services/api';
import { X, Clock, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, Lock, QrCode, CreditCard } from 'lucide-react';

const RegistrationLockModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, refreshRegistration } = useAuth();

  const [step, setStep] = useState(1); // 1: Student Details & Lock, 2: Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [lockTimeLeft, setLockTimeLeft] = useState({ minutes: 10, seconds: 0 });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    studentId: '',
    department: 'CSE',
    year: '3rd Year',
    section: 'A',
    residency: 'Day Scholar',
    transactionId: ''
  });

  // Pre-fill user details from Google profile when user or modal opens
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.displayName || user.name || prev.fullName || '',
      }));
    }
  }, [user, isOpen]);

  // Initiate seat lock when modal opens
  useEffect(() => {
    if (isOpen && user) {
      initiateSeatLock();
    }
  }, [isOpen]);

  // Countdown timer for 10-minute seat lock
  useEffect(() => {
    if (!lockExpiresAt) return;

    const timer = setInterval(() => {
      const remaining = new Date(lockExpiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        clearInterval(timer);
        setError('Your 10-minute seat lock has expired. Please initiate registration again.');
        setLockTimeLeft({ minutes: 0, seconds: 0 });
      } else {
        const minutes = Math.floor(remaining / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setLockTimeLeft({ minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockExpiresAt]);

  const initiateSeatLock = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await lockSeat({
        fullName: formData.fullName || user.displayName || user.name,
        photoURL: user.photoURL
      });

      if (res.data.success) {
        setLockExpiresAt(res.data.expiresAt);
      }
    } catch (err) {
      if (err.response?.data?.isAlreadyRegistered) {
        onSuccess(err.response.data.registration);
        onClose();
        return;
      }
      setError(err.response?.data?.message || 'Failed to reserve seat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextToPayment = (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.phone) {
      setError('Please provide your Student ID and Phone number to continue.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await confirmPayment({
        transactionId: formData.transactionId || `UPI-${Date.now()}`,
        paymentMethod: 'UPI'
      });

      if (res.data.success) {
        await refreshRegistration();
        onSuccess(res.data.registration);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment confirmation failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px', borderRadius: '24px' }}>
        
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>

        {/* Lock Expiration Bar */}
        <div style={{
          background: 'rgba(249, 115, 22, 0.12)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '12px',
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F97316', fontWeight: 600 }}>
            <Lock size={16} />
            <span>Seat Temporarily Locked</span>
          </div>
          <div style={{ color: '#FFFFFF', fontWeight: 800, fontFamily: 'monospace' }}>
            {String(lockTimeLeft.minutes).padStart(2, '0')}:{String(lockTimeLeft.seconds).padStart(2, '0')} remaining
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <span className="badge badge-orange" style={{ marginBottom: '8px' }}>
            Step {step} of 2 - {step === 1 ? 'Student Details' : 'Registration Fee Payment'}
          </span>
          <h2 style={{ fontSize: '1.5rem', color: '#FFF' }}>
            {step === 1 ? 'Workshop Student Registration' : 'Complete Fee Payment (₹300)'}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem' }}>
            Google Verified: <strong style={{ color: '#F97316' }}>{user.email}</strong>
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '18px',
            color: '#F87171',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNextToPayment}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Full Name (From Google)</label>
                <input
                  type="text"
                  name="fullName"
                  className="form-control"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>KLU Email (Verified)</label>
                <input
                  type="email"
                  className="form-control"
                  value={user.email}
                  disabled
                  style={{ opacity: 0.75, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Student Roll No / ID</label>
                <input
                  type="text"
                  name="studentId"
                  className="form-control"
                  placeholder="e.g. 2400030123"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Department</label>
                <select name="department" className="form-control" value={formData.department} onChange={handleChange}>
                  <option value="CSE">CSE</option>
                  <option value="AI & DS">AI & DS</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>

              <div className="form-group">
                <label>Year</label>
                <select name="year" className="form-control" value={formData.year} onChange={handleChange}>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div className="form-group">
                <label>Section</label>
                <input
                  type="text"
                  name="section"
                  className="form-control"
                  value={formData.section}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '14px', padding: '14px' }}
            >
              Proceed to Fee Payment (₹300)
              <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handlePaymentSubmit}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                PAYMENT AMOUNT
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#38BDF8' }}>
                ₹300
              </div>
              <div style={{ fontSize: '0.8rem', color: '#34D399', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ShieldCheck size={16} /> Seat Locked & Guaranteed for 10 Minutes
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', fontSize: '0.85rem' }}>
                <p style={{ color: '#CBD5E1', marginBottom: '8px' }}>
                  Pay via UPI ID: <strong style={{ color: '#F97316' }}>ieee.kare@upi</strong> or scan QR code.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label>UPI Reference / Transaction ID (Optional for instant test)</label>
              <input
                type="text"
                name="transactionId"
                className="form-control"
                placeholder="e.g. 423984729384"
                value={formData.transactionId}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center', padding: '14px' }}
              >
                {loading ? 'Confirming Seat...' : 'Confirm Registration (₹300 PAID)'}
                <CheckCircle2 size={18} />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default RegistrationLockModal;
