import React from 'react';
import { CheckCircle2, ShieldCheck, Ticket, Download, ArrowRight, MessageSquare } from 'lucide-react';
import { getTicketDownloadUrl } from '../../services/api';

const RegistrationSuccessCard = ({ registration, eventDetails, onOpenToken, onOpenDashboard }) => {
  if (!registration) return null;

  const regId = registration.registrationId || 'EDS-WS-001';
  const whatsappUrl = eventDetails?.whatsappGroupLink || 'https://chat.whatsapp.com/ieee-edu-society-workshop';
  const pdfUrl = getTicketDownloadUrl(regId);

  const handleDownloadPdf = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleJoinWhatsApp = () => {
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="glass-card" style={{
      padding: '32px',
      borderRadius: '24px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(16, 185, 129, 0.4)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.2)',
      textAlign: 'center',
      maxWidth: '580px',
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
        fontSize: '1.65rem',
        fontWeight: 800,
        color: '#FFFFFF',
        marginBottom: '6px',
        letterSpacing: '-0.02em'
      }}>
        Registration Successful 🎉
      </h2>

      <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '24px' }}>
        Your registration and payment verification have been completed successfully.
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
              Participant ID
            </div>
            <div style={{ color: '#F97316', fontWeight: 800, fontSize: '1rem', fontFamily: 'monospace' }}>
              {regId}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Payment Status
            </div>
            <div style={{ color: (registration.paymentStatus === 'PAID' || registration.paymentStatus === 'VERIFIED') ? '#34D399' : '#F97316', fontWeight: 800, fontSize: '0.95rem' }}>
              {(registration.paymentStatus === 'PAID' || registration.paymentStatus === 'VERIFIED') ? 'VERIFIED & PAID' : 'PENDING ADMIN VERIFICATION'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Participant Name
            </div>
            <div style={{ color: '#FFFFFF', fontWeight: 600 }}>
              {registration.fullName || registration.name || 'Participant'}
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
              Event
            </div>
            <div style={{ color: '#E2E8F0', fontWeight: 600 }}>
              {eventDetails?.eventName || 'AI/ML Workshop 2026'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Verification
            </div>
            <div style={{ color: '#38BDF8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> Approved by Admin
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {onOpenToken ? (
            <button
              onClick={onOpenToken}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '12px 18px', fontSize: '0.92rem' }}
            >
              <Ticket size={16} /> View Pass / Token
            </button>
          ) : (
            <button
              onClick={onOpenDashboard}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '12px 18px', fontSize: '0.92rem' }}
            >
              <Ticket size={16} /> View Pass & Dashboard
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            className="btn-secondary"
            style={{ flex: 1, justifyContent: 'center', padding: '12px 18px', fontSize: '0.92rem', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38BDF8' }}
          >
            <Download size={16} /> Download PDF Pass
          </button>
        </div>

        {/* WhatsApp Group Link Button */}
        <button
          onClick={handleJoinWhatsApp}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '13px 20px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <MessageSquare size={18} />
          Join WhatsApp Group
        </button>
      </div>
    </div>
  );
};

export default RegistrationSuccessCard;
