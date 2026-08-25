const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Event = require('../models/Event');
const User = require('../models/User');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('[Seed] Connected to MongoDB');

    // 1. Seed Admin User
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@klu.ac.in').toLowerCase();
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        googleId: 'admin-seed-id',
        name: 'KARE IEEE Admin',
        email: adminEmail,
        profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        role: 'admin'
      });
      console.log(`[Seed] Admin user created: ${adminEmail}`);
    } else {
      admin.role = 'admin';
      await admin.save();
      console.log(`[Seed] Admin user verified: ${adminEmail}`);
    }

    // 2. Seed Workshop Event
    let event = await Event.findOne();
    if (!event) {
      event = await Event.create({
        eventName: process.env.EVENT_NAME || 'Intelligent Yield Prediction & AI/ML Workshop',
        description: 'Join the premier 2-Day AI/ML Workshop organized by KARE IEEE Education Society. Master cutting-edge Machine Learning models, CNNs, LSTMs, and Model Deployment with hands-on lab sessions.',
        date: process.env.EVENT_DATE || '2026-09-15',
        startTime: '09:30 AM',
        endTime: '05:00 PM',
        venue: process.env.EVENT_LOCATION || 'IEEE Tech Hall, KARE Campus',
        capacity: parseInt(process.env.EVENT_CAPACITY || '200'),
        registrationFee: parseInt(process.env.REGISTRATION_FEE || '250'),
        registrationOpen: true,
        paymentUPI: process.env.PAYMENT_UPI_ID || 'ieee.kare@upi',
        organizer: 'KARE IEEE Education Society',
        topics: [
          { title: 'Machine Learning Foundations', description: 'Supervised vs Unsupervised algorithms, regression models, feature engineering', icon: 'Cpu' },
          { title: 'Convolutional Neural Networks (CNNs)', description: 'Image classification, feature maps, Pooling layers & Vision architectures', icon: 'Layers' },
          { title: 'LSTMs & Sequential Models', description: 'Time-series yield prediction, recurrent neural networks & attention mechanics', icon: 'Activity' },
          { title: 'Transformer Architectures', description: 'Self-attention mechanisms, modern AI pipeline integration & LLM basics', icon: 'Zap' },
          { title: 'Deep Learning Optimization', description: 'Loss functions, Adam optimizers, hyperparameter tuning & regularization', icon: 'Sliders' },
          { title: 'Production Model Deployment', description: 'Deploying ML pipelines using FastAPI, React & Cloud Infrastructure', icon: 'Globe' }
        ],
        schedule: [
          { time: '09:30 AM', title: 'Registration & Welcome Kit Distribution', speaker: 'IEEE Team', details: 'Check-in at gate and collect badge & kit' },
          { time: '10:00 AM', title: 'Inauguration & Keynote Address', speaker: 'KARE HOD & IEEE Chair', details: 'Importance of AI/ML in modern engineering' },
          { time: '10:30 AM', title: 'Session 1: Machine Learning & CNN Architectures', speaker: 'Dr. AI Research Lead', details: 'Deep dive into computer vision & models' },
          { time: '12:00 PM', title: 'Session 2: Yield Prediction Algorithms', speaker: 'Guest Specialist', details: 'Practical dataset analysis & feature extraction' },
          { time: '01:00 PM', title: 'Networking Lunch Break', speaker: 'Cafeteria', details: 'Complimentary lunch provided' },
          { time: '02:00 PM', title: 'Session 3: LSTMs & Time-Series AI Models', speaker: 'ML Engineer', details: 'Hands-on coding session in Python' },
          { time: '04:00 PM', title: 'Hands-On Lab & Project Building', speaker: 'Mentors', details: 'Train and deploy your yield prediction model' },
          { time: '05:00 PM', title: 'Q&A, Valedictory & Attendance Scanning', speaker: 'Organizers', details: 'Venue QR scanner check-in & certificate unlocks' }
        ]
      });
      console.log('[Seed] Workshop Event initialized');
    }

    console.log('[Seed] DB Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDB();
}

module.exports = { seedDB };
