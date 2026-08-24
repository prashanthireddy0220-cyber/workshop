import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitRegistration } from '../services/api';
import { X, CheckCircle, Shield, AlertCircle, ArrowRight } from 'lucide-react';

const RegistrationModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, refreshRegistration } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: user ? (user.displayName || user.name || '') : '',
    phone: '',
    studentId: '',
    department: 'CSE',
    year: '3rd Year',
    section: '24S01',
    residency: 'Day Scholar'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.displayName || user.name || prev.fullName || ''
      }));
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await submitRegistration({
        ...formData,
        fullName: formData.fullName || user.displayName || user.name,
        email: user.email
      });

      if (res.data.success) {
        await refreshRegistration();
        onSuccess(res.data.registration);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>

        <div style={{ marginBottom: '20px' }}>
          <span className="badge badge-orange" style={{ marginBottom: '8px' }}>Step 1 of 2</span>
          <h2 style={{ fontSize: '1.6rem', color: '#FFF' }}>Workshop Registration Form</h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Authenticated via Google Account <strong style={{ color: '#F97316' }}>{user.email}</strong>
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#F87171',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Full Name (From Google Account)</label>
              <input
                type="text"
                name="fullName"
                className="form-control"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Google Account Name"
              />
            </div>

            <div className="form-group">
              <label>Google Account Email (Locked)</label>
              <input
                type="email"
                className="form-control"
                value={user.email}
                disabled
                readOnly
                style={{ opacity: 0.8, cursor: 'not-allowed', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              />
            </div>
          </div>

          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Student Roll Number / ID</label>
              <input
                type="text"
                name="studentId"
                className="form-control"
                placeholder="e.g. 2400030123"
                value={formData.studentId}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Department</label>
              <select name="department" className="form-control" value={formData.department} onChange={handleChange}>
                <option value="CSE">CSE</option>
                <option value="AI & DS">AI & DS</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
              </select>
            </div>

            <div className="form-group">
              <label>Academic Year</label>
              <select name="year" className="form-control" value={formData.year} onChange={handleChange}>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="PG / PhD">PG / PhD</option>
              </select>
            </div>

            <div className="form-group">
              <label>Section (e.g. 24S01)</label>
              <input
                type="text"
                name="section"
                className="form-control"
                placeholder="e.g. 24S01"
                value={formData.section}
                onChange={handleChange}
                required
              />
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                e.g. 24S01, 23S01, S01
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Residency Status</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#FFF' }}>
                <input
                  type="radio"
                  name="residency"
                  value="Day Scholar"
                  checked={formData.residency === 'Day Scholar'}
                  onChange={handleChange}
                />
                Day Scholar
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#FFF' }}>
                <input
                  type="radio"
                  name="residency"
                  value="Hosteller"
                  checked={formData.residency === 'Hosteller'}
                  onChange={handleChange}
                />
                Hosteller
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
          >
            {loading ? 'Generating Registration ID...' : 'Submit Registration & Proceed to Payment'}
            <ArrowRight size={18} />
          </button>
        </form>

      </div>
    </div>
  );
};

export default RegistrationModal;
