import React, { useState, useEffect } from 'react';
import { getEventDetails, updateEventConfig } from '../../../services/api';
import { Globe, Save, CheckCircle2, ShieldAlert, CreditCard } from 'lucide-react';

const WebsiteContentManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [config, setConfig] = useState({
    eventName: 'National Workshop on Intelligent Yield Prediction & AI/ML Models',
    venue: 'IEEE Tech Hall, KARE Campus',
    date: '2026-09-15',
    capacity: 200,
    registrationFee: 250,
    paymentUPI: 'ieee.kare@upi',
    registrationOpen: true
  });

  useEffect(() => {
    getEventDetails().then((res) => {
      if (res.data.success && res.data.event) {
        const ev = res.data.event;
        setConfig({
          eventName: ev.eventName || config.eventName,
          venue: ev.venue || config.venue,
          date: ev.date || config.date,
          capacity: ev.capacity || config.capacity,
          registrationFee: ev.registrationFee || config.registrationFee,
          paymentUPI: ev.paymentUPI || config.paymentUPI,
          registrationOpen: ev.registrationOpen !== undefined ? ev.registrationOpen : true
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updateEventConfig(config);
      setMsg('Public website content and registration parameters updated live!');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert('Failed to save website content configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.35rem', color: '#FFF', fontWeight: 800, margin: 0 }}>
          Public Website Content & Configuration
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.86rem', marginTop: '4px', margin: '4px 0 0 0' }}>
          Real-time control panel for website text, UPI IDs, seat limits, and public registration state.
        </p>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34D399', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} /> <span>{msg}</span>
        </div>
      )}

      <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '32px' }}>
        {loading ? (
          <p style={{ color: '#94A3B8' }}>Loading live website parameters...</p>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Hero Section Workshop Title</label>
              <input type="text" className="form-control" value={config.eventName} onChange={(e) => setConfig({ ...config, eventName: e.target.value })} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Venue Address</label>
                <input type="text" className="form-control" value={config.venue} onChange={(e) => setConfig({ ...config, venue: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Event Dates</label>
                <input type="text" className="form-control" value={config.date} onChange={(e) => setConfig({ ...config, date: e.target.value })} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Max Participant Capacity</label>
                <input type="number" className="form-control" value={config.capacity} onChange={(e) => setConfig({ ...config, capacity: Number(e.target.value) })} required />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Registration Fee (₹)</label>
                <input type="number" className="form-control" value={config.registrationFee} onChange={(e) => setConfig({ ...config, registrationFee: Number(e.target.value) })} required />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Official UPI Payment VPA</label>
                <input type="text" className="form-control" value={config.paymentUPI} onChange={(e) => setConfig({ ...config, paymentUPI: e.target.value })} required />
              </div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="checkbox" id="liveReg" checked={config.registrationOpen} onChange={(e) => setConfig({ ...config, registrationOpen: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: '#F97316' }} />
              <label htmlFor="liveReg" style={{ color: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                Enable Live Student Registration Portal on Website
              </label>
            </div>

            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '13px 22px', fontSize: '0.92rem', justifyContent: 'center', alignSelf: 'flex-start', marginTop: '10px' }}>
              <Save size={18} /> {saving ? 'Publishing Updates...' : 'Publish Live to Public Website'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WebsiteContentManagement;
