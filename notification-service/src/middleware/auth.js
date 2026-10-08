const jwt = require('jsonwebtoken');
const { error } = require('../utils/envelope');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentication required: missing or invalid Bearer token', 401);
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'supersecretjwtkey_ev_2026_change_in_prod';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { userId, role, email }
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return error(res, 'Forbidden: insufficient permissions', 403);
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireRole
};
