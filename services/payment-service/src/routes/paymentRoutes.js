const express = require('express');
const { authenticate } = require('../middleware/auth');
const { createPayment, listPayments, getPayment, pay } = require('../controllers/paymentController');
const router = express.Router();
router.use(authenticate);
router.get('/', listPayments);
router.get('/:id', getPayment);
router.patch('/:id/pay', pay);
module.exports = router;
