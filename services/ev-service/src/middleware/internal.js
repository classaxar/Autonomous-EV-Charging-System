const { error } = require('../utils/envelope');

function requireInternalKey(req, res, next) {
  const providedKey = req.headers['x-internal-key'];
  const expectedKey = process.env.INTERNAL_KEY;
  if (!expectedKey) {
    return error(res, 'INTERNAL_KEY is not configured', 500);
  }

  if (!providedKey || providedKey !== expectedKey) {
    return error(res, 'Forbidden: invalid or missing internal service key', 403);
  }

  return next();
}

module.exports = { requireInternalKey };
