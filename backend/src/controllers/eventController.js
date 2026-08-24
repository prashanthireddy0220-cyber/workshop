const Event = require('../models/Event');
const Registration = require('../models/Registration');

const getEventDetails = async (req, res) => {
  try {
    let event = await Event.findOne();
    if (!event) {
      // Return default event structure if DB not seeded yet
      event = {
        eventName: process.env.EVENT_NAME || 'Intelligent Yield Prediction & AI/ML Workshop',
        description: 'Join the premier 2-Day AI/ML Workshop organized by KARE IEEE Education Society. Master cutting-edge Machine Learning models, CNNs, LSTMs, and Model Deployment with hands-on college lab projects.',
        date: process.env.EVENT_DATE || '2026-09-15',
        startTime: '09:30 AM',
        endTime: '05:00 PM',
        venue: process.env.EVENT_LOCATION || 'IEEE Tech Hall, KARE Campus',
        capacity: parseInt(process.env.EVENT_CAPACITY || '200'),
        registrationFee: parseInt(process.env.REGISTRATION_FEE || '300'),
        registrationOpen: true,
        paymentUPI: process.env.PAYMENT_UPI_ID || 'ieee.kare@upi',
        organizer: 'KARE IEEE Education Society'
      };
    }

    return res.status(200).json({ success: true, event });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getEventStatus = async (req, res) => {
  try {
    let event = await Event.findOne();
    
    const capacity = event ? event.capacity : parseInt(process.env.EVENT_CAPACITY || '200');
    const registrationFee = event ? event.registrationFee : parseInt(process.env.REGISTRATION_FEE || '300');
    const registrationStart = event?.registrationStart || '2026-08-01T00:00:00.000Z';
    const registrationEnd = event?.registrationEnd || event?.registrationDeadline || '2026-08-28T23:59:59.000Z';
    const registrationOpen = event ? event.registrationOpen : true;

    const now = new Date();
    const endDate = new Date(registrationEnd);

    // Count confirmed registrations
    const confirmedCount = await Registration.countDocuments({
      $or: [
        { seatStatus: 'CONFIRMED' },
        { paymentStatus: { $in: ['PAID', 'VERIFIED'] } },
        { status: { $in: ['PAYMENT_VERIFIED', 'ATTENDED'] } }
      ]
    });

    // Count active locked seats (lockedAt within 10 minutes OR lockExpiresAt > now)
    const lockedCount = await Registration.countDocuments({
      seatStatus: 'LOCKED',
      lockExpiresAt: { $gt: now }
    });

    // Available seats calculation
    const available = Math.max(0, capacity - confirmedCount - lockedCount);

    // Determine status badge: CLOSED, FULL, ALMOST FULL, FILLING FAST, OPEN
    let statusText = 'OPEN';
    if (now > endDate || !registrationOpen) {
      statusText = 'CLOSED';
    } else if (confirmedCount + lockedCount >= capacity || available <= 0) {
      statusText = 'FULL';
    } else if (available <= 10) {
      statusText = 'ALMOST FULL';
    } else if (available <= Math.ceil(capacity * 0.25)) {
      statusText = 'FILLING FAST';
    } else {
      statusText = 'OPEN';
    }

    return res.status(200).json({
      success: true,
      capacity,
      confirmed: confirmedCount,
      locked: lockedCount,
      available,
      remaining: available,
      registered: confirmedCount,
      registrationFee,
      registrationStart,
      registrationEnd,
      serverTime: now.toISOString(),
      status: statusText,
      registrationOpen: registrationOpen && statusText !== 'CLOSED' && statusText !== 'FULL'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getEventDetails, getEventStatus };
