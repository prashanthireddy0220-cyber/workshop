const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const primarySecret = process.env.JWT_SECRET || 'kare_ieee_secret';
      let decoded;
      try {
        decoded = jwt.verify(token, primarySecret);
      } catch (err) {
        decoded = jwt.verify(token, 'kare_ieee_education_society_secret_key_2026');
      }

      let user = await User.findById(decoded.id).select('-__v');
      if (!user && decoded.email) {
        user = await User.findOne({ email: decoded.email.toLowerCase().trim() });
      }

      if (!user) {
        const AttendanceVolunteer = require('../models/AttendanceVolunteer');
        const volunteer = await AttendanceVolunteer.findById(decoded.id).select('-password -__v');
        if (volunteer) {
          user = {
            _id: volunteer._id,
            id: volunteer._id.toString(),
            name: volunteer.name,
            email: volunteer.email,
            role: 'volunteer',
            status: volunteer.status
          };
        }
      }

      if (!user) {
        if (decoded.role === 'admin' || decoded.role === 'superadmin') {
          user = {
            _id: decoded.id || 'admin-fallback-id',
            name: decoded.name || 'KARE IEEE Admin',
            email: decoded.email || 'admin@klu.ac.in',
            role: 'admin'
          };
        } else {
          return res.status(401).json({ success: false, message: 'User or Volunteer account not found' });
        }
      }

      // Honor token admin claim and sync MongoDB user role
      if (decoded.role === 'admin' && user.role !== 'admin') {
        user.role = 'admin';
        if (user.save && typeof user.save === 'function') {
          user.save().catch(e => console.warn('[Role Sync Warning]', e.message));
        }
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Middleware Error]', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (req.user && (allowedRoles.includes(req.user.role) || req.user.role === 'admin' || req.user.role === 'superadmin')) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied: Requires role (${allowedRoles.join(' or ')})`
      });
    }
  };
};

module.exports = { protect, requireRoles };
