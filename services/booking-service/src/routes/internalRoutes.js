const express = require('express');
const { requireInternalKey } = require('../middleware/internal');
const { updateBookingStatusInternal, getBookingInternal } = require('../controllers/bookingController');

const router = express.Router();

router.use(requireInternalKey);
router.patch('/:id/status', updateBookingStatusInternal);
router.get('/:id', getBookingInternal);

module.exports = router;
