const express = require('express');
const { requireInternalKey } = require('../middleware/internal');
const { createPayment, allPayments } = require('../controllers/paymentController');
const router = express.Router();
router.use(requireInternalKey);
router.post('/', createPayment);
router.get('/all', allPayments);
module.exports = router;
