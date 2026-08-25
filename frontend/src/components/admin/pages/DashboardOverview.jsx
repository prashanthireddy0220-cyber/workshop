import React from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  UserCheck,
  Award,
  CheckCircle2,
  Clock,
  IndianRupee,
  Activity,
  ArrowUpRight
} from 'lucide-react';

const DashboardOverview = ({ stats, recentRegistrations, onNavigateTab }) => {
  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      subtext: 'Registered @klu.ac.in accounts',
      icon: Users,
      color: '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.1)'
    },
    {
      title: 'Total Workshops',
      value: stats?.totalWorkshops || 1,
      subtext: 'AI/ML & Deep Learning Series',
      icon: BookOpen,
      color: '#F97316',
      bg: 'rgba(249, 115, 22, 0.1)'
    },
    {
      title: 'Upcoming Events',
      value: stats?.totalEvents || 1,
      subtext: 'Next: Sept 15-16, 2026',
      icon: Calendar,
      color: '#A855F7',
      bg: 'rgba(168, 85, 247, 0.1)'
    },
    {
      title: 'Total Registrations',
      value: stats?.totalRegistrations || 0,
      subtext: `${stats?.confirmedRegistrations || 0} Confirmed (${stats?.remainingSeats || 0} seats open)`,
      icon: Activity,
      color: '#34D399',
      bg: 'rgba(52, 211, 153, 0.1)'
    },
    {
      title: "Today's Attendance",
      value: stats?.totalAttendance || 0,
      subtext: `Attendance Rate: ${stats?.attendanceRate || '0%'}`,
      icon: UserCheck,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)'
    },
    {
      title: 'Certificates Generated',
      value: stats?.certificatesGenerated || 0,
      subtext: 'Verified Digital Certificates',
      icon: Award,
      color: '#EC4899',
      bg: 'rgba(236, 72, 153, 0.1)'
    }
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(249, 115, 22, 0.25)',
        borderRadius: '20px',
        padding: '24px 28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#FFF', fontWeight: 800, margin: 0 }}>
            Welcome to KARE IEEE Admin Portal
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '6px', margin: '6px 0 0 0' }}>
            Real-time analytics and event operations management for the upcoming AI/ML Workshop.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onNavigateTab('workshops')}
            style={{
              padding: '10px 18px',
              background: '#F97316',
              color: '#FFF',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Manage Workshops
          </button>
          <button
            onClick={() => onNavigateTab('attendance')}
            style={{
              padding: '10px 18px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFF',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            View Attendance
          </button>
        </div>
      </div>

      {/* Grid of Metric Statistic Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {statCards.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <div
              key={idx}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                padding: '22px 20px',
                transition: 'all 0.25 ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.86rem', color: '#94A3B8', fontWeight: 600 }}>
                  {card.title}
                </span>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color
                }}>
                  <IconComp size={22} />
                </div>
              </div>

              <div style={{ fontSize: '1.9rem', color: '#FFFFFF', fontWeight: 800, marginBottom: '6px' }}>
                {card.value}
              </div>

              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                {card.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Registrations & Quick Activity Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Recent Registrations Section */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#FFF', fontWeight: 700, margin: 0 }}>
              Recent Student Registrations
            </h3>
            <button
              onClick={() => onNavigateTab('students')}
              style={{ background: 'none', border: 'none', color: '#F97316', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          {recentRegistrations && recentRegistrations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentRegistrations.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: 700 }}>
                      {item.fullName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                      {item.email} • {item.department} ({item.year})
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: item.status === 'PAYMENT_VERIFIED' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: item.status === 'PAYMENT_VERIFIED' ? '#34D399' : '#F59E0B'
                  }}>
                    {item.status === 'PAYMENT_VERIFIED' ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748B', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              No student registrations yet.
            </p>
          )}
        </div>

        {/* System & Capacity Health */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '1.05rem', color: '#FFF', fontWeight: 700, marginBottom: '18px', margin: '0 0 18px 0' }}>
            Venue Capacity & Revenue Overview
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '8px' }}>
              <span>Seat Fill Ratio ({stats?.confirmedRegistrations || 0} / {stats?.capacity || 200})</span>
              <span style={{ color: '#F97316', fontWeight: 700 }}>
                {Math.round(((stats?.confirmedRegistrations || 0) / (stats?.capacity || 200)) * 100)}%
              </span>
            </div>

            <div style={{ height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, Math.round(((stats?.confirmedRegistrations || 0) / (stats?.capacity || 200)) * 100))}%`,
                background: 'linear-gradient(90deg, #F97316 0%, #EA580C 100%)',
                borderRadius: '5px'
              }} />
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block' }}>Total Verified Revenue</span>
              <span style={{ fontSize: '1.35rem', color: '#34D399', fontWeight: 800 }}>
                ₹{stats?.totalRevenue || 0}
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block' }}>Fee / Seat</span>
              <span style={{ fontSize: '1rem', color: '#FFF', fontWeight: 700 }}>
                ₹{stats?.registrationFee || 250}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;
