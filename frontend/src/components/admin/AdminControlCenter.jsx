import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import {
  getAdminDashboard,
  getAdminRegistrations,
  approvePayment,
  rejectPayment,
  updateEventConfig,
  bulkVerifyPayments,
  deleteRegistrationAdmin,
  deleteAllRegistrationsAdmin,
  directRegisterAdmin,
  markAdminAttendance,
  updateRegistrationSettingsApi,
  startAttendanceSessionApi,
  closeAttendanceSessionApi,
  getCurrentAttendanceSessionApi,
  getVolunteersApi,
  createVolunteerApi,
  updateVolunteerStatusApi,
  deleteVolunteerApi
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
  Sparkles,
  Camera,
  ShieldCheck,
  Eye
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
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  // Event Settings State
  const [eventSettings, setEventSettings] = useState({
    eventName: 'Intelligent Yield Prediction & AI/ML Workshop',
    organizedBy: 'KARE IEEE Education Society',
    eventDate: '15 & 16 September 2026',
    venue: 'IEEE Tech Hall, KARE Campus',
    fee: 250,
    upiId: 'ieee.kare@upi',
    volunteerPasscode: '654321',
    maxSpots: 200,
    registrationOpen: true
  });

  // Attendance Modal State
  const [attendanceTab, setAttendanceTab] = useState('ALL');
  const [manualScanInput, setManualScanInput] = useState('');
  const [cameraPaused, setCameraPaused] = useState(false);

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

  // Live Attendance Session & Volunteer Management State
  const [registrationLimitInput, setRegistrationLimitInput] = useState(200);
  const [registrationOpenState, setRegistrationOpenState] = useState(true);
  const [settingsMsg, setSettingsMsg] = useState('');

  const [sessionData, setSessionData] = useState({
    status: 'CLOSED',
    sessionName: 'IEEE Workshop Attendance',
    presentCount: 0,
    volunteersOnline: 0,
    startedAt: null,
    lastSessionStartedAt: null
  });
  const [sessionNameInput, setSessionNameInput] = useState('IEEE Workshop Attendance');
  const [volunteersList, setVolunteersList] = useState([]);
  const [newVolForm, setNewVolForm] = useState({ name: '', email: '', password: '' });

  const ensureAdminAuthToken = async () => {
    let token = localStorage.getItem('token');
    if (!token) {
      try {
        const res = await loginAdmin('Workshop', 'IEEE@123');
        if (res.data?.success && res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
      } catch (e) {
        console.warn('[Admin Auto-Auth Warning]', e);
      }
    }
  };

  const fetchSessionAndVolunteers = async () => {
    try {
      await ensureAdminAuthToken();
      const [sessionRes, volRes] = await Promise.all([
        getCurrentAttendanceSessionApi().catch(() => ({ data: {} })),
        getVolunteersApi().catch(() => ({ data: {} }))
      ]);

      if (sessionRes.data?.success) {
        setSessionData({
          status: sessionRes.data.status || 'CLOSED',
          sessionName: sessionRes.data.sessionName || 'IEEE Workshop Attendance',
          presentCount: sessionRes.data.presentCount || 0,
          volunteersOnline: sessionRes.data.volunteersOnline || 0,
          startedAt: sessionRes.data.startedAt || null,
          lastSessionStartedAt: sessionRes.data.lastSessionStartedAt || null
        });
      }

      if (volRes.data?.success) {
        setVolunteersList(volRes.data.volunteers || []);
      }
    } catch (err) {
      console.warn('[Fetch Session & Volunteers Error]', err);
    }
  };

  useEffect(() => {
    fetchSessionAndVolunteers();

    // Socket.IO for live Admin updates
    const getSocketUrl = () => {
      let envUrl = import.meta.env.VITE_API_URL;
      if (!envUrl) {
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          envUrl = 'https://workshop-9be7.onrender.com';
        } else {
          envUrl = 'http://localhost:5001';
        }
      }
      let url = envUrl.trim().replace(/\/+$/, '');
      return url.replace(/\/api\/?$/, '');
    };

    const socket = io(getSocketUrl(), { transports: ['polling', 'websocket'], reconnection: true });

    socket.on('attendance_updated', (data) => {
      if (data && data.presentCount !== undefined) {
        setSessionData(prev => ({ ...prev, presentCount: data.presentCount }));
      }
    });

    socket.on('attendance_session_changed', (data) => {
      if (data) {
        setSessionData(prev => ({
          ...prev,
          status: data.status,
          sessionName: data.session?.sessionName || prev.sessionName,
          presentCount: data.session?.presentCount !== undefined ? data.session.presentCount : (data.status === 'ACTIVE' ? prev.presentCount : 0)
        }));
      }
    });

    socket.on('volunteer_presence_updated', (data) => {
      if (data && data.volunteersOnline !== undefined) {
        setSessionData(prev => ({ ...prev, volunteersOnline: data.volunteersOnline }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleStartAttendanceSession = async () => {
    try {
      setSettingsMsg('');
      const res = await startAttendanceSessionApi(sessionNameInput);
      if (res.data?.success) {
        setSettingsMsg('✓ Attendance session started! Status: ACTIVE');
        fetchSessionAndVolunteers();
      }
    } catch (err) {
      setSettingsMsg('✗ Failed to start attendance session: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCloseAttendanceSession = async () => {
    try {
      setSettingsMsg('');
      const res = await closeAttendanceSessionApi();
      if (res.data?.success) {
        setSettingsMsg('✓ Attendance session closed! Status: CLOSED');
        fetchSessionAndVolunteers();
      }
    } catch (err) {
      setSettingsMsg('✗ Failed to close attendance session: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateVolunteerSubmit = async (e) => {
    e.preventDefault();
    if (!newVolForm.email || !newVolForm.password || !newVolForm.name) return;
    try {
      const res = await createVolunteerApi(newVolForm);
      if (res.data?.success) {
        setNewVolForm({ name: '', email: '', password: '' });
        setSettingsMsg('✓ Volunteer account created successfully!');
        fetchSessionAndVolunteers();
      }
    } catch (err) {
      setSettingsMsg('✗ Failed to create volunteer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleVolStatus = async (volId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      await updateVolunteerStatusApi(volId, { status: nextStatus });
      fetchSessionAndVolunteers();
    } catch (err) {
      alert('Failed to update volunteer status.');
    }
  };

  const handleDeleteVol = async (volId) => {
    if (!window.confirm('Are you sure you want to delete this volunteer account?')) return;
    try {
      await deleteVolunteerApi(volId);
      fetchSessionAndVolunteers();
    } catch (err) {
      alert('Failed to delete volunteer account.');
    }
  };

  const handleSaveRegistrationSettings = async () => {
    try {
      setSettingsMsg('');
      const res = await updateRegistrationSettingsApi({
        registrationOpen: registrationOpenState,
        registrationLimit: parseInt(registrationLimitInput, 10)
      });
      if (res.data.success) {
        setSettingsMsg('✓ Registration settings saved successfully!');
        fetchAllData();
      }
    } catch (err) {
      setSettingsMsg('✗ Failed to save registration settings: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await ensureAdminAuthToken();
      const [dashboardRes, regRes] = await Promise.all([
        getAdminDashboard().catch(err => ({ data: { success: false, stats: {} } })),
        getAdminRegistrations({
          q: searchQuery,
          department: deptFilter,
          year: yearFilter,
          paymentStatus: statusFilter
        }).catch(err => ({ data: { success: false, registrations: [] } }))
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
        setEventSettings(prev => ({
          ...prev,
          maxSpots: s.capacity || 200,
          registrationOpen: s.registrationOpen !== false
        }));
        setRegistrationLimitInput(s.registrationLimit !== undefined ? s.registrationLimit : s.capacity || 200);
        setRegistrationOpenState(s.registrationOpen !== false);
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
      const newStatus = !eventSettings.registrationOpen;
      await updateEventConfig({ registrationOpen: newStatus });
      setEventSettings(prev => ({ ...prev, registrationOpen: newStatus }));
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

  // Mark Individual Student Attendance in Roster
  const handleToggleAttendance = async (registrationId, currentStatus) => {
    try {
      const newStatus = currentStatus ? 'ABSENT' : 'PRESENT';
      await markAdminAttendance(registrationId, newStatus);
      fetchAllData();
    } catch (err) {
      alert('Failed to update attendance status.');
    }
  };

  // Manual Scan/Mark Reg No
  const handleManualMarkSubmit = async (e) => {
    e.preventDefault();
    if (!manualScanInput.trim()) return;
    const target = registrations.find(
      r => r.registrationId?.toLowerCase() === manualScanInput.trim().toLowerCase() ||
           r.studentId?.toLowerCase() === manualScanInput.trim().toLowerCase()
    );
    if (target) {
      await handleToggleAttendance(target.registrationId, target.attendance);
      setManualScanInput('');
    } else {
      alert(`No student found matching "${manualScanInput}"`);
    }
  };

  // Save Event Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateEventConfig({
        eventName: eventSettings.eventName,
        venue: eventSettings.venue,
        date: eventSettings.eventDate,
        capacity: parseInt(eventSettings.maxSpots) || 200,
        registrationFee: parseInt(eventSettings.fee) || 300,
        paymentUPI: eventSettings.upiId,
        registrationOpen: eventSettings.registrationOpen
      });
      setSettingsOpen(false);
      alert('Event configuration saved successfully!');
      fetchAllData();
    } catch (err) {
      alert('Failed to save event settings.');
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

  // Safe fallbacks for data lists & stats
  const safeRegistrations = Array.isArray(registrations) ? registrations : [];
  const safeStats = stats || {};

  // Attendance stats calculation
  const presentCount = safeRegistrations.filter(r => r && (r.attendance === true || r.attendance === 'PRESENT')).length;
  const absentCount = Math.max(0, safeRegistrations.length - presentCount);
  const attendanceRate = safeRegistrations.length > 0 ? ((presentCount / safeRegistrations.length) * 100).toFixed(0) : 0;

  // Filtered roster for Attendance modal
  const filteredAttendanceRoster = safeRegistrations.filter(r => {
    if (!r) return false;
    if (attendanceTab === 'PRESENT') return r.attendance === true || r.attendance === 'PRESENT';
    if (attendanceTab === 'ABSENT') return r.attendance !== true && r.attendance !== 'PRESENT';
    return true;
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0F172A 0%, #070D1B 100%)',
      color: '#F8FAFC',
      fontFamily: "'Inter', sans-serif",
      padding: '24px 32px'
    }}>
      
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* ==========================================================================
           TOP HEADER & CONTROL CENTER BANNER
           ========================================================================== */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '28px 36px',
          marginBottom: '28px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              ADMIN CONTROL CENTER
            </h1>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '4px' }}>
              IEEE KARE • INTELLIGENT YIELD PREDICTION & AI/ML WORKSHOP
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            
            {/* + Direct Registration Button */}
            <button
              onClick={() => setDirectRegOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
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
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={16} /> + Direct Registration
            </button>

            {/* Attendance Sessions Button */}
            <button
              onClick={() => setAttendanceModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#F8FAFC',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '10px 18px',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <UserCheck size={16} color="#38BDF8" /> Attendance Sessions
            </button>

            {/* Event Settings Button */}
            <button
              onClick={() => setSettingsOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#F8FAFC',
                border: '1px solid rgba(255, 255, 255, 0.12)',
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
              <Settings size={16} color="#38BDF8" /> Event Settings
            </button>

            {/* QR Code Button */}
            <button
              onClick={() => setQrModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#F8FAFC',
                border: '1px solid rgba(255, 255, 255, 0.12)',
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
              <QrCode size={16} color="#38BDF8" /> QR Code Scanner
            </button>

            {/* STATUS: OPEN / CLOSED Badge Toggle Button */}
            <button
              onClick={handleToggleStatus}
              style={{
                background: eventSettings.registrationOpen ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: eventSettings.registrationOpen ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                color: eventSettings.registrationOpen ? '#4ADE80' : '#F87171',
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
              {eventSettings.registrationOpen ? <Unlock size={14} /> : <Lock size={14} />}
              STATUS: {eventSettings.registrationOpen ? 'OPEN' : 'CLOSED'}
            </button>

            {/* Logout Icon Button */}
            <button
              onClick={logout}
              title="Logout from Admin"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94A3B8',
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
           METRIC STAT CARDS ROW
           ========================================================================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '28px'
        }}>
          
          {/* Card 1: TOTAL REGISTRATIONS */}
          <div style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                TOTAL REGISTRATIONS
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FFFFFF', marginTop: '6px' }}>
                {safeStats.totalRegistrations || 0}
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '6px', display: 'flex', gap: '12px' }}>
                <span style={{ color: '#4ADE80', fontWeight: 700 }}>Approved: {safeStats.confirmedRegistrations || 0}</span>
                <span style={{ color: '#FB923C', fontWeight: 700 }}>Pending: {safeStats.pendingPayments || 0}</span>
              </div>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: '50%', color: '#38BDF8' }}>
              <Users size={22} />
            </div>
          </div>

          {/* Card 2: REMAINING SPOTS */}
          <div style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                REMAINING SPOTS
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FFFFFF', marginTop: '6px' }}>
                {safeStats.remainingSeats !== undefined ? safeStats.remainingSeats : 200} <span style={{ fontSize: '1.2rem', color: '#64748B', fontWeight: 700 }}>/ {safeStats.capacity || 200}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginTop: '6px' }}>
                Cap: {safeStats.capacity || 200} Participants
              </div>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: '50%', color: '#38BDF8' }}>
              <Clock size={22} />
            </div>
          </div>

          {/* Card 3: TOTAL FEE REVENUE */}
          <div style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                TOTAL FEE REVENUE
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#4ADE80', marginTop: '6px' }}>
                ₹{(safeStats.totalRevenue || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginTop: '6px' }}>
                Verified Payments @ ₹250/student
              </div>
            </div>
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', padding: '12px', borderRadius: '50%', color: '#4ADE80' }}>
              <IndianRupee size={22} />
            </div>
          </div>

          {/* Card 4: TODAY'S SUBMISSIONS */}
          <div style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                TODAY'S SUBMISSIONS
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '6px' }}>
                +{(safeStats.todaySubmissions || 0)}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginTop: '6px' }}>
                Live submission rate
              </div>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: '50%', color: '#38BDF8' }}>
              <TrendingUp size={22} />
            </div>
          </div>

        </div>

        {/* Toast Notification */}
        {settingsMsg && (
          <div style={{
            background: settingsMsg.startsWith('✓') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: settingsMsg.startsWith('✓') ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            color: settingsMsg.startsWith('✓') ? '#4ADE80' : '#F87171',
            borderRadius: '16px',
            padding: '14px 20px',
            marginBottom: '28px',
            fontWeight: 800,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{settingsMsg}</span>
            <button onClick={() => setSettingsMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 900 }}>✕</button>
          </div>
        )}

        {/* ==========================================================================
           REGISTRATION, ATTENDANCE & VOLUNTEER CONTROL CENTER
           ========================================================================== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>

          {/* 1. REGISTRATION SETTINGS CARD */}
          <div style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} color="#F97316" /> Registration Settings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#94A3B8' }}>Registration Status:</span>
                <button
                  type="button"
                  onClick={() => setRegistrationOpenState(!registrationOpenState)}
                  style={{
                    background: registrationOpenState ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: registrationOpenState ? '#4ADE80' : '#F87171',
                    border: registrationOpenState ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {registrationOpenState ? <Unlock size={14} /> : <Lock size={14} />}
                  REGISTRATION: {registrationOpenState ? 'ON (OPEN)' : 'OFF (CLOSED)'}
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Registration Limit:
                </label>
                <input
                  type="number"
                  value={registrationLimitInput}
                  onChange={(e) => setRegistrationLimitInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.9rem', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#94A3B8' }}>Current Registrations: </span>
                  <strong style={{ color: '#FFF' }}>{safeStats.totalRegistrations || 0}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8' }}>Remaining: </span>
                  <strong style={{ color: '#4ADE80' }}>{Math.max(0, registrationLimitInput - (safeStats.totalRegistrations || 0))}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveRegistrationSettings}
                style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', textAlign: 'center' }}
              >
                Save Registration Settings
              </button>
            </div>
          </div>

          {/* 2. ATTENDANCE MANAGEMENT CARD (Replaces old ATTENDANCE SETTINGS) */}
          <div style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={18} color="#38BDF8" /> ATTENDANCE MANAGEMENT
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Status Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#94A3B8' }}>Attendance Status:</span>
                <span style={{
                  background: sessionData.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: sessionData.status === 'ACTIVE' ? '#4ADE80' : '#F87171',
                  border: sessionData.status === 'ACTIVE' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  fontWeight: 900,
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {sessionData.status === 'ACTIVE' ? <Unlock size={14} /> : <Lock size={14} />}
                  {sessionData.status === 'ACTIVE' ? 'ACTIVE' : 'CLOSED'}
                </span>
              </div>

              {/* Active Session Info Box */}
              {sessionData.status === 'ACTIVE' ? (
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                    LIVE ATTENDANCE
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Present: </span>
                      <strong style={{ color: '#4ADE80', fontSize: '1.1rem' }}>{sessionData.presentCount}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Status: </span>
                      <strong style={{ color: '#4ADE80' }}>ACTIVE</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#94A3B8' }}>Volunteers Online: </span>
                      <strong style={{ color: '#38BDF8' }}>{sessionData.volunteersOnline}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#94A3B8' }}>Current Attendance:</span>
                    <strong style={{ color: '#FFF' }}>{sessionData.presentCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#94A3B8' }}>Last Session Started:</span>
                    <strong style={{ color: '#38BDF8' }}>
                      {sessionData.startedAt ? new Date(sessionData.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (sessionData.lastSessionStartedAt ? new Date(sessionData.lastSessionStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--')}
                    </strong>
                  </div>
                </div>
              )}

              {/* Start / Close Session Form */}
              {sessionData.status === 'CLOSED' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1' }}>
                    Session Name (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IEEE Workshop Attendance"
                    value={sessionNameInput}
                    onChange={(e) => setSessionNameInput(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.88rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleStartAttendanceSession}
                    style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'center', boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)' }}
                  >
                    START ATTENDANCE
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleCloseAttendanceSession}
                    style={{ flex: 1, background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', textAlign: 'center' }}
                  >
                    CLOSE ATTENDANCE
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceModalOpen(true)}
                    style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '12px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    VIEW ATTENDANCE
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3. VOLUNTEER MANAGEMENT CARD (Replaces old ATTENDANCE TEAM MANAGEMENT) */}
          <div style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} color="#4ADE80" /> VOLUNTEER MANAGEMENT
            </h3>

            {/* List of Registered Volunteers */}
            <div style={{ marginBottom: '16px', maxHeight: '170px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Volunteers List ({volunteersList.length})
                </span>
                <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 700 }}>
                  Online: {sessionData.volunteersOnline}
                </span>
              </div>

              {volunteersList.length === 0 ? (
                <p style={{ color: '#64748B', fontSize: '0.82rem', marginTop: '6px' }}>No volunteer accounts created yet. Add one below.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {volunteersList.map((vol) => (
                    <div key={vol._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.82rem' }}>
                      <div>
                        <strong style={{ color: '#FFF' }}>{vol.name}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{vol.email}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleVolStatus(vol._id, vol.status)}
                          style={{
                            background: vol.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: vol.status === 'ACTIVE' ? '#4ADE80' : '#F87171',
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {vol.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVol(vol._id)}
                          style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: 'none', padding: '4px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Volunteer Form */}
            <form onSubmit={handleCreateVolunteerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Volunteer Name"
                value={newVolForm.name}
                onChange={(e) => setNewVolForm(prev => ({ ...prev, name: e.target.value }))}
                required
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.85rem' }}
              />
              <input
                type="email"
                placeholder="Volunteer Email / Username"
                value={newVolForm.email}
                onChange={(e) => setNewVolForm(prev => ({ ...prev, email: e.target.value }))}
                required
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.85rem' }}
              />
              <input
                type="password"
                placeholder="Set Volunteer Password"
                value={newVolForm.password}
                onChange={(e) => setNewVolForm(prev => ({ ...prev, password: e.target.value }))}
                required
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.85rem' }}
              />
              <button
                type="submit"
                style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '10px', borderRadius: '10px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                + Add Volunteer Account
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminControlCenter;
