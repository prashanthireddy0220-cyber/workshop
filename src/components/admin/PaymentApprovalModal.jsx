import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Upload, ExternalLink } from 'lucide-react';
import { approvePayment, rejectPayment, updatePaymentProofAdmin } from '../../services/api';

const PaymentApprovalModal = ({ isOpen, onClose, registrationItem, onRefresh }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // File upload state for admin
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen || !registrationItem) return null;

  const payment = registrationItem.payment;
  const rawProofUrl = payment?.upiScreenshotUrl || payment?.screenshotUrl || registrationItem?.upiScreenshotUrl || registrationItem?.screenshotUrl || '';
  
  const fullUrl = rawProofUrl
    ? (rawProofUrl.startsWith('http://') || rawProofUrl.startsWith('https://') || rawProofUrl.startsWith('data:'))
      ? rawProofUrl
      : rawProofUrl.startsWith('/')
        ? rawProofUrl
        : `/${rawProofUrl}`
    : '';

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await approvePayment(registrationItem.registrationId);
      if (res.data.success) {
        onRefresh();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Please enter a rejection reason.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await rejectPayment(registrationItem.registrationId, rejectionReason.trim());
      if (res.data.success) {
        onRefresh();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setError('');
    setSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('screenshot', uploadFile);
      const res = await updatePaymentProofAdmin(registrationItem.registrationId, formData);
      if (res.data.success) {
        setSuccessMsg('Payment proof uploaded successfully!');
        setUploadFile(null);
        onRefresh();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload screenshot.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        
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
          <span className="badge badge-orange" style={{ marginBottom: '8px' }}>Payment Verification</span>
          <h2 style={{ fontSize: '1.5rem', color: '#FFF' }}>Review Participant Payment Proof</h2>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '12px', borderRadius: '8px', color: '#F87171', marginBottom: '16px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', padding: '12px', borderRadius: '8px', color: '#4ADE80', marginBottom: '16px', fontSize: '0.85rem' }}>
            {successMsg}
          </div>
        )}

        {/* Participant Details Summary */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#94A3B8' }}>Participant ID:</span>
              <div style={{ color: '#F97316', fontWeight: 700 }}>{registrationItem.registrationId}</div>
            </div>
            <div>
              <span style={{ color: '#94A3B8' }}>Participant Name:</span>
              <div style={{ color: '#FFF', fontWeight: 600 }}>{registrationItem.fullName}</div>
            </div>
            <div>
              <span style={{ color: '#94A3B8' }}>Department / Year:</span>
              <div style={{ color: '#FFF' }}>{registrationItem.department} ({registrationItem.year})</div>
            </div>
            <div>
              <span style={{ color: '#94A3B8' }}>UPI Transaction ID:</span>
              <div style={{ color: '#38BDF8', fontWeight: 700, fontFamily: 'monospace' }}>
                {payment?.transactionId || registrationItem.studentId || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* UPI Payment Screenshot Preview & View Link */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>
            Uploaded UPI Payment Screenshot Proof:
          </label>

          {fullUrl ? (
            <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', padding: '12px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <img
                src={fullUrl}
                alt="UPI Payment Screenshot Proof"
                style={{ maxHeight: '280px', maxWidth: '100%', borderRadius: '8px', margin: '0 auto 10px auto', display: 'block', objectFit: 'contain' }}
              />
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 16px', borderRadius: '8px' }}
              >
                <ExternalLink size={15} /> Open Full Resolution Proof
              </a>
            </div>
          ) : (
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.15)', textAlign: 'center' }}>
              <AlertCircle size={28} color="#F97316" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                No Screenshot Uploaded by Participant
              </div>
              <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: '14px' }}>
                Transaction ID Reference: <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{payment?.transactionId || 'Manual Verification'}</strong>
              </div>

              {/* Admin Screenshot Upload Box */}
              <form onSubmit={handleUploadProof} style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  style={{ fontSize: '0.8rem', color: '#94A3B8' }}
                />
                {uploadFile && (
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={uploading}
                    style={{ padding: '6px 14px', fontSize: '0.8rem', marginTop: '4px' }}
                  >
                    <Upload size={14} /> {uploading ? 'Uploading...' : 'Attach Payment Proof Screenshot'}
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Action Controls */}
        {!showRejectInput ? (
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowRejectInput(true)}
              className="btn-danger"
              disabled={loading}
            >
              <XCircle size={18} /> Reject Payment
            </button>

            <button
              onClick={handleApprove}
              className="btn-success"
              disabled={loading}
            >
              <CheckCircle size={18} /> {loading ? 'Approving...' : 'Approve & Issue Ticket'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleRejectSubmit}>
            <div className="form-group">
              <label>Rejection Reason (will be emailed to student)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Transaction ID 425619873012 not found in UPI statement"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowRejectInput(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-danger" disabled={loading}>
                Confirm Rejection
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default PaymentApprovalModal;
