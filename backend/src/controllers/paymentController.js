const Payment = require('../models/Payment');
const Registration = require('../models/Registration');
const cloudinary = require('../config/cloudinary');

/**
 * Helper to upload buffer to Cloudinary using upload_stream
 */
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ieee/upi-payments',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    stream.end(fileBuffer);
  });
};

const submitPayment = async (req, res) => {
  let uploadedPublicId = '';

  try {
    const { registrationId, transactionId, amount } = req.body;
    const userId = req.user._id;

    if (!registrationId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID and Transaction ID are required.'
      });
    }

    // Verify registration exists for this user
    const registration = await Registration.findOne({ registrationId, userId });
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Matching registration record not found.'
      });
    }

    let upiScreenshotUrl = '';
    let upiScreenshotPublicId = '';

    if (req.file) {
      try {
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
        upiScreenshotUrl = cloudinaryResult.secure_url;
        upiScreenshotPublicId = cloudinaryResult.public_id;
        uploadedPublicId = cloudinaryResult.public_id;
      } catch (uploadError) {
        console.error('[Cloudinary Upload Failed]', uploadError.message || uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload payment screenshot.'
        });
      }
    } else if (req.body.screenshotUrl) {
      upiScreenshotUrl = req.body.screenshotUrl;
    } else {
      return res.status(400).json({
        success: false,
        message: 'UPI payment screenshot is required.'
      });
    }

    try {
      // Check if payment entry exists (re-submission case)
      let payment = await Payment.findOne({ registrationId });
      if (payment) {
        // If replacing an existing Cloudinary image, clean up old asset
        if (payment.upiScreenshotPublicId && payment.upiScreenshotPublicId !== upiScreenshotPublicId) {
          try {
            await cloudinary.uploader.destroy(payment.upiScreenshotPublicId);
          } catch (delErr) {
            console.warn('[Cloudinary Old Image Delete Warning]', delErr);
          }
        }

        payment.transactionId = transactionId;
        payment.screenshotUrl = upiScreenshotUrl;
        payment.upiScreenshotUrl = upiScreenshotUrl;
        payment.upiScreenshotPublicId = upiScreenshotPublicId;
        payment.amount = amount || payment.amount || 300;
        payment.status = 'PENDING';
        payment.rejectionReason = '';
        payment.submittedAt = Date.now();
        await payment.save();
      } else {
        payment = await Payment.create({
          registrationId,
          userId,
          amount: amount || 300,
          transactionId,
          screenshotUrl: upiScreenshotUrl,
          upiScreenshotUrl,
          upiScreenshotPublicId,
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
    } catch (mongoError) {
      console.error('[MongoDB Payment Save Error]', mongoError);
      
      // Cleanup Cloudinary image if DB save failed
      if (uploadedPublicId) {
        try {
          await cloudinary.uploader.destroy(uploadedPublicId);
        } catch (cleanupErr) {
          console.error('[Cloudinary Cleanup Error]', cleanupErr);
        }
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to save payment record.'
      });
    }
  } catch (error) {
    console.error('[Payment Submission Error]', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during payment submission.'
    });
  }
};

const getPaymentByRegistrationId = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const payment = await Payment.findOne({ registrationId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
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
