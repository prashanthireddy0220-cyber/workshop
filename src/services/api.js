import axios from 'axios';

// Normalize API Base URL to ensure /api suffix is present
const getBaseUrl = () => {
  let url = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').trim();
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const API_BASE = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('volunteerToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Services
export const loginWithGoogle = (credential) => api.post('/auth/google', { credential });
export const loginDev = (email) => api.post('/auth/dev-login', { email });
export const loginAdmin = (username, password) => api.post('/auth/admin-login', { username, password });
export const getAuthMe = () => api.get('/auth/me');
export const logoutUser = () => api.post('/auth/logout');

// Event Services
export const getEventDetails = () => api.get('/event');
export const getEventStatus = () => api.get('/event/status');

// Registration Services
export const submitRegistration = (data) => api.post('/registrations', data);
export const lockSeat = (data) => api.post('/registrations/lock-seat', data || {});
export const confirmPayment = (data) => api.post('/registrations/confirm-payment', data);
export const getMyRegistration = () => api.get('/registrations/me');
export const getRegistrationById = (id) => api.get(`/registrations/${id}`);

// Payment Services
export const submitPayment = (formData) =>
  api.post('/payments/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const getPayment = (registrationId) => api.get(`/payments/${registrationId}`);

// Admin Services
export const getAdminDashboard = () => api.get('/admin/dashboard');
export const getAdminRegistrations = (params) => api.get('/admin/registrations', { params });
export const updateEventConfig = (config) => api.put('/admin/event/config', config);
export const approvePayment = (id) => api.put(`/admin/payments/${id}/approve`);
export const rejectPayment = (id, rejectionReason) => api.put(`/admin/payments/${id}/reject`, { rejectionReason });
export const searchParticipants = (q) => api.get('/admin/participants/search', { params: { q } });
export const directRegisterAdmin = (data) => api.post('/admin/registrations/direct', data);
export const bulkVerifyPayments = () => api.put('/admin/payments/bulk-verify');
export const deleteRegistrationAdmin = (id) => api.delete(`/admin/registrations/${id}`);
export const deleteAllRegistrationsAdmin = () => api.delete('/admin/registrations');
export const updatePaymentProofAdmin = (id, formData) =>
  api.post(`/admin/payments/${id}/proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

// Workshop Management API
export const getAdminWorkshops = () => api.get('/admin/workshops');
export const createAdminWorkshop = (data) => api.post('/admin/workshops', data);
export const updateAdminWorkshop = (id, data) => api.put(`/admin/workshops/${id}`, data);
export const deleteAdminWorkshop = (id) => api.delete(`/admin/workshops/${id}`);

// Attendance Admin API
export const markAdminAttendance = (registrationId, status) =>
  api.post('/admin/attendance/mark', { registrationId, status });

// Certificate Admin API
export const issueAdminCertificate = (registrationId) =>
  api.post('/admin/certificates/issue', { registrationId });

// Announcements Admin API
export const getAdminAnnouncements = () => api.get('/admin/announcements');
export const createAdminAnnouncement = (data) => api.post('/admin/announcements', data);
export const deleteAdminAnnouncement = (id) => api.delete(`/admin/announcements/${id}`);

// Gallery Admin API
export const getAdminGallery = () => api.get('/admin/gallery');
export const addAdminGalleryItem = (data) => api.post('/admin/gallery', data);
export const deleteAdminGalleryItem = (id) => api.delete(`/admin/gallery/${id}`);

// Ticket Services
export const getTicket = (registrationId) => api.get(`/tickets/${registrationId}`);
export const getTicketDownloadUrl = (registrationId) => `${API_BASE}/tickets/${registrationId}/download`;

// Attendance & Session Control Services
export const checkInParticipant = (token) => api.post('/attendance/check-in', { token });
export const scanAttendanceApi = (token) => api.post('/attendance/scan', { token });
export const getAttendanceStatusApi = () => api.get('/attendance/status');
export const getAttendanceStatsApi = () => api.get('/attendance/stats');

// Volunteer Auth & Live Session Control
export const volunteerLoginApi = (email, password) => api.post('/attendance/login', { email, password });
export const getVolunteerMeApi = () => api.get('/attendance/me');
export const startAttendanceSessionApi = (sessionName) => api.post('/attendance/session/start', { sessionName });
export const closeAttendanceSessionApi = () => api.post('/attendance/session/close');
export const getCurrentAttendanceSessionApi = () => api.get('/attendance/current');

// Admin Volunteer Management API
export const getVolunteersApi = () => api.get('/attendance/volunteers');
export const createVolunteerApi = (data) => api.post('/attendance/volunteers', data);
export const updateVolunteerStatusApi = (id, data) => api.put(`/attendance/volunteers/${id}`, data);
export const deleteVolunteerApi = (id) => api.delete(`/attendance/volunteers/${id}`);
export const getAttendanceSessionHistoryApi = () => api.get('/attendance/sessions');

// Admin Settings API
export const updateRegistrationSettingsApi = (settings) => api.put('/admin/registration-settings', settings);
export const updateAttendanceSettingsApi = (settings) => api.put('/admin/attendance-settings', settings);
export const getAttendanceTeamApi = () => api.get('/admin/attendance-team');
export const addAttendanceTeamMemberApi = (data) => api.post('/admin/attendance-team', data);
export const removeAttendanceTeamMemberApi = (id) => api.delete(`/admin/attendance-team/${id}`);

// Certificate Services
export const getCertificateInfo = (registrationId) => api.get(`/certificates/${registrationId}`);
export const getCertificateDownloadUrl = (registrationId) => `${API_BASE}/certificates/${registrationId}/download`;

export default api;
