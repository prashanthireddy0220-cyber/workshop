const express = require('express');
const router = express.Router();
const { checkInParticipant } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.post('/check-in', protect, adminOnly, checkInParticipant);

module.exports = router;
