let counter = 100;
function generateSessionId() {
  counter += 1;
  return `CS${counter}`;
}
module.exports = { generateSessionId };
