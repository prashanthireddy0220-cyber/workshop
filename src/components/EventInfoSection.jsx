import React from 'react';
import { MapPin, Calendar, CreditCard, ShieldCheck, Mail, Phone, Award } from 'lucide-react';

const EventInfoSection = () => {
  return (
    <section id="details" style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span className="badge badge-green" style={{ marginBottom: '12px' }}>Essential Info</span>
          <h2 style={{ fontSize: '2.5rem', color: '#FFF', fontWeight: 700 }}>
            Event Details & Guidelines
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Calendar size={22} color="#F97316" />
              <h3 style={{ fontSize: '1.2rem', color: '#FFF' }}>Date & Deadline</h3>
            </div>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem', marginBottom: '8px' }}>
              <strong>Event Date:</strong> September 15-16, 2026 (2-Day Workshop)
            </p>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem' }}>
              <strong>Registration Deadline:</strong> September 14, 2026 (or until seats fill)
            </p>
          </div>

          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <MapPin size={22} color="#38BDF8" />
              <h3 style={{ fontSize: '1.2rem', color: '#FFF' }}>Venue & Location</h3>
            </div>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem', marginBottom: '8px' }}>
              <strong>Venue:</strong> IEEE Tech Auditorium & CSE Lab
            </p>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem' }}>
              <strong>Campus:</strong> Kalasalingam Academy of Research & Education (KARE)
            </p>
          </div>

          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <CreditCard size={22} color="#34D399" />
              <h3 style={{ fontSize: '1.2rem', color: '#FFF' }}>Registration Fee & UPI</h3>
            </div>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem', marginBottom: '8px' }}>
              <strong>Registration Fee:</strong> ₹250 per participant
            </p>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem' }}>
              <strong>Official UPI ID:</strong> <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', color: '#F97316' }}>ieee.kare@upi</code>
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default EventInfoSection;
