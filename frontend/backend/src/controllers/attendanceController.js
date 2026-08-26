const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceVolunteer = require('../models/AttendanceVolunteer');
const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const Ticket = require('../models/Ticket');
const Certificate = require('../models/Certificate');
const Event = require('../models/Event');

// 1. Volunteer Login
const volunteerLogin = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginInput = (email || username || '').trim().toLowerCase();

    if (!loginInput || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Username and password are required.'
      });
    }

    const volunteer = await AttendanceVolunteer.findOne({ email: loginInput });

    if (!volunteer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid volunteer credentials.'
      });
    }

    if (volunteer.status === 'DISABLED') {
      return res.status(403).json({
        success: false,
        message: 'Your volunteer account has been disabled by the administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, volunteer.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid volunteer credentials.'
      });
    }

    const token = jwt.sign(
      { id: volunteer._id, email: volunteer.email, name: volunteer.name, role: 'volunteer' },
      process.env.JWT_SECRET || 'kare_ieee_secret',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        role: 'volunteer',
        status: volunteer.status
      }
    });
  } catch (error) {
    console.error('[Volunteer Login Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Current Volunteer Profile
const getVolunteerMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    return res.status(200).json({
      success: true,
      volunteer: {
        id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role || 'volunteer'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Admin Starts Attendance Session
const startSession = async (req, res) => {
  try {
    const { sessionName } = req.body;
    const name = (sessionName || '').trim() || 'IEEE Workshop Attendance';

    // Close any currently active sessions
    await AttendanceSession.updateMany(
      { status: 'ACTIVE' },
      { status: 'CLOSED', closedAt: new Date() }
    );

    // Create new active session
    const newSession = await AttendanceSession.create({
      sessionName: name,
      status: 'ACTIVE',
      startedAt: new Date(),
      startedBy: req.user ? req.user._id : null,
      presentCount: 0
    });

    // Update global event state
    await Event.findOneAndUpdate(
      {},
      { attendanceOpen: true },
      { upsert: true, new: true }
    );

    // Emit Socket broadcast to all connected devices
    const io = req.app.get('io');
    if (io) {
      io.emit('attendance_session_changed', {
        status: 'ACTIVE',
        session: {
          id: newSession._id,
          sessionName: newSession.sessionName,
          startedAt: newSession.startedAt,
          presentCount: 0
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance session started successfully.',
      session: newSession
    });
  } catch (error) {
    console.error('[Start Session Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Admin Closes Attendance Session
const closeSession = async (req, res) => {
  try {
    const activeSession = await AttendanceSession.findOne({ status: 'ACTIVE' });

    if (activeSession) {
      activeSession.status = 'CLOSED';
      activeSession.closedAt = new Date();
      await activeSession.save();
    }

    // Update global event state
    await Event.findOneAndUpdate(
      {},
      { attendanceOpen: false },
      { upsert: true, new: true }
    );

    // Emit Socket broadcast to all connected devices to disable scanners
    const io = req.app.get('io');
    if (io) {
      io.emit('attendance_session_changed', {
        status: 'CLOSED',
        session: activeSession || null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance session closed successfully.',
      session: activeSession
    });
  } catch (error) {
    console.error('[Close Session Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Current Attendance Session & Real-Time Stats
const getCurrentSession = async (req, res) => {
  try {
    const activeSession = await AttendanceSession.findOne({ status: 'ACTIVE' });
    const lastSession = await AttendanceSession.findOne({ status: 'CLOSED' }).sort({ closedAt: -1 });

    const getOnlineCount = req.app.get('getVolunteersOnlineCount');
    const volunteersOnline = getOnlineCount ? getOnlineCount() : 0;

    let presentCount = 0;
    if (activeSession) {
      presentCount = await AttendanceRecord.countDocuments({ sessionId: activeSession._id });
      if (activeSession.presentCount !== presentCount) {
        activeSession.presentCount = presentCount;
        await activeSession.save();
      }
    }

    return res.status(200).json({
      success: true,
      sessionActive: !!activeSession,
      status: activeSession ? 'ACTIVE' : 'CLOSED',
      sessionName: activeSession ? activeSession.sessionName : (lastSession ? lastSession.sessionName : 'IEEE Workshop Attendance'),
      presentCount: presentCount,
      volunteersOnline,
      startedAt: activeSession ? activeSession.startedAt : null,
      lastSessionStartedAt: lastSession ? lastSession.startedAt : null,
      sessionId: activeSession ? activeSession._id : null
    });
  } catch (error) {
    console.error('[Get Current Session Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Live QR Code Scan Handler
const scanAttendance = async (req, res) => {
  try {
    // Check if attendance session is currently ACTIVE
    const activeSession = await AttendanceSession.findOne({ status: 'ACTIVE' });

    if (!activeSession) {
      return res.status(400).json({
        success: false,
        message: 'Attendance is currently closed. Please wait for the administrator to start attendance.'
      });
    }

    const { token, registrationId, qrToken } = req.body;
    let rawInput = (token || registrationId || qrToken || '').trim();

    if (!rawInput) {
      return res.status(400).json({
        success: false,
        message: 'QR Code payload or Participant ID is required.'
      });
    }

    // Try parsing as JSON if rawInput starts with '{'
    let inputToken = rawInput;
    if (rawInput.startsWith('{')) {
      try {
        const parsed = JSON.parse(rawInput);
        inputToken = (parsed.qrToken || parsed.registrationId || parsed.ticketId || parsed.token || rawInput).trim();
      } catch (e) {
        inputToken = rawInput;
      }
    }

    // Lookup participant in Ticket or Registration models
    let ticket = await Ticket.findOne({
      $or: [
        { qrToken: inputToken },
        { ticketId: inputToken },
        { registrationId: inputToken }
      ]
    });

    let registration = null;
    if (ticket) {
      registration = await Registration.findOne({ registrationId: ticket.registrationId });
    } else {
      registration = await Registration.findOne({
        $or: [
          { registrationId: inputToken },
          { studentId: inputToken },
          { email: inputToken.toLowerCase() }
        ]
      });
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'INVALID QR CODE. Participant registration not found.'
      });
    }

    // Check if participant is already marked present in the active session
    const existingRecord = await AttendanceRecord.findOne({
      sessionId: activeSession._id,
      registrationId: registration.registrationId
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        alreadyCheckedIn: true,
        message: 'ALREADY PRESENT',
        participant: {
          name: registration.fullName,
          email: registration.email,
          registrationId: registration.registrationId,
          studentId: registration.studentId || registration.registrationId,
          department: registration.department,
          year: registration.year,
          scannedAt: existingRecord.scannedAt,
          scannedByName: existingRecord.scannedByName || 'Volunteer'
        }
      });
    }

    // Create unique AttendanceRecord
    const volunteerName = req.user ? (req.user.name || req.user.email || 'Volunteer') : 'Volunteer';
    const volunteerId = req.user ? req.user._id : null;
    const now = new Date();

    let newRecord;
    try {
      newRecord = await AttendanceRecord.create({
        sessionId: activeSession._id,
        registrationId: registration.registrationId,
        participantName: registration.fullName,
        participantEmail: registration.email,
        studentId: registration.studentId || registration.registrationId,
        department: registration.department,
        year: registration.year,
        scannedBy: volunteerId,
        scannedByName: volunteerName,
        scannedAt: now,
        status: 'PRESENT'
      });
    } catch (dbErr) {
      // Handle MongoDB 11000 Duplicate Key Error (Concurrent Scans)
      if (dbErr.code === 11000) {
        return res.status(400).json({
          success: false,
          alreadyCheckedIn: true,
          message: 'ALREADY PRESENT',
          participant: {
            name: registration.fullName,
            email: registration.email,
            registrationId: registration.registrationId,
            studentId: registration.studentId || registration.registrationId,
            department: registration.department,
            year: registration.year,
            scannedAt: now,
            scannedByName: volunteerName
          }
        });
      }
      throw dbErr;
    }

    // Update active session present count atomically
    const newCount = await AttendanceRecord.countDocuments({ sessionId: activeSession._id });
    activeSession.presentCount = newCount;
    await activeSession.save();

    // Maintain backwards compatibility with legacy models
    registration.status = 'ATTENDED';
    await registration.save();

    if (ticket) {
      ticket.status = 'USED';
      await ticket.save();
    }

    await Attendance.findOneAndUpdate(
      { registrationId: registration.registrationId },
      {
        registrationId: registration.registrationId,
        ticketId: ticket ? ticket.ticketId : `TKT-${registration.registrationId}`,
        checkedIn: true,
        status: 'PRESENT',
        participantName: registration.fullName,
        participantEmail: registration.email,
        department: registration.department,
        checkedInAt: now,
        scannedAt: now
      },
      { upsert: true, new: true }
    );

    // Emit Socket broadcast to all connected volunteer devices and Admin
    const io = req.app.get('io');
    if (io) {
      io.emit('attendance_updated', {
        presentCount: newCount,
        lastScan: {
          participantName: registration.fullName,
          registrationId: registration.registrationId,
          studentId: registration.studentId || registration.registrationId,
          department: registration.department,
          year: registration.year,
          scannedByName: volunteerName,
          scannedAt: now
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: '✓ ATTENDANCE MARKED',
      presentCount: newCount,
      participant: {
        name: registration.fullName,
        email: registration.email,
        registrationId: registration.registrationId,
        studentId: registration.studentId || registration.registrationId,
        department: registration.department,
        year: registration.year,
        scannedAt: now,
        scannedByName: volunteerName
      }
    });
  } catch (error) {
    console.error('[Scan Attendance Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Volunteer Management Controllers (Admin)
const getVolunteers = async (req, res) => {
  try {
    const volunteers = await AttendanceVolunteer.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      volunteers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createVolunteer = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required for volunteer creation.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await AttendanceVolunteer.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A volunteer with this email already exists.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const volunteer = await AttendanceVolunteer.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      status: 'ACTIVE',
      createdBy: req.user ? req.user._id : null
    });

    return res.status(201).json({
      success: true,
      message: 'Volunteer account created successfully.',
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        status: volunteer.status
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateVolunteerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, newPassword } = req.body;

    const volunteer = await AttendanceVolunteer.findById(id);
    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer account not found.' });
    }

    if (status) {
      volunteer.status = status;
    }

    if (newPassword) {
      volunteer.password = await bcrypt.hash(newPassword, 10);
    }

    await volunteer.save();

    return res.status(200).json({
      success: true,
      message: 'Volunteer account updated successfully.',
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        status: volunteer.status
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    await AttendanceVolunteer.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: 'Volunteer account deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Session History & Records (Admin)
const getSessionHistory = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find().sort({ startedAt: -1 }).limit(30);
    return res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSessionRecords = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const records = await AttendanceRecord.find({ sessionId }).sort({ scannedAt: -1 });
    return res.status(200).json({
      success: true,
      records
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  volunteerLogin,
  getVolunteerMe,
  startSession,
  closeSession,
  getCurrentSession,
  scanAttendance,
  getAttendanceStatus: getCurrentSession,
  getAttendanceStats: getCurrentSession,
  getVolunteers,
  createVolunteer,
  updateVolunteerStatus,
  deleteVolunteer,
  getSessionHistory,
  getSessionRecords
};
