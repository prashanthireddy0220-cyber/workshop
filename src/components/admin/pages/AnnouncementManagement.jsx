import React, { useState, useEffect } from 'react';
import { getAdminAnnouncements, createAdminAnnouncement, deleteAdminAnnouncement } from '../../../services/api';
import { Megaphone, Plus, Trash2, CheckCircle2, X } from 'lucide-react';

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('IMPORTANT');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await getAdminAnnouncements();
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
      }
    } catch (err) {
      console.error('[Announcements Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    try {
      await createAdminAnnouncement({ title, content, category });
      setModalOpen(false);
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to publish announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAdminAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to delete announcement');
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: '#FFF', fontWeight: 800, margin: 0 }}>
            Announcements & Notifications
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.86rem', marginTop: '4px', margin: '4px 0 0 0' }}>
            Publish official updates and broadcast notifications to student workshop participants.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
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
          <Plus size={18} /> New Announcement
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <p style={{ color: '#94A3B8' }}>Loading announcements...</p>
      ) : announcements.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {announcements.map((item) => (
            <div
              key={item._id}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                padding: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: item.category === 'IMPORTANT' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: item.category === 'IMPORTANT' ? '#F87171' : '#38BDF8'
                  }}>
                    {item.category}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Published on {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', color: '#FFF', fontWeight: 800, margin: '0 0 6px 0' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                  {item.content}
                </p>
              </div>

              <button
                onClick={() => handleDelete(item._id)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: 'none',
                  color: '#F87171',
                  padding: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#94A3B8' }}>No announcements published yet.</p>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(3,7,18,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#0F172A', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '20px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.2rem', color: '#FFF', fontWeight: 800, marginBottom: '18px' }}>Create New Announcement</h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Title</label>
                <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Content Body</label>
                <textarea className="form-control" rows="4" value={content} onChange={(e) => setContent(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Priority / Category</label>
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="IMPORTANT">IMPORTANT</option>
                  <option value="GENERAL">GENERAL</option>
                  <option value="WORKSHOP">WORKSHOP</option>
                  <option value="SCHEDULE_CHANGE">SCHEDULE_CHANGE</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '10px', padding: '12px', justifyContent: 'center' }}>
                Publish Announcement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManagement;
