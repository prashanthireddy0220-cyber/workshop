import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = ({ activeTab, onSelectTab, title, onRefresh, onLaunchScanner, children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070D1B',
      color: '#F8FAFC',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      display: 'flex'
    }}>
      {/* Fixed Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        marginLeft: window.innerWidth >= 1024 ? '270px' : 0,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}>
        {/* Top Header */}
        <AdminHeader
          title={title}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onRefresh={onRefresh}
          onLaunchScanner={onLaunchScanner}
        />

        {/* View Content Shell */}
        <main style={{ flex: 1, padding: '28px 24px 40px 24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
