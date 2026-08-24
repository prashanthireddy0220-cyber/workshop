const Attendance = require('../models/Attendance');
const Ticket = require('../models/Ticket');
const Registration = require('../models/Registration');
const Certificate = require('../models/Certificate');

const checkInParticipant = async (req, res) => {
  try {
    const { token, eventId, workshopId } = req.body; // qrToken, ticketId, or registrationId
    if (!token) {
      return res.status(400).json({ success: false, message: 'Scan token or Registration/Ticket ID is required.' });
    }

    const trimmedToken = token.trim();

    // 1. Find Ticket or Registration
    let ticket = await Ticket.findOne({
      $or: [
        { qrToken: trimmedToken },
        { ticketId: trimmedToken },
        { registrationId: trimmedToken }
      ]
    });

    let registration = null;

    if (ticket) {
      registration = await Registration.findOne({ registrationId: ticket.registrationId });
    } else {
      // Direct lookup by registrationId
      registration = await Registration.findOne({ registrationId: trimmedToken });
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '✗ Invalid QR code. Registration record not found.'
      });
    }

    // 2. Validate Workshop / Event Match if specified
    if (eventId && registration.eventId && registration.eventId.toString() !== eventId.toString()) {
      return res.status(400).json({
        success: false,
        message: '✗ This QR code is registered for a different workshop/event.'
      });
    }

    if (workshopId && registration.workshopId && registration.workshopId !== workshopId) {
      return res.status(400).json({
        success: false,
        message: '✗ This QR code is registered for a different workshop.'
      });
    }

    // Ensure Ticket exists for attendance record
    if (!ticket) {
      ticket = await Ticket.findOne({ registrationId: registration.registrationId });
    }

    // 3. Duplicate Scan Check
    const existingAttendance = await Attendance.findOne({ registrationId: registration.registrationId });
    if (existingAttendance && existingAttendance.checkedIn) {
      return res.status(400).json({
        success: false,
        alreadyCheckedIn: true,
        message: 'Attendance already marked',
        attendance: existingAttendance,
        participant: {
          name: registration.fullName,
          registrationId: registration.registrationId,
          studentId: registration.studentId || registration.registrationId,
          department: registration.department,
          year: registration.year,
          checkedInAt: existingAttendance.checkedInAt
        }
      });
    }

    // 4. Record Attendance Check-In
    const attendance = await Attendance.create({
      registrationId: registration.registrationId,
      ticketId: ticket ? ticket.ticketId : `TKT-${registration.registrationId}`,
      userId: registration.userId,
      eventId: registration.eventId,
      workshopId: workshopId || 'AI_ML_2026',
      checkedIn: true,
      checkedInAt: Date.now(),
      checkedInBy: req.user ? req.user._id : null
    });

    // Update Registration and Ticket statuses
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
        eventId: registration.eventId,
        certificateUrl: `/api/certificates/${registration.registrationId}/download`,
        generatedAt: Date.now()
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: '✓ Attendance Marked Successfully!',
      attendance,
      participant: {
        name: registration.fullName,
        registrationId: registration.registrationId,
        email: registration.email,
        studentId: registration.studentId || registration.registrationId,
        department: registration.department,
        year: registration.year,
        checkedInAt: attendance.checkedInAt
      }
    });
  } catch (error) {
    console.error('[Check-In Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { checkInParticipant };
