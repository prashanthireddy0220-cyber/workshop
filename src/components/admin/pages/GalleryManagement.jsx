import React, { useState, useEffect } from 'react';
import { getAdminGallery, addAdminGalleryItem, deleteAdminGalleryItem } from '../../../services/api';
import { Image as ImageIcon, Plus, Trash2, CheckCircle2, X } from 'lucide-react';

const GalleryManagement = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('Workshop');

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await getAdminGallery();
      if (res.data.success) {
        setGalleryItems(res.data.items);
      }
    } catch (err) {
      console.error('[Gallery Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title || !imageUrl) return;
    try {
      await addAdminGalleryItem({ title, imageUrl, category });
      setModalOpen(false);
      setTitle('');
      setImageUrl('');
      fetchGallery();
    } catch (err) {
      alert('Failed to add gallery item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this gallery photo?')) return;
    try {
      await deleteAdminGalleryItem(id);
      fetchGallery();
    } catch (err) {
      alert('Failed to delete photo');
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: '#FFF', fontWeight: 800, margin: 0 }}>
            Photo Gallery Management
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.86rem', marginTop: '4px', margin: '4px 0 0 0' }}>
            Upload and curate IEEE Education Society workshop gallery images.
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
          <Plus size={18} /> Add Gallery Image
        </button>
      </div>

      {/* Grid View */}
      {loading ? (
        <p style={{ color: '#94A3B8' }}>Loading photo gallery...</p>
      ) : galleryItems.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {galleryItems.map((item) => (
            <div
              key={item._id}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=60'; }}
              />
              <div style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', color: '#FFF', fontWeight: 700, margin: 0 }}>{item.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{item.category}</span>
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
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#94A3B8' }}>No gallery images added yet.</p>
      )}

      {/* Add Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(3,7,18,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#0F172A', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '20px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.2rem', color: '#FFF', fontWeight: 800, marginBottom: '18px' }}>Add New Gallery Image</h3>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Title / Event Caption</label>
                <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Image URL</label>
                <input type="text" className="form-control" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '10px', padding: '12px', justifyContent: 'center' }}>
                Upload to Gallery
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManagement;
