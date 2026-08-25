import React from 'react';
import { Users, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';

const SeatAvailabilityCard = ({
  capacity = 200,
  confirmed = 151,
  locked = 4,
  available = 45,
  status = 'FILLING FAST'
}) => {
  // Compute filled percentage safely
  const totalOccupied = Math.min(capacity, confirmed + locked);
  const fillPercentage = capacity > 0 ? Math.min(100, Math.round((totalOccupied / capacity) * 100)) : 0;

  // Determine badge styling dynamically
  const getBadgeStyle = (statusStr) => {
    switch (statusStr) {
      case 'CLOSED':
      case 'FULL':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.35)',
          color: '#F87171',
          dot: '🔴',
          text: statusStr === 'CLOSED' ? 'CLOSED' : 'FULL'
        };
      case 'ALMOST FULL':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.35)',
          color: '#FBBF24',
          dot: '🟡',
          text: 'ALMOST FULL'
        };
      case 'FILLING FAST':
        return {
          bg: 'rgba(249, 115, 22, 0.15)',
          border: 'rgba(249, 115, 22, 0.35)',
          color: '#F97316',
          dot: '🟠',
          text: 'FILLING FAST'
        };
      case 'OPEN':
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.35)',
          color: '#34D399',
          dot: '🟢',
          text: 'OPEN'
        };
    }
  };

  const badgeInfo = getBadgeStyle(status);

  return (
    <div className="glass-card" style={{
      padding: '28px',
      borderRadius: '20px',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="#F97316" />
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            REGISTRATION STATUS
          </span>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: badgeInfo.bg,
          border: `1px solid ${badgeInfo.border}`,
          color: badgeInfo.color,
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.04em'
        }}>
          <span>{badgeInfo.dot}</span>
          <span>{badgeInfo.text}</span>
        </div>
      </div>

      {/* Dynamic Numbers Main View */}
      <div style={{ textAlign: 'center', margin: '20px 0 24px 0' }}>
        <div style={{
          fontSize: 'clamp(2.4rem, 4vw, 3.4rem)',
          fontWeight: 900,
          color: '#FFFFFF',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          marginBottom: '6px'
        }}>
          <span style={{ color: available > 0 ? '#FFFFFF' : '#EF4444' }}>{available}</span>
          <span style={{ color: '#64748B', fontWeight: 400, fontSize: '0.65em' }}> / {capacity}</span>
        </div>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#F97316',
          textTransform: 'uppercase',
          letterSpacing: '0.12em'
        }}>
          SEATS REMAINING
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '10px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '9999px',
        overflow: 'hidden',
        marginBottom: '20px',
        position: 'relative'
      }}>
        <div style={{
          width: `${fillPercentage}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #F97316 0%, #38BDF8 100%)',
          borderRadius: '9999px',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 0 12px rgba(249, 115, 22, 0.4)'
        }} />
      </div>

      {/* Breakdown Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'center'
      }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 8px', borderRadius: '10px' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34D399' }}>{confirmed}</div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>CONFIRMED</div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 8px', borderRadius: '10px' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FBBF24' }}>{locked}</div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>LOCKED IN PAYMENT</div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 8px', borderRadius: '10px' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38BDF8' }}>{capacity}</div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>MAX CAPACITY</div>
        </div>
      </div>
    </div>
  );
};

export default SeatAvailabilityCard;
