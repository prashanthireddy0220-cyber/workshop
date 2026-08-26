const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
      index: true
    },
    registrationId: {
      type: String,
      required: true,
      index: true
    },
    participantName: {
      type: String,
      required: true
    },
    participantEmail: {
      type: String,
      default: ''
    },
    studentId: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: ''
    },
    year: {
      type: String,
      default: ''
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceVolunteer',
      default: null
    },
    scannedByName: {
      type: String,
      default: 'Volunteer'
    },
    scannedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['PRESENT'],
      default: 'PRESENT'
    }
  },
  { timestamps: true }
);

// Unique compound index: a participant can only be marked PRESENT ONCE per session
attendanceRecordSchema.index({ sessionId: 1, registrationId: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
