const scoring = require('../config/scoring');

function haversineDistanceKm(first, second) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const latitudeOne = toRadians(first.latitude);
  const latitudeTwo = toRadians(second.latitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeOne) * Math.cos(latitudeTwo) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizePrice(price, minPrice, maxPrice) {
  if (maxPrice === minPrice) {
    return 100;
  }
  return 100 * ((maxPrice - price) / (maxPrice - minPrice));
}

function priorityForBattery(currentBattery) {
  if (currentBattery <= 15) {
    return 'HIGH';
  }
  if (currentBattery <= 40) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function scoreStations(input, stations) {
  const currentBattery = Number(input.currentBattery);
  const targetBattery = Number(input.targetBattery);
  const batteryCapacity = Number(input.batteryCapacity);
  const maxChargingPower = Number(input.maxChargingPower);
  const batteryPriority = 100 - currentBattery;
  const availableStations = stations.filter((station) => Number(station.availableChargers) > 0);

  if (availableStations.length === 0) {
    return {
      priority: priorityForBattery(currentBattery),
      ranked: []
    };
  }

  const prices = availableStations.map((station) => Number(station.pricePerKwh));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const weights = {
    ...scoring.weights,
    distance: scoring.weights.distance * (1 + batteryPriority / 100)
  };
  const weightTotal = Object.values(weights).reduce((total, weight) => total + weight, 0);

  const ranked = availableStations.map((station) => {
    const distanceKm = haversineDistanceKm(input.location, station.location);
    const stationPower = Number(station.chargerPowerKw);
    const effectivePower = Math.min(stationPower, maxChargingPower);
    const distanceScore = Math.max(0, 100 - distanceKm * scoring.distanceMultiplier);
    const queueScore = Math.max(0, 100 - Number(station.queueLength || 0) * scoring.queueMultiplier);
    const priceScore = normalizePrice(Number(station.pricePerKwh), minPrice, maxPrice);
    const speedScore = Math.min(100, (effectivePower / scoring.referencePowerKw) * 100);
    const score = (
      batteryPriority * weights.battery
      + distanceScore * weights.distance
      + queueScore * weights.queue
      + priceScore * weights.price
      + speedScore * weights.speed
    ) / weightTotal;
    const estimatedMinutes = effectivePower > 0
      ? ((targetBattery - currentBattery) / 100) * batteryCapacity / effectivePower * 60
      : null;

    return {
      stationId: station.stationId,
      name: station.name,
      score: Number(score.toFixed(2)),
      distanceKm: Number(distanceKm.toFixed(2)),
      queueLength: Number(station.queueLength || 0),
      pricePerKwh: Number(station.pricePerKwh),
      estimatedMinutes: estimatedMinutes === null ? null : Number(Math.max(0, estimatedMinutes).toFixed(2)),
      reason: 'Nearest available charger, low queue, high battery priority',
      slots: station.slots || []
    };
  }).sort((first, second) => second.score - first.score);

  return {
    priority: priorityForBattery(currentBattery),
    ranked
  };
}

module.exports = {
  haversineDistanceKm,
  normalizePrice,
  priorityForBattery,
  scoreStations
};
