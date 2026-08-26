const express = require('express');
const router = express.Router();
const { submitPayment, uploadScreenshotOnly, getPaymentByRegistrationId } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { uploadPaymentScreenshot } = require('../middleware/uploadMiddleware');

// Route 1: Standalone Cloudinary screenshot upload endpoint
router.post('/upload-screenshot', protect, uploadPaymentScreenshot.single('screenshot'), uploadScreenshotOnly);

// Route 2: Full payment submission endpoint
router.post('/submit', protect, uploadPaymentScreenshot.single('screenshot'), submitPayment);

// Route 3: Get payment details by registration ID
router.get('/:registrationId', protect, getPaymentByRegistrationId);

module.exports = router;
