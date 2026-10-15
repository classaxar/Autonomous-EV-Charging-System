let counter = 100;
function generatePaymentId() {
  counter += 1;
  return `P${counter}`;
}
module.exports = { generatePaymentId };
