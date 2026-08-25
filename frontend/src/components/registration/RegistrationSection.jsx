import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getEventStatus } from '../../services/api';
import GoogleKLUAuth from './GoogleKLUAuth';
import RegistrationFeeCard from './RegistrationFeeCard';
import SeatAvailabilityCard from './SeatAvailabilityCard';
import RegistrationCountdownCard from './RegistrationCountdownCard';
import RegistrationSuccessCard from './RegistrationSuccessCard';
import RegistrationLockModal from './RegistrationLockModal';
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

const RegistrationSection = ({ onOpenDashboard }) => {
  const { user, registrationState, refreshRegistration } = useAuth();

  const [eventStatus, setEventStatus] = useState({
    capacity: 200,
    confirmed: 0,
    locked: 0,
    available: 200,
    status: 'OPEN',
    registrationFee: 300,
    registrationStart: '2026-08-01T00:00:00.000Z',
    registrationEnd: '2026-08-28T23:59:59.000Z',
    serverTime: new Date().toISOString(),
    registrationOpen: true
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await getEventStatus();
      if (res.data.success) {
        setEventStatus({
          capacity: res.data.capacity || 200,
          confirmed: res.data.confirmed || res.data.registered || 0,
          locked: res.data.locked || 0,
          available: res.data.available !== undefined ? res.data.available : res.data.remaining,
          status: res.data.status || 'OPEN',
          registrationFee: res.data.registrationFee || 300,
          registrationStart: res.data.registrationStart || '2026-08-01T00:00:00.000Z',
          registrationEnd: res.data.registrationEnd || '2026-08-28T23:59:59.000Z',
          serverTime: res.data.serverTime || new Date().toISOString(),
          registrationOpen: res.data.registrationOpen !== false
        });
      }
    } catch (err) {
      console.error('[RegistrationSection] Error fetching status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Real-time updates polling every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleContinueClick = () => {
    if (!user) {
      // Trigger Google Login
      document.querySelector('.glass-card button')?.click();
      return;
    }

    if (registrationState?.registration?.seatStatus === 'CONFIRMED' || registrationState?.registration?.status === 'PAYMENT_VERIFIED') {
      if (onOpenDashboard) onOpenDashboard();
      return;
    }

    setModalOpen(true);
  };

  const handleSuccess = async (newRegistration) => {
    await refreshRegistration();
    await fetchStatus();
  };

  const isAlreadyConfirmed = registrationState?.registration?.seatStatus === 'CONFIRMED' ||
    registrationState?.registration?.paymentStatus === 'PAID' ||
    registrationState?.registration?.paymentStatus === 'VERIFIED' ||
    registrationState?.registration?.status === 'PAYMENT_VERIFIED';

  return (
    <section id="registration" style={{
      position: 'relative',
      padding: '100px 24px',
      background: 'radial-gradient(circle at 50% 0%, rgba(15, 23, 42, 0.9) 0%, rgba(7, 13, 27, 1) 100%)',
      overflow: 'hidden'
    }}>
      
      {/* Dynamic Background Glows */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, rgba(56, 189, 248, 0.08) 50%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            background: 'rgba(249, 115, 22, 0.12)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            color: '#F97316',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '14px'
          }}>
            <Sparkles size={14} />
            <span>OFFICIAL WORKSHOP REGISTRATION</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '14px',
            lineHeight: 1.2
          }}>
            REGISTRATION
          </h2>

          <p style={{
            fontSize: '1.05rem',
            color: '#94A3B8',
            maxWidth: '640px',
            margin: '0 auto',
            fontWeight: 400
          }}>
            Register using your official <strong style={{ color: '#F97316' }}>@klu.ac.in</strong> student account. Seats are allocated dynamically with temporary seat locking.
          </p>
        </div>

        {/* Landing Page Content Grid */}
        <div>
          {/* Grid Layout of Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {/* Card 1: Google Auth / Verification */}
            <GoogleKLUAuth onAuthSuccess={fetchStatus} />

            {/* Card 2: Registration Fee */}
            <RegistrationFeeCard fee={eventStatus.registrationFee || 250} />

            {/* Card 3: Live Seat Availability & Progress Bar */}
            <SeatAvailabilityCard
              capacity={eventStatus.capacity}
              confirmed={eventStatus.confirmed}
              locked={eventStatus.locked}
              available={eventStatus.available}
              status={eventStatus.status}
            />

            {/* Card 4: Live Countdown Timer */}
            <RegistrationCountdownCard
              registrationEnd={eventStatus.registrationEnd}
              serverTime={eventStatus.serverTime}
            />
          </div>

          {/* Primary Action CTA Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            {eventStatus.status === 'CLOSED' ? (
              <button
                disabled
                className="btn-secondary"
                style={{
                  padding: '18px 48px',
                  fontSize: '1.15rem',
                  borderRadius: '16px',
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171'
                }}
              >
                REGISTRATION CLOSED
              </button>
            ) : eventStatus.status === 'FULL' ? (
              <button
                disabled
                className="btn-secondary"
                style={{
                  padding: '18px 48px',
                  fontSize: '1.15rem',
                  borderRadius: '16px',
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171'
                }}
              >
                REGISTRATION FULL
              </button>
            ) : (
              <button
                onClick={handleContinueClick}
                className="btn-primary"
                style={{
                  padding: '18px 52px',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(249, 115, 22, 0.4)'
                }}
              >
                {isAlreadyConfirmed ? 'VIEW PASS / DASHBOARD →' : 'CONTINUE REGISTRATION →'}
              </button>
            )}

            <div style={{
              marginTop: '16px',
              fontSize: '0.85rem',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={16} color="#34D399" />
              <span>10-Minute Temporary Seat Lock Enabled on Checkout</span>
            </div>
          </div>
        </div>

        {/* Registration Lock & Payment Modal */}
        <RegistrationLockModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
        />

      </div>
    </section>
  );
};

export default RegistrationSection;
