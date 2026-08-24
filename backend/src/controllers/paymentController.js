const Payment = require('../models/Payment');
const Registration = require('../models/Registration');
const path = require('path');

const submitPayment = async (req, res) => {
  try {
    const { registrationId, transactionId, amount } = req.body;
    const userId = req.user._id;

    if (!registrationId || !transactionId) {
      return res.status(400).json({ success: false, message: 'Registration ID and Transaction ID are required' });
    }

    // Verify registration exists for this user
    const registration = await Registration.findOne({ registrationId, userId });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Matching registration record not found' });
    }

    let screenshotUrl = '';
    if (req.file) {
      // Store relative path accessible by web server
      screenshotUrl = `/uploads/screenshots/${req.file.filename}`;
    } else if (req.body.screenshotUrl) {
      screenshotUrl = req.body.screenshotUrl;
    } else {
      return res.status(400).json({ success: false, message: 'Payment screenshot upload is required' });
    }

    // Check if payment entry exists (re-submission case)
    let payment = await Payment.findOne({ registrationId });
    if (payment) {
      payment.transactionId = transactionId;
      payment.screenshotUrl = screenshotUrl;
      payment.amount = amount || payment.amount || 250;
      payment.status = 'PENDING';
      payment.rejectionReason = '';
      payment.submittedAt = Date.now();
      await payment.save();
    } else {
      payment = await Payment.create({
        registrationId,
        userId,
        amount: amount || 250,
        transactionId,
        screenshotUrl,
        status: 'PENDING',
        submittedAt: Date.now()
      });
    }

    // Update Registration status
    registration.status = 'PAYMENT_SUBMITTED';
    await registration.save();

    return res.status(200).json({
      success: true,
      message: 'Payment proof submitted successfully! Pending admin verification.',
      payment
    });
  } catch (error) {
    console.error('[Payment Submit Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentByRegistrationId = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const payment = await Payment.findOne({ registrationId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }
    return res.status(200).json({ success: true, payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitPayment,
  getPaymentByRegistrationId
};
