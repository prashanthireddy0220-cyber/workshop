import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdminDashboard } from '../../services/api';
import AdminLoginPage from './AdminLoginPage';
import AdminLayout from './AdminLayout';
import QRScannerModal from './QRScannerModal';

// Pages
import DashboardOverview from './pages/DashboardOverview';
import WorkshopManagement from './pages/WorkshopManagement';
import EventManagement from './pages/EventManagement';
import AttendanceManagement from './pages/AttendanceManagement';
import StudentManagement from './pages/StudentManagement';
import CertificateManagement from './pages/CertificateManagement';
import GalleryManagement from './pages/GalleryManagement';
import AnnouncementManagement from './pages/AnnouncementManagement';
import WebsiteContentManagement from './pages/WebsiteContentManagement';
import AdminSettings from './pages/AdminSettings';

const AdminPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await getAdminDashboard();
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentRegistrations(res.data.recentRegistrations || []);
      }
    } catch (err) {
      console.error('[Admin Portal Dashboard Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  // Handle URL hash changes like #workshops, #attendance, etc.
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'workshops', 'events', 'attendance', 'students', 'certificates', 'gallery', 'announcements', 'content', 'settings'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = `#${tabId}`;
  };

  // 1. Unauthenticated / Non-Admin Gate -> Show Admin Login Page
  if (!user || user.role !== 'admin') {
    return <AdminLoginPage />;
  }

  // Titles Mapping for Header
  const titleMap = {
    dashboard: 'Dashboard Overview',
    workshops: 'Workshop Management',
    events: 'Event & Schedule Management',
    attendance: 'Venue Attendance Management',
    students: 'Student & Participant Directory',
    certificates: 'Certificate Issuance & Tracking',
    gallery: 'Photo Gallery Management',
    announcements: 'Announcements & Broadcasts',
    content: 'Live Website Content & Config',
    settings: 'Admin Settings & Security'
  };

  // Render Active Section View
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview stats={stats} recentRegistrations={recentRegistrations} onNavigateTab={handleSelectTab} />;
      case 'workshops':
        return <WorkshopManagement />;
      case 'events':
        return <EventManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'students':
        return <StudentManagement />;
      case 'certificates':
        return <CertificateManagement />;
      case 'gallery':
        return <GalleryManagement />;
      case 'announcements':
        return <AnnouncementManagement />;
      case 'content':
        return <WebsiteContentManagement />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <DashboardOverview stats={stats} recentRegistrations={recentRegistrations} onNavigateTab={handleSelectTab} />;
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      title={titleMap[activeTab] || 'Admin Portal'}
      onRefresh={fetchDashboardData}
      onLaunchScanner={() => setQrModalOpen(true)}
    >
      {renderActiveView()}

      {/* QR Scanner Modal */}
      {qrModalOpen && (
        <QRScannerModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          onCheckInSuccess={fetchDashboardData}
        />
      )}
    </AdminLayout>
  );
};

export default AdminPortal;
