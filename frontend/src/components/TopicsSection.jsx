import React from 'react';
import { Cpu, Layers, Activity, Zap, Sliders, Globe } from 'lucide-react';

const topics = [
  {
    icon: Cpu,
    title: 'Machine Learning Foundations',
    description: 'Data preprocessing, regression models, feature selection & Scikit-Learn pipelines.',
    color: '#F97316'
  },
  {
    icon: Layers,
    title: 'Convolutional Neural Networks (CNNs)',
    description: 'Image classification, feature extraction, Pooling layers & ResNet architectures.',
    color: '#38BDF8'
  },
  {
    icon: Activity,
    title: 'LSTMs & Time-Series AI',
    description: 'Sequential crop yield forecasting, temporal dependencies & recurrent models.',
    color: '#34D399'
  },
  {
    icon: Zap,
    title: 'Transformers & Self-Attention',
    description: 'Modern attention mechanics, vision transformers & foundation AI concepts.',
    color: '#F43F5E'
  },
  {
    icon: Sliders,
    title: 'Deep Learning Optimization',
    description: 'Loss functions, Adam optimizers, hyperparameter tuning & overfitting prevention.',
    color: '#A855F7'
  },
  {
    icon: Globe,
    title: 'Production Model Deployment',
    description: 'Serving ML models via REST APIs, Express backend & interactive React UI.',
    color: '#EAB308'
  }
];

const TopicsSection = () => {
  return (
    <section id="topics" style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span className="badge badge-blue" style={{ marginBottom: '12px' }}>Curriculum</span>
          <h2 style={{ fontSize: '2.5rem', color: '#FFF', fontWeight: 700 }}>
            Workshop Topics & Modules
          </h2>
          <p style={{ color: '#94A3B8', maxWidth: '650px', margin: '12px auto 0 auto' }}>
            Hands-on modules structured to transition you from core Machine Learning concepts to real-world deployment.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {topics.map((topic, idx) => {
            const IconComponent = topic.icon;
            return (
              <div key={idx} className="glass-card" style={{ padding: '28px' }}>
                <div style={{
                  background: `${topic.color}20`,
                  border: `1px solid ${topic.color}40`,
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <IconComponent size={24} color={topic.color} />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: '#FFF', marginBottom: '10px' }}>{topic.title}</h3>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: '1.5' }}>{topic.description}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default TopicsSection;
