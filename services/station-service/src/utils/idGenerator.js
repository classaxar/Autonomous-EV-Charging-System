function generateStationId() {
  const suffix = `${Date.now().toString().slice(-5)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  return `ST${suffix}`;
}

module.exports = {
  generateStationId
};
