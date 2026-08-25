import React, { useState, useEffect, useRef } from 'react';
import { getEventStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Hero3DCanvas from './Hero3DCanvas';
import { Calendar, MapPin, Clock, Users, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

const Hero = ({ onRegisterClick, onLoginClick }) => {
  const { user } = useAuth();
  const cardRef = useRef(null);

  const [status, setStatus] = useState({
    capacity: 200,
    registered: 0,
    remaining: 200,
    registrationOpen: true
  });

  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const fetchStatus = async () => {
    try {
      const res = await getEventStatus();
      if (res.data.success) {
        setStatus({
          capacity: res.data.capacity,
          registered: res.data.registered,
          remaining: res.data.remaining,
          registrationOpen: res.data.registrationOpen
        });
      }
    } catch (err) {
      console.error('[Hero Status Error]', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Smooth 3D tilt tracking mouse movement
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rx = -(y / rect.height) * 16; // 3D pitch
    const ry = (x / rect.width) * 16;  // 3D yaw

    setTilt({ rx, ry });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const progressPercent = Math.min(100, Math.round((status.registered / status.capacity) * 100));

  return (
    <section id="home" style={{
      position: 'relative',
      padding: '90px 24px 110px 24px',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 25%, rgba(249, 115, 22, 0.14) 0%, rgba(15, 23, 42, 0) 65%)'
    }}>
      
      {/* 3D Dynamic Interactive Particle & Core Mesh Canvas */}
      <Hero3DCanvas />

      <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        
        {/* Event Organizer Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 18px',
          borderRadius: '9999px',
          background: 'rgba(249, 115, 22, 0.12)',
          border: '1px solid rgba(249, 115, 22, 0.35)',
          marginBottom: '28px',
          backdropFilter: 'blur(8px)'
        }}>
          <Zap size={16} color="#F97316" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F97316', letterSpacing: '0.03em' }}>
            KARE IEEE Education Society Presents
          </span>
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 4.2rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: '20px',
          color: '#FFFFFF',
          textShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          National Workshop on <br />
          <span className="gradient-text">Intelligent Yield Prediction & AI/ML Models</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: '#94A3B8',
          maxWidth: '800px',
          margin: '0 auto 36px auto',
          fontWeight: 400,
          lineHeight: 1.6
        }}>
          Master Deep Learning, Convolutional Neural Networks, LSTMs, and Production Model Deployment. Build real-world agricultural yield forecasting systems with hands-on college lab guidance.
        </p>

        {/* Quick Details Badges */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '40px'
        }}>
          <div className="glass-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} color="#F97316" />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Sept 15-16, 2026 (2-Day Workshop)</span>
          </div>

          <div className="glass-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} color="#38BDF8" />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>09:30 AM – 05:00 PM</span>
          </div>

          <div className="glass-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={18} color="#34D399" />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>IEEE Tech Hall, KARE Campus</span>
          </div>

          <div className="glass-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderColor: 'rgba(249, 115, 22, 0.4)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F97316' }}>Registration Fee: ₹250</span>
          </div>
        </div>

        {/* Interactive 3D Cursor-Responsive Capacity Card */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="glass-card"
          style={{
            maxWidth: '560px',
            margin: '0 auto 40px auto',
            padding: '28px',
            textAlign: 'left',
            background: 'rgba(15, 23, 42, 0.9)',
            transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transition: 'transform 0.15s cubic-bezier(0.1, 0.2, 0.1, 1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(249, 115, 22, 0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#F97316" />
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#FFF' }}>Live Registration Capacity</span>
            </div>
            <span className={status.registrationOpen ? 'badge badge-green' : 'badge badge-red'}>
              {status.registrationOpen ? 'Registrations Open' : 'Registrations Closed'}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '10px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginBottom: '12px'
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #F97316 0%, #38BDF8 100%)',
              borderRadius: '9999px',
              transition: 'width 0.5s ease-in-out'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#94A3B8' }}>
            <span>Registered: <strong style={{ color: '#FFF' }}>{status.registered}</strong> / {status.capacity}</span>
            <span>Remaining: <strong style={{ color: '#F97316' }}>{status.remaining} seats</strong></span>
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onRegisterClick}
            disabled={!status.registrationOpen}
            className="btn-primary"
            style={{
              padding: '16px 38px',
              fontSize: '1.1rem',
              opacity: status.registrationOpen ? 1 : 0.6,
              cursor: status.registrationOpen ? 'pointer' : 'not-allowed'
            }}
          >
            {status.registrationOpen ? 'Register Now' : 'Registrations Closed'}
            <ArrowRight size={20} />
          </button>

          {!user && (
            <button
              onClick={onLoginClick}
              className="btn-secondary"
              style={{ padding: '16px 32px', fontSize: '1.1rem' }}
            >
              Continue with Google (@klu.ac.in)
            </button>
          )}
        </div>

        {/* KLU Domain restriction callout */}
        <div style={{ marginTop: '22px', fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck size={16} color="#34D399" />
          <span>Strictly restricted to verified <strong>@klu.ac.in</strong> student & faculty accounts</span>
        </div>

      </div>
    </section>
  );
};

export default Hero;
