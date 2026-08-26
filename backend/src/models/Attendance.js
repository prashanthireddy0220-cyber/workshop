const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      index: true
    },
    sessionName: {
      type: String,
      default: ''
    },
    registrationId: {
      type: String,
      required: true,
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
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Compound index to ensure participant is unique PER ATTENDANCE SESSION
attendanceSchema.index({ sessionId: 1, registrationId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
