import React from 'react';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';

const scheduleData = [
  { time: '09:30 AM', title: 'Registration & Entry Check-in', details: 'Scan digital QR ticket at venue entry and collect kit' },
  { time: '10:00 AM', title: 'Inauguration & Keynote Address', details: 'Welcome address by KARE HOD & IEEE Faculty Chair' },
  { time: '10:30 AM', title: 'Session 1: Machine Learning Foundations', details: 'Feature engineering, regression models & yield datasets' },
  { time: '12:00 PM', title: 'Session 2: CNNs & Computer Vision', details: 'Classifying crop health images with deep learning' },
  { time: '01:00 PM', title: 'Networking Lunch Break', details: 'Complimentary lunch & refreshments for participants' },
  { time: '02:00 PM', title: 'Session 3: LSTMs & Time-Series Yield Models', details: 'Recurrent networks & temporal prediction algorithms' },
  { time: '04:00 PM', title: 'Hands-On Lab & Model Deployment', details: 'Train custom model & deploy live web application' },
  { time: '05:00 PM', title: 'Q&A, Attendance Scanning & Certificates', details: 'Venue QR scanner check-in & instant certificate unlock' }
];

const ScheduleSection = () => {
  return (
    <section id="schedule" style={{ padding: '80px 24px', background: 'rgba(15, 23, 42, 0.4)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span className="badge badge-orange" style={{ marginBottom: '12px' }}>Event Timeline</span>
          <h2 style={{ fontSize: '2.5rem', color: '#FFF', fontWeight: 700 }}>
            Workshop Schedule
          </h2>
          <p style={{ color: '#94A3B8', marginTop: '8px' }}>
            Structured single-day intensive technical itinerary.
          </p>
        </div>

        <div style={{ position: 'relative', paddingLeft: '30px', borderLeft: '2px solid rgba(249, 115, 22, 0.3)' }}>
          {scheduleData.map((item, idx) => (
            <div key={idx} style={{ marginBottom: '32px', position: 'relative' }}>
              
              {/* Timeline Bullet */}
              <div style={{
                position: 'absolute',
                left: '-41px',
                top: '0',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#0F172A',
                border: '3px solid #F97316'
              }} />

              <div className="glass-card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Clock size={16} color="#F97316" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F97316' }}>{item.time}</span>
                </div>
                <h3 style={{ fontSize: '1.15rem', color: '#FFF', marginBottom: '6px' }}>{item.title}</h3>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>{item.details}</p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ScheduleSection;
