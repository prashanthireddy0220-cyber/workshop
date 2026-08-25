const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      default: 'Intelligent Yield Prediction & AI/ML Workshop'
    },
    description: {
      type: String,
      required: true
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
      required: true,
      default: 200
    },
    registrationFee: {
      type: Number,
      required: true,
      default: 250
    },
    registrationOpen: {
      type: Boolean,
      default: true
    },
    registrationStart: {
      type: String,
      default: '2026-08-01T00:00:00.000Z'
    },
    registrationEnd: {
      type: String,
      default: '2026-08-28T23:59:59.000Z'
    },
    registrationDeadline: {
      type: String,
      default: '2026-08-28T23:59:59.000Z'
    },
    paymentUPI: {
      type: String,
      default: 'ieee.kare@upi'
    },
    paymentQR: {
      type: String,
      default: '/assets/payment-qr.png'
    },
    paymentQRActive: {
      type: Boolean,
      default: true
    },
    paymentQRUpdatedAt: {
      type: Date,
      default: Date.now
    },
    whatsappGroupLink: {
      type: String,
      default: 'https://chat.whatsapp.com/ieee-edu-society-workshop'
    },
    organizer: {
      type: String,
      default: 'KARE IEEE Education Society'
    },
    topics: [
      {
        title: String,
        description: String,
        icon: String
      }
    ],
    schedule: [
      {
        time: String,
        title: String,
        speaker: String,
        details: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
