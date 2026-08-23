import React from 'react';
import { CheckCircle2, ShieldCheck, Ticket, Download, ArrowRight } from 'lucide-react';

const RegistrationSuccessCard = ({ registration, onOpenDashboard }) => {
  if (!registration) return null;

  return (
    <div className="glass-card" style={{
      padding: '32px',
      borderRadius: '24px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(16, 185, 129, 0.4)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.2)',
      textAlign: 'center',
      maxWidth: '560px',
      margin: '0 auto'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'rgba(16, 185, 129, 0.15)',
        border: '2px solid #34D399',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px auto',
        boxShadow: '0 0 20px rgba(52, 211, 153, 0.4)'
      }}>
        <CheckCircle2 size={36} color="#34D399" />
      </div>

      <h2 style={{
        fontSize: '1.6rem',
        fontWeight: 800,
        color: '#FFFFFF',
        marginBottom: '6px',
        letterSpacing: '-0.02em'
      }}>
        ✓ REGISTRATION SUCCESSFUL
      </h2>

      <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '24px' }}>
        Your seat has been officially locked and confirmed for the workshop.
      </p>

      {/* Summary Card Details */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'left',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.9rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Registration ID
            </div>
            <div style={{ color: '#F97316', fontWeight: 800, fontSize: '0.95rem', fontFamily: 'monospace' }}>
              {registration.registrationId}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Status
            </div>
            <div style={{ color: '#34D399', fontWeight: 800, fontSize: '0.95rem' }}>
              CONFIRMED
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Name
            </div>
            <div style={{ color: '#FFFFFF', fontWeight: 600 }}>
              {registration.fullName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Email
            </div>
            <div style={{ color: '#FFFFFF', fontWeight: 600, wordBreak: 'break-all' }}>
              {registration.email}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Payment Status
            </div>
            <div style={{ color: '#34D399', fontWeight: 700 }}>
              ₹300 - PAID
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Verification
            </div>
            <div style={{ color: '#38BDF8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> Verified KLU User
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={onOpenDashboard}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '14px 28px', fontSize: '1rem' }}
        >
          View Participant Pass & Ticket
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default RegistrationSuccessCard;
