import React, { useState, useEffect } from 'react';
import { getAdminRegistrations, markAdminAttendance } from '../../../services/api';
import { UserCheck, Search, Download, CheckCircle2, XCircle, RefreshCw, Filter } from 'lucide-react';

const AttendanceManagement = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PRESENT, ABSENT
  const [updatingId, setUpdatingId] = useState('');

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const res = await getAdminRegistrations({ q: searchQuery });
      if (res.data.success) {
        setRegistrations(res.data.registrations);
      }
    } catch (err) {
      console.error('[Attendance Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [searchQuery]);

  const handleToggleAttendance = async (item, newStatus) => {
    setUpdatingId(item.registrationId);
    try {
      await markAdminAttendance(item.registrationId, newStatus);
      setRegistrations((prev) =>
        prev.map((r) =>
          r.registrationId === item.registrationId ? { ...r, attendance: newStatus } : r
        )
      );
    } catch (err) {
      alert('Failed to update attendance status.');
    } finally {
      setUpdatingId('');
    }
  };

  const exportCSV = () => {
    const headers = ['Participant ID', 'Student Name', 'Student ID', 'Email', 'Phone', 'Department', 'Year', 'Attendance Status'];
    const rows = filteredList.map((r) => [
      r.registrationId,
      `"${r.fullName}"`,
      r.studentId,
      r.email,
      r.phone,
      r.department,
      r.year,
      r.attendance ? 'PRESENT' : 'ABSENT'
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KARE_IEEE_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPresent = (r) => r.attendance === true || r.attendance === 'PRESENT';

  const filteredList = registrations.filter((r) => {
    if (filterStatus === 'PRESENT') return isPresent(r);
    if (filterStatus === 'ABSENT') return !isPresent(r);
    return true;
  });

  const presentCount = registrations.filter((r) => isPresent(r)).length;
  const totalCount = registrations.length;
  const attendanceRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: '#FFF', fontWeight: 800, margin: 0 }}>
            Venue Attendance Management
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.86rem', marginTop: '4px', margin: '4px 0 0 0' }}>
            Mark student attendance, track venue check-in rates, and export attendance rosters.
          </p>
        </div>

        <button
          onClick={exportCSV}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
            color: '#FFF',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.25)'
          }}
        >
          <Download size={16} /> Export Attendance CSV
        </button>
      </div>

      {/* Metrics Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px 20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Total Registered</span>
          <div style={{ fontSize: '1.6rem', color: '#FFF', fontWeight: 800, marginTop: '4px' }}>{totalCount}</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(252, 211, 77, 0.2)', borderRadius: '16px', padding: '18px 20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600 }}>Present (Checked In)</span>
          <div style={{ fontSize: '1.6rem', color: '#34D399', fontWeight: 800, marginTop: '4px' }}>{presentCount}</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px 20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Absent</span>
          <div style={{ fontSize: '1.6rem', color: '#F87171', fontWeight: 800, marginTop: '4px' }}>{totalCount - presentCount}</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '16px', padding: '18px 20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 600 }}>Attendance Percentage</span>
          <div style={{ fontSize: '1.6rem', color: '#38BDF8', fontWeight: 800, marginTop: '4px' }}>{attendanceRate}%</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px',
        background: 'rgba(15, 23, 42, 0.75)',
        padding: '16px 20px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by student name, roll number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', fontSize: '0.88rem' }}
          />
          <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'PRESENT', 'ABSENT'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: filterStatus === status ? '#F97316' : 'rgba(255, 255, 255, 0.06)',
                color: filterStatus === status ? '#FFF' : '#94A3B8'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Table */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8' }}>
                <th style={{ padding: '14px 20px' }}>Student Name</th>
                <th style={{ padding: '14px 20px' }}>Student ID / Roll</th>
                <th style={{ padding: '14px 20px' }}>Email</th>
                <th style={{ padding: '14px 20px' }}>Department</th>
                <th style={{ padding: '14px 20px' }}>Attendance Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>Loading student roster...</td>
                </tr>
              ) : filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <tr key={item.registrationId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#FFF' }}>
                      {item.fullName}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#38BDF8', fontWeight: 600 }}>
                      {item.studentId || item.registrationId}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#94A3B8' }}>
                      {item.email}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#CBD5E1' }}>
                      {item.department} ({item.year})
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {item.attendance ? (
                        <button
                          onClick={() => handleToggleAttendance(item, false)}
                          disabled={updatingId === item.registrationId}
                          style={{
                            padding: '6px 14px',
                            background: 'rgba(52, 211, 153, 0.15)',
                            border: '1px solid rgba(52, 211, 153, 0.3)',
                            color: '#34D399',
                            borderRadius: '20px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <CheckCircle2 size={14} /> PRESENT (Click to Mark Absent)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleAttendance(item, true)}
                          disabled={updatingId === item.registrationId}
                          style={{
                            padding: '6px 14px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#F87171',
                            borderRadius: '20px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <XCircle size={14} /> ABSENT (Click to Mark Present)
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>No student registration records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
