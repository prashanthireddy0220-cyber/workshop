import React from 'react';
import { Mail, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{
      background: '#070D1B',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '60px 24px 30px 24px',
      color: '#94A3B8'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '40px',
        marginBottom: '40px'
      }}>

        {/* Col 1: Brand */}
        <div>
          <img src="/logo.svg" alt="KARE IEEE Education Society" style={{ height: '45px', marginBottom: '16px' }} />
          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
            Official workshop registration & digital credentialing platform for Kalasalingam Academy of Research and Education (KARE) IEEE Education Society Student Branch Chapter.
          </p>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 style={{ color: '#FFF', fontSize: '1rem', marginBottom: '16px' }}>Quick Navigation</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px' }}><a href="#home" style={{ color: '#94A3B8', textDecoration: 'none' }}>Home</a></li>
            <li style={{ marginBottom: '8px' }}><a href="#about" style={{ color: '#94A3B8', textDecoration: 'none' }}>About Workshop</a></li>
            <li style={{ marginBottom: '8px' }}><a href="#topics" style={{ color: '#94A3B8', textDecoration: 'none' }}>Topics Covered</a></li>
            <li style={{ marginBottom: '8px' }}><a href="#schedule" style={{ color: '#94A3B8', textDecoration: 'none' }}>Event Schedule</a></li>
            <li style={{ marginBottom: '8px' }}><a href="/admin" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.85rem' }}>Admin Portal Login</a></li>
          </ul>
        </div>

        {/* Col 3: Contact & Social Handles */}
        <div>
          <h4 style={{ color: '#FFF', fontSize: '1rem', marginBottom: '16px' }}>Contact & Connect</h4>

          <p style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Mail size={16} color="#F97316" />
            <a href="mailto:ieeeeducation@klu.ac.in" style={{ color: '#F8FAFC', textDecoration: 'none', transition: 'color 0.2s' }}>
              ieeeeducation@klu.ac.in
            </a>
          </p>

          <p style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Instagram size={16} color="#E1306C" />
            <a href="https://www.instagram.com/kare_ieee_eds_official/" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
              @kare_ieee_eds_official
            </a>
          </p>

          <p style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Linkedin size={16} color="#0A66C2" />
            <a href="https://www.linkedin.com/in/ieee-education-society-kare-97b490381/" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
              IEEE Education Society KARE
            </a>
          </p>
        </div>

      </div>

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        paddingTop: '24px',
        textAlign: 'center',
        fontSize: '0.85rem'
      }}>
        <p>© 2026 KARE IEEE Education Society. All rights reserved. Built for College Event Excellence.</p>
      </div>
    </footer>
  );
};

export default Footer;
