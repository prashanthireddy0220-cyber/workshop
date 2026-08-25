const express = require('express');
const router = express.Router();
const {
  scanAttendance,
  getAttendanceStatus,
  getAttendanceStats
} = require('../controllers/attendanceController');
const { protect, requireRoles } = require('../middleware/authMiddleware');

// Public/Team attendance status route for /attend page
router.get('/status', protect, getAttendanceStatus);

// Authorized scan & mark routes (admin & attendance_team)
router.post('/scan', protect, requireRoles('admin', 'attendance_team'), scanAttendance);
router.post('/mark', protect, requireRoles('admin', 'attendance_team'), scanAttendance);
router.post('/check-in', protect, requireRoles('admin', 'attendance_team'), scanAttendance);
router.get('/stats', protect, requireRoles('admin', 'attendance_team'), getAttendanceStats);

module.exports = router;
