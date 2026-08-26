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

  // Event Settings State (Matching Photo 1)
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

  // Attendance Modal State (Matching Photo 2)
  const [attendanceTab, setAttendanceTab] = useState('ALL'); // ALL, PRESENT, ABSENT
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

  const fetchSessionAndVolunteers = async () => {
    try {
      const [sessionRes, volRes, dashboardRes] = await Promise.all([
        getCurrentAttendanceSessionApi().catch(() => ({ data: {} })),
        getVolunteersApi().catch(() => ({ data: {} })),
        getAdminDashboard().catch(() => ({ data: {} }))
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

      if (dashboardRes.data?.success && dashboardRes.data.stats) {
        const st = dashboardRes.data.stats;
        setRegistrationLimitInput(st.registrationLimit !== undefined ? st.registrationLimit : st.capacity || 200);
        setRegistrationOpenState(st.registrationOpen !== false);
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
           TOP HEADER & CONTROL CENTER BANNER (Dark Website Theme)
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
           METRIC STAT CARDS ROW (Dark Theme Glassmorphic Cards)
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

        {/* Feedback / Toast message for settings updates */}
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
           REGISTRATION, ATTENDANCE & TEAM MANAGEMENT CONTROL CENTER
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

        {/* ==========================================================================
           SEARCH, FILTER & ACTION BAR
           ========================================================================== */}
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px 28px', marginBottom: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
              STUDENT REGISTRATION RECORDS <span style={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600 }}>({safeRegistrations.length} Total)</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
              <Search size={18} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by Participant ID, Name, Roll No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFFFFF', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#F8FAFC', fontSize: '0.88rem', fontWeight: 600 }}>
              <option value="" style={{ background: '#0F172A' }}>Status: All</option>
              <option value="PAYMENT_VERIFIED" style={{ background: '#0F172A' }}>Approved</option>
              <option value="PAYMENT_SUBMITTED" style={{ background: '#0F172A' }}>Pending Verification</option>
              <option value="REJECTED" style={{ background: '#0F172A' }}>Rejected</option>
            </select>

            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#F8FAFC', fontSize: '0.88rem', fontWeight: 600 }}>
              <option value="" style={{ background: '#0F172A' }}>Dept: All</option>
              <option value="CSE" style={{ background: '#0F172A' }}>CSE</option>
              <option value="AI & DS" style={{ background: '#0F172A' }}>AI & DS</option>
              <option value="IT" style={{ background: '#0F172A' }}>IT</option>
              <option value="ECE" style={{ background: '#0F172A' }}>ECE</option>
              <option value="EEE" style={{ background: '#0F172A' }}>EEE</option>
              <option value="Mechanical" style={{ background: '#0F172A' }}>Mechanical</option>
              <option value="Civil" style={{ background: '#0F172A' }}>Civil</option>
            </select>

            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#F8FAFC', fontSize: '0.88rem', fontWeight: 600 }}>
              <option value="" style={{ background: '#0F172A' }}>Year: All</option>
              <option value="1st Year" style={{ background: '#0F172A' }}>1st Year</option>
              <option value="2nd Year" style={{ background: '#0F172A' }}>2nd Year</option>
              <option value="3rd Year" style={{ background: '#0F172A' }}>3rd Year</option>
              <option value="4th Year" style={{ background: '#0F172A' }}>4th Year</option>
            </select>

            <button onClick={() => setDirectRegOpen(true)} style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', color: '#FFFFFF', border: 'none', padding: '10px 18px', borderRadius: '9999px', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <Plus size={15} /> + DIRECT REGISTRATION
            </button>

            <button onClick={handleBulkVerify} style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '10px 16px', borderRadius: '9999px', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <CheckCircle2 size={15} /> VERIFY ALL
            </button>

            <button onClick={handleExportCSV} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '10px 16px', borderRadius: '9999px', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <FileSpreadsheet size={15} /> Excel / CSV
            </button>

            <button onClick={handleDeleteAll} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 16px', borderRadius: '9999px', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <Trash2 size={15} /> DELETE ALL
            </button>
          </div>
        </div>

        {/* ==========================================================================
           STUDENT REGISTRATIONS DATA TABLE (Dark Glassmorphic Table)
           ========================================================================== */}
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
              ) : safeRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No student registrations found.
                  </td>
                </tr>
              ) : (
                safeRegistrations.map((reg, index) => {
                  const rawProof = reg.payment?.upiScreenshotUrl || reg.payment?.screenshotUrl || reg.upiScreenshotUrl || reg.screenshotUrl || '';
                  const isVerified = reg.status === 'PAYMENT_VERIFIED' || reg.paymentStatus === 'VERIFIED';
                  const isRejected = reg.status === 'REJECTED' || reg.paymentStatus === 'REJECTED';

                  const proofUrl = rawProof
                    ? (rawProof.startsWith('http://') || rawProof.startsWith('https://') || rawProof.startsWith('data:'))
                      ? rawProof
                      : rawProof.startsWith('/')
                        ? rawProof
                        : `/${rawProof}`
                    : '';

                  return (
                    <tr key={reg._id || index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '16px' }}>
                        <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 800, fontSize: '0.8rem', padding: '6px 12px', borderRadius: '9999px', display: 'inline-block' }}>
                          {reg.registrationId}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>#{index + 1}</div>
                      </td>

                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.92rem' }}>{reg.fullName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#38BDF8', marginTop: '2px' }}>{reg.email}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{reg.phone}</div>
                      </td>

                      <td style={{ padding: '16px', fontWeight: 800, fontFamily: 'monospace', color: '#F8FAFC' }}>
                        {reg.studentId}
                      </td>

                      <td style={{ padding: '16px', fontWeight: 800, fontFamily: 'monospace', color: '#38BDF8' }}>
                        {reg.payment?.transactionId || 'N/A'}
                      </td>

                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{reg.department} ({reg.year})</div>
                        <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Sec: <strong style={{ color: '#FFF' }}>{reg.section || '24S01'}</strong> • {reg.residency || 'Day Scholar'}</div>
                      </td>

                      <td style={{ padding: '16px' }}>
                        {proofUrl ? (
                          <div
                            onClick={() => setSelectedReg(reg)}
                            title="Click to view payment proof"
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              border: '2px solid #38BDF8',
                              cursor: 'pointer',
                              background: '#000',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <img
                              src={proofUrl}
                              alt="Payment Proof"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.parentNode) {
                                  e.target.parentNode.innerHTML = '<span style="font-size:0.65rem;color:#38BDF8;font-weight:800;">PROOF</span>';
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedReg(reg)}
                            title="Click to review/attach payment proof"
                            style={{
                              background: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              color: '#38BDF8',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '6px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={13} /> View Proof
                          </button>
                        )}
                      </td>

                      <td style={{ padding: '16px' }}>
                        <span style={{ background: isVerified ? 'rgba(34, 197, 94, 0.15)' : isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)', color: isVerified ? '#4ADE80' : isRejected ? '#F87171' : '#FB923C', border: isVerified ? '1px solid rgba(34, 197, 94, 0.3)' : isRejected ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(249, 115, 22, 0.3)', fontWeight: 800, fontSize: '0.78rem', padding: '5px 12px', borderRadius: '9999px', display: 'inline-block' }}>
                          {isVerified ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                        </span>
                      </td>

                      <td style={{ padding: '16px', color: '#94A3B8', fontSize: '0.8rem' }}>
                        {new Date(reg.createdAt).toLocaleDateString()}<br />
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {new Date(reg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button onClick={() => setSelectedReg(reg)} title="Review Payment" style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38BDF8', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteRegistration(reg.registrationId || reg._id)} title="Delete Record" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
         MODAL 1: PAYMENT APPROVAL & CLOUDINARY RECEIPT PREVIEW
         ========================================================================== */}
      {selectedReg && (
        <PaymentApprovalModal
          isOpen={!!selectedReg}
          onClose={() => setSelectedReg(null)}
          registrationItem={selectedReg}
          onRefresh={fetchAllData}
        />
      )}

      {/* ==========================================================================
         MODAL 2: VENUE QR SCANNER
         ========================================================================== */}
      {qrModalOpen && (
        <QRScannerModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          onCheckInSuccess={fetchAllData}
        />
      )}

      {/* ==========================================================================
         MODAL 3: ATTENDANCE SESSIONS MODAL (Dark Theme)
         ========================================================================== */}
      {attendanceModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" style={{ maxWidth: '1000px', width: '95%', borderRadius: '28px', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#F8FAFC', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: 0, textTransform: 'uppercase' }}>
                  ATTENDANCE SYSTEM
                </h2>
                <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Scan venue QR codes or manually mark student attendance records.
                </p>
              </div>
              <button onClick={() => setAttendanceModalOpen(false)} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} color="#94A3B8" />
              </button>
            </div>

            {/* Top Grid: Left Camera Scan Box + Right Search & Stats Box */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              
              {/* Left Box: Camera Live View */}
              <div style={{ background: '#0B132B', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                    Integrated Camera Scanner
                  </span>
                  <button
                    onClick={() => setCameraPaused(!cameraPaused)}
                    style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#FFF', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {cameraPaused ? 'Resume Camera' : 'Pause Camera'}
                  </button>
                </div>

                <div style={{ background: '#020617', height: '180px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.2)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <Camera size={48} color="#38BDF8" style={{ opacity: 0.8 }} />
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', background: 'rgba(0,0,0,0.75)', padding: '6px', borderRadius: '8px', fontSize: '0.72rem', color: '#94A3B8', textAlign: 'center' }}>
                    Continuously decodes QR codes • 2.5s Cool-Down Protection
                  </div>
                </div>
              </div>

              {/* Right Box: Search, Mark & Live Stats */}
              <div style={{ background: '#0B132B', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '20px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                  BARCODE / REG NO SEARCH
                </span>

                <form onSubmit={handleManualMarkSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="Type or scan Reg No / QR payload..."
                    value={manualScanInput}
                    onChange={(e) => setManualScanInput(e.target.value)}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0F172A', color: '#FFF', fontSize: '0.88rem' }}
                  />
                  <button type="submit" style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', color: '#FFF', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
                    MARK
                  </button>
                </form>

                {/* Stats Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center', marginBottom: '16px', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '12px', borderRadius: '14px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>PRESENT</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4ADE80' }}>{presentCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>ABSENT</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F87171' }}>{absentCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>RATE</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8' }}>{attendanceRate}%</div>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setAttendanceTab('PRESENT')} style={{ flex: 1, padding: '6px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer', background: attendanceTab === 'PRESENT' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)', color: attendanceTab === 'PRESENT' ? '#4ADE80' : '#94A3B8' }}>
                    PRESENT ({presentCount})
                  </button>
                  <button onClick={() => setAttendanceTab('ABSENT')} style={{ flex: 1, padding: '6px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer', background: attendanceTab === 'ABSENT' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)', color: attendanceTab === 'ABSENT' ? '#F87171' : '#94A3B8' }}>
                    ABSENT ({absentCount})
                  </button>
                  <button onClick={() => setAttendanceTab('ALL')} style={{ flex: 1, padding: '6px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer', background: attendanceTab === 'ALL' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)', color: attendanceTab === 'ALL' ? '#38BDF8' : '#94A3B8' }}>
                    ALL ({registrations.length})
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Table: SESSION PARTICIPANT ROSTER */}
            <div style={{ background: '#0B132B', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '20px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '14px', textTransform: 'uppercase' }}>
                SESSION PARTICIPANT ROSTER
              </h4>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>STUDENT NAME</th>
                    <th style={{ padding: '10px 12px' }}>REG NUMBER</th>
                    <th style={{ padding: '10px 12px' }}>DEPT / YEAR</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>ATTENDANCE STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendanceRoster.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                        No participants found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendanceRoster.map((r, i) => (
                      <tr key={r._id || i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#FFFFFF' }}>
                          {r.fullName}<br />
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 400 }}>{r.email}</span>
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8' }}>
                          {r.studentId}
                        </td>
                        <td style={{ padding: '12px', color: '#CBD5E1', fontWeight: 600 }}>
                          {r.department} ({r.year})
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleAttendance(r.registrationId, r.attendance)}
                            style={{
                              background: r.attendance ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: r.attendance ? '#4ADE80' : '#F87171',
                              border: r.attendance ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                              padding: '6px 16px',
                              borderRadius: '9999px',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            {r.attendance ? '✓ PRESENT' : '✗ ABSENT'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================================================
         MODAL 4: EVENT SETTINGS MODAL (Dark Website Theme)
         ========================================================================== */}
      {settingsOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" style={{ maxWidth: '640px', width: '95%', borderRadius: '28px', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#F8FAFC', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  🔒 PERMANENT / READ-ONLY CONFIG
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: '4px 0 0 0' }}>
                  EVENT SETTINGS
                </h3>
              </div>
              <button onClick={() => setSettingsOpen(false)} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color="#94A3B8" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings}>
              {/* Event Name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  EVENT NAME
                </label>
                <input
                  type="text"
                  value={eventSettings.eventName}
                  onChange={(e) => setEventSettings({ ...eventSettings, eventName: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF' }}
                />
              </div>

              {/* Group / Organized By + Event Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                    GROUP / ORGANIZED BY
                  </label>
                  <input
                    type="text"
                    value={eventSettings.organizedBy}
                    onChange={(e) => setEventSettings({ ...eventSettings, organizedBy: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.88rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                    EVENT DATE
                  </label>
                  <input
                    type="text"
                    value={eventSettings.eventDate}
                    onChange={(e) => setEventSettings({ ...eventSettings, eventDate: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.88rem', fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Venue + Fee */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                    VENUE
                  </label>
                  <input
                    type="text"
                    value={eventSettings.venue}
                    onChange={(e) => setEventSettings({ ...eventSettings, venue: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.88rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                    REGISTRATION FEE (₹)
                  </label>
                  <input
                    type="number"
                    value={eventSettings.fee}
                    onChange={(e) => setEventSettings({ ...eventSettings, fee: parseInt(e.target.value) || 300 })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.88rem', fontWeight: 800 }}
                  />
                </div>
              </div>

              {/* Official UPI VPA ID */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  OFFICIAL UPI VPA ID
                </label>
                <input
                  type="text"
                  value={eventSettings.upiId}
                  onChange={(e) => setEventSettings({ ...eventSettings, upiId: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', fontSize: '0.88rem', fontWeight: 700, color: '#38BDF8' }}
                />
              </div>

              {/* Volunteer Passcode */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                    VOLUNTEER 6-DIGIT PASSCODE
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 700 }}>
                    USED FOR URL/ATTEND VOLUNTEER SCANNER ACCESS
                  </span>
                </div>
                <input
                  type="text"
                  value={eventSettings.volunteerPasscode}
                  onChange={(e) => setEventSettings({ ...eventSettings, volunteerPasscode: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '1rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.1em' }}
                />
              </div>

              {/* Maximum Spots */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  MAXIMUM SPOTS
                </label>
                <input
                  type="number"
                  value={eventSettings.maxSpots}
                  onChange={(e) => setEventSettings({ ...eventSettings, maxSpots: parseInt(e.target.value) || 200 })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.95rem', fontWeight: 800 }}
                />
              </div>

              {/* Registration Status Toggle Bar */}
              <div style={{ background: '#0B132B', borderRadius: '16px', padding: '14px 20px', marginBottom: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF' }}>Registration Status</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Toggle to manually open or close student registrations</div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  style={{
                    background: eventSettings.registrationOpen ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: eventSettings.registrationOpen ? '#4ADE80' : '#F87171',
                    border: eventSettings.registrationOpen ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  STATUS: {eventSettings.registrationOpen ? 'OPEN' : 'CLOSED'}
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#94A3B8', padding: '12px 24px', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', color: '#FFFFFF', border: 'none', padding: '12px 32px', borderRadius: '9999px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)' }}
                >
                  Save Configuration
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ==========================================================================
         MODAL 5: DIRECT REGISTRATION MODAL
         ========================================================================== */}
      {directRegOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" style={{ maxWidth: '520px', borderRadius: '24px', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#F8FAFC', padding: '28px' }}>
            <button onClick={() => setDirectRegOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
              <X size={24} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '4px' }}>
              Direct Student Registration
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Bypass Google Sign-In & Payment verification for offline / spot registration.
            </p>

            {directFormError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {directFormError}
              </div>
            )}

            <form onSubmit={handleDirectSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                  <input type="text" required value={directForm.fullName} onChange={(e) => setDirectForm({ ...directForm, fullName: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>Email Address *</label>
                  <input type="email" required value={directForm.email} onChange={(e) => setDirectForm({ ...directForm, email: e.target.value })} placeholder="student@klu.ac.in" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.88rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>Student Roll No / ID *</label>
                  <input type="text" required value={directForm.studentId} onChange={(e) => setDirectForm({ ...directForm, studentId: e.target.value })} placeholder="e.g. 2400030123" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>Phone Number *</label>
                  <input type="tel" required value={directForm.phone} onChange={(e) => setDirectForm({ ...directForm, phone: e.target.value })} placeholder="9876543210" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.88rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>Dept</label>
                  <select value={directForm.department} onChange={(e) => setDirectForm({ ...directForm, department: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.85rem' }}>
                    <option value="CSE" style={{ background: '#0F172A' }}>CSE</option>
                    <option value="AI & DS" style={{ background: '#0F172A' }}>AI & DS</option>
                    <option value="IT" style={{ background: '#0F172A' }}>IT</option>
                    <option value="ECE" style={{ background: '#0F172A' }}>ECE</option>
                    <option value="EEE" style={{ background: '#0F172A' }}>EEE</option>
                    <option value="Mechanical" style={{ background: '#0F172A' }}>Mechanical</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>Year</label>
                  <select value={directForm.year} onChange={(e) => setDirectForm({ ...directForm, year: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.85rem' }}>
                    <option value="1st Year" style={{ background: '#0F172A' }}>1st Year</option>
                    <option value="2nd Year" style={{ background: '#0F172A' }}>2nd Year</option>
                    <option value="3rd Year" style={{ background: '#0F172A' }}>3rd Year</option>
                    <option value="4th Year" style={{ background: '#0F172A' }}>4th Year</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>Section</label>
                  <input type="text" value={directForm.section} onChange={(e) => setDirectForm({ ...directForm, section: e.target.value })} placeholder="24S01" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#0B132B', color: '#FFF', fontSize: '0.85rem' }} />
                </div>
              </div>

              <button type="submit" disabled={directFormLoading} style={{ width: '100%', background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', color: '#FFFFFF', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)' }}>
                {directFormLoading ? 'Processing Registration...' : 'Complete & Confirm Spot (₹300 Paid)'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminControlCenter;
