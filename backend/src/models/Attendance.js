const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    ticketId: {
      type: String,
      default: ''
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    workshopId: {
      type: String,
      default: 'IEEE-WS-2026'
    },
    checkedIn: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT'],
      default: 'PRESENT'
    },
    participantName: {
      type: String,
      default: ''
    },
    participantEmail: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: ''
    },
    checkedInAt: {
      type: Date,
      default: Date.now
    },
    scannedAt: {
      type: Date,
      default: Date.now
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
