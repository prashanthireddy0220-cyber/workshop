const express = require('express');
const router = express.Router();
const {
  getTicketByRegistrationId,
  downloadTicketPDF,
  verifyTicketToken
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.get('/verify/:ticketId', verifyTicketToken);
router.get('/:registrationId', protect, getTicketByRegistrationId);
router.get('/:registrationId/download', protect, downloadTicketPDF);

module.exports = router;
