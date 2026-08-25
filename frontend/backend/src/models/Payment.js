const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      ref: 'Registration'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    transactionId: {
      type: String,
      required: true,
      trim: true
    },
    screenshotUrl: {
      type: String,
      default: ''
    },
    upiScreenshotUrl: {
      type: String,
      default: ''
    },
    upiScreenshotPublicId: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
