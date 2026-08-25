const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRegistrationsList,
  approvePayment,
  rejectPayment,
  searchParticipants,
  updateEventConfig,
  getWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  markAttendanceAdmin,
  issueCertificateAdmin,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getGallery,
  addGalleryItem,
  deleteGalleryItem,
  deleteRegistrationRecord,
  deleteAllRegistrations,
  bulkApprovePayments,
  directRegistrationAdmin
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect);
router.use(adminOnly);

// Stats & Registrations
router.get('/dashboard', getDashboardStats);
router.get('/registrations', getRegistrationsList);
router.get('/participants/search', searchParticipants);
router.post('/registrations/direct', directRegistrationAdmin);
router.delete('/registrations/:id', deleteRegistrationRecord);
router.delete('/registrations', deleteAllRegistrations);

// Payment Approvals
router.put('/payments/bulk-verify', bulkApprovePayments);
router.put('/payments/:id/approve', approvePayment);
router.put('/payments/:id/reject', rejectPayment);

// Event & Config
router.put('/event/config', updateEventConfig);

// Workshops CRUD
router.get('/workshops', getWorkshops);
router.post('/workshops', createWorkshop);
router.put('/workshops/:id', updateWorkshop);
router.delete('/workshops/:id', deleteWorkshop);

// Attendance Management
router.post('/attendance/mark', markAttendanceAdmin);

// Certificate Issue
router.post('/certificates/issue', issueCertificateAdmin);

// Announcements CRUD
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Gallery CRUD
router.get('/gallery', getGallery);
router.post('/gallery', addGalleryItem);
router.delete('/gallery/:id', deleteGalleryItem);

module.exports = router;
