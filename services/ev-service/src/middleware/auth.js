const jwt = require('jsonwebtoken');
const { error } = require('../utils/envelope');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentication required: missing or invalid bearer token', 401);
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return error(res, 'JWT_SECRET is not configured', 500);
  }

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (
      typeof decoded.userId !== 'string' ||
      !['USER', 'STATION_ADMIN', 'SYSTEM_ADMIN'].includes(decoded.role)
    ) {
      return error(res, 'Invalid token payload', 401);
    }
    req.user = decoded;
    return next();
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
    return next();
  };
}

module.exports = { authenticate, requireRole };
