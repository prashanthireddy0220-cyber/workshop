import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lockSeat, confirmPayment, submitPayment, getEventDetails } from '../../services/api';
import { X, Clock, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, Lock, QrCode, Upload, Edit, FileText } from 'lucide-react';
import PaymentSubmittedPage from './PaymentSubmittedPage';

const RegistrationLockModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, refreshRegistration } = useAuth();

  const [step, setStep] = useState(1); // 1: Student Details, 1.5: Confirm Details, 2: Payment, 3: Success Receipt
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventDetails, setEventDetails] = useState(null);
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [submittedPayment, setSubmittedPayment] = useState(null);
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [lockDurationMinutes, setLockDurationMinutes] = useState(10);
  const [lockTimeLeft, setLockTimeLeft] = useState({ minutes: 10, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

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
  const [qrImageFailed, setQrImageFailed] = useState(false);

  // Pre-fill user details from Google profile when user or modal opens
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.displayName || user.name || prev.fullName || '',
      }));
    }
  }, [user, isOpen]);

  // Reset steps & state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setIsExpired(false);
      fetchEventDetails();
    }
  }, [isOpen]);

  const fetchEventDetails = async () => {
    try {
      const evtRes = await getEventDetails();
      if (evtRes.data.success) {
        setEventDetails(evtRes.data.event);
        if (evtRes.data.event.seatLockDurationMinutes) {
          setLockDurationMinutes(evtRes.data.event.seatLockDurationMinutes);
          setLockTimeLeft({ minutes: evtRes.data.event.seatLockDurationMinutes, seconds: 0 });
        }
      }
    } catch (evtErr) {
      console.warn('[EventDetails Fetch Warning]', evtErr);
    }
  };

  // Countdown timer for seat lock
  useEffect(() => {
    if (!lockExpiresAt) return;

    const timer = setInterval(() => {
      const remaining = new Date(lockExpiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        clearInterval(timer);
        setIsExpired(true);
        setError(`Your ${lockDurationMinutes}-minute temporary seat lock has expired. Please re-initiate registration.`);
        setLockTimeLeft({ minutes: 0, seconds: 0 });
      } else {
        const minutes = Math.floor(remaining / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setLockTimeLeft({ minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockExpiresAt, lockDurationMinutes]);

  const initiateSeatLock = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await lockSeat({
        fullName: formData.fullName || user.displayName || user.name,
        phone: formData.phone,
        studentId: formData.studentId,
        department: formData.department,
        year: formData.year,
        section: formData.section,
        residency: formData.residency,
        photoURL: user.photoURL
      });

      if (res.data.success) {
        setLockExpiresAt(res.data.expiresAt);
        if (res.data.lockDurationMinutes) {
          setLockDurationMinutes(res.data.lockDurationMinutes);
        }
        setIsExpired(false);
        setStep(2);
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

  const handleNextToConfirm = (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.phone) {
      setError('Please provide your Student Register / ID Number and Phone number to continue.');
      return;
    }
    setError('');
    setStep(1.5);
  };

  const handleConfirmAndProceedToPayment = () => {
    initiateSeatLock();
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (isExpired) {
      setError(`Your ${lockDurationMinutes}-minute seat lock has expired. Please start registration again.`);
      return;
    }

    // MANDATORY REQUIREMENT: Payment screenshot proof must be attached
    if (!paymentFile) {
      setError('Please upload your UPI payment screenshot proof before completing registration.');
      return;
    }
    
    // Strict 12-digit UTR validation
    const utr = formData.transactionId ? formData.transactionId.trim() : '';
    if (!utr || utr.length !== 12 || !/^\d{12}$/.test(utr)) {
      setError('UPI Reference / UTR Number must be exactly 12 numeric digits (e.g. 123456789012).');
      return;
    }

    setLoading(true);
    setError('');

    const feeAmount = eventDetails?.registrationFee || 250;

    try {
      let registrationRecord = null;

      // 1. Confirm basic registration record
      const res = await confirmPayment({
        transactionId: utr,
        paymentMethod: 'UPI'
      });

      if (res.data.success) {
        registrationRecord = res.data.registration;
        
        // 2. Mandatorily upload payment screenshot proof to Cloudinary & DB
        const uploadData = new FormData();
        uploadData.append('registrationId', registrationRecord.registrationId);
        uploadData.append('transactionId', utr);
        uploadData.append('amount', feeAmount);
        uploadData.append('screenshot', paymentFile);

        const uploadRes = await submitPayment(uploadData);

        if (uploadRes.data.success) {
          await refreshRegistration();
          setSubmittedRecord(registrationRecord);
          setSubmittedPayment({ transactionId: utr, amount: feeAmount });
          setStep(3); // Transition to Registration Successful ONLY after screenshot upload succeeds!
        } else {
          setError(uploadRes.data.message || 'Failed to upload payment screenshot proof. Please try again.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment submission failed. Please ensure screenshot is attached and UTR is valid.');
    } finally {
      setLoading(false);
    }
  };

  const currentFee = eventDetails?.registrationFee || 250;
  const upiId = eventDetails?.paymentUPI || 'ieee.kare@upi';
  const qrUri = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=KARE%20IEEE%20Education%20Society&am=${currentFee}&cu=INR`)}`;

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
        {step >= 1.5 && (
          <div style={{
            background: isExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.12)',
            border: `1px solid ${isExpired ? 'rgba(239, 68, 68, 0.35)' : 'rgba(249, 115, 22, 0.3)'}`,
            borderRadius: '12px',
            padding: '10px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isExpired ? '#F87171' : '#F97316', fontWeight: 600 }}>
              <Lock size={16} />
              <span>{isExpired ? 'Seat Lock Expired' : 'Seat Temporarily Locked & Guaranteed'}</span>
            </div>
            <div style={{ color: '#FFFFFF', fontWeight: 800, fontFamily: 'monospace' }}>
              {String(lockTimeLeft.minutes).padStart(2, '0')}:{String(lockTimeLeft.seconds).padStart(2, '0')} remaining
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <span className="badge badge-orange" style={{ marginBottom: '8px' }}>
            {step === 1 ? 'Step 1: Participant Details' : step === 1.5 ? 'Step 2: Confirm Details' : step === 2 ? 'Step 3: Payment Verification' : 'Registration Complete'}
          </span>
          <h2 style={{ fontSize: '1.45rem', color: '#FFF', margin: '4px 0' }}>
            {step === 1 ? 'Workshop Student Registration' : step === 1.5 ? 'Confirm Your Details Before Payment' : step === 2 ? `Fee Payment (₹${currentFee})` : 'Registration Successful'}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: 0 }}>
            Verified Account: <strong style={{ color: '#F97316' }}>{user.email}</strong>
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
          /* Step 1: Form Details Input */
          <form onSubmit={handleNextToConfirm}>
            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Participant Name (Google)</label>
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
                <label>Verified Email</label>
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
                <label>Student Register / ID Number</label>
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
                <label>Section</label>
                <input
                  type="text"
                  name="section"
                  className="form-control"
                  placeholder="e.g. 24S01"
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
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '14px' }}
            >
              Review Registration Details
              <ArrowRight size={18} />
            </button>
          </form>
        ) : step === 1.5 ? (
          /* Step 1.5: Pre-Payment Details Confirmation (Requirement 9) */
          <div>
            <div style={{
              background: 'rgba(249, 115, 22, 0.12)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '20px',
              fontSize: '0.88rem',
              color: '#F97316',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={20} flexShrink={0} />
              <span>Please check your registration details carefully before proceeding to payment.</span>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.9rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Participant Name</div>
                  <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1rem' }}>{formData.fullName || user.displayName || user.name}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Verified Email</div>
                  <div style={{ color: '#38BDF8', fontWeight: 600, wordBreak: 'break-all' }}>{user.email}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Student Register ID</div>
                  <div style={{ color: '#FFFFFF', fontWeight: 600 }}>{formData.studentId} ({formData.department} - {formData.year})</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Phone Number</div>
                  <div style={{ color: '#FFFFFF', fontWeight: 600 }}>{formData.phone}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Workshop Event</div>
                  <div style={{ color: '#E2E8F0', fontWeight: 600 }}>{eventDetails?.eventName || 'Intelligent Yield Prediction & AI/ML Workshop'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Registration Fee</div>
                  <div style={{ color: '#34D399', fontWeight: 800, fontSize: '1.1rem' }}>₹{currentFee}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Edit size={16} /> Edit Details
              </button>
              <button
                type="button"
                onClick={handleConfirmAndProceedToPayment}
                disabled={loading}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center', padding: '14px' }}
              >
                {loading ? 'Reserving Seat...' : `Confirm & Proceed to Payment (₹${currentFee})`}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Payment Section */
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
                REGISTRATION FEE AMOUNT
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#38BDF8' }}>
                ₹{currentFee}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#34D399', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ShieldCheck size={16} /> Seat Locked & Guaranteed for {lockDurationMinutes} Minutes
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center', fontSize: '0.85rem' }}>
                <p style={{ color: '#CBD5E1', marginBottom: '12px' }}>
                  Pay via UPI ID: <strong style={{ color: '#F97316' }}>{upiId}</strong> or scan QR code below.
                </p>

                {/* Scannable Payment QR Code */}
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
                      src={qrImageFailed ? qrUri : (eventDetails?.paymentQR || '/assets/payment-qr.png')}
                      alt="UPI Payment QR Code"
                      onError={() => setQrImageFailed(true)}
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
                onClick={() => setStep(1.5)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || isExpired}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center', padding: '14px', opacity: (loading || isExpired) ? 0.6 : 1 }}
              >
                {loading ? 'Confirming Seat...' : isExpired ? 'Seat Lock Expired' : `Confirm Registration (₹${currentFee} PAID)`}
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
