import React from 'react';
import { Users, DollarSign, Clock, CheckCircle, XCircle, Award, ShieldAlert, Cpu } from 'lucide-react';

const OverviewCards = ({ stats }) => {
  if (!stats) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px',
      marginBottom: '32px'
    }}>
      
      {/* Total Registrations */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>Total Registered</span>
          <Users size={20} color="#F97316" />
        </div>
        <h3 style={{ fontSize: '1.8rem', color: '#FFF', marginTop: '10px' }}>{stats.totalRegistrations}</h3>
        <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Capacity: {stats.capacity} seats</p>
      </div>

      {/* Verified Revenue */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>Total Verified Revenue</span>
          <DollarSign size={20} color="#34D399" />
        </div>
        <h3 style={{ fontSize: '1.8rem', color: '#34D399', marginTop: '10px' }}>₹{stats.totalRevenue}</h3>
        <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>{stats.verifiedPayments} approved payments</p>
      </div>

      {/* Pending Payments */}
      <div className="glass-card" style={{ padding: '20px', borderColor: stats.pendingPayments > 0 ? 'rgba(249, 115, 22, 0.4)' : 'rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>Pending Verifications</span>
          <Clock size={20} color="#F97316" />
        </div>
        <h3 style={{ fontSize: '1.8rem', color: '#F97316', marginTop: '10px' }}>{stats.pendingPayments}</h3>
        <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Requires admin review</p>
      </div>

      {/* Remaining Seats */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>Remaining Seats</span>
          <Cpu size={20} color="#38BDF8" />
        </div>
        <h3 style={{ fontSize: '1.8rem', color: '#38BDF8', marginTop: '10px' }}>{stats.remainingSeats}</h3>
        <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Available for booking</p>
      </div>

      {/* Venue Attendance */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>Venue Attendance</span>
          <Award size={20} color="#A855F7" />
        </div>
        <h3 style={{ fontSize: '1.8rem', color: '#A855F7', marginTop: '10px' }}>{stats.totalAttendance}</h3>
        <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Attendance Rate: {stats.attendanceRate}</p>
      </div>

    </div>
  );
};

export default OverviewCards;
