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
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kare_ieee_secret');

      let user = await User.findById(decoded.id).select('-__v');
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
        return res.status(401).json({ success: false, message: 'User or Volunteer account not found' });
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
    if (req.user && allowedRoles.includes(req.user.role)) {
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
