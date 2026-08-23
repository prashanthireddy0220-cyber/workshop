import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

const RegistrationCountdownCard = ({
  registrationEnd = '2026-08-28T23:59:59.000Z',
  serverTime = null
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    // Calculate initial server vs client offset
    const targetEnd = new Date(registrationEnd).getTime();
    const serverStart = serverTime ? new Date(serverTime).getTime() : Date.now();
    const clockOffset = serverStart - Date.now();

    const updateCountdown = () => {
      const nowSynced = Date.now() + clockOffset;
      const distance = targetEnd - nowSynced;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [registrationEnd, serverTime]);

  return (
    <div className="glass-card" style={{
      padding: '24px',
      borderRadius: '20px',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Clock size={18} color="#38BDF8" />
        <span style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          REGISTRATION CLOSES IN
        </span>
      </div>

      {timeLeft.isExpired ? (
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#F87171',
          fontSize: '0.95rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} />
          <span>Registration has closed.</span>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '12px 6px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
              {String(timeLeft.days).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', marginTop: '6px', textTransform: 'uppercase' }}>
              DAYS
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '12px 6px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', marginTop: '6px', textTransform: 'uppercase' }}>
              HOURS
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '12px 6px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', marginTop: '6px', textTransform: 'uppercase' }}>
              MINUTES
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '12px 6px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F97316', lineHeight: 1 }}>
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', marginTop: '6px', textTransform: 'uppercase' }}>
              SECONDS
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationCountdownCard;
