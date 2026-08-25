import React from 'react';
import { IndianRupee, Award, ShieldCheck } from 'lucide-react';

const RegistrationFeeCard = ({ fee = 250 }) => {
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
      justify: 'center'
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

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '0px' }}>
          <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
            ₹{fee}
          </span>
          <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>
            / per participant
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegistrationFeeCard;
