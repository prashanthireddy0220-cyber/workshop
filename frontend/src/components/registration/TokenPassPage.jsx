import React, { useState, useEffect } from 'react';
import { Download, ShieldCheck, QrCode, Calendar, MapPin, ArrowLeft, MessageSquare, Ticket as TicketIcon } from 'lucide-react';
import { getTicket, getTicketDownloadUrl } from '../../services/api';

const TokenPassPage = ({ registrationId, registration: propRegistration, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [regData, setRegData] = useState(propRegistration || null);
  const [error, setError] = useState('');

  const targetRegId = registrationId || propRegistration?.registrationId || 'EDS-WS-001';

  useEffect(() => {
    const fetchTicketDetails = async () => {
      if (!targetRegId) return;
      setLoading(true);
      try {
        const res = await getTicket(targetRegId);
        if (res.data.success) {
          setTicketData(res.data.ticket);
          if (res.data.registration) setRegData(res.data.registration);
        }
      } catch (err) {
        console.warn('[TokenPassPage] Could not fetch ticket:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicketDetails();
  }, [targetRegId]);

  const downloadUrl = getTicketDownloadUrl(targetRegId);

  const handleDownloadPdf = () => {
    window.open(downloadUrl, '_blank');
  };

  const name = regData?.fullName || regData?.name || 'Participant';
  const email = regData?.email || '';
  const studentId = regData?.studentId || '';
  const dept = regData?.department || 'CSE';
  const college = regData?.college || 'KARE';
  const isVerified = regData?.paymentStatus === 'VERIFIED' || regData?.paymentStatus === 'PAID' || regData?.status === 'PAYMENT_VERIFIED';

  return (
    <div className="token-pass-container" style={{
      maxWidth: '640px',
      margin: '0 auto',
      padding: '24px 20px',
      color: '#FFFFFF',
      position: 'relative'
    }}>
      {/* Back / Close button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94A3B8',
            padding: '8px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            marginBottom: '20px',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}

      {/* Main Ticket Card Pass */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 30, 0.99) 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(249, 115, 22, 0.35)',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 35px rgba(249,115,22,0.15)',
        overflow: 'hidden'
      }}>

        {/* Brand Banner Header */}
        <div style={{
          background: 'linear-gradient(90deg, #0F172A 0%, #1E2952 100%)',
          padding: '24px 28px',
          borderBottom: '1px solid rgba(249, 115, 22, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <img src="/logo.svg" alt="KARE IEEE" style={{ height: '36px', width: 'auto' }} />
              <span style={{ fontSize: '0.78rem', color: '#F97316', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                IEEE EDUCATION SOCIETY
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
              Official Event Entry Pass
            </h3>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-orange" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
              {targetRegId}
            </span>
          </div>
        </div>

        {/* Pass Content Body */}
        <div style={{ padding: '28px' }}>

          {/* Verification Badge Header */}
          <div style={{
            background: isVerified ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
            border: `1px solid ${isVerified ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: isVerified ? '#4ADE80' : '#FACC15',
            fontSize: '0.88rem',
            fontWeight: 700
          }}>
            <ShieldCheck size={20} />
            <span>{isVerified ? '✓ Payment Verified & Ticket Confirmed' : '⚠ Payment Pending Admin Verification'}</span>
          </div>

          {/* Participant Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participant Name</span>
              <h4 style={{ fontSize: '1.2rem', color: '#FFFFFF', fontWeight: 800, margin: '2px 0 0 0' }}>{name}</h4>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration ID</span>
              <h4 style={{ fontSize: '1.2rem', color: '#F97316', fontWeight: 800, margin: '2px 0 0 0', fontFamily: 'monospace' }}>{targetRegId}</h4>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student ID / Dept</span>
              <p style={{ color: '#E2E8F0', fontWeight: 600, margin: '2px 0 0 0', fontSize: '0.92rem' }}>
                {studentId ? `${studentId} (${dept})` : dept}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>College</span>
              <p style={{ color: '#E2E8F0', fontWeight: 600, margin: '2px 0 0 0', fontSize: '0.92rem' }}>{college}</p>
            </div>
          </div>

          {/* Event Venue Info Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.88rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CBD5E1' }}>
              <Calendar size={16} color="#F97316" />
              <span>Event Date: <strong>15th September 2026 (09:30 AM - 05:00 PM)</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#CBD5E1' }}>
              <MapPin size={16} color="#38BDF8" />
              <span>Venue: <strong>IEEE Tech Hall, KARE Campus</strong></span>
            </div>
          </div>

          {/* QR Code Entry Token Center Display */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: '#FFFFFF',
            borderRadius: '20px',
            marginBottom: '24px'
          }}>
            {ticketData?.qrCodeDataUrl ? (
              <img
                src={ticketData.qrCodeDataUrl}
                alt="Ticket QR Token"
                style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto' }}
              />
            ) : (
              <div style={{ width: '180px', height: '180px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '12px' }}>
                <QrCode size={120} color="#0F172A" />
              </div>
            )}
            <p style={{ color: '#0F172A', fontWeight: 800, fontSize: '0.85rem', margin: '8px 0 0 0', fontFamily: 'monospace' }}>
              {ticketData?.ticketId || `TKT-${targetRegId}`}
            </p>
            <p style={{ color: '#64748B', fontSize: '0.75rem', margin: '2px 0 0 0' }}>
              Present this QR code at venue gate for check-in entry
            </p>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleDownloadPdf}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
            >
              <Download size={18} />
              Download PDF Pass
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TokenPassPage;
