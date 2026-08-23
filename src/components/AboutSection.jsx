import React from 'react';
import { Target, Award, Cpu, BookOpen, CheckCircle, Users } from 'lucide-react';

const AboutSection = () => {
  return (
    <section id="about" style={{ padding: '80px 24px', background: 'rgba(15, 23, 42, 0.4)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span className="badge badge-orange" style={{ marginBottom: '12px' }}>Event Overview</span>
          <h2 style={{ fontSize: '2.5rem', color: '#FFF', fontWeight: 700 }}>
            About The Workshop
          </h2>
          <p style={{ color: '#94A3B8', maxWidth: '700px', margin: '12px auto 0 auto' }}>
            Empowering students with practical Artificial Intelligence & Machine Learning expertise tailored for agricultural computer vision and yield forecasting.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ background: 'rgba(249, 115, 22, 0.15)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Target size={24} color="#F97316" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#FFF', marginBottom: '12px' }}>What is the Workshop?</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>
              A comprehensive 2-day hands-on technical workshop organized by KARE IEEE Education Society focusing on end-to-end Machine Learning pipelines, time-series forecasting, and computer vision models.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Award size={24} color="#38BDF8" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#FFF', marginBottom: '12px' }}>Why Attend?</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>
              Gain direct experience writing Python code for Deep Learning models, working with satellite datasets, building CNN classifiers, and receiving an official IEEE Participation Certificate.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ background: 'rgba(52, 211, 153, 0.15)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Users size={24} color="#34D399" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#FFF', marginBottom: '12px' }}>Who Can Attend?</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>
              Open exclusively to all B.Tech / M.Tech / Research Scholars of Kalasalingam Academy of Research and Education (KARE) holding active <strong style={{ color: '#FFF' }}>@klu.ac.in</strong> email credentials.
            </p>
          </div>

        </div>

        {/* Core Objectives List */}
        <div className="glass-card" style={{ marginTop: '40px', padding: '36px' }}>
          <h3 style={{ fontSize: '1.4rem', color: '#FFF', marginBottom: '20px' }}>Key Workshop Objectives</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              'Understand Supervised ML & Feature Engineering Pipelines',
              'Build Convolutional Neural Networks (CNNs) for Crop Health',
              'Train Long Short-Term Memory (LSTM) Networks for Yield Data',
              'Evaluate Models using RMSE, R² Score, and Confusion Matrices',
              'Deploy Trained Models with Web Dashboards (Vite + React)',
              'Venue QR Ticket Check-In & Automated PDF Certificate Delivery'
            ].map((objective, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle size={20} color="#F97316" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: '#CBD5E1', fontSize: '0.95rem' }}>{objective}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default AboutSection;
