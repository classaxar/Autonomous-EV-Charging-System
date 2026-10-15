const axios = require('axios');
const Payment = require('../models/Payment');
const { success, error } = require('../utils/envelope');
const { generatePaymentId } = require('../utils/idGenerator');

function headers() {
  return { 'x-internal-key': process.env.INTERNAL_KEY || 'internal_secret_key_2026_ev_system' };
}

async function notify(userId, type, message) {
  try {
    await axios.post(`${process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5008'}/internal/notifications`, {
      userId, type, message
    }, { headers: headers(), timeout: 5000 });
  } catch (notifyError) {
    console.warn(`[Payment] notification failed: ${notifyError.message}`);
  }
}

async function createPayment(req, res) {
  const { userId, bookingId, sessionId, energyKwh, pricePerKwh } = req.body || {};
  if (!userId || !bookingId || !sessionId || !Number.isFinite(Number(energyKwh))
    || !Number.isFinite(Number(pricePerKwh)) || Number(energyKwh) < 0 || Number(pricePerKwh) < 0) {
    return error(res, 'userId, bookingId, sessionId, energyKwh, and pricePerKwh are required', 400);
  }
  const existing = await Payment.findOne({ sessionId });
  if (existing) return success(res, existing, 'Payment already exists');
  const energy = Number(energyKwh);
  const price = Number(pricePerKwh);
  const payment = await Payment.create({
    paymentId: generatePaymentId(), userId, bookingId, sessionId,
    energyKwh: energy, pricePerKwh: price, amount: Number((energy * price).toFixed(2))
  });
  return success(res, payment, 'Payment created', 201);
}

async function listPayments(req, res) {
  return success(res, await Payment.find({ userId: req.user.userId }).sort({ createdAt: -1 }), 'Payments fetched');
}

async function getPayment(req, res) {
  const payment = await Payment.findOne({ paymentId: req.params.id, userId: req.user.userId });
  return payment ? success(res, payment, 'Payment fetched') : error(res, 'Payment not found', 404);
}

async function pay(req, res) {
  const payment = await Payment.findOne({ paymentId: req.params.id, userId: req.user.userId });
  if (!payment) return error(res, 'Payment not found', 404);
  if (payment.status === 'PAID') return success(res, payment, 'Payment already paid');
  
  const { paymentMethod, transactionRef, baseAmount, cgst, sgst, payerDetails } = req.body || {};
  payment.status = 'PAID';
  payment.paymentMethod = paymentMethod || 'UPI';
  payment.transactionRef = transactionRef || `UTR${Date.now()}`;
  payment.paidAt = new Date();
  if (baseAmount !== undefined) payment.baseAmount = Number(baseAmount);
  if (cgst !== undefined) payment.cgst = Number(cgst);
  if (sgst !== undefined) payment.sgst = Number(sgst);
  if (payerDetails) payment.payerDetails = String(payerDetails);

  await payment.save();
  await notify(payment.userId, 'PAYMENT_SUCCESS', `Payment ${payment.paymentId} of ₹${payment.amount} completed via ${payment.paymentMethod}. Ref: ${payment.transactionRef}`);
  return success(res, payment, 'Payment paid');
}

async function allPayments(req, res) {
  return success(res, await Payment.find({}).sort({ createdAt: -1 }), 'Payments fetched');
}

module.exports = { createPayment, listPayments, getPayment, pay, allPayments };
