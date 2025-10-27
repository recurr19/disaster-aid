const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — ensures the user is authenticated with a valid JWT
 * Usage: router.get('/profile', protect, controller)
 */
exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

/**
 * Role-based access middleware
 * Usage: router.get('/authority', protect, authorizeRoles('authority'), controller)
 */
exports.authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};
