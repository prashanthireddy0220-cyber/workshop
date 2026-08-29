const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true
    },
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
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    qrToken: {
      type: String,
      required: true,
      unique: true
    },
    qrCodeDataUrl: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['VALID', 'USED', 'CANCELLED'],
      default: 'VALID'
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

ticketSchema.index({ registrationId: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);

