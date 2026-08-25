const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['GENERAL', 'IMPORTANT', 'WORKSHOP', 'SCHEDULE_CHANGE'],
      default: 'GENERAL'
    },
    pinned: {
      type: Boolean,
      default: false
    },
    author: {
      type: String,
      default: 'KARE IEEE Admin'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
