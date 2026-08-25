const Attendance = require('../models/Attendance');
const Ticket = require('../models/Ticket');
const Registration = require('../models/Registration');
const Certificate = require('../models/Certificate');
const Event = require('../models/Event');

// 1. Scan / Mark Attendance (for /attend route & Admin scanner)
const scanAttendance = async (req, res) => {
  try {
    const { token, registrationId, qrToken } = req.body;
    const inputToken = (token || registrationId || qrToken || '').trim();

    if (!inputToken) {
      return res.status(400).json({
        success: false,
        message: 'Scan token, Participant ID, or QR payload is required.'
      });
    }

    // A. Check Event Configuration & Limits
    const event = await Event.findOne() || {
      eventName: 'Intelligent Yield Prediction & AI/ML Workshop',
      attendanceOpen: true,
      attendanceLimit: 200
    };

    if (event.attendanceOpen === false) {
      return res.status(400).json({
        success: false,
        message: 'Attendance is currently closed.'
      });
    }

    const currentAttendanceCount = await Attendance.countDocuments({ checkedIn: true });
    const limit = event.attendanceLimit !== undefined ? event.attendanceLimit : (event.capacity || 200);

    if (currentAttendanceCount >= limit) {
      return res.status(400).json({
        success: false,
        message: `Attendance limit reached (${limit} participants max).`
      });
    }

    // B. Lookup Participant Registration / Ticket
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
        message: '✗ Invalid QR code. Participant registration record not found.'
      });
    }

    // C. Duplicate Attendance Check
    const existingAttendance = await Attendance.findOne({ registrationId: registration.registrationId });
    if (existingAttendance && existingAttendance.checkedIn) {
      return res.status(400).json({
        success: false,
        alreadyCheckedIn: true,
        message: 'Attendance already marked for this participant.',
        attendance: existingAttendance,
        participant: {
          name: registration.fullName,
          email: registration.email,
          registrationId: registration.registrationId,
          studentId: registration.studentId || registration.registrationId,
          department: registration.department,
          year: registration.year,
          checkedInAt: existingAttendance.checkedInAt || existingAttendance.scannedAt
        }
      });
    }

    // D. Create Attendance Entry
    if (!ticket) {
      ticket = await Ticket.findOne({ registrationId: registration.registrationId });
    }

    const now = new Date();
    const attendance = await Attendance.create({
      registrationId: registration.registrationId,
      ticketId: ticket ? ticket.ticketId : `TKT-${registration.registrationId}`,
      userId: registration.userId,
      eventId: registration.eventId || event._id,
      workshopId: 'AI_ML_2026',
      checkedIn: true,
      status: 'PRESENT',
      participantName: registration.fullName,
      participantEmail: registration.email,
      department: registration.department,
      checkedInAt: now,
      scannedAt: now,
      checkedInBy: req.user ? req.user._id : null,
      scannedBy: req.user ? req.user._id : null
    });

    // Update Registration & Ticket statuses
    registration.status = 'ATTENDED';
    await registration.save();

    if (ticket) {
      ticket.status = 'USED';
      await ticket.save();
    }

    // Generate Certificate record eligibility
    const certCode = `CERT-KLU-2026-${registration.registrationId.split('-').pop()}`;
    await Certificate.findOneAndUpdate(
      { registrationId: registration.registrationId },
      {
        certificateId: certCode,
        registrationId: registration.registrationId,
        userId: registration.userId,
        eventId: registration.eventId || event._id,
        certificateUrl: `/api/certificates/${registration.registrationId}/download`,
        generatedAt: now
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: '✓ Attendance Marked Successfully (PRESENT)',
      attendance,
      participant: {
        name: registration.fullName,
        email: registration.email,
        registrationId: registration.registrationId,
        studentId: registration.studentId || registration.registrationId,
        department: registration.department,
        year: registration.year,
        checkedInAt: now
      }
    });
  } catch (error) {
    console.error('[Scan Attendance Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Public / Team Attendance Status for /attend Route
const getAttendanceStatus = async (req, res) => {
  try {
    const event = await Event.findOne() || {
      eventName: 'Intelligent Yield Prediction & AI/ML Workshop',
      attendanceOpen: true,
      attendanceLimit: 200,
      registrationLimit: 200,
      registrationOpen: true
    };

    const currentAttendance = await Attendance.countDocuments({ checkedIn: true });
    const currentRegistrations = await Registration.countDocuments();

    const attLimit = event.attendanceLimit !== undefined ? event.attendanceLimit : (event.capacity || 200);
    const regLimit = event.registrationLimit !== undefined ? event.registrationLimit : (event.capacity || 200);

    return res.status(200).json({
      success: true,
      eventName: event.eventName || 'Intelligent Yield Prediction & AI/ML Workshop',
      attendanceOpen: event.attendanceOpen !== false,
      attendanceLimit: attLimit,
      currentAttendance,
      remainingAttendanceSlots: Math.max(0, attLimit - currentAttendance),
      registrationOpen: event.registrationOpen !== false,
      registrationLimit: regLimit,
      currentRegistrations,
      remainingRegistrationSlots: Math.max(0, regLimit - currentRegistrations)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Attendance Stats & Recent Scans Feed
const getAttendanceStats = async (req, res) => {
  try {
    const event = await Event.findOne() || {
      eventName: 'Intelligent Yield Prediction & AI/ML Workshop',
      attendanceOpen: true,
      attendanceLimit: 200
    };

    const totalRegistrations = await Registration.countDocuments();
    const currentAttendance = await Attendance.countDocuments({ checkedIn: true });
    const limit = event.attendanceLimit !== undefined ? event.attendanceLimit : (event.capacity || 200);
    const absentCount = Math.max(0, totalRegistrations - currentAttendance);

    const recentScans = await Attendance.find({ checkedIn: true })
      .sort({ checkedInAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      eventName: event.eventName,
      attendanceOpen: event.attendanceOpen !== false,
      attendanceLimit: limit,
      currentAttendance,
      remainingSlots: Math.max(0, limit - currentAttendance),
      totalRegistrations,
      absentCount,
      recentScans
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  scanAttendance,
  checkInParticipant: scanAttendance,
  getAttendanceStatus,
  getAttendanceStats
};
