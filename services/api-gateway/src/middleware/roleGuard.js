const jwt = require('jsonwebtoken');
const { error } = require('../utils/envelope');

/**
 * Gateway Role Guard Helper per TASKBOOK A-11
 * Inspects Authorization Bearer token header without proxy interference
 */
function requireGatewayRole(...allowedRoles) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Authentication required: missing or invalid Bearer token', 401);
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'supersecretjwtkey_ev_2026_change_in_prod';

    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return error(res, 'Forbidden: insufficient role permissions', 403);
      }

      next();
    } catch (err) {
      return error(res, 'Invalid or expired token', 401);
    }
  };
}

module.exports = {
  requireGatewayRole
};
