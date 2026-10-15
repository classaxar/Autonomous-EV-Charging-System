const defaults = {
    battery: Number(process.env.SCORE_WEIGHT_BATTERY || 0.3),
    distance: Number(process.env.SCORE_WEIGHT_DISTANCE || 0.2),
    queue: Number(process.env.SCORE_WEIGHT_QUEUE || 0.2),
    price: Number(process.env.SCORE_WEIGHT_PRICE || 0.15),
    speed: Number(process.env.SCORE_WEIGHT_SPEED || 0.15)
};

function getWeights() {
  return {
    battery: Number(process.env.SCORE_WEIGHT_BATTERY || defaults.battery),
    distance: Number(process.env.SCORE_WEIGHT_DISTANCE || defaults.distance),
    queue: Number(process.env.SCORE_WEIGHT_QUEUE || defaults.queue),
    price: Number(process.env.SCORE_WEIGHT_PRICE || defaults.price),
    speed: Number(process.env.SCORE_WEIGHT_SPEED || defaults.speed)
  };
}

module.exports = {
  weights: defaults,
  getWeights,
  distanceMultiplier: 10,
  queueMultiplier: 15,
  referencePowerKw: 50
};
