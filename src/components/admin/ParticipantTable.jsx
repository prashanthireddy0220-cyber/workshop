import React from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, ShieldCheck, QrCode } from 'lucide-react';

const ParticipantTable = ({
  registrations,
  searchQuery,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  yearFilter,
  onYearChange,
  paymentStatusFilter,
  onPaymentStatusChange,
  attendanceFilter,
  onAttendanceChange,
  onSelectRegistration
}) => {
  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '42px' }}
            placeholder="Search by Name, Reg ID (KLU-ML-2026-XXXX), Email, Phone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <select className="form-control" style={{ width: 'auto' }} value={departmentFilter} onChange={(e) => onDepartmentChange(e.target.value)}>
            <option value="">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="AI & DS">AI & DS</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
          </select>

          <select className="form-control" style={{ width: 'auto' }} value={yearFilter} onChange={(e) => onYearChange(e.target.value)}>
            <option value="">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>

          <select className="form-control" style={{ width: 'auto' }} value={paymentStatusFilter} onChange={(e) => onPaymentStatusChange(e.target.value)}>
            <option value="">All Payment Statuses</option>
            <option value="PAYMENT_SUBMITTED">Pending Verification</option>
            <option value="PAYMENT_VERIFIED">Verified</option>
            <option value="PAYMENT_REJECTED">Rejected</option>
            <option value="REGISTERED">Not Submitted</option>
          </select>

          <select className="form-control" style={{ width: 'auto' }} value={attendanceFilter} onChange={(e) => onAttendanceChange(e.target.value)}>
            <option value="">All Attendance</option>
            <option value="ATTENDED">Attended</option>
            <option value="NOT_ATTENDED">Not Checked In</option>
          </select>
        </div>

      </div>

      {/* Participant List Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Participant ID</th>
              <th>Participant Name</th>
              <th>Email / Phone</th>
              <th>Dept / Year</th>
              <th>Payment Status</th>
              <th>Attendance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  No participant records match the specified filters.
                </td>
              </tr>
            ) : (
              registrations.map((reg) => {
                const paymentStatus = reg.payment?.status || reg.paymentStatus || (reg.status === 'PAYMENT_VERIFIED' ? 'VERIFIED' : 'NOT_SUBMITTED');

                return (
                  <tr key={reg._id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#F97316', fontFamily: 'monospace' }}>
                        {reg.registrationId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFF' }}>{reg.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{reg.college}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>{reg.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{reg.phone}</div>
                    </td>
                    <td>
                      <span className="badge badge-blue">{reg.department}</span>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>{reg.year}</div>
                    </td>
                    <td>
                      {paymentStatus === 'VERIFIED' && <span className="badge badge-green">✓ Verified</span>}
                      {paymentStatus === 'PENDING' && <span className="badge badge-orange">⏳ Pending Review</span>}
                      {paymentStatus === 'REJECTED' && <span className="badge badge-red">✕ Rejected</span>}
                      {paymentStatus === 'NOT_SUBMITTED' && <span className="badge badge-blue">Not Submitted</span>}
                    </td>
                    <td>
                      {reg.attendance ? (
                        <span className="badge badge-green">✓ Attended</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Not Checked In</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => onSelectRegistration(reg)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ParticipantTable;
