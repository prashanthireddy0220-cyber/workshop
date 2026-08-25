import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lockSeat, confirmPayment, submitPayment, getEventDetails } from '../../services/api';
import { X, Clock, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, Lock, QrCode, CreditCard, Upload } from 'lucide-react';
import PaymentSubmittedPage from './PaymentSubmittedPage';

const RegistrationLockModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, refreshRegistration } = useAuth();

  const [step, setStep] = useState(1); // 1: Student Details, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventDetails, setEventDetails] = useState(null);
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [submittedPayment, setSubmittedPayment] = useState(null);
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [lockTimeLeft, setLockTimeLeft] = useState({ minutes: 10, seconds: 0 });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    studentId: '',
    department: 'CSE',
    year: '3rd Year',
    section: '24S01',
    residency: 'Day Scholar',
    transactionId: ''
  });

  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentPreviewUrl, setPaymentPreviewUrl] = useState('');

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
      try {
        const evtRes = await getEventDetails();
        if (evtRes.data.success) setEventDetails(evtRes.data.event);
      } catch (evtErr) {
        console.warn('[EventDetails Fetch Warning]', evtErr);
      }

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
    const { name, value } = e.target;
    if (name === 'transactionId') {
      // Clean only numeric digits and limit to 12 digits
      const cleanVal = value.replace(/\D/g, '').slice(0, 12);
      setFormData({ ...formData, transactionId: cleanVal });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(selected.type)) {
        setError('Invalid image type. Only JPEG, JPG, PNG, and WebP images are allowed.');
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setError('Image size must be 5 MB or less.');
        return;
      }
      setPaymentFile(selected);
      setPaymentPreviewUrl(URL.createObjectURL(selected));
      setError('');
    }
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
    
    // Strict 12-digit UTR validation
    const utr = formData.transactionId ? formData.transactionId.trim() : '';
    if (!utr || utr.length !== 12 || !/^\d{12}$/.test(utr)) {
      setError('UPI Reference / UTR Number must be exactly 12 numeric digits (e.g. 123456789012).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let registrationRecord = null;

      // Submit payment confirmation
      const res = await confirmPayment({
        transactionId: utr,
        paymentMethod: 'UPI'
      });

      if (res.data.success) {
        registrationRecord = res.data.registration;
        
        // If payment screenshot was attached, upload screenshot file as well
        if (paymentFile && registrationRecord?.registrationId) {
          try {
            const uploadData = new FormData();
            uploadData.append('registrationId', registrationRecord.registrationId);
            uploadData.append('transactionId', utr);
            uploadData.append('amount', 300);
            uploadData.append('screenshot', paymentFile);
            await submitPayment(uploadData);
          } catch (uploadErr) {
            console.warn('[Screenshot Upload Warning]', uploadErr);
          }
        }

        await refreshRegistration();
        setSubmittedRecord(registrationRecord);
        setSubmittedPayment({ transactionId: utr, amount: 300 });
        setStep(3);
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
          justifyContent: 'space-between',
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

        {step === 3 ? (
          <PaymentSubmittedPage
            registration={submittedRecord}
            payment={submittedPayment}
            eventDetails={eventDetails}
            onViewToken={() => {
              onSuccess(submittedRecord);
              onClose();
            }}
            onClose={onClose}
          />
        ) : step === 1 ? (
          <form onSubmit={handleNextToPayment}>
            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

            <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
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
                <label>Section (e.g. 24S01)</label>
                <input
                  type="text"
                  name="section"
                  className="form-control"
                  placeholder="e.g. 24S01"
                  value={formData.section}
                  onChange={handleChange}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                  e.g. 24S01, 23S01, S01
                </span>
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

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center', fontSize: '0.85rem' }}>
                <p style={{ color: '#CBD5E1', marginBottom: '12px' }}>
                  Pay via UPI ID: <strong style={{ color: '#F97316' }}>{eventDetails?.paymentUPI || 'ieee.kare@upi'}</strong> or scan QR code below.
                </p>

                {/* Admin Controlled Payment QR Code */}
                {eventDetails?.paymentQRActive !== false && (
                  <div style={{
                    background: '#FFFFFF',
                    padding: '12px',
                    borderRadius: '16px',
                    display: 'inline-block',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                    maxWidth: '210px',
                    width: '100%',
                    margin: '0 auto 8px auto'
                  }}>
                    <img
                      src={eventDetails?.paymentQR || '/assets/payment-qr.png'}
                      alt="UPI Payment QR Code"
                      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
                    />
                  </div>
                )}
                <p style={{ color: '#94A3B8', fontSize: '0.78rem', margin: 0 }}>
                  Scan using Google Pay, PhonePe, Paytm or any UPI App
                </p>
              </div>
            </div>

            {/* Payment Screenshot Upload Field */}
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', color: '#FFF', fontWeight: 700, marginBottom: '6px' }}>
                1. Upload UPI Payment Screenshot (JPEG, PNG, WEBP &lt; 5MB)
              </label>
              
              <div style={{
                border: '2px dashed rgba(249, 115, 22, 0.35)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(15, 23, 42, 0.7)',
                position: 'relative'
              }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />

                {paymentPreviewUrl ? (
                  <div>
                    <img
                      src={paymentPreviewUrl}
                      alt="Payment Receipt Preview"
                      style={{ maxHeight: '120px', borderRadius: '8px', margin: '0 auto 6px auto', display: 'block', border: '1px solid rgba(255,255,255,0.2)' }}
                    />
                    <span style={{ fontSize: '0.82rem', color: '#34D399', fontWeight: 700 }}>
                      ✓ Screenshot Selected: {paymentFile.name}
                    </span>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} color="#F97316" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                    <p style={{ color: '#FFF', fontSize: '0.88rem', fontWeight: 600 }}>
                      Click or drag payment screenshot here
                    </p>
                    <p style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: '2px' }}>
                      Upload GPay / PhonePe / Paytm payment screenshot
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 12-Digit UTR Number Input */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.88rem', color: '#FFF', fontWeight: 700 }}>
                  2. UPI UTR / Transaction Reference ID (Exact 12 Digits)
                </label>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: formData.transactionId.length === 12 ? '#34D399' : '#F97316'
                }}>
                  {formData.transactionId.length} / 12 digits
                </span>
              </div>
              <input
                type="text"
                name="transactionId"
                className="form-control"
                placeholder="e.g. 123456789012"
                maxLength={12}
                value={formData.transactionId}
                onChange={handleChange}
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                Must be exactly 12 numeric digits from your UPI payment app receipt
              </span>
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
