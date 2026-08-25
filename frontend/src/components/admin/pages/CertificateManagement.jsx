import React, { useState, useEffect } from 'react';
import { getAdminRegistrations, issueAdminCertificate, getCertificateDownloadUrl } from '../../../services/api';
import { Award, Search, Download, CheckCircle2, AlertCircle } from 'lucide-react';

const CertificateManagement = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [issuingId, setIssuingId] = useState('');
  const [msg, setMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminRegistrations({ q: searchQuery });
      if (res.data.success) {
        setRegistrations(res.data.registrations);
      }
    } catch (err) {
      console.error('[Certificate Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const handleIssueCertificate = async (registrationId) => {
    setIssuingId(registrationId);
    setMsg('');
    try {
      const res = await issueAdminCertificate(registrationId);
      if (res.data.success) {
        setMsg(`Certificate generated successfully for Registration ID ${registrationId}`);
        fetchData();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      alert('Failed to generate certificate.');
    } finally {
      setIssuingId('');
    }
  };

  const eligibleList = registrations.filter((r) =>
    r.status === 'PAYMENT_VERIFIED' || r.status === 'ATTENDED' || r.attendance === true
  );

  return (
    <div>
      {/* Header Bar */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.35rem', color: '#FFF', fontWeight: 800, margin: 0 }}>
          Certificate Management & Issuance
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.86rem', marginTop: '4px', margin: '4px 0 0 0' }}>
          Issue verified digital IEEE Education Society certificates to eligible participants.
        </p>
      </div>

      {msg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(52, 211, 153, 0.15)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          color: '#34D399',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} /> <span>{msg}</span>
        </div>
      )}

      {/* Search Input */}
      <div style={{
        marginBottom: '20px',
        background: 'rgba(15, 23, 42, 0.75)',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search eligible student by name, student ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', fontSize: '0.88rem' }}
          />
          <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Eligible Participants Table */}
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
                <th style={{ padding: '14px 20px' }}>Registration ID</th>
                <th style={{ padding: '14px 20px' }}>Email</th>
                <th style={{ padding: '14px 20px' }}>Certificate Status</th>
                <th style={{ padding: '14px 20px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>Loading eligible participants...</td>
                </tr>
              ) : eligibleList.length > 0 ? (
                eligibleList.map((item) => (
                  <tr key={item.registrationId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#FFF' }}>
                      {item.fullName}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#38BDF8', fontWeight: 600 }}>
                      {item.registrationId}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#94A3B8' }}>
                      {item.email}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {item.certificate ? (
                        <span style={{ color: '#34D399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={16} /> ISSUED ({item.certificate.certificateId})
                        </span>
                      ) : (
                        <span style={{ color: '#F59E0B', fontWeight: 600 }}>
                          Eligible (Pending Issue)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {item.certificate ? (
                        <a
                          href={getCertificateDownloadUrl(item.registrationId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 14px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38BDF8',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Download size={14} /> Download Certificate
                        </a>
                      ) : (
                        <button
                          onClick={() => handleIssueCertificate(item.registrationId)}
                          disabled={issuingId === item.registrationId}
                          style={{
                            padding: '6px 14px',
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                            border: 'none',
                            color: '#FFF',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Award size={14} /> {issuingId === item.registrationId ? 'Issuing...' : 'Generate & Issue'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>No verified/attended participants eligible for certificates yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CertificateManagement;
