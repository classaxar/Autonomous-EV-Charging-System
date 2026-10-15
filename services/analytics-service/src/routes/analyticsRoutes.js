const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const controller = require('../controllers/analyticsController');
const router = express.Router();
router.use(authenticate, requireRole('SYSTEM_ADMIN'));
router.get('/summary', controller.summary);
router.get('/daily', controller.daily);
router.get('/stations', controller.stations);
module.exports = router;
