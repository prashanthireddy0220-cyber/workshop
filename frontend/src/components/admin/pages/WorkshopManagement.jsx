import React, { useState, useEffect } from 'react';
import { getAdminWorkshops, createAdminWorkshop, updateAdminWorkshop, deleteAdminWorkshop } from '../../../services/api';
import { BookOpen, Plus, Edit2, Trash2, CheckCircle2, XCircle, Calendar, MapPin, Users, Award, ShieldAlert, X } from 'lucide-react';

const WorkshopManagement = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '2026-09-15',
    startTime: '09:30 AM',
    endTime: '05:00 PM',
    venue: 'IEEE Tech Hall, KARE Campus',
    capacity: 200,
    registrationFee: 250,
    status: 'UPCOMING',
    registrationOpen: true,
    speakerName: 'Dr. R. Anand & Industry Experts',
    speakerTitle: 'Senior AI Research Scientist & IEEE Senior Member'
  });

  const fetchWorkshops = async () => {
    setLoading(true);
    try {
      const res = await getAdminWorkshops();
      if (res.data.success) setWorkshops(res.data.workshops);
    } catch (err) {
      console.error('[Fetch Workshops Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: 'Intelligent Yield Prediction using CNNs, LSTMs & Transformers',
      description: 'Master Deep Learning, Convolutional Neural Networks, LSTMs, and Production Model Deployment.',
      date: '2026-09-15',
      startTime: '09:30 AM',
      endTime: '05:00 PM',
      venue: 'IEEE Tech Hall, KARE Campus',
      capacity: 200,
      registrationFee: 250,
      status: 'UPCOMING',
      registrationOpen: true,
      speakerName: 'Dr. R. Anand & Industry Experts',
      speakerTitle: 'Senior AI Research Scientist'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      date: item.date || '2026-09-15',
      startTime: item.startTime || '09:30 AM',
      endTime: item.endTime || '05:00 PM',
      venue: item.venue || 'IEEE Tech Hall, KARE Campus',
      capacity: item.capacity || 200,
      registrationFee: item.registrationFee || 250,
      status: item.status || 'UPCOMING',
      registrationOpen: item.registrationOpen !== undefined ? item.registrationOpen : true,
      speakerName: item.speaker?.name || 'Dr. R. Anand & Industry Experts',
      speakerTitle: item.speaker?.title || 'Senior AI Research Scientist'
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        venue: formData.venue,
        capacity: Number(formData.capacity),
        registrationFee: Number(formData.registrationFee),
        status: formData.status,
        registrationOpen: formData.registrationOpen,
        speaker: {
          name: formData.speakerName,
          title: formData.speakerTitle
        }
      };

      if (editingItem) {
        await updateAdminWorkshop(editingItem._id, payload);
        setSuccessMsg('Workshop updated successfully!');
      } else {
        await createAdminWorkshop(payload);
        setSuccessMsg('New Workshop created successfully!');
      }
      setModalOpen(false);
      fetchWorkshops();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save workshop');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workshop? This action cannot be undone.')) return;
    try {
      await deleteAdminWorkshop(id);
      setSuccessMsg('Workshop deleted successfully');
      fetchWorkshops();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to delete workshop');
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: '#FFF', fontWeight: 800, margin: 0 }}>
            Workshop Management
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.86rem', marginTop: '4px', margin: '4px 0 0 0' }}>
            Create, edit, toggle registration, and manage technical workshop details.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 18px',
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            color: '#FFF',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
          }}
        >
          <Plus size={18} /> Create Workshop
        </button>
      </div>

      {successMsg && (
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
          <CheckCircle2 size={18} /> <span>{successMsg}</span>
        </div>
      )}

      {/* Workshop Cards Grid */}
      {loading ? (
        <p style={{ color: '#94A3B8' }}>Loading workshops...</p>
      ) : workshops.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {workshops.map((item) => (
            <div
              key={item._id}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: item.status === 'UPCOMING' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                    color: item.status === 'UPCOMING' ? '#38BDF8' : '#34D399'
                  }}>
                    {item.status}
                  </span>

                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: item.registrationOpen ? '#34D399' : '#F87171'
                  }}>
                    {item.registrationOpen ? '● Registrations Open' : '○ Registration Closed'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', color: '#FFF', fontWeight: 800, marginBottom: '8px' }}>
                  {item.title}
                </h3>
                
                <p style={{ fontSize: '0.86rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '16px' }}>
                  {item.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#CBD5E1', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={15} color="#F97316" />
                    <span>{item.date} ({item.startTime} - {item.endTime})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={15} color="#38BDF8" />
                    <span>{item.venue}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={15} color="#34D399" />
                    <span>Capacity: {item.capacity} seats | Fee: ₹{item.registrationFee}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  onClick={() => handleOpenEditModal(item)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFF',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Edit2 size={14} /> Edit
                </button>

                <button
                  onClick={() => handleDelete(item._id)}
                  style={{
                    padding: '9px 14px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#F87171',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#94A3B8' }}>No workshops created yet.</p>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 18, 0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            background: '#0F172A',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            borderRadius: '24px',
            padding: '32px',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', color: '#FFF', fontWeight: 800, marginBottom: '20px' }}>
              {editingItem ? 'Edit Workshop' : 'Create New Workshop'}
            </h3>

            {error && (
              <div style={{ padding: '10px', background: 'rgba(239,68,68,0.15)', color: '#F87171', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Workshop Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Date</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Venue</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Capacity</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Fee (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.registrationFee}
                    onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Speaker Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.speakerName}
                  onChange={(e) => setFormData({ ...formData, speakerName: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  id="regOpen"
                  checked={formData.registrationOpen}
                  onChange={(e) => setFormData({ ...formData, registrationOpen: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#F97316' }}
                />
                <label htmlFor="regOpen" style={{ fontSize: '0.88rem', color: '#FFF', cursor: 'pointer' }}>
                  Open for Student Registrations
                </label>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ marginTop: '14px', width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                Save Workshop
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkshopManagement;
