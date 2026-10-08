function generateBookingId() {
  const suffix = `${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return `B${suffix}`;
}

module.exports = {
  generateBookingId
};
