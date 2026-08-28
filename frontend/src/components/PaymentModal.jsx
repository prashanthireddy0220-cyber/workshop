import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitPayment } from '../services/api';
import { X, Upload, CheckCircle, AlertCircle, QrCode, Shield, FileText } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, registrationId, onSuccess }) => {
  const { refreshRegistration } = useAuth();
  
  const [transactionId, setTransactionId] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTransactionIdChange = (e) => {
    // Only numeric digits, max 12 digits
    const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 12);
    setTransactionId(cleanVal);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid image type. Only JPEG, JPG, PNG, and WebP images are allowed.');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Image size must be 5 MB or less.');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload your payment screenshot proof first.');
      return;
    }
    
    // Validate exact 12-digit UTR
    const utr = transactionId ? transactionId.trim() : '';
    if (!utr || utr.length !== 12 || !/^\d{12}$/.test(utr)) {
      setError('UPI Reference / UTR Number must be exactly 12 numeric digits (e.g. 123456789012).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('registrationId', registrationId);
      formData.append('transactionId', utr);
      formData.append('amount', 250);
      formData.append('paymentScreenshot', file);

      console.log("[PAYMENT DEBUG]", {
        registrationId,
        transactionId: utr,
        screenshotFile: file,
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size
      });

      for (const [key, value] of formData.entries()) {
        console.log("[FORM DATA]", key, value);
      }

      const res = await submitPayment(formData);
      if (res.data.success) {
        await refreshRegistration();
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payment proof. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px', borderRadius: '24px' }}>
        
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

        <div style={{ marginBottom: '20px' }}>
          <span className="badge badge-orange" style={{ marginBottom: '8px' }}>Step 2 of 2</span>
          <h2 style={{ fontSize: '1.6rem', color: '#FFF' }}>Payment Submission</h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Participant ID: <strong style={{ color: '#F97316' }}>{registrationId}</strong>
          </p>
        </div>

        {/* UPI Payment Information Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* UPI QR Code */}
          <div style={{
            background: '#FFF',
            padding: '8px',
            borderRadius: '12px',
            width: '110px',
            height: '110px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img
              src="/assets/payment-qr.png"
              alt="UPI Payment QR Code"
              style={{ width: '85px', height: '85px', display: 'block', borderRadius: '6px' }}
            />
            <span style={{ fontSize: '0.62rem', color: '#0F172A', fontWeight: 800 }}>SCAN TO PAY ₹250</span>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <h4 style={{ color: '#FFF', marginBottom: '6px', fontSize: '0.95rem' }}>Payment Instructions</h4>
            <p style={{ color: '#94A3B8', fontSize: '0.82rem', marginBottom: '6px', lineHeight: 1.4 }}>
              1. Scan QR code using GPay, PhonePe, or Paytm.<br />
              2. Pay registration fee: <strong style={{ color: '#F97316' }}>₹250</strong>.<br />
              3. Upload payment screenshot & enter 12-digit UTR ID.
            </p>
            <div style={{ fontSize: '0.85rem', color: '#38BDF8', fontWeight: 700 }}>
              UPI ID: <strong>ieee.kare@upi</strong>
            </div>
          </div>
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

        <form onSubmit={handleSubmit}>

          {/* FIRST: Upload Payment Screenshot Proof */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', color: '#FFF', fontWeight: 700, marginBottom: '6px' }}>
              1. Upload UPI Payment Screenshot (JPEG, PNG, WEBP &lt; 5MB)
            </label>
            
            <div style={{
              border: '2px dashed rgba(249, 115, 22, 0.35)',
              borderRadius: '14px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(15, 23, 42, 0.7)',
              position: 'relative'
            }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                required
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

              {previewUrl ? (
                <div>
                  <img
                    src={previewUrl}
                    alt="Payment Screenshot Preview"
                    style={{ maxHeight: '130px', borderRadius: '8px', margin: '0 auto 8px auto', display: 'block', border: '1px solid rgba(255,255,255,0.2)' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#34D399', fontWeight: 700 }}>
                    ✓ Screenshot Selected: {file.name}
                  </span>
                </div>
              ) : (
                <div>
                  <Upload size={32} color="#F97316" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                  <p style={{ color: '#FFF', fontSize: '0.9rem', fontWeight: 700 }}>
                    Click or drag payment screenshot here
                  </p>
                  <p style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '2px' }}>
                    Upload GPay, PhonePe, Paytm, or Netbanking payment receipt screenshot
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SECOND: UTR / UPI Transaction Reference Number */}
          <div className="form-group" style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: '#FFF', fontWeight: 700 }}>
                2. UPI / UTR Reference Number (Exact 12 Digits)
              </label>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: transactionId.length === 12 ? '#34D399' : '#F97316'
              }}>
                {transactionId.length} / 12 digits
              </span>
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 123456789012"
              maxLength={12}
              value={transactionId}
              onChange={handleTransactionIdChange}
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
              Enter the exact 12-digit UTR / UPI Reference Number from your payment app receipt
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem' }}
          >
            {loading ? 'Submitting Payment Proof...' : 'Submit Payment Proof'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default PaymentModal;
