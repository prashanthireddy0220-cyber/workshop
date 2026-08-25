import React from 'react';
import { IndianRupee, Award, ShieldCheck } from 'lucide-react';

const RegistrationFeeCard = ({ fee = 300 }) => {
  return (
    <div className="glass-card" style={{
      padding: '24px',
      borderRadius: '20px',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
      display: 'flex',
      flexDirection: 'column',
      justify: 'space-between'
    }}>
      <div>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '10px'
        }}>
          REGISTRATION FEE
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '14px' }}>
          <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
            ₹{fee}
          </span>
          <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>
            / per participant
          </span>
        </div>
      </div>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        borderRadius: '10px',
        background: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        color: '#38BDF8',
        fontSize: '0.85rem',
        fontWeight: 600
      }}>
        <Award size={16} color="#38BDF8" />
        <span>Includes Participation Certificate & IEEE Kit</span>
      </div>
    </div>
  );
};

export default RegistrationFeeCard;
