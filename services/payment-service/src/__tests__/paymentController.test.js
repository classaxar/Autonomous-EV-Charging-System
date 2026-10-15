jest.mock('../models/Payment', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

const Payment = require('../models/Payment');
const { createPayment } = require('../controllers/paymentController');

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
