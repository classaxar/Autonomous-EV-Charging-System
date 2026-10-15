jest.mock('../models/Payment', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

const Payment = require('../models/Payment');
const { createPayment, pay } = require('../controllers/paymentController');

function response() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('calculates and rounds payment amount', async () => {
  const payment = { amount: 288, sessionId: 'SES1' };
  Payment.findOne.mockResolvedValue(null);
  Payment.create.mockResolvedValue(payment);
  const res = response();

  await createPayment({ body: { userId: 'U1', bookingId: 'B1', sessionId: 'SES1', energyKwh: 24, pricePerKwh: 12 } }, res);

  expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 288 }));
  expect(res.status).toHaveBeenCalledWith(201);
});

test('returns the existing payment for a duplicate session', async () => {
  const payment = { amount: 10, sessionId: 'SES1' };
  Payment.findOne.mockResolvedValue(payment);
  const res = response();

  await createPayment({ body: { userId: 'U1', bookingId: 'B1', sessionId: 'SES1', energyKwh: 1, pricePerKwh: 10 } }, res);

  expect(Payment.create).not.toHaveBeenCalled();
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: payment, message: 'Payment already exists' }));
});

test('settles payment via Indian Rupee payment method (UPI / RuPay)', async () => {
  const mockPaymentDoc = {
    paymentId: 'PAY-100',
    userId: 'U1',
    amount: 354,
    status: 'PENDING',
    save: jest.fn().mockResolvedValue(true)
  };
  Payment.findOne.mockResolvedValue(mockPaymentDoc);
  const res = response();

  await pay({
    params: { id: 'PAY-100' },
    user: { userId: 'U1' },
    body: {
      paymentMethod: 'UPI',
      transactionRef: 'UTR-20261015-883391',
      baseAmount: 300,
      cgst: 27,
      sgst: 27,
      payerDetails: 'driver@okhdfcbank'
    }
  }, res);

  expect(mockPaymentDoc.status).toBe('PAID');
  expect(mockPaymentDoc.paymentMethod).toBe('UPI');
  expect(mockPaymentDoc.transactionRef).toBe('UTR-20261015-883391');
  expect(mockPaymentDoc.save).toHaveBeenCalled();
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Payment paid' }));
});
