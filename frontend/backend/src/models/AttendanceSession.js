const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    sessionName: {
      type: String,
      required: true,
      default: 'IEEE Workshop Attendance'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED'],
      default: 'CLOSED',
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    closedAt: {
      type: Date,
      default: null
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    presentCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
