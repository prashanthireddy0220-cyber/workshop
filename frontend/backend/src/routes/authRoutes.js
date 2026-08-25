const express = require('express');
const router = express.Router();
const { googleLogin, devLogin, adminLogin, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/google', googleLogin);
router.post('/dev-login', devLogin);
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);
router.post('/logout', logout);

module.exports = router;
