import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getTicketDownloadUrl, getCertificateDownloadUrl } from '../services/api';
import {
  X,
  User,
  Ticket,
  Award,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  AlertTriangle,
  CreditCard,
  QrCode,
  Calendar,
  MapPin,
  CheckCircle2
} from 'lucide-react';

const ParticipantDashboard = ({ isOpen, onClose, onOpenRegistration, onOpenPayment }) => {
  const { user, registrationState } = useAuth();

  if (!isOpen || !user) return null;

  const registration = registrationState?.registration;
  const payment = registrationState?.payment;
  const ticket = registrationState?.ticket;
  const attendance = registrationState?.attendance;
  const certificate = registrationState?.certificate;
  const summary = {
    registration: registration ? 'REGISTERED' : 'NOT REGISTERED',
    payment: (registration?.paymentStatus === 'PAID' || registration?.paymentStatus === 'VERIFIED' || payment?.status === 'VERIFIED') ? 'VERIFIED / PAID' : (payment?.status === 'PENDING' ? 'PENDING' : 'NOT PAID'),
    ticket: ticket ? 'AVAILABLE' : 'NOT AVAILABLE',
    attendance: attendance && attendance.checkedIn ? 'CHECKED IN' : 'NOT CHECKED IN',
    certificate: certificate ? 'AVAILABLE' : 'NOT AVAILABLE'
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED / PAID':
      case 'REGISTERED':
      case 'AVAILABLE':
      case 'CHECKED IN':
        return <span className="badge badge-green">✓ {status}</span>;
      case 'PENDING':
        return <span className="badge badge-orange">⏳ {status}</span>;
      case 'REJECTED':
      case 'NOT PAID':
        return <span className="badge badge-red">✕ {status}</span>;
      default:
        return <span className="badge badge-blue">{status || 'NOT AVAILABLE'}</span>;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '820px' }}>
        
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

        {/* Header Profile Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          paddingBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '24px'
        }}>
          <img
            src={user.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
            alt={user.name}
            style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #F97316' }}
          />
          <div>
            <h2 style={{ fontSize: '1.5rem', color: '#FFF' }}>{user.name}</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>{user.email}</p>
            <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
              <span className="badge badge-blue">{user.role.toUpperCase()}</span>
              {registration && <span className="badge badge-orange">ID: {registration.registrationId}</span>}
            </div>
          </div>
        </div>

        {/* State Tracker Stepper Cards */}
        {user.role === 'admin' ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', background: 'rgba(249, 115, 22, 0.08)', borderRadius: '20px', border: '1px solid rgba(249, 115, 22, 0.25)' }}>
            <div style={{ background: 'rgba(249, 115, 22, 0.15)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <User size={32} color="#F97316" />
            </div>
            <h3 style={{ color: '#FFF', fontSize: '1.35rem', fontWeight: 800, marginBottom: '8px' }}>Authorized IEEE Admin Account</h3>
            <p style={{ color: '#94A3B8', maxWidth: '480px', margin: '0 auto 24px auto', fontSize: '0.92rem', lineHeight: '1.5' }}>
              You are authenticated as an Administrator (<strong style={{ color: '#F97316' }}>{user.email}</strong>). Admin users manage registrations, venue check-ins, workshops, and certificates via the Admin Control Panel.
            </p>
            <a
              href="/admin"
              className="btn-primary"
              style={{ display: 'inline-flex', padding: '12px 24px', fontSize: '0.95rem', textDecoration: 'none' }}
            >
              Open Admin Control Panel (/admin)
            </a>
          </div>
        ) : !registration ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ background: 'rgba(249, 115, 22, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <User size={30} color="#F97316" />
            </div>
            <h3 style={{ color: '#FFF', fontSize: '1.3rem', marginBottom: '8px' }}>Not Registered Yet</h3>
            <p style={{ color: '#94A3B8', maxWidth: '400px', margin: '0 auto 24px auto', fontSize: '0.9rem' }}>
              You have authenticated your @klu.ac.in account. Please complete your academic details to reserve your seat.
            </p>
            <button onClick={onOpenRegistration} className="btn-primary">
              Register for Workshop Now
            </button>
          </div>
        ) : (
          <div>
            {/* Status Summary Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginBottom: '24px'
            }}>
              
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase' }}>Registration</span>
                <div style={{ marginTop: '6px' }}>{getStatusBadge(summary.registration)}</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase' }}>Payment Proof</span>
                <div style={{ marginTop: '6px' }}>{getStatusBadge(summary.payment)}</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase' }}>QR Ticket</span>
                <div style={{ marginTop: '6px' }}>{getStatusBadge(summary.ticket)}</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase' }}>Venue Attendance</span>
                <div style={{ marginTop: '6px' }}>{getStatusBadge(summary.attendance)}</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase' }}>Certificate</span>
                <div style={{ marginTop: '6px' }}>{getStatusBadge(summary.certificate)}</div>
              </div>

            </div>

            {/* VISUAL QR TICKET CARD */}
            {ticket && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '20px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                  
                  {/* Left Details */}
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(249, 115, 22, 0.15)', borderRadius: '20px', color: '#F97316', fontSize: '0.75rem', fontWeight: 800, marginBottom: '12px' }}>
                      <QrCode size={14} /> OFFICIAL WORKSHOP TICKET PASS
                    </div>

                    <h3 style={{ fontSize: '1.2rem', color: '#FFF', fontWeight: 800, margin: '0 0 8px 0' }}>
                      National Workshop on AI/ML & Intelligent Yield Prediction
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', color: '#94A3B8', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} color="#F97316" />
                        <span>Date: <strong>15 September 2026</strong> (09:30 AM - 05:00 PM)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} color="#38BDF8" />
                        <span>Venue: <strong>IEEE Tech Hall, KARE Campus</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Ticket size={14} color="#34D399" />
                        <span>Participant ID: <strong style={{ color: '#FFF' }}>{registration.registrationId}</strong></span>
                      </div>
                    </div>

                    {/* Attendance Status Callout */}
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: attendance && attendance.checkedIn ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                      border: attendance && attendance.checkedIn ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(245, 158, 11, 0.25)',
                      color: attendance && attendance.checkedIn ? '#34D399' : '#F59E0B',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {attendance && attendance.checkedIn ? (
                        <>
                          <CheckCircle2 size={18} />
                          <span>Attendance: <strong>Present ✓</strong> ({new Date(attendance.checkedInAt).toLocaleTimeString()})</span>
                        </>
                      ) : (
                        <>
                          <Clock size={18} />
                          <span>Attendance: <strong>Not Marked</strong> (Scan QR at venue gate)</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right QR Image */}
                  <div style={{
                    textAlign: 'center',
                    background: '#FFFFFF',
                    padding: '16px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.4)'
                  }}>
                    <img
                      src={ticket.qrCodeDataUrl}
                      alt="Student Ticket QR Code"
                      style={{ width: '150px', height: '150px', display: 'block', margin: '0 auto' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#1E293B', fontWeight: 800, display: 'block', marginTop: '6px' }}>
                      {registration.registrationId}
                    </span>
                  </div>

                </div>

                <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                  <a
                    href={getTicketDownloadUrl(registration.registrationId)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                    style={{ background: '#1E2952', color: '#FFF', border: '1px solid #38BDF8', fontSize: '0.85rem', padding: '8px 16px' }}
                  >
                    <Download size={16} /> Download PDF Pass
                  </a>
                </div>
              </div>
            )}

            {/* Rejection Alert Notice if Payment Rejected */}
            {payment && payment.status === 'REJECTED' && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '24px',
                color: '#F87171'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '4px' }}>
                  <AlertTriangle size={18} />
                  <span>Payment Verification Rejected</span>
                </div>
                <p style={{ fontSize: '0.875rem', marginBottom: '12px' }}>
                  Reason: "{payment.rejectionReason || 'Transaction ID or screenshot mismatch.'}"
                </p>
                <button onClick={onOpenPayment} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Re-submit Correct Payment Proof
                </button>
              </div>
            )}

            {/* Certificate Download Card */}
            {(certificate || (attendance && attendance.checkedIn)) && (
              <div style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={20} color="#34D399" />
                    <h4 style={{ color: '#FFF' }}>IEEE Participation Certificate Unlocked</h4>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
                    Verified attendance at venue. Official certificate available for instant download.
                  </p>
                </div>
                <a
                  href={getCertificateDownloadUrl(registration.registrationId)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                >
                  <Download size={18} /> Download Certificate PDF
                </a>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default ParticipantDashboard;
