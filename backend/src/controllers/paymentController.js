const Payment = require('../models/Payment');
const Registration = require('../models/Registration');
const cloudinary = require('../config/cloudinary');

/**
 * Helper to upload buffer to Cloudinary using upload_stream
 */
const uploadToCloudinary = (fileBuffer, mimeType = 'image/png') => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary credentials exist
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      const base64 = fileBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return resolve({
        secure_url: dataUrl,
        public_id: `payment-proof-${Date.now()}`
      });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ieee/upi-payments',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Direct Upload Error]', error);
          const base64 = fileBuffer.toString('base64');
          const dataUrl = `data:${mimeType};base64,${base64}`;
          resolve({
            secure_url: dataUrl,
            public_id: `payment-proof-${Date.now()}`
          });
        } else {
          resolve(result);
        }
      }
    );
    stream.end(fileBuffer);
  });
};

const uploadScreenshotOnly = async (req, res) => {
  try {
    const { registrationId, transactionId, amount } = req.body || {};
    const targetFile = req.file || (req.files && (req.files.paymentScreenshot?.[0] || req.files.screenshot?.[0]));

    console.log('==================================================');
    console.log('[PAYMENT UPLOAD ROUTE HIT]');
    console.log(` -> Timestamp: ${new Date().toISOString()}`);
    console.log(` -> File attached: ${targetFile ? `YES (name=${targetFile.originalname}, size=${targetFile.size}b, mime=${targetFile.mimetype})` : 'NO'}`);
    console.log("req.body:", req.body);
    console.log("req.file:", targetFile);
    console.log("req.files:", req.files);
    console.log(` -> Payload: registrationId="${registrationId || ''}", transactionId="${transactionId || ''}"`);
    console.log('==================================================');

    let upiScreenshotUrl = '';
    let upiScreenshotPublicId = '';

    if (targetFile) {
      console.log('[CLOUDINARY UPLOAD ATTEMPT] Streaming buffer to Cloudinary folder "ieee/upi-payments"...');
      const mimeType = targetFile.mimetype || 'image/png';
      const cloudinaryResult = await uploadToCloudinary(targetFile.buffer, mimeType);
      upiScreenshotUrl = cloudinaryResult.secure_url;
      upiScreenshotPublicId = cloudinaryResult.public_id;
      console.log(`[CLOUDINARY UPLOAD SUCCESS] Secure URL: ${upiScreenshotUrl}`);
    } else if (req.body.screenshotUrl) {
      upiScreenshotUrl = req.body.screenshotUrl;
      console.log(`[CLOUDINARY URL REUSED] URL: ${upiScreenshotUrl}`);
    } else {
      console.warn('[PAYMENT UPLOAD REJECTED] No screenshot file provided in request.');
      return res.status(400).json({
        success: false,
        message: 'No payment screenshot file attached.'
      });
    }

    // If registrationId and transactionId are supplied, complete DB update
    if (registrationId && transactionId) {
      const cleanUtr = String(transactionId).trim();
      if (cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
        console.warn(`[PAYMENT UPLOAD REJECTED] Invalid UTR length/format: "${cleanUtr}"`);
        return res.status(400).json({
          success: false,
          message: 'UPI Reference / UTR Number must be exactly 12 numeric digits.'
        });
      }

      let registration = await Registration.findOne({ registrationId });
      if (!registration && req.user) {
        registration = await Registration.findOne({ userId: req.user._id });
      }

      if (registration) {
        let payment = await Payment.findOne({ registrationId: registration.registrationId });
        const isAlreadyVerified = registration.paymentStatus === 'PAID' || registration.paymentStatus === 'VERIFIED';
        const targetStatus = isAlreadyVerified ? 'VERIFIED' : 'PENDING';
        const feeAmount = parseInt(amount || process.env.REGISTRATION_FEE || '250', 10);

        if (payment) {
          payment.transactionId = cleanUtr;
          payment.screenshotUrl = upiScreenshotUrl;
          payment.upiScreenshotUrl = upiScreenshotUrl;
          payment.upiScreenshotPublicId = upiScreenshotPublicId;
          payment.amount = feeAmount;
          payment.status = targetStatus;
          payment.submittedAt = Date.now();
          await payment.save();
        } else {
          payment = await Payment.create({
            registrationId: registration.registrationId,
            userId: registration.userId,
            amount: feeAmount,
            transactionId: cleanUtr,
            screenshotUrl: upiScreenshotUrl,
            upiScreenshotUrl,
            upiScreenshotPublicId,
            status: targetStatus,
            submittedAt: Date.now()
          });
        }

        registration.status = 'PAYMENT_SUBMITTED';
        registration.paymentStatus = 'PENDING';
        registration.upiScreenshotUrl = upiScreenshotUrl;
        registration.screenshotUrl = upiScreenshotUrl;
        await registration.save();

        console.log(`[DATABASE UPDATE SUCCESS] Registration ${registration.registrationId} updated with payment proof.`);
        console.log('==================================================');

        return res.status(200).json({
          success: true,
          message: 'Payment proof submitted successfully!',
          url: upiScreenshotUrl,
          publicId: upiScreenshotPublicId,
          payment,
          registration
        });
      }
    }

    console.log('[PAYMENT SCREENSHOT PRE-UPLOAD SUCCESS]');
    console.log('==================================================');

    return res.status(200).json({
      success: true,
      message: 'Payment screenshot uploaded successfully',
      url: upiScreenshotUrl,
      publicId: upiScreenshotPublicId,
      secure_url: upiScreenshotUrl
    });
  } catch (error) {
    console.error('[Upload Screenshot Error]', error.message || error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload payment screenshot. Please try again.'
    });
  }
};

