const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with polling & websocket transports
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store io instance on app for controllers
app.set('io', io);

// Connected Volunteers Tracking for "Volunteers Online" count
const connectedVolunteers = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('volunteer_connected', (volunteerData) => {
    if (volunteerData && (volunteerData.email || volunteerData.id)) {
      const volId = volunteerData.email || volunteerData.id;
      connectedVolunteers.set(socket.id, volId);
      const onlineCount = new Set(connectedVolunteers.values()).size;
      io.emit('volunteer_presence_updated', { volunteersOnline: onlineCount });
    }
  });

  socket.on('disconnect', () => {
    if (connectedVolunteers.has(socket.id)) {
      connectedVolunteers.delete(socket.id);
      const onlineCount = new Set(connectedVolunteers.values()).size;
      io.emit('volunteer_presence_updated', { volunteersOnline: onlineCount });
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// Helper function to get current online volunteers count
app.set('getVolunteersOnlineCount', () => new Set(connectedVolunteers.values()).size);

// Trust reverse proxy headers
app.set('trust proxy', 1);

// Ensure Uploads Directory Exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect Database
connectDB();

// Middleware to check Database Readiness
app.use(async (req, res, next) => {
  if (req.path !== '/api/health' && req.path !== '/health') {
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectDB();
      } catch (err) {
        // Ignored here
      }
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          message: 'Database is connecting. Please try again in a moment.'
        });
      }
    }
  }
  next();
});

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' },
  validate: { xForwardedForHeader: false }
});
app.use('/api', limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Uploaded Payment Screenshots & Static Assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Mounting
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/auth', require('./src/routes/authRoutes'));

app.use('/api/event', require('./src/routes/eventRoutes'));
app.use('/event', require('./src/routes/eventRoutes'));

app.use('/api/registrations', require('./src/routes/registrationRoutes'));
app.use('/registrations', require('./src/routes/registrationRoutes'));

app.use('/api/payments', require('./src/routes/paymentRoutes'));
app.use('/payments', require('./src/routes/paymentRoutes'));

app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/admin', require('./src/routes/adminRoutes'));

app.use('/api/tickets', require('./src/routes/ticketRoutes'));
app.use('/tickets', require('./src/routes/ticketRoutes'));

app.use('/api/attendance', require('./src/routes/attendanceRoutes'));
app.use('/attendance', require('./src/routes/attendanceRoutes'));

app.use('/api/certificates', require('./src/routes/certificateRoutes'));
app.use('/certificates', require('./src/routes/certificateRoutes'));

// Explicit Fallback Route Handlers (guarantees zero 404s for login, settings & payment upload)
app.all(['/api/payments/upload-screenshot', '/payments/upload-screenshot', '/api/payment/upload', '/payment/upload', '/api/payments/upload', '/payments/upload'], (req, res, next) => {
  if (req.method === 'OPTIONS') return res.status(204).end();
  const { uploadPaymentScreenshot } = require('./src/middleware/uploadMiddleware');
  const { uploadScreenshotOnly } = require('./src/controllers/paymentController');

  return uploadPaymentScreenshot.any()(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    return uploadScreenshotOnly(req, res, next);
  });
});

app.post(['/api/attendance/login', '/attendance/login', '/api/auth/volunteer-login', '/auth/volunteer-login'], (req, res, next) => {
  const { volunteerLogin } = require('./src/controllers/attendanceController');
  return volunteerLogin(req, res, next);
});

app.all(['/api/admin/registration-settings', '/admin/registration-settings', '/api/registration-settings'], (req, res, next) => {
  const { updateRegistrationSettings } = require('./src/controllers/adminController');
  return updateRegistrationSettings(req, res, next);
});

app.all(['/api/admin/attendance-settings', '/admin/attendance-settings', '/api/attendance-settings'], (req, res, next) => {
  const { updateAttendanceSettings } = require('./src/controllers/adminController');
  return updateAttendanceSettings(req, res, next);
});

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'KARE IEEE Education Society Workshop API',
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Server] KARE IEEE Workshop Backend running on port ${PORT}`);
  console.log('==================================================');
  console.log('[Server] ATTENDANCE & API ENDPOINTS VERIFIED READY:');
  console.log(' -> POST /api/attendance/login');
  console.log(' -> GET  /api/attendance/current');
  console.log(' -> POST /api/attendance/scan');
  console.log(' -> POST /api/attendance/session/start');
  console.log(' -> POST /api/attendance/session/close');
  console.log(' -> GET  /api/attendance/volunteers');
  console.log(' -> Socket.IO Path: /socket.io/');
  console.log('==================================================');
});
