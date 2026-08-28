import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutSection from './components/AboutSection';
import TopicsSection from './components/TopicsSection';
import ScheduleSection from './components/ScheduleSection';
import EventInfoSection from './components/EventInfoSection';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import RegistrationLockModal from './components/registration/RegistrationLockModal';
import ParticipantDashboard from './components/ParticipantDashboard';
import AdminPortal from './components/admin/AdminPortal';
import AttendanceScannerPage from './components/attendance/AttendanceScannerPage';
import PageLoader from './components/PageLoader';

import RegistrationSection from './components/registration/RegistrationSection';
import TokenPassPage from './components/registration/TokenPassPage';

const AppContent = () => {
  const { user, registrationState, refreshRegistration, loading: authLoading } = useAuth();
  
  // Page Transition Loading state
  const [pageLoading, setPageLoading] = useState(true);

  // Check URL pathname/hash to determine route
  const isAdminRoute = window.location.pathname.includes('admin') || window.location.hash.includes('admin');
  const isAttendanceRoute = window.location.pathname.startsWith('/attend') || window.location.hash.startsWith('#/attend');
  const isTokenRoute = window.location.pathname.startsWith('/registration/token') || window.location.pathname.startsWith('/token');
  const isMyRegistrationsRoute = window.location.pathname.startsWith('/my-registrations') || window.location.pathname.startsWith('/registration');

  // Initial site load transition
  useEffect(() => {
    if (isAdminRoute || isAttendanceRoute) {
      setPageLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      setPageLoading(false);
      if (isMyRegistrationsRoute && !isTokenRoute) {
        if (user) {
          setDashboardOpen(true);
        } else {
          setAuthModalOpen(true);
        }
      }
    }, 4300); // 4.3s display + 0.7s smooth fade out = 5 seconds total
    return () => clearTimeout(timer);
  }, [user, isMyRegistrationsRoute, isTokenRoute, isAdminRoute]);

  // Modal visibility states for public student view
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // Reusable trigger transition helper
  const triggerTransition = (actionCallback) => {
    setPageLoading(true);
    setTimeout(() => {
      if (actionCallback) actionCallback();
      setPageLoading(false);
    }, 400);
  };

  const handleRegisterClick = () => {
    triggerTransition(() => {
      if (!user) {
        setAuthModalOpen(true);
      } else if (
        registrationState?.registration?.seatStatus === 'CONFIRMED' ||
        registrationState?.registration?.paymentStatus === 'PAID' ||
        registrationState?.registration?.paymentStatus === 'VERIFIED' ||
        registrationState?.registration?.status === 'PAYMENT_VERIFIED'
      ) {
        setDashboardOpen(true);
      } else {
        setRegModalOpen(true);
      }
    });
  };

  const handleAuthSuccess = () => {
    triggerTransition(() => {
      setAuthModalOpen(false);
      setRegModalOpen(true);
    });
  };

  const handleRegistrationSuccess = async () => {
    await refreshRegistration();
  };

  // If visiting /registration/token/:registrationId -> Render Standalone Token Pass Page
  if (isTokenRoute) {
    const parts = window.location.pathname.split('/');
    const pathId = parts[parts.length - 1] !== 'token' ? parts[parts.length - 1] : '';
    const tokenRegId = pathId || registrationState?.registration?.registrationId || 'EDS-WS-001';

    return (
      <div className="app-container" style={{ minHeight: '100vh', background: '#070D1B', padding: '30px 16px' }}>
        <PageLoader isLoading={pageLoading || authLoading} />
        <TokenPassPage registrationId={tokenRegId} onClose={() => window.location.href = '/'} />
      </div>
    );
  }

  // If visiting /attend -> Render Standalone Attendance Scanning Portal
  if (isAttendanceRoute) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', background: '#070D1B' }}>
        <AttendanceScannerPage />
      </div>
    );
  }

  // If visiting http://localhost:5173/admin -> Render Standalone Restricted Admin Portal
  if (isAdminRoute) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', background: '#0F172A' }}>
        <AdminPortal />
      </div>
    );
  }

  // Otherwise -> Render Clean Public Student Workshop Platform
  return (
    <div className="app-container">
      {/* Full-Screen Brand Page Loader & Transition */}
      <PageLoader isLoading={pageLoading || authLoading} />

      {/* Navbar */}
      <Navbar
        onOpenAuth={() => triggerTransition(() => setAuthModalOpen(true))}
        onOpenDashboard={() => triggerTransition(() => setDashboardOpen(true))}
      />

      {/* Main Page Sections */}
      <Hero
        onRegisterClick={handleRegisterClick}
        onLoginClick={() => triggerTransition(() => setAuthModalOpen(true))}
      />

      <AboutSection />
      <TopicsSection />
      <ScheduleSection />
      
      {/* Registration Section */}
      <RegistrationSection
        onOpenRegistration={handleRegisterClick}
        onOpenDashboard={() => triggerTransition(() => setDashboardOpen(true))}
        onOpenAuth={() => triggerTransition(() => setAuthModalOpen(true))}
      />

      <EventInfoSection />
      <Footer />

      {/* Interactive Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <RegistrationLockModal
        isOpen={regModalOpen}
        onClose={() => setRegModalOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />

      <ParticipantDashboard
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        onOpenRegistration={() => triggerTransition(() => { setDashboardOpen(false); setRegModalOpen(true); })}
        onOpenPayment={() => triggerTransition(() => { setDashboardOpen(false); setRegModalOpen(true); })}
      />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
