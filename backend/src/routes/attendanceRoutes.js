const express = require('express');
const router = express.Router();
const {
  volunteerLogin,
  getVolunteerMe,
  startSession,
  closeSession,
  getCurrentSession,
  scanAttendance,
  getVolunteers,
  createVolunteer,
  updateVolunteerStatus,
  deleteVolunteer,
  getSessionHistory,
  getSessionRecords
} = require('../controllers/attendanceController');
const { protect, requireRoles } = require('../middleware/authMiddleware');

// Volunteer Auth
router.post('/login', volunteerLogin);
router.post('/volunteer-login', volunteerLogin);
router.get('/me', protect, getVolunteerMe);

// Session Status & Scan Routes
router.get('/status', getCurrentSession);
router.get('/current', getCurrentSession);
router.get('/stats', getCurrentSession);
router.post('/scan', protect, scanAttendance);
router.post('/mark', protect, scanAttendance);
router.post('/check-in', protect, scanAttendance);

// Admin Attendance Session Control
router.post('/session/start', protect, requireRoles('admin', 'volunteer', 'attendance_volunteer', 'attendance_team'), startSession);
router.post('/session/close', protect, requireRoles('admin', 'volunteer', 'attendance_volunteer', 'attendance_team'), closeSession);

// Admin Volunteer Management
router.get('/volunteers', protect, requireRoles('admin', 'volunteer', 'attendance_volunteer', 'attendance_team'), getVolunteers);
router.post('/volunteers', protect, requireRoles('admin', 'volunteer', 'attendance_volunteer', 'attendance_team'), createVolunteer);
router.put('/volunteers/:id', protect, requireRoles('admin', 'volunteer', 'attendance_volunteer', 'attendance_team'), updateVolunteerStatus);
router.delete('/volunteers/:id', protect, requireRoles('admin', 'volunteer', 'attendance_volunteer', 'attendance_team'), deleteVolunteer);

// Admin Session History & Records
router.get('/sessions', protect, requireRoles('admin'), getSessionHistory);
router.get('/sessions/:sessionId/records', protect, requireRoles('admin'), getSessionRecords);

module.exports = router;
