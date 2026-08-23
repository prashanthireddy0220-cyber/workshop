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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setError('Please enter the UPI Transaction/Reference ID');
      return;
    }
    if (!file) {
      setError('Please upload your payment screenshot proof');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('registrationId', registrationId);
      formData.append('transactionId', transactionId.trim());
      formData.append('amount', 250);
      formData.append('screenshot', file);

      const res = await submitPayment(formData);
      if (res.data.success) {
        await refreshRegistration();
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        
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
            Registration ID: <strong style={{ color: '#F97316' }}>{registrationId}</strong>
          </p>
        </div>

        {/* UPI Payment Information Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          gap: '20px',
          alignItems: 'center'
        }}>
          {/* Mock UPI QR */}
          <div style={{
            background: '#FFF',
            padding: '10px',
            borderRadius: '8px',
            width: '120px',
            height: '120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <QrCode size={80} color="#0F172A" />
            <span style={{ fontSize: '0.65rem', color: '#0F172A', fontWeight: 700 }}>SCAN TO PAY ₹250</span>
          </div>

          <div>
            <h4 style={{ color: '#FFF', marginBottom: '6px' }}>Payment Instructions</h4>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '6px' }}>
              1. Scan QR code using GPay, PhonePe, or Paytm.<br />
              2. Pay exact fee: <strong style={{ color: '#F97316' }}>₹250</strong>.<br />
              3. Note down 12-digit UTR/Ref ID & take screenshot.
            </p>
            <div style={{ fontSize: '0.85rem', color: '#38BDF8' }}>
              UPI ID: <strong>ieee.kare@upi</strong>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#F87171',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>UPI Transaction / Reference ID (12 digits)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 425619873012"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Upload Payment Screenshot Proof (JPG, PNG, PDF &lt; 5MB)</label>
            
            <div style={{
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(15, 23, 42, 0.6)',
              position: 'relative'
            }}>
              <input
                type="file"
                accept="image/*,.pdf"
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

              {previewUrl ? (
                <div>
                  <img
                    src={previewUrl}
                    alt="Payment Screenshot Preview"
                    style={{ maxHeight: '140px', borderRadius: '6px', margin: '0 auto 8px auto', display: 'block' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#34D399' }}>✓ File Selected: {file.name}</span>
                </div>
              ) : (
                <div>
                  <Upload size={32} color="#F97316" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                  <p style={{ color: '#FFF', fontSize: '0.9rem', fontWeight: 500 }}>
                    Click or drag payment screenshot here
                  </p>
                  <p style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '4px' }}>
                    Supports JPG, PNG, WEBP & PDF files up to 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
          >
            {loading ? 'Submitting Payment Proof...' : 'Submit Payment Proof'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default PaymentModal;