const submitPayment = async (req, res) => {
  let uploadedPublicId = '';

  try {
    const { registrationId, transactionId, amount } = req.body;
    const userId = req.user ? req.user._id : null;
    const targetFile = req.file || (req.files && (req.files.paymentScreenshot?.[0] || req.files.screenshot?.[0]));

    console.log('==================================================');
    console.log('[PAYMENT SUBMIT ROUTE HIT]');
    console.log(` -> Timestamp: ${new Date().toISOString()}`);
    console.log(` -> File attached: ${targetFile ? `YES (name=${targetFile.originalname}, size=${targetFile.size}b, mime=${targetFile.mimetype})` : 'NO'}`);
    console.log("req.body:", req.body);
    console.log("req.file:", targetFile);
    console.log("req.files:", req.files);
    console.log(` -> Payload: registrationId="${registrationId || ''}", transactionId="${transactionId || ''}"`);
    console.log('==================================================');

    if (!registrationId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID and Transaction ID are required.'
      });
    }

    const cleanUtr = String(transactionId).trim();
    if (cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
      return res.status(400).json({
        success: false,
        message: 'UPI Reference / UTR Number must be exactly 12 numeric digits.'
      });
    }

    let registration = await Registration.findOne({ registrationId });
    if (!registration && userId) {
      registration = await Registration.findOne({ userId });
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Matching registration record not found.'
      });
    }

    let upiScreenshotUrl = '';
    let upiScreenshotPublicId = '';

    if (targetFile) {
      try {
        const cloudinaryResult = await uploadToCloudinary(targetFile.buffer);
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
      const isAlreadyVerified = registration.paymentStatus === 'PAID' || registration.paymentStatus === 'VERIFIED' || registration.seatStatus === 'CONFIRMED';
      const targetStatus = isAlreadyVerified ? 'VERIFIED' : 'PENDING';
      const reqFee = parseInt(amount || process.env.REGISTRATION_FEE || '250', 10);

      let payment = await Payment.findOne({ registrationId: registration.registrationId });
      if (payment) {
        if (payment.upiScreenshotPublicId && payment.upiScreenshotPublicId !== upiScreenshotPublicId) {
          try {
            await cloudinary.uploader.destroy(payment.upiScreenshotPublicId);
          } catch (delErr) {
            console.warn('[Cloudinary Old Image Delete Warning]', delErr);
          }
        }

        payment.transactionId = cleanUtr;
        payment.screenshotUrl = upiScreenshotUrl;
        payment.upiScreenshotUrl = upiScreenshotUrl;
        payment.upiScreenshotPublicId = upiScreenshotPublicId;
        payment.amount = reqFee;
        payment.status = isAlreadyVerified ? 'VERIFIED' : 'PENDING';
        payment.rejectionReason = '';
        payment.submittedAt = Date.now();
        await payment.save();
      } else {
        payment = await Payment.create({
          registrationId: registration.registrationId,
          userId: registration.userId || userId,
          amount: reqFee,
          transactionId: cleanUtr,
          screenshotUrl: upiScreenshotUrl,
          upiScreenshotUrl,
          upiScreenshotPublicId,
          status: targetStatus,
          submittedAt: Date.now()
        });
      }

      registration.status = 'PAYMENT_SUBMITTED';
      registration.paymentStatus = 'PENDING';
      if (upiScreenshotUrl) {
        registration.upiScreenshotUrl = upiScreenshotUrl;
        registration.screenshotUrl = upiScreenshotUrl;
      }
      await registration.save();

      return res.status(200).json({
        success: true,
        message: 'Payment proof submitted successfully! Pending admin verification.',
        payment,
        registration
      });
    } catch (mongoError) {
      console.error('[MongoDB Payment Save Error]', mongoError);
      
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
  uploadScreenshotOnly,
  getPaymentByRegistrationId
};
