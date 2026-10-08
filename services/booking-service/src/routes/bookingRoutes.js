const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  listBookings,
  createBooking,
  getBooking,
  cancelBooking
} = require('../controllers/bookingController');

const router = express.Router();

router.use(authenticate);
router.get('/', listBookings);
router.post('/', createBooking);
router.get('/:id', getBooking);
router.patch('/:id/cancel', cancelBooking);

module.exports = router;
