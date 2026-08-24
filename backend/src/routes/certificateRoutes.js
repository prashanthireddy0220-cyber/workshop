const express = require('express');
const router = express.Router();
const { getCertificateInfo, downloadCertificatePDF } = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:registrationId', protect, getCertificateInfo);
router.get('/:registrationId/download', protect, downloadCertificatePDF);

module.exports = router;
