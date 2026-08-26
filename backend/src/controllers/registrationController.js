const QRCodeLib = require('qrcode');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const Ticket = require('../models/Ticket');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const { sendRegistrationSuccessEmail } = require('../services/emailService');

const ensureTicketForRegistration = async (registration) => {
  try {
    let ticket = await Ticket.findOne({ registrationId: registration.registrationId });
    if (!ticket) {
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const ticketId = `TKT-${randomCode}`;
      const qrToken = `KARE-IEEE-VERIFY-${registration.registrationId}-${ticketId}`;
      const qrCodeDataUrl = await QRCodeLib.toDataURL(qrToken, { width: 300, margin: 2 });

      ticket = await Ticket.create({
        ticketId,
        registrationId: registration.registrationId,
        userId: registration.userId,
        eventId: registration.eventId,
        qrToken,
        qrCodeDataUrl,
        status: 'VALID',
        generatedAt: Date.now()
      });
    }
    return ticket;
  } catch (err) {
    console.error('[Ticket QR Auto-Generation Error]', err);
    return null;
  }
};

const generateSequentialRegistrationId = async () => {
  const registrations = await Registration.find({}, { registrationId: 1 }).lean();
  let maxNum = 0;
  for (const reg of registrations) {
    if (reg.registrationId) {
      const match = reg.registrationId.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  const nextSeq = (maxNum + 1).toString().padStart(4, '0');
  return `REG-KLU-5775-${nextSeq}`;
};

const createRegistration = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    // Check if user already registered
    const existingReg = await Registration.findOne({ userId });
    if (existingReg) {
      const existingTicket = await ensureTicketForRegistration(existingReg);
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this workshop.',
        registration: existingReg,
        ticket: existingTicket
      });
    }

    // Fetch Event & Check Capacity
    let event = await Event.findOne();
    const capacity = event ? event.capacity : parseInt(process.env.EVENT_CAPACITY || '200');
    const registeredCount = await Registration.countDocuments();

    if (registeredCount >= capacity) {
      return res.status(400).json({
        success: false,
        message: 'Registration is full. Capacity has been reached.'
      });
    }

    const eventId = event ? event._id : null;

    // Generate unique Registration ID: EDS-WS-001
    const registrationId = await generateSequentialRegistrationId();

    const {
      fullName,
      phone,
      college,
      studentId,
      department,
      year,
      section,
      residency
    } = req.body;

    const newRegistration = await Registration.create({
      registrationId,
      userId,
      eventId: eventId || userId,
      fullName: fullName || req.user.name,
      email: userEmail,
      phone,
      college: college || 'Kalasalingam Academy of Research and Education (KARE)',
      studentId,
      department,
      year,
      section: section || 'A',
      residency: residency || 'Day Scholar',
      status: 'REGISTERED'
    });

    const ticket = await ensureTicketForRegistration(newRegistration);

    // Send confirmation email asynchronously
    sendRegistrationSuccessEmail(newRegistration, event || { eventName: 'AI/ML Workshop', date: '2026-09-15', venue: 'IEEE Tech Hall' });

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      registration: newRegistration,
      ticket
    });
  } catch (error) {
    console.error('[Registration Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMyRegistration = async (req, res) => {
  try {
    const userId = req.user._id;

    const registration = await Registration.findOne({ userId });
    if (!registration) {
      return res.status(200).json({
        success: true,
        registration: null,
        statusSummary: {
          registration: 'Not Registered',
          payment: 'Not Submitted',
          ticket: 'Not Available',
          attendance: 'Not Checked In',
          certificate: 'Not Available'
        }
      });
    }

    const ticket = await ensureTicketForRegistration(registration);
    const payment = await Payment.findOne({ registrationId: registration.registrationId });
    const attendance = await Attendance.findOne({ registrationId: registration.registrationId });
    const certificate = await Certificate.findOne({ registrationId: registration.registrationId });

    const statusSummary = {
      registration: 'Registered',
      payment: payment ? payment.status : 'Not Submitted',
      ticket: ticket ? 'Available' : 'Not Available',
      attendance: attendance && attendance.checkedIn ? 'Checked In' : 'Not Checked In',
      certificate: certificate ? 'Available' : 'Not Available'
    };

    return res.status(200).json({
      success: true,
      registration,
      payment,
      ticket,
      attendance,
      certificate,
      statusSummary
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findOne({ registrationId: id });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    return res.status(200).json({ success: true, registration });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const lockSeat = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : '';

    // 1. SECURITY REQUIREMENT: Backend verification for @klu.ac.in
    if (!userEmail.endsWith('@klu.ac.in') && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Please sign in using your KLU (@klu.ac.in) account.'
      });
    }

    // 2. Fetch Event details & Enforce Limits
    let event = await Event.findOne();
    const capacity = event ? event.capacity : parseInt(process.env.EVENT_CAPACITY || '200');
    const registrationLimit = event?.registrationLimit !== undefined ? event.registrationLimit : capacity;
    const registrationOpen = event ? (event.registrationOpen !== false) : true;
    const registrationEnd = event?.registrationEnd || event?.registrationDeadline || '2026-08-28T23:59:59.000Z';

    const now = new Date();
    if (now > new Date(registrationEnd) || !registrationOpen) {
      return res.status(400).json({
        success: false,
        message: 'Registration is currently closed.'
      });
    }

    // Check Total Registrations vs Limit
    const currentRegCount = await Registration.countDocuments({ seatStatus: { $in: ['LOCKED', 'CONFIRMED'] } });
    let existingReg = await Registration.findOne({ $or: [{ userId }, { email: userEmail }] });

    if (currentRegCount >= registrationLimit && !existingReg) {
      return res.status(400).json({
        success: false,
        message: 'Registration limit reached. Registration is closed.'
      });
    }
    
    if (existingReg) {
      if (existingReg.seatStatus === 'CONFIRMED' || existingReg.paymentStatus === 'PAID' || existingReg.paymentStatus === 'VERIFIED') {
        return res.status(400).json({
          success: false,
          isAlreadyRegistered: true,
          message: 'You are already registered for this event.',
          registration: existingReg
        });
      }

      // If active lock exists, extend/refresh lock
      const lockMinutes = parseInt(process.env.SEAT_LOCK_MINUTES || '10', 10);
      if (existingReg.seatStatus === 'LOCKED' && existingReg.lockExpiresAt > now) {
        const lockDuration = lockMinutes * 60 * 1000;
        existingReg.lockedAt = now;
        existingReg.lockExpiresAt = new Date(now.getTime() + lockDuration);
        await existingReg.save();

        return res.status(200).json({
          success: true,
          message: `Seat locked for payment (${lockMinutes} minutes remaining)`,
          registration: existingReg,
          lockDurationMinutes: lockMinutes,
          expiresAt: existingReg.lockExpiresAt
        });
      }
    }

    // 4. Capacity Check
    const confirmedCount = await Registration.countDocuments({
      $or: [
        { seatStatus: 'CONFIRMED' },
        { paymentStatus: { $in: ['PAID', 'VERIFIED'] } },
        { status: { $in: ['PAYMENT_VERIFIED', 'ATTENDED'] } }
      ]
    });

    const activeLockedCount = await Registration.countDocuments({
      seatStatus: 'LOCKED',
      lockExpiresAt: { $gt: now }
    });

    if (confirmedCount + activeLockedCount >= capacity) {
      return res.status(400).json({
        success: false,
        message: 'REGISTRATION FULL. No seats remaining at this time.'
      });
    }

    // 5. Create new lock
    const registrationId = await generateSequentialRegistrationId();
    const lockMinutes = parseInt(process.env.SEAT_LOCK_MINUTES || '10', 10);
    const lockDuration = lockMinutes * 60 * 1000;
    const lockExpiresAt = new Date(now.getTime() + lockDuration);

    const {
      fullName,
      phone,
      studentId,
      department,
      year,
      section,
      residency,
      photoURL
    } = req.body;

    if (existingReg) {
      existingReg.seatStatus = 'LOCKED';
      existingReg.paymentStatus = 'PENDING';
      existingReg.lockedAt = now;
      existingReg.lockExpiresAt = lockExpiresAt;
      if (fullName) existingReg.fullName = fullName;
      if (phone) existingReg.phone = phone;
      if (studentId) existingReg.studentId = studentId;
      if (department) existingReg.department = department;
      if (year) existingReg.year = year;
      if (section) existingReg.section = section;
      if (residency) existingReg.residency = residency;
      await existingReg.save();

      return res.status(200).json({
        success: true,
        message: `Seat locked successfully for ${lockMinutes} minutes.`,
        registration: existingReg,
        lockDurationMinutes: lockMinutes,
        expiresAt: lockExpiresAt
      });
    }

    const newRegistration = await Registration.create({
      registrationId,
      userId,
      eventId: event ? event._id : userId,
      fullName: fullName || req.user.name || userEmail.split('@')[0],
      email: userEmail,
      phone: phone || '',
      studentId: studentId || '',
      department: department || 'CSE',
      year: year || '3rd Year',
      section: section || 'A',
      residency: residency || 'Day Scholar',
      photoURL: photoURL || req.user.profilePhoto || '',
      firebaseUid: req.user.googleId || '',
      paymentStatus: 'PENDING',
      seatStatus: 'LOCKED',
      lockedAt: now,
      lockExpiresAt,
      status: 'REGISTERED'
    });

    return res.status(201).json({
      success: true,
      message: `Seat locked successfully for ${lockMinutes} minutes.`,
      registration: newRegistration,
      lockDurationMinutes: lockMinutes,
      expiresAt: lockExpiresAt
    });
  } catch (error) {
    console.error('[Lock Seat Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { registrationId, transactionId, paymentMethod } = req.body;

    const registration = await Registration.findOne({
      $or: [
        { registrationId },
        { userId }
      ]
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration session not found.' });
    }

    const now = new Date();
    const lockMinutes = parseInt(process.env.SEAT_LOCK_MINUTES || '10', 10);
    if (registration.seatStatus === 'LOCKED' && registration.lockExpiresAt < now) {
      return res.status(400).json({
        success: false,
        message: `Your ${lockMinutes}-minute seat lock has expired. Please initiate registration again.`
      });
    }

    // Keep payment status as PENDING for admin manual verification
    registration.paymentStatus = 'PENDING';
    registration.status = 'PAYMENT_SUBMITTED';
    await registration.save();

    // Create or update Payment record with PENDING status
    let payment = await Payment.findOne({ registrationId: registration.registrationId });
    if (!payment) {
      payment = await Payment.create({
        registrationId: registration.registrationId,
        userId: registration.userId,
        transactionId: transactionId || `UPI-${Date.now()}`,
        amount: parseInt(process.env.REGISTRATION_FEE || '250'),
        paymentMethod: paymentMethod || 'UPI',
        status: 'PENDING',
        submittedAt: now
      });
    } else {
      payment.status = 'PENDING';
      payment.transactionId = transactionId || payment.transactionId;
      payment.submittedAt = now;
      await payment.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Payment proof submitted successfully! Pending admin verification.',
      registration,
      payment
    });
  } catch (error) {
    console.error('[Confirm Payment Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRegistration,
  lockSeat,
  confirmPayment,
  getMyRegistration,
  getRegistrationById
};
