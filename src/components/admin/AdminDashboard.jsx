import React, { useState, useEffect } from 'react';
import { getAdminDashboard, getAdminRegistrations } from '../../services/api';
import OverviewCards from './OverviewCards';
import ParticipantTable from './ParticipantTable';
import PaymentApprovalModal from './PaymentApprovalModal';
import QRScannerModal from './QRScannerModal';
import { Shield, RefreshCw, QrCode, X, Search } from 'lucide-react';

const AdminDashboard = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
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
      console.error('[Admin Dashboard Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDashboardData();
    }
  }, [isOpen, searchQuery, departmentFilter, yearFilter, paymentStatusFilter, attendanceFilter]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
      <div className="modal-content" style={{ maxWidth: '1200px', width: '95%' }}>
        
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={24} color="#F97316" />
              <h2 style={{ fontSize: '1.8rem', color: '#FFF' }}>KARE IEEE Admin Control Panel</h2>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
              Workshop registration manager, payment verification, venue QR check-in & statistics.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setQrModalOpen(true)}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)' }}
            >
              <QrCode size={18} /> Venue Entry QR Scanner
            </button>

            <button onClick={fetchDashboardData} className="btn-secondary">
              <RefreshCw size={16} /> Refresh
            </button>

            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px' }}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Dashboard Metric Overview */}
        <OverviewCards stats={stats} />

        {/* Participant Registration Table */}
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

        {/* Payment Review Modal */}
        {selectedReg && (
          <PaymentApprovalModal
            isOpen={!!selectedReg}
            onClose={() => setSelectedReg(null)}
            registrationItem={selectedReg}
            onRefresh={fetchDashboardData}
          />
        )}

        {/* QR Scanner Modal */}
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

export default AdminDashboard;
