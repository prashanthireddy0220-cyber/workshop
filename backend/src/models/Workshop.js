const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: 'Intelligent Yield Prediction using CNNs, LSTMs & Transformers'
    },
    description: {
      type: String,
      required: true,
      default: 'Master Deep Learning, Convolutional Neural Networks, LSTMs, and Production Model Deployment.'
    },
    bannerUrl: {
      type: String,
      default: ''
    },
    date: {
      type: String,
      required: true,
      default: '2026-09-15'
    },
    startTime: {
      type: String,
      default: '09:30 AM'
    },
    endTime: {
      type: String,
      default: '05:00 PM'
    },
    venue: {
      type: String,
      required: true,
      default: 'IEEE Tech Hall, KARE Campus'
    },
    capacity: {
      type: Number,
      default: 200
    },
    registrationFee: {
      type: Number,
      default: 250
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
      default: 'UPCOMING'
    },
    registrationOpen: {
      type: Boolean,
      default: true
    },
    speaker: {
      name: { type: String, default: 'Dr. R. Anand & Industry Experts' },
      title: { type: String, default: 'Senior AI Research Scientist & IEEE Senior Member' },
      organization: { type: String, default: 'KARE AI Research Lab' },
      photoUrl: { type: String, default: '' }
    },
    topics: [
      {
        title: String,
        description: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workshop', workshopSchema);
