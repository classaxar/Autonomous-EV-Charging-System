const { error } = require('../utils/envelope');

function requireInternalKey(req, res, next) {
  const providedKey = req.headers['x-internal-key'];
  const expectedKey = process.env.INTERNAL_KEY || 'internal_secret_key_2026_ev_system';

  if (!providedKey || providedKey !== expectedKey) {
    return error(res, 'Forbidden: invalid or missing internal service key', 403);
  }

  next();
}

module.exports = {
  requireInternalKey
};
