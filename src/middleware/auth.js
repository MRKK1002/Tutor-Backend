const jwt = require('jsonwebtoken');
const Tutor = require('../models/Tutor');
const Admin = require('../models/Admin');

// Protect routes — verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'admin') {
      req.user = await Admin.findById(decoded.id);
      req.userRole = 'admin';
    } else {
      req.user = await Tutor.findById(decoded.id);
      req.userRole = 'tutor';
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    if (req.userRole === 'tutor' && !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
  }
};

// Only allow admin
const adminOnly = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access only' });
  }
  next();
};

// Only allow tutor
const tutorOnly = (req, res, next) => {
  if (req.userRole !== 'tutor') {
    return res.status(403).json({ success: false, message: 'Tutor access only' });
  }
  next();
};

module.exports = { protect, adminOnly, tutorOnly };
