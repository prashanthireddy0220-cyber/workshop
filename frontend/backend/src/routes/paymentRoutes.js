const express = require('express');
const router = express.Router();
const { submitPayment, getPaymentByRegistrationId } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { uploadPaymentScreenshot } = require('../middleware/uploadMiddleware');

router.post('/submit', protect, uploadPaymentScreenshot.single('screenshot'), submitPayment);
router.get('/:registrationId', protect, getPaymentByRegistrationId);

module.exports = router;
