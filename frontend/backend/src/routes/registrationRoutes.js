const express = require('express');
const router = express.Router();
const {
  createRegistration,
  lockSeat,
  confirmPayment,
  getMyRegistration,
  getRegistrationById
} = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRegistration);
router.post('/lock-seat', protect, lockSeat);
router.post('/confirm-payment', protect, confirmPayment);
router.get('/me', protect, getMyRegistration);
router.get('/:id', protect, getRegistrationById);

module.exports = router;
