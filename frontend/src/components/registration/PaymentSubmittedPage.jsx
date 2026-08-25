import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, Copy, ExternalLink, ArrowRight } from 'lucide-react';

const PaymentSubmittedPage = ({ registration, payment, eventDetails, onViewToken, onClose }) => {
  const regId = registration?.registrationId || 'EDS-WS-001';
  const utr = payment?.transactionId || registration?.transactionId || 'Submitted';
  const amount = payment?.amount || eventDetails?.registrationFee || 300;

  const handleCopyRegId = () => {
    navigator.clipboard.writeText(regId);
  };

  return (
    <div className="payment-submitted-page" style={{
      background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(7, 13, 27, 0.99) 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(249, 115, 22, 0.3)',
      padding: '36px 28px',
      maxWidth: '560px',
      margin: '0 auto',
      boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(249, 115, 22, 0.15)',
      color: '#FFFFFF',
      position: 'relative'
    }}>
      {/* Header Badge */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(249, 115, 22, 0.15)',
          border: '2px solid #F97316',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: '#F97316'
        }}>
          <Clock size={32} />
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          Payment Submitted Successfully!
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0 }}>
          Your payment details have been logged and are pending admin verification.
        </p>
      </div>

      {/* Status Warning Banner */}
      <div style={{
        background: 'rgba(234, 179, 8, 0.12)',
        border: '1px solid rgba(234, 179, 8, 0.35)',
        borderRadius: '16px',
        padding: '14px 18px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ShieldAlert size={22} color="#EAB308" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#EAB308', fontWeight: 700 }}>
            Payment Status: Pending Admin Verification
          </h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#CBD5E1' }}>
            An IEEE Admin will review your payment screenshot and 12-digit UTR within 1–2 hours.
          </p>
        </div>
      </div>

      {/* Summary Box */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '12px'
        }}>
          <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Registration ID</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#F97316', fontWeight: 800, fontSize: '1.05rem', fontFamily: 'monospace' }}>
              {regId}
            </span>
            <button
              onClick={handleCopyRegId}
              title="Copy ID"
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '12px'
        }}>
          <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Amount Paid</span>
          <span style={{ color: '#38BDF8', fontWeight: 800, fontSize: '1.05rem' }}>
            ₹{amount}
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Submitted UTR / Transaction ID</span>
          <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'monospace' }}>
            {utr}
          </span>
        </div>
      </div>

      {/* Next Steps List */}
      <div style={{ marginBottom: '28px' }}>
        <h4 style={{ fontSize: '0.9rem', color: '#CBD5E1', fontWeight: 700, marginBottom: '10px' }}>
          What happens next?
        </h4>
        <ul style={{ paddingLeft: '20px', color: '#94A3B8', fontSize: '0.84rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Admin verifies your payment receipt & UTR reference.</li>
          <li>Upon approval, your registration status automatically changes to <strong>VERIFIED</strong>.</li>
          <li>Your official event pass and ticket download will become available.</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {onViewToken && (
          <button
            onClick={onViewToken}
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
          >
            View Event Pass / Token
            <ArrowRight size={18} />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '14px 20px', justifyContent: 'center' }}
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentSubmittedPage;
