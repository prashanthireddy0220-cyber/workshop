import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdminDashboard, getAdminRegistrations } from '../../services/api';
import OverviewCards from './OverviewCards';
import ParticipantTable from './ParticipantTable';
import PaymentApprovalModal from './PaymentApprovalModal';
import QRScannerModal from './QRScannerModal';
import { Shield, RefreshCw, QrCode, LogOut, Lock, ArrowLeft, ShieldAlert, KeyRound, UserCheck } from 'lucide-react';

const AdminPage = () => {
  const { user, handleAdminLogin, logout } = useAuth();
  const [usernameInput, setUsernameInput] = useState('Workshop');
  const [passwordInput, setPasswordInput] = useState('IEEE@123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [stats, setStats] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Table Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('');

  // Modals
  const [selectedReg, setSelectedReg] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, regRes] = await Promise.all([
        getAdminDashboard(),
        getAdminRegistrations({
          q: searchQuery,
          department: departmentFilter,
          year: yearFilter,
          paymentStatus: paymentStatusFilter,
          attendanceStatus: attendanceFilter
        })
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (regRes.data.success) setRegistrations(regRes.data.registrations);
    } catch (err) {
      console.error('[Admin Page Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user, searchQuery, departmentFilter, yearFilter, paymentStatusFilter, attendanceFilter]);

  const handleAdminAuthSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError('Please enter admin username and password');
      return;
    }

    setLoginLoading(true);
    setLoginError('');
    try {
      await handleAdminLogin(usernameInput.trim(), passwordInput.trim());
    } catch (err) {
      setLoginError(err.message || 'Access Denied: Invalid admin username or password');
    } finally {
      setLoginLoading(false);
    }
  };

  // 1. If not authenticated as Admin, show Username + Password Login Gate
  if (!user || user.role !== 'admin') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#070D1B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px 28px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              background: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <Shield size={32} color="#F97316" />
            </div>
            <h2 style={{ fontSize: '1.6rem', color: '#FFF', fontWeight: 700 }}>Admin Portal Sign In</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '6px' }}>
              Enter authorized admin username and password to proceed
            </p>
          </div>

          {loginError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#F87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldAlert size={18} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminAuthSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Admin Username</label>
              <input
                type="text"
                className="form-control"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Workshop"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Admin Password</label>
              <input
                type="password"
                className="form-control"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="IEEE@123"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
            >
              <Lock size={18} />
              {loginLoading ? 'Verifying Admin Access...' : 'Unlock Admin Portal'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <a href="/" style={{ color: '#94A3B8', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Return to Public Workshop Platform
            </a>
          </div>

        </div>
      </div>
    );
  }

  // 2. Standalone Full-Screen Admin Portal Dashboard
  return (
    <div style={{ minHeight: '100vh', background: '#070D1B', color: '#F8FAFC', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Header Control Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/logo.svg" alt="KARE IEEE" style={{ height: '40px' }} />
              <span className="badge badge-orange">AUTHENTICATED ADMIN PORTAL</span>
            </div>
            <h1 style={{ fontSize: '2rem', color: '#FFF', fontWeight: 800, marginTop: '8px' }}>
              KARE IEEE Workshop Control Panel
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '2px' }}>
              Manage registrations, verify UPI payments, scan venue QR tickets & issue certificates.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setQrModalOpen(true)}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)' }}
            >
              <QrCode size={18} /> Launch Venue QR Scanner
            </button>

            <button onClick={fetchDashboardData} className="btn-secondary">
              <RefreshCw size={16} /> Refresh Data
            </button>

            <button onClick={logout} className="btn-secondary" style={{ color: '#F87171', borderColor: 'rgba(239,68,68,0.3)' }}>
              <LogOut size={16} /> Exit Admin
            </button>
          </div>
        </div>

        {/* Dashboard Overview Cards */}
        <OverviewCards stats={stats} />

        {/* Searchable Participant Table */}
        <ParticipantTable
          registrations={registrations}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          yearFilter={yearFilter}
          onYearChange={setYearFilter}
          paymentStatusFilter={paymentStatusFilter}
          onPaymentStatusChange={setPaymentStatusFilter}
          attendanceFilter={attendanceFilter}
          onAttendanceChange={setAttendanceFilter}
          onSelectRegistration={(reg) => setSelectedReg(reg)}
        />

        {/* Modals */}
        {selectedReg && (
          <PaymentApprovalModal
            isOpen={!!selectedReg}
            onClose={() => setSelectedReg(null)}
            registrationItem={selectedReg}
            onRefresh={fetchDashboardData}
          />
        )}

        {qrModalOpen && (
          <QRScannerModal
            isOpen={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
            onCheckInSuccess={fetchDashboardData}
          />
        )}

      </div>
    </div>
  );
};

export default AdminPage;
