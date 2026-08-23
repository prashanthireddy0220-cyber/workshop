import React, { useState, useEffect } from 'react';
import { getAdminRegistrations } from '../../../services/api';
import ParticipantTable from '../ParticipantTable';
import PaymentApprovalModal from '../PaymentApprovalModal';

const StudentManagement = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Table Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('');

  // Selected for Payment Review Modal
  const [selectedReg, setSelectedReg] = useState(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await getAdminRegistrations({
        q: searchQuery,
        department: departmentFilter,
        year: yearFilter,
        paymentStatus: paymentStatusFilter,
        attendanceStatus: attendanceFilter
      });
      if (res.data.success) {
        setRegistrations(res.data.registrations);
      }
    } catch (err) {
      console.error('[Student Mgmt Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [searchQuery, departmentFilter, yearFilter, paymentStatusFilter, attendanceFilter]);

  return (
    <div>
      {/* Header Bar */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.35rem', color: '#FFF', fontWeight: 800, margin: 0 }}>
          Student & Participant Directory
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.86rem', marginTop: '4px', margin: '4px 0 0 0' }}>
          Search participants, review UPI transaction proofs, approve registrations, and manage student credentials.
        </p>
      </div>

      {/* Main Participant Table Component */}
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

      {/* Payment Approval Modal */}
      {selectedReg && (
        <PaymentApprovalModal
          isOpen={!!selectedReg}
          onClose={() => setSelectedReg(null)}
          registrationItem={selectedReg}
          onRefresh={fetchRegistrations}
        />
      )}
    </div>
  );
};

export default StudentManagement;
