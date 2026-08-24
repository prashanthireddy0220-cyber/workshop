const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    profilePhoto: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['participant', 'admin'],
      default: 'participant'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
