const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const Ticket = require('../models/Ticket');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const Workshop = require('../models/Workshop');
const Announcement = require('../models/Announcement');
const Gallery = require('../models/Gallery');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const QRCodeLib = require('qrcode');
const { generateTicketPDF, generateCertificatePDF } = require('../services/pdfService');
const { sendPaymentApprovedEmail, sendPaymentRejectedEmail } = require('../services/emailService');

// Safe Payment record finder to prevent Mongoose CastError on custom string registration IDs
const findPaymentByRef = async (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    return await Payment.findOne({ $or: [{ registrationId: id }, { _id: id }] });
  }
  return await Payment.findOne({ registrationId: id });
};

// 1. Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const event = await Event.findOne();
    const capacity = event ? event.capacity : parseInt(process.env.EVENT_CAPACITY || '200');
    const fee = event ? event.registrationFee : parseInt(process.env.REGISTRATION_FEE || '250');

    const now = new Date();
    const confirmedRegistrations = await Registration.countDocuments({
      $or: [
        { seatStatus: 'CONFIRMED' },
        { paymentStatus: { $in: ['PAID', 'VERIFIED'] } },
        { status: { $in: ['PAYMENT_VERIFIED', 'ATTENDED'] } }
      ]
    });

    const lockedSeats = await Registration.countDocuments({
      seatStatus: 'LOCKED',
      lockExpiresAt: { $gt: now }
    });

    const totalRegistrations = await Registration.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'participant' });
    const totalWorkshops = await Workshop.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalPaymentsSubmitted = await Payment.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: 'PENDING' });
    const verifiedPayments = await Payment.countDocuments({ status: 'VERIFIED' });
    const rejectedPayments = await Payment.countDocuments({ status: 'REJECTED' });

    const availableSeats = Math.max(0, capacity - confirmedRegistrations - lockedSeats);
    const totalAttendance = await Attendance.countDocuments({ checkedIn: true });
    const totalCertificates = await Certificate.countDocuments();

    const totalRevenue = verifiedPayments * fee;
    const attendanceRate = verifiedPayments > 0 ? ((totalAttendance / verifiedPayments) * 100).toFixed(1) : 0;

    const recentRegistrations = await Registration.find().sort({ createdAt: -1 }).limit(5).lean();

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalWorkshops: totalWorkshops || 1,
        totalEvents: totalEvents || 1,
        totalRegistrations,
        confirmedRegistrations,
        lockedSeats,
        availableSeats,
        totalPaymentsSubmitted,
        pendingPayments,
        verifiedPayments,
        rejectedPayments,
        capacity,
        remainingSeats: availableSeats,
        totalAttendance,
        attendanceRate: `${attendanceRate}%`,
        totalRevenue,
        registrationFee: fee,
        certificatesGenerated: totalCertificates,
        registrationStart: event?.registrationStart,
        registrationEnd: event?.registrationEnd || event?.registrationDeadline,
        registrationOpen: event ? event.registrationOpen : true
      },
      recentRegistrations
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Event Configuration Update
const updateEventConfig = async (req, res) => {
  try {
    const {
      eventName,
      venue,
      date,
      capacity,
      registrationFee,
      paymentUPI,
      registrationStart,
      registrationEnd,
      registrationOpen,
      description,
      paymentQR,
      paymentQRActive,
      whatsappGroupLink
    } = req.body;

    let event = await Event.findOne();
    if (!event) {
      event = new Event({
        eventName: eventName || 'Intelligent Yield Prediction & AI/ML Workshop',
        description: description || 'KARE IEEE Education Society Workshop',
        venue: venue || 'IEEE Tech Hall, KARE Campus',
        date: date || '2026-09-15',
        capacity: capacity || 200,
        registrationFee: registrationFee || 300,
        paymentUPI: paymentUPI || 'ieee.kare@upi',
        paymentQR: paymentQR || '/assets/payment-qr.png',
        paymentQRActive: paymentQRActive !== undefined ? paymentQRActive : true,
        paymentQRUpdatedAt: Date.now(),
        whatsappGroupLink: whatsappGroupLink || 'https://chat.whatsapp.com/ieee-edu-society-workshop',
        registrationStart: registrationStart || '2026-08-01T00:00:00.000Z',
        registrationEnd: registrationEnd || '2026-08-28T23:59:59.000Z',
        registrationOpen: registrationOpen !== undefined ? registrationOpen : true
      });
    } else {
      if (eventName !== undefined) event.eventName = eventName;
      if (venue !== undefined) event.venue = venue;
      if (date !== undefined) event.date = date;
      if (capacity !== undefined) event.capacity = capacity;
      if (registrationFee !== undefined) event.registrationFee = registrationFee;
      if (paymentUPI !== undefined) event.paymentUPI = paymentUPI;
      if (paymentQR !== undefined) {
        event.paymentQR = paymentQR;
        event.paymentQRUpdatedAt = Date.now();
      }
      if (paymentQRActive !== undefined) event.paymentQRActive = paymentQRActive;
      if (whatsappGroupLink !== undefined) event.whatsappGroupLink = whatsappGroupLink;
      if (registrationStart !== undefined) event.registrationStart = registrationStart;
      if (registrationEnd !== undefined) {
        event.registrationEnd = registrationEnd;
        event.registrationDeadline = registrationEnd;
      }
      if (registrationOpen !== undefined) event.registrationOpen = registrationOpen;
      if (description !== undefined) event.description = description;
    }

    await event.save();

    return res.status(200).json({
      success: true,
      message: 'Event & website content configuration updated successfully!',
      event
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Registrations List
const getRegistrationsList = async (req, res) => {
  try {
    const { q, department, year, paymentStatus, attendanceStatus } = req.query;

    let filter = {};

    if (department) filter.department = department;
    if (year) filter.year = year;
    if (paymentStatus) filter.status = paymentStatus;

    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { registrationId: regex },
        { fullName: regex },
        { email: regex },
        { phone: regex },
        { studentId: regex }
      ];
    }

    let registrations = await Registration.find(filter).sort({ createdAt: -1 }).lean();

    const regIds = registrations.map((r) => r.registrationId);
    const payments = await Payment.find({ registrationId: { $in: regIds } }).lean();
    const attendances = await Attendance.find({ registrationId: { $in: regIds } }).lean();
    const tickets = await Ticket.find({ registrationId: { $in: regIds } }).lean();
    const certificates = await Certificate.find({ registrationId: { $in: regIds } }).lean();

    const paymentMap = {};
    payments.forEach((p) => (paymentMap[p.registrationId] = p));

    const attendanceMap = {};
    attendances.forEach((a) => (attendanceMap[a.registrationId] = a));

    const ticketMap = {};
    tickets.forEach((t) => (ticketMap[t.registrationId] = t));

    const certMap = {};
    certificates.forEach((c) => (certMap[c.registrationId] = c));

    const enrichedList = registrations.map((reg) => ({
      ...reg,
      payment: paymentMap[reg.registrationId] || null,
      ticket: ticketMap[reg.registrationId] || null,
      attendance: attendanceMap[reg.registrationId] ? attendanceMap[reg.registrationId].checkedIn : false,
      certificate: certMap[reg.registrationId] || null
    }));

    if (attendanceStatus) {
      const isAttended = attendanceStatus === 'ATTENDED';
      const filteredEnriched = enrichedList.filter((item) => item.attendance === isAttended);
      return res.status(200).json({ success: true, count: filteredEnriched.length, registrations: filteredEnriched });
    }

    return res.status(200).json({
      success: true,
      count: enrichedList.length,
      registrations: enrichedList
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Payment Approval
const approvePayment = async (req, res) => {
  try {
    const { id } = req.params; // e.g. "KLU-ML-2026-0001" or ObjectId

    let payment = await findPaymentByRef(id);
    let registration = await Registration.findOne({ registrationId: id });
    if (!registration && payment) {
      registration = await Registration.findOne({ registrationId: payment.registrationId });
    }

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found' });
    }

    if (!payment) {
      // Auto-create verified Payment record if missing
      payment = await Payment.create({
        registrationId: registration.registrationId,
        userId: registration.userId,
        amount: 250,
        transactionId: `UPI-ADMIN-${Date.now()}`,
        screenshotUrl: '/uploads/manual_admin_approval.png',
        status: 'VERIFIED',
        verifiedBy: req.user ? req.user._id : null,
        verifiedAt: Date.now()
      });
    } else {
      payment.status = 'VERIFIED';
      payment.verifiedBy = req.user ? req.user._id : null;
      payment.verifiedAt = Date.now();
      payment.rejectionReason = '';
      await payment.save();
    }

    registration.status = 'PAYMENT_VERIFIED';
    registration.paymentStatus = 'VERIFIED';
    await registration.save();

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

    const event = await Event.findOne() || {
      eventName: 'Intelligent Yield Prediction & AI/ML Workshop',
      date: '2026-09-15',
      venue: 'IEEE Tech Hall, KARE Campus'
    };

    try {
      const ticketPdfBuffer = await generateTicketPDF(ticket, registration, event);
      sendPaymentApprovedEmail(registration, ticket, event, ticketPdfBuffer);
    } catch (pdfErr) {
      console.error('[PDF Generation Error]', pdfErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment approved successfully! Ticket generated & confirmation email sent.',
      payment,
      ticket
    });
  } catch (error) {
    console.error('[Approve Payment Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Payment Rejection
const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    let payment = await findPaymentByRef(id);
    let registration = await Registration.findOne({ registrationId: id });
    if (!registration && payment) {
      registration = await Registration.findOne({ registrationId: payment.registrationId });
    }

    if (!payment && !registration) {
      return res.status(404).json({ success: false, message: 'Payment or Registration record not found' });
    }

    if (!payment && registration) {
      payment = await Payment.create({
        registrationId: registration.registrationId,
        userId: registration.userId,
        amount: 250,
        transactionId: 'N/A',
        screenshotUrl: '',
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Transaction ID or screenshot does not match payment records.',
        verifiedBy: req.user ? req.user._id : null,
        verifiedAt: Date.now()
      });
    } else {
      payment.status = 'REJECTED';
      payment.rejectionReason = rejectionReason || 'Transaction ID or screenshot does not match payment records.';
      payment.verifiedBy = req.user ? req.user._id : null;
      payment.verifiedAt = Date.now();
      await payment.save();
    }

    if (registration) {
      registration.status = 'PAYMENT_REJECTED';
      registration.paymentStatus = 'REJECTED';
      await registration.save();
      sendPaymentRejectedEmail(registration, payment.rejectionReason);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment rejected. Notification sent to participant.',
      payment
    });
  } catch (error) {
    console.error('[Reject Payment Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Search Participants
const searchParticipants = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query parameter (q) is required' });
    }

    const regex = new RegExp(q, 'i');
    const registrations = await Registration.find({
      $or: [
        { registrationId: regex },
        { fullName: regex },
        { email: regex },
        { phone: regex },
        { studentId: regex }
      ]
    }).lean();

    return res.status(200).json({ success: true, count: registrations.length, participants: registrations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Workshop Management (CRUD)
const getWorkshops = async (req, res) => {
  try {
    let workshops = await Workshop.find().sort({ createdAt: -1 });
    if (workshops.length === 0) {
      const defaultWS = await Workshop.create({
        title: 'Intelligent Yield Prediction using CNNs, LSTMs & Transformers',
        description: 'Learn Deep Learning techniques with practical implementation, real datasets, and industry guidance.',
        date: '2026-09-15',
        startTime: '09:30 AM',
        endTime: '05:00 PM',
        venue: 'IEEE Tech Hall, KARE Campus',
        capacity: 200,
        registrationFee: 250,
        status: 'UPCOMING',
        registrationOpen: true
      });
      workshops = [defaultWS];
    }
    return res.status(200).json({ success: true, workshops });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.create(req.body);
    return res.status(201).json({ success: true, message: 'Workshop created successfully', workshop });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const workshop = await Workshop.findByIdAndUpdate(id, req.body, { new: true });
    if (!workshop) return res.status(404).json({ success: false, message: 'Workshop not found' });
    return res.status(200).json({ success: true, message: 'Workshop updated successfully', workshop });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    await Workshop.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Workshop deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Attendance Marking & Management
const markAttendanceAdmin = async (req, res) => {
  try {
    const { registrationId, status } = req.body; // status: true / false
    if (!registrationId) return res.status(400).json({ success: false, message: 'Registration ID is required' });

    const registration = await Registration.findOne({ registrationId });
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    let attendance = await Attendance.findOne({ registrationId });
    if (!attendance) {
      attendance = new Attendance({
        registrationId,
        userId: registration.userId,
        checkedIn: status,
        checkedInAt: status ? Date.now() : null
      });
    } else {
      attendance.checkedIn = status;
      attendance.checkedInAt = status ? (attendance.checkedInAt || Date.now()) : null;
    }

    await attendance.save();
    if (status) {
      registration.status = 'ATTENDED';
      await registration.save();
    }

    return res.status(200).json({ success: true, message: `Attendance marked as ${status ? 'PRESENT' : 'ABSENT'}`, attendance });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Certificate Issue Admin
const issueCertificateAdmin = async (req, res) => {
  try {
    const { registrationId } = req.body;
    const registration = await Registration.findOne({ registrationId });
    if (!registration) return res.status(404).json({ success: false, message: 'Registration record not found' });

    let cert = await Certificate.findOne({ registrationId });
    if (!cert) {
      const certificateId = `CERT-IEEE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      cert = await Certificate.create({
        certificateId,
        registrationId,
        userId: registration.userId,
        recipientName: registration.fullName,
        email: registration.email,
        issueDate: new Date(),
        status: 'ISSUED'
      });
    }

    return res.status(200).json({ success: true, message: 'Certificate issued successfully', certificate: cert });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Announcements CRUD
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, announcements });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.create(req.body);
    return res.status(201).json({ success: true, message: 'Announcement published', announcement });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Gallery CRUD
const getGallery = async (req, res) => {
  try {
    const items = await Gallery.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.create(req.body);
    return res.status(201).json({ success: true, message: 'Gallery item added', item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    await Gallery.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Gallery item deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRegistrationRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const reg = await Registration.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { registrationId: id }
      ]
    });
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration record not found' });
    }
    const regId = reg.registrationId;
    await Registration.deleteOne({ _id: reg._id });
    await Payment.deleteMany({ registrationId: regId });
    await Ticket.deleteMany({ registrationId: regId });
    await Attendance.deleteMany({ registrationId: regId });
    await Certificate.deleteMany({ registrationId: regId });
    return res.status(200).json({ success: true, message: 'Registration record deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAllRegistrations = async (req, res) => {
  try {
    await Registration.deleteMany({});
    await Payment.deleteMany({});
    await Ticket.deleteMany({});
    await Attendance.deleteMany({});
    await Certificate.deleteMany({});
    return res.status(200).json({ success: true, message: 'All registration records cleared successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const bulkApprovePayments = async (req, res) => {
  try {
    const pendingPayments = await Payment.find({ status: 'PENDING' });
    const regIds = pendingPayments.map(p => p.registrationId);

    await Payment.updateMany({ status: 'PENDING' }, { $set: { status: 'VERIFIED', verifiedAt: Date.now() } });
    await Registration.updateMany(
      { registrationId: { $in: regIds } },
      { $set: { status: 'PAYMENT_VERIFIED', paymentStatus: 'VERIFIED', seatStatus: 'CONFIRMED' } }
    );

    return res.status(200).json({
      success: true,
      message: `Successfully verified ${pendingPayments.length} pending payments!`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const directRegistrationAdmin = async (req, res) => {
  try {
    const { fullName, email, phone, studentId, department, year, section, residency } = req.body;

    if (!fullName || !email || !studentId || !phone) {
      return res.status(400).json({ success: false, message: 'Name, Email, Student ID, and Phone are required' });
    }

    const count = await Registration.countDocuments();
    const nextSeq = (count + 1).toString().padStart(4, '0');
    const registrationId = `KLU-ML-2026-${nextSeq}`;

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: fullName,
        email: email.toLowerCase(),
        role: 'participant'
      });
    }

    const newReg = await Registration.create({
      registrationId,
      userId: user._id,
      eventId: user._id,
      fullName,
      email: email.toLowerCase(),
      phone,
      studentId,
      department: department || 'CSE',
      year: year || '3rd Year',
      section: section || '24S01',
      residency: residency || 'Day Scholar',
      status: 'PAYMENT_VERIFIED',
      paymentStatus: 'VERIFIED',
      seatStatus: 'CONFIRMED'
    });

    await Payment.create({
      registrationId,
      userId: user._id,
      amount: 300,
      transactionId: `DIRECT-ADMIN-${Date.now()}`,
      screenshotUrl: '/uploads/manual_admin_approval.png',
      status: 'VERIFIED',
      submittedAt: Date.now(),
      verifiedAt: Date.now()
    });

    return res.status(201).json({
      success: true,
      message: 'Direct registration completed successfully!',
      registration: newReg
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getRegistrationsList,
  approvePayment,
  rejectPayment,
  searchParticipants,
  updateEventConfig,
  getWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  markAttendanceAdmin,
  issueCertificateAdmin,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getGallery,
  addGalleryItem,
  deleteGalleryItem,
  deleteRegistrationRecord,
  deleteAllRegistrations,
  bulkApprovePayments,
  directRegistrationAdmin
};
