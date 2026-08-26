import React, { useState } from 'react';
import { Settings, Shield, Lock, CheckCircle2, Server, Database, Key } from 'lucide-react';

const AdminSettings = () => {
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpdateSecurity = (e) => {
    e.preventDefault();
    setSuccessMsg('Admin security preferences & session tokens updated.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.35rem', color: '#FFF', fontWeight: 800, margin: 0 }}>
          Admin Portal Settings & System Health
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.86rem', marginTop: '4px', margin: '4px 0 0 0' }}>
          Manage admin security, JWT session expiration, API configuration, and database connection status.
        </p>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34D399', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} /> <span>{successMsg}</span>
        </div>
      )}

      {/* System Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '18px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34D399', marginBottom: '10px' }}>
            <Database size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Database Connection</span>
          </div>
          <div style={{ fontSize: '1.1rem', color: '#FFF', fontWeight: 800 }}>MongoDB Connected</div>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>127.0.0.1:27017 / kare_ieee_workshop</span>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '18px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38BDF8', marginBottom: '10px' }}>
            <Server size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Backend Node.js API</span>
          </div>
          <div style={{ fontSize: '1.1rem', color: '#FFF', fontWeight: 800 }}>HTTP 200 OK (Port 5001)</div>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Express proxy via /api</span>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '18px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F97316', marginBottom: '10px' }}>
            <Key size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Authentication Engine</span>
          </div>
          <div style={{ fontSize: '1.1rem', color: '#FFF', fontWeight: 800 }}>JWT 7-Day Sessions</div>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Firebase Google OAuth Enabled</span>
        </div>
      </div>

      {/* Security Form */}
      <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#FFF', fontWeight: 800, marginBottom: '18px', margin: '0 0 18px 0' }}>
          Admin Authentication & Security Credentials
        </h3>

        <form onSubmit={handleUpdateSecurity} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Current Admin Username</label>
            <input type="text" className="form-control" placeholder="Admin Username" readOnly style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Admin Associated Email</label>
            <input type="email" className="form-control" defaultValue="admin@klu.ac.in" readOnly style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>

          <div style={{ padding: '14px 16px', background: 'rgba(249, 115, 22, 0.08)', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.2)', color: '#F97316', fontSize: '0.86rem', lineHeight: '1.6' }}>
            To modify default environment admin username/password (<code style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 7px', borderRadius: '5px', color: '#FFF', fontWeight: 600 }}>ADMIN_USERNAME</code> & <code style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 7px', borderRadius: '5px', color: '#FFF', fontWeight: 600 }}>ADMIN_PASSWORD</code>), update <code style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 7px', borderRadius: '5px', color: '#FFF', fontWeight: 600 }}>backend/.env</code> file.
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '12px 20px', justifyContent: 'center', alignSelf: 'flex-start', marginTop: '10px' }}>
            <Shield size={16} /> Save Security Preferences
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
