const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config();

const app = express();

// Connect Database
connectDB();

// Middleware to check Database Readiness
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/health') {
    if (mongoose.connection.readyState !== 1) {
      connectDB();
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
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true); // Allow dev origins gracefully
      }
    },
    credentials: true
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Uploaded Payment Screenshots & Static Assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Mounting
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/event', require('./src/routes/eventRoutes'));
app.use('/api/registrations', require('./src/routes/registrationRoutes'));
app.use('/api/payments', require('./src/routes/paymentRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/tickets', require('./src/routes/ticketRoutes'));
app.use('/api/attendance', require('./src/routes/attendanceRoutes'));
app.use('/api/certificates', require('./src/routes/certificateRoutes'));

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
app.listen(PORT, () => {
  console.log(`[Server] KARE IEEE Workshop Backend running on port ${PORT}`);
});
