import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminDashboard,
  getAdminRegistrations,
  approvePayment,
  rejectPayment,
  updateEventConfig,
  bulkVerifyPayments,
  deleteRegistrationAdmin,
  deleteAllRegistrationsAdmin,
  directRegisterAdmin
} from '../../services/api';
import PaymentApprovalModal from './PaymentApprovalModal';
import QRScannerModal from './QRScannerModal';
import {
  Users,
  Clock,
  IndianRupee,
  TrendingUp,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileText,
  Trash2,
  QrCode,
  Settings,
  LogOut,
  UserCheck,
  Edit,
  ExternalLink,
  Lock,
  Unlock,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';

const AdminControlCenter = () => {
  const { logout } = useAuth();

  const [stats, setStats] = useState({
    totalRegistrations: 0,
    confirmedRegistrations: 0,
    pendingPayments: 0,
    rejectedPayments: 0,
    capacity: 200,
    remainingSeats: 200,
    totalRevenue: 0,
    todaySubmissions: 0,
    registrationOpen: true
  });

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  // Modals
  const [selectedReg, setSelectedReg] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [directRegOpen, setDirectRegOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Form state for Direct Registration
  const [directForm, setDirectForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    studentId: '',
    department: 'CSE',
    year: '3rd Year',
    section: '24S01',
    residency: 'Day Scholar'
  });
  const [directFormLoading, setDirectFormLoading] = useState(false);
  const [directFormError, setDirectFormError] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, regRes] = await Promise.all([
        getAdminDashboard(),
        getAdminRegistrations({
          q: searchQuery,
          department: deptFilter,
          year: yearFilter,
          paymentStatus: statusFilter
        })
      ]);

      if (dashboardRes.data.success) {
        const s = dashboardRes.data.stats;
        setStats({
          totalRegistrations: s.totalRegistrations || 0,
          confirmedRegistrations: s.confirmedRegistrations || s.verifiedPayments || 0,
          pendingPayments: s.pendingPayments || 0,
          rejectedPayments: s.rejectedPayments || 0,
          capacity: s.capacity || 200,
          remainingSeats: s.remainingSeats !== undefined ? s.remainingSeats : s.availableSeats || 200,
          totalRevenue: s.totalRevenue || (s.verifiedPayments || 0) * 300,
          todaySubmissions: s.todaySubmissions || 0,
          registrationOpen: s.registrationOpen !== false
        });
      }

      if (regRes.data.success) {
        setRegistrations(regRes.data.registrations || []);
      }
    } catch (err) {
      console.error('[Admin Data Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [searchQuery, statusFilter, deptFilter, yearFilter]);

  // Toggle Registration Status (Open / Closed)
  const handleToggleStatus = async () => {
    try {
      const newStatus = !stats.registrationOpen;
      await updateEventConfig({ registrationOpen: newStatus });
      setStats(prev => ({ ...prev, registrationOpen: newStatus }));
    } catch (err) {
      alert('Failed to update registration status');
    }
  };

  // Bulk Approve Payments
  const handleBulkVerify = async () => {
    if (!window.confirm('Are you sure you want to verify all pending payments?')) return;
    try {
      const res = await bulkVerifyPayments();
      alert(res.data.message || 'All pending payments verified!');
      fetchAllData();
    } catch (err) {
      alert('Bulk verification failed.');
    }
  };

  // Delete Single Registration
  const handleDeleteRegistration = async (id) => {
    if (!window.confirm('Are you sure you want to delete this registration record?')) return;
    try {
      await deleteRegistrationAdmin(id);
      fetchAllData();
    } catch (err) {
      alert('Failed to delete registration record.');
    }
  };

  // Delete All Registrations
  const handleDeleteAll = async () => {
    const input = window.prompt('DANGER: Type "DELETE ALL" to clear all registration records permanently:');
    if (input === 'DELETE ALL') {
      try {
        await deleteAllRegistrationsAdmin();
        alert('All registration records cleared!');
        fetchAllData();
      } catch (err) {
        alert('Failed to clear records.');
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!registrations.length) return alert('No registrations to export.');
    const headers = ['Participant ID', 'Full Name', 'Email', 'Phone', 'Student ID', 'Dept', 'Year', 'Section', 'Residency', 'Status', 'Transaction ID', 'Submitted At'];
    const rows = registrations.map(r => [
      r.registrationId,
      `"${r.fullName}"`,
      r.email,
      r.phone,
      r.studentId,
      r.department,
      r.year,
      r.section,
      r.residency,
      r.status,
      r.payment?.transactionId || '',
      new Date(r.createdAt).toLocaleString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Workshop_Registrations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct Registration Submit
  const handleDirectSubmit = async (e) => {
    e.preventDefault();
    setDirectFormLoading(true);
    setDirectFormError('');
    try {
      const res = await directRegisterAdmin(directForm);
      if (res.data.success) {
        alert('Student registered and confirmed successfully!');
        setDirectRegOpen(false);
        setDirectForm({
          fullName: '',
          email: '',
          phone: '',
          studentId: '',
          department: 'CSE',
          year: '3rd Year',
          section: '24S01',
          residency: 'Day Scholar'
        });
        fetchAllData();
      }
    } catch (err) {
      setDirectFormError(err.response?.data?.message || 'Direct registration failed.');
    } finally {
      setDirectFormLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#EDF2F7',
      color: '#1A202C',
      fontFamily: "'Inter', sans-serif",
      padding: '24px 32px'
    }}>
      
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* ==========================================================================
           TOP HEADER & CONTROL CENTER BANNER (Matching Friend's Design)
           ========================================================================== */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '28px 36px',
          marginBottom: '28px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              ADMIN CONTROL CENTER
            </h1>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '4px' }}>
              IEEE KARE • INTELLIGENT YIELD PREDICTION & AI/ML WORKSHOP
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            
            {/* + Direct Registration Button */}
            <button
              onClick={() => setDirectRegOpen(true)}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={16} /> + Direct Registration
            </button>

            {/* Attendance Sessions Button */}
            <button
              onClick={() => alert('Attendance session module active.')}
              style={{
                background: '#F1F5F9',
                color: '#334155',
                border: '1px solid #E2E8F0',
                padding: '10px 18px',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <UserCheck size={16} color="#2563EB" /> Attendance Sessions
            </button>

            {/* Event Settings Button */}
            <button
              onClick={() => setSettingsOpen(true)}
              style={{
                background: '#F1F5F9',
                color: '#334155',
                border: '1px solid #E2E8F0',
                padding: '10px 18px',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Settings size={16} color="#2563EB" /> Event Settings
            </button>

            {/* QR Code Button */}
            <button
              onClick={() => setQrModalOpen(true)}
              style={{
                background: '#F1F5F9',
                color: '#334155',
                border: '1px solid #E2E8F0',
                padding: '10px 18px',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <QrCode size={16} color="#2563EB" /> QR Code Scanner
            </button>

            {/* STATUS: OPEN / CLOSED Badge Toggle Button */}
            <button
              onClick={handleToggleStatus}
              style={{
                background: stats.registrationOpen ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: stats.registrationOpen ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                color: stats.registrationOpen ? '#16A34A' : '#DC2626',
                padding: '9px 18px',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              {stats.registrationOpen ? <Unlock size={14} /> : <Lock size={14} />}
              STATUS: {stats.registrationOpen ? 'OPEN' : 'CLOSED'}
            </button>

            {/* Logout Icon Button */}
            <button
              onClick={logout}
              title="Logout from Admin"
              style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                color: '#64748B',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* ==========================================================================
           METRIC STAT CARDS ROW (4 Neumorphic Cards)
           ========================================================================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '28px'
        }}>
          
          {/* Card 1: TOTAL REGISTRATIONS */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                TOTAL REGISTRATIONS
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0F172A', marginTop: '6px' }}>
                {stats.totalRegistrations}
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '6px', display: 'flex', gap: '12px' }}>
                <span style={{ color: '#16A34A', fontWeight: 700 }}>Approved: {stats.confirmedRegistrations}</span>
                <span style={{ color: '#EA580C', fontWeight: 700 }}>Pending: {stats.pendingPayments}</span>
              </div>
            </div>
            <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '50%', color: '#2563EB' }}>
              <Users size={22} />
            </div>
          </div>

          {/* Card 2: REMAINING SPOTS */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                REMAINING SPOTS
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0F172A', marginTop: '6px' }}>
                {stats.remainingSeats} <span style={{ fontSize: '1.2rem', color: '#94A3B8', fontWeight: 700 }}>/ {stats.capacity}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginTop: '6px' }}>
                Cap: {stats.capacity} Participants
              </div>
            </div>
            <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '50%', color: '#2563EB' }}>
              <Clock size={22} />
            </div>
          </div>

          {/* Card 3: TOTAL FEE REVENUE */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                TOTAL FEE REVENUE
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#16A34A', marginTop: '6px' }}>
                ₹{stats.totalRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginTop: '6px' }}>
                Verified Payments @ ₹300/student
              </div>
            </div>
            <div style={{ background: '#DCFCE7', padding: '12px', borderRadius: '50%', color: '#16A34A' }}>
              <IndianRupee size={22} />
            </div>
          </div>

          {/* Card 4: TODAY'S SUBMISSIONS */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                TODAY'S SUBMISSIONS
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#2563EB', marginTop: '6px' }}>
                +{stats.todaySubmissions}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginTop: '6px' }}>
                Live submission rate
              </div>
            </div>
            <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '50%', color: '#2563EB' }}>
              <TrendingUp size={22} />
            </div>
          </div>

        </div>

        {/* ==========================================================================
           SEARCH, FILTER & ACTION BAR
           ========================================================================== */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px 28px',
          marginBottom: '28px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
              STUDENT REGISTRATION RECORDS <span style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 600 }}>({registrations.length} Total)</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
              <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by Participant ID, Name, Roll No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  borderRadius: '9999px',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '9999px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#334155'
              }}
            >
              <option value="">Status: All</option>
              <option value="PAYMENT_VERIFIED">Approved</option>
              <option value="PAYMENT_SUBMITTED">Pending Verification</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '9999px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#334155'
              }}
            >
              <option value="">Dept: All</option>
              <option value="CSE">CSE</option>
              <option value="AI & DS">AI & DS</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '9999px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#334155'
              }}
            >
              <option value="">Year: All</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>

            {/* Action Buttons */}
            <button
              onClick={() => setDirectRegOpen(true)}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Plus size={15} /> + DIRECT REGISTRATION
            </button>

            <button
              onClick={handleBulkVerify}
              style={{
                background: '#DCFCE7',
                color: '#16A34A',
                border: '1px solid #BBF7D0',
                padding: '10px 16px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={15} /> VERIFY ALL
            </button>

            <button
              onClick={handleExportCSV}
              style={{
                background: '#F1F5F9',
                color: '#0284C7',
                border: '1px solid #E2E8F0',
                padding: '10px 16px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <FileSpreadsheet size={15} /> Excel / CSV
            </button>

            <button
              onClick={handleDeleteAll}
              style={{
                background: '#FEE2E2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                padding: '10px 16px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={15} /> DELETE ALL
            </button>

          </div>
        </div>

        {/* ==========================================================================
           STUDENT REGISTRATIONS DATA TABLE
           ========================================================================== */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)',
          overflowX: 'auto'
        }}>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #EDF2F7', color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 16px' }}>PARTICIPANT ID</th>
                <th style={{ padding: '14px 16px' }}>STUDENT DETAILS</th>
                <th style={{ padding: '14px 16px' }}>REG NO</th>
                <th style={{ padding: '14px 16px' }}>UPI / UTR TXN ID</th>
                <th style={{ padding: '14px 16px' }}>DEPT / YEAR</th>
                <th style={{ padding: '14px 16px' }}>PAYMENT PROOF</th>
                <th style={{ padding: '14px 16px' }}>STATUS</th>
                <th style={{ padding: '14px 16px' }}>SUBMITTED AT</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    Loading participant records...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No student registrations found.
                  </td>
                </tr>
              ) : (
                registrations.map((reg, index) => {
                  const proofUrl = reg.payment?.upiScreenshotUrl || reg.payment?.screenshotUrl || '';
                  const isVerified = reg.status === 'PAYMENT_VERIFIED' || reg.paymentStatus === 'VERIFIED';
                  const isRejected = reg.status === 'REJECTED' || reg.paymentStatus === 'REJECTED';

                  return (
                    <tr key={reg._id || index} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                      
                      {/* Participant ID Badge */}
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          background: '#EFF6FF',
                          color: '#2563EB',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          padding: '6px 12px',
                          borderRadius: '9999px',
                          display: 'inline-block'
                        }}>
                          {reg.registrationId}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>#{index + 1}</div>
                      </td>

                      {/* Student Details */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                          {reg.fullName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#2563EB', marginTop: '2px' }}>
                          {reg.email}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {reg.phone}
                        </div>
                      </td>

                      {/* Reg No */}
                      <td style={{ padding: '16px', fontWeight: 800, fontFamily: 'monospace', color: '#1E293B' }}>
                        {reg.studentId}
                      </td>

                      {/* UPI / UTR Txn ID */}
                      <td style={{ padding: '16px', fontWeight: 800, fontFamily: 'monospace', color: '#2563EB' }}>
                        {reg.payment?.transactionId || 'N/A'}
                      </td>

                      {/* Dept / Year */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>
                          {reg.department} ({reg.year})
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          Sec: <strong>{reg.section || '24S01'}</strong> • {reg.residency || 'Day Scholar'}
                        </div>
                      </td>

                      {/* Payment Proof Circular Thumbnail */}
                      <td style={{ padding: '16px' }}>
                        {proofUrl ? (
                          <div
                            onClick={() => setSelectedReg(reg)}
                            title="Click to view full screenshot proof"
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              border: '2px solid #2563EB',
                              cursor: 'pointer',
                              background: '#000',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                          >
                            <img
                              src={proofUrl.startsWith('http') ? proofUrl : `/${proofUrl}`}
                              alt="Payment Proof"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>No proof</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          background: isVerified ? '#DCFCE7' : isRejected ? '#FEE2E2' : '#FFEDD5',
                          color: isVerified ? '#15803D' : isRejected ? '#B91C1C' : '#C2410C',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          padding: '5px 12px',
                          borderRadius: '9999px',
                          display: 'inline-block'
                        }}>
                          {isVerified ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                        </span>
                      </td>

                      {/* Submitted At */}
                      <td style={{ padding: '16px', color: '#64748B', fontSize: '0.8rem' }}>
                        {new Date(reg.createdAt).toLocaleDateString()}<br />
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          {new Date(reg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedReg(reg)}
                            title="Review Payment & Details"
                            style={{ background: '#EFF6FF', border: 'none', color: '#2563EB', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <CheckCircle2 size={16} />
                          </button>

                          <button
                            onClick={() => handleDeleteRegistration(reg.registrationId || reg._id)}
                            title="Delete Record"
                            style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

        </div>

      </div>

      {/* ==========================================================================
         MODALS: Payment Approval, QR Scanner, Direct Registration, Settings
         ========================================================================== */}
      
      {/* 1. Payment Proof Modal */}
      {selectedReg && (
        <PaymentApprovalModal
          isOpen={!!selectedReg}
          onClose={() => setSelectedReg(null)}
          registrationItem={selectedReg}
          onRefresh={fetchAllData}
        />
      )}

      {/* 2. QR Scanner Modal */}
      {qrModalOpen && (
        <QRScannerModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          onCheckInSuccess={fetchAllData}
        />
      )}

      {/* 3. Direct Registration Modal */}
      {directRegOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', borderRadius: '24px', background: '#FFFFFF', color: '#0F172A', padding: '28px' }}>
            
            <button
              onClick={() => setDirectRegOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>
              Direct Student Registration
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '20px' }}>
              Bypass Google Sign-In & Payment verification for offline / spot registration.
            </p>

            {directFormError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {directFormError}
              </div>
            )}

            <form onSubmit={handleDirectSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={directForm.fullName}
                    onChange={(e) => setDirectForm({ ...directForm, fullName: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={directForm.email}
                    onChange={(e) => setDirectForm({ ...directForm, email: e.target.value })}
                    placeholder="student@klu.ac.in"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Student Roll No / ID *</label>
                  <input
                    type="text"
                    required
                    value={directForm.studentId}
                    onChange={(e) => setDirectForm({ ...directForm, studentId: e.target.value })}
                    placeholder="e.g. 2400030123"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={directForm.phone}
                    onChange={(e) => setDirectForm({ ...directForm, phone: e.target.value })}
                    placeholder="9876543210"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Dept</label>
                  <select
                    value={directForm.department}
                    onChange={(e) => setDirectForm({ ...directForm, department: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  >
                    <option value="CSE">CSE</option>
                    <option value="AI & DS">AI & DS</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="Mechanical">Mechanical</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Year</label>
                  <select
                    value={directForm.year}
                    onChange={(e) => setDirectForm({ ...directForm, year: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Section</label>
                  <input
                    type="text"
                    value={directForm.section}
                    onChange={(e) => setDirectForm({ ...directForm, section: e.target.value })}
                    placeholder="24S01"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={directFormLoading}
                style={{
                  width: '100%',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                {directFormLoading ? 'Processing Registration...' : 'Complete & Confirm Spot (₹300 Paid)'}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 4. Settings & Configuration Modal */}
      {settingsOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', borderRadius: '24px', background: '#FFFFFF', color: '#0F172A', padding: '28px' }}>
            
            <button
              onClick={() => setSettingsOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>
              Workshop Settings & Controls
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '20px' }}>
              Configure capacity limits and registration toggle status.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Workshop Capacity Limit
              </label>
              <input
                type="number"
                value={stats.capacity}
                onChange={(e) => setStats({ ...stats, capacity: parseInt(e.target.value) || 200 })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Registration Toggle Status
              </label>
              <button
                onClick={handleToggleStatus}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: stats.registrationOpen ? '#DCFCE7' : '#FEE2E2',
                  color: stats.registrationOpen ? '#15803D' : '#B91C1C'
                }}
              >
                {stats.registrationOpen ? '✓ REGISTRATION IS OPEN (Click to Close)' : '🔒 REGISTRATION IS CLOSED (Click to Open)'}
              </button>
            </div>

            <button
              onClick={() => {
                updateEventConfig({ capacity: stats.capacity, registrationOpen: stats.registrationOpen });
                setSettingsOpen(false);
                alert('Settings saved!');
              }}
              style={{
                width: '100%',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              Save Configuration Settings
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminControlCenter;
