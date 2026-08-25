const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    college: {
      type: String,
      default: 'Kalasalingam Academy of Research and Education (KARE)'
    },
    studentId: {
      type: String,
      trim: true,
      default: ''
    },
    department: {
      type: String,
      default: 'CSE'
    },
    year: {
      type: String,
      default: '3rd Year'
    },
    section: {
      type: String,
      default: 'A'
    },
    residency: {
      type: String,
      enum: ['Day Scholar', 'Hosteller'],
      default: 'Day Scholar'
    },
    photoURL: {
      type: String,
      default: ''
    },
    upiScreenshotUrl: {
      type: String,
      default: ''
    },
    screenshotUrl: {
      type: String,
      default: ''
    },
    firebaseUid: {
      type: String,
      default: ''
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    },
    seatStatus: {
      type: String,
      enum: ['AVAILABLE', 'LOCKED', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
      default: 'LOCKED'
    },
    lockedAt: {
      type: Date,
      default: Date.now
    },
    lockExpiresAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['REGISTERED', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PAYMENT_REJECTED', 'ATTENDED'],
      default: 'REGISTERED'
    }
  },
  { timestamps: true }
);

// Prevent duplicate active registration for same user & event
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
