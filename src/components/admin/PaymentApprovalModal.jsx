import React, { useState } from 'react';
import { X, CheckCircle, XCircle, ShieldCheck, AlertCircle, FileText } from 'lucide-react';
import { approvePayment, rejectPayment } from '../../services/api';

const PaymentApprovalModal = ({ isOpen, onClose, registrationItem, onRefresh }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !registrationItem) return null;

  const payment = registrationItem.payment;

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

        {/* Participant Details Summary */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#94A3B8' }}>Registration ID:</span>
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
                {payment ? payment.transactionId : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Screenshot Preview */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '8px' }}>
            Uploaded Payment Screenshot Proof:
          </label>

          {payment && payment.screenshotUrl ? (
            <div style={{ background: '#000', borderRadius: '10px', overflow: 'hidden', padding: '10px', textAlign: 'center' }}>
              <img
                src={payment.screenshotUrl.startsWith('/') ? payment.screenshotUrl : `/${payment.screenshotUrl}`}
                alt="Payment Proof Screenshot"
                style={{ maxHeight: '300px', maxWidth: '100%', borderRadius: '6px', margin: '0 auto' }}
              />
            </div>
          ) : (
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: '#64748B', textAlign: 'center' }}>
              No screenshot uploaded
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
