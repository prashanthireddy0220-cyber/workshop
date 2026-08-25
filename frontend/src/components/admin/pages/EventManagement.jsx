import React, { useState, useEffect } from 'react';
import { getEventDetails, updateEventConfig } from '../../../services/api';
import { Calendar, MapPin, Clock, Save, CheckCircle2, ShieldAlert, QrCode, MessageSquare, Image, ToggleLeft, ToggleRight } from 'lucide-react';

const EventManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    eventName: 'National Workshop on Intelligent Yield Prediction & AI/ML Models',
    description: 'Master Deep Learning, Convolutional Neural Networks, LSTMs, and Production Model Deployment. Build real-world agricultural yield forecasting systems with hands-on college lab guidance.',
    date: '2026-09-15',
    venue: 'IEEE Tech Hall, KARE Campus',
    capacity: 200,
    registrationFee: 250,
    registrationOpen: true,
    paymentUPI: 'ieee.kare@upi',
    paymentQR: '/assets/payment-qr.png',
    paymentQRActive: true,
    paymentQRUpdatedAt: null,
    whatsappGroupLink: 'https://chat.whatsapp.com/ieee-edu-society-workshop'
  });

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await getEventDetails();
      if (res.data.success && res.data.event) {
        const ev = res.data.event;
        setFormData({
          eventName: ev.eventName || formData.eventName,
          description: ev.description || formData.description,
          date: ev.date || formData.date,
          venue: ev.venue || formData.venue,
          capacity: ev.capacity || formData.capacity,
          registrationFee: ev.registrationFee || 250,
          registrationOpen: ev.registrationOpen !== undefined ? ev.registrationOpen : true,
          paymentUPI: ev.paymentUPI || formData.paymentUPI,
          paymentQR: ev.paymentQR || formData.paymentQR,
          paymentQRActive: ev.paymentQRActive !== undefined ? ev.paymentQRActive : true,
          paymentQRUpdatedAt: ev.paymentQRUpdatedAt || null,
          whatsappGroupLink: ev.whatsappGroupLink || formData.whatsappGroupLink
        });
      }
    } catch (err) {
      console.error('[Event Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      await updateEventConfig(formData);
      setSuccessMsg('Event details, Payment QR, and WhatsApp configuration updated live!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchDetails();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update event configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.35rem', color: '#FFF', fontWeight: 800, margin: 0 }}>
          Event & Payment QR Management
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.86rem', marginTop: '4px', margin: '4px 0 0 0' }}>
          Configure main workshop parameters, Payment QR code, WhatsApp group link, and live website settings.
        </p>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34D399', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} /> <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={18} /> <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Event Form Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '32px'
      }}>
        {loading ? (
          <p style={{ color: '#94A3B8' }}>Loading event details...</p>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* General Info */}
            <div>
              <label style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Main Workshop Event Title
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Event Description & Overview
              </label>
              <textarea
                className="form-control"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Event Date
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Venue Location
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Max Seat Capacity
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Registration Fee (₹)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.registrationFee}
                  onChange={(e) => setFormData({ ...formData, registrationFee: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Official UPI Payment ID
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.paymentUPI}
                  onChange={(e) => setFormData({ ...formData, paymentUPI: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* PAYMENT QR CODE MANAGEMENT BOX */}
            <div style={{
              background: 'rgba(249, 115, 22, 0.06)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '1.05rem', color: '#F97316', fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={20} /> Payment QR Code Management
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '20px', alignItems: 'start' }}>
                <div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                      Payment QR Code Image URL / Asset Path
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. /assets/payment-qr.png or https://..."
                      value={formData.paymentQR}
                      onChange={(e) => setFormData({ ...formData, paymentQR: e.target.value })}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                      Paste a custom uploaded image URL or static path. This image will be shown on student payment screens.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <input
                      type="checkbox"
                      id="qrActiveCheck"
                      checked={formData.paymentQRActive}
                      onChange={(e) => setFormData({ ...formData, paymentQRActive: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#F97316', cursor: 'pointer' }}
                    />
                    <label htmlFor="qrActiveCheck" style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                      Activate Payment QR Code on User Payment Page
                    </label>
                  </div>

                  {formData.paymentQRUpdatedAt && (
                    <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>
                      Last Updated: {new Date(formData.paymentQRUpdatedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* QR Preview Card */}
                <div style={{
                  background: '#FFFFFF',
                  padding: '10px',
                  borderRadius: '14px',
                  textAlign: 'center',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
                }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Current Payment QR Preview
                  </span>
                  <img
                    src={formData.paymentQR || '/assets/payment-qr.png'}
                    alt="Current Payment QR Preview"
                    style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '8px', display: 'block' }}
                  />
                </div>
              </div>
            </div>

            {/* WHATSAPP GROUP LINK CONFIGURATION */}
            <div style={{
              background: 'rgba(37, 211, 102, 0.06)',
              border: '1px solid rgba(37, 211, 102, 0.25)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '1.05rem', color: '#25D366', fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} /> Official WhatsApp Group Link
              </h3>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  WhatsApp Group Invite Link
                </label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://chat.whatsapp.com/..."
                  value={formData.whatsappGroupLink}
                  onChange={(e) => setFormData({ ...formData, whatsappGroupLink: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                  Students will see a "Join WhatsApp Group" button after successful registration verification.
                </span>
              </div>
            </div>

            {/* Public Registration Flow Toggle */}
            <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                id="eventRegOpen"
                checked={formData.registrationOpen}
                onChange={(e) => setFormData({ ...formData, registrationOpen: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#F97316', cursor: 'pointer' }}
              />
              <label htmlFor="eventRegOpen" style={{ color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', fontSize: '0.92rem' }}>
                Enable Public Student Registration Flow on Website
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ padding: '14px 24px', fontSize: '0.95rem', justifyContent: 'center', alignSelf: 'flex-start', marginTop: '10px' }}
            >
              <Save size={18} />
              {saving ? 'Saving Live Event Settings...' : 'Save & Publish Live Event Settings'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EventManagement;
