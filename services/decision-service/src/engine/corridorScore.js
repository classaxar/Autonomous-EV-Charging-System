const { haversineDistanceKm, findNearbyTouristSpot } = require('../data/touristSpots');

/**
 * Normalizes price between 0 and 100 (lower price = higher score)
 */
function normalizePrice(price, minPrice, maxPrice) {
  if (maxPrice === minPrice) return 100;
  return Math.max(0, Math.min(100, 100 * ((maxPrice - price) / (maxPrice - minPrice))));
}

/**
 * Evaluates candidate EV charging stations along a route corridor
 * and pairs them with cultural/tourist attractions for smart leisure charging.
 */
function scoreCorridorStations(input, stations) {
  const origin = input.origin;
  const destination = input.destination;
  const currentBattery = Number(input.currentBattery ?? 35);
  const targetBattery = Number(input.targetBattery ?? 80);
  const batteryCapacity = Number(input.batteryCapacity ?? 60);
  const maxChargingPower = Number(input.maxChargingPower ?? 60);
  const maxDetourKm = Number(input.maxDetourKm ?? 25);

  const directDistanceKm = Number(haversineDistanceKm(origin, destination).toFixed(2));
  const availableStations = stations.filter((st) => Number(st.availableChargers || 0) > 0);

  if (availableStations.length === 0) {
    return {
      directDistanceKm,
      recommended: null,
      ranked: []
    };
  }

  const prices = availableStations.map((st) => Number(st.pricePerKwh || 12));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const evaluated = availableStations.map((station) => {
    const dOriginToStation = haversineDistanceKm(origin, station.location);
    const dStationToDest = haversineDistanceKm(station.location, destination);
    const totalTripKm = dOriginToStation + dStationToDest;
    const detourKm = Math.max(0, totalTripKm - directDistanceKm);

    // Filter out stations that are too far off the travel corridor
    if (detourKm > maxDetourKm && directDistanceKm > 10) {
      return null;
    }

    const stationPower = Number(station.chargerPowerKw || 50);
    const effectivePower = Math.min(stationPower, maxChargingPower);
    const neededKwh = Math.max(0, ((targetBattery - currentBattery) / 100) * batteryCapacity);
    const estimatedMinutes = effectivePower > 0
      ? Number(((neededKwh / effectivePower) * 60).toFixed(0))
      : 45;

    // Check battery safety: average 0.18 kWh per km
    const kwhRequiredToReach = dOriginToStation * 0.18;
    const currentKwh = (currentBattery / 100) * batteryCapacity;
    const isBatterySafe = currentKwh >= kwhRequiredToReach;
    const batteryReachBuffer = Number((currentKwh - kwhRequiredToReach).toFixed(1));

    // Find nearby tourist / heritage spot
    const touristSpot = findNearbyTouristSpot(station.location, 10);

    // 1. Detour Score (100 is 0 detour, drops with distance)
    const detourScore = Math.max(0, 100 - detourKm * 4.5);

    // 2. Leisure / Tourism Score (Key differentiator!)
    let leisureScore = 20; // baseline for regular highway stop
    let touristSynergyText = 'Standard highway charging stop';

    if (touristSpot) {
      leisureScore = 65; // High base for cultural attraction
      if (touristSpot.distanceFromStationKm <= 1.0) {
        leisureScore += 20; // Walking distance bonus!
      } else if (touristSpot.distanceFromStationKm <= 3.0) {
        leisureScore += 10;
      }

      if (touristSpot.rating >= 4.8) {
        leisureScore += 5;
      }

      // Time synergy: does charging time match recommended tour time?
      const tourMins = touristSpot.recommendedTourMinutes || 45;
      const timeDiff = Math.abs(estimatedMinutes - tourMins);
      if (timeDiff <= 20) {
        leisureScore += 10; // Perfect duration sync!
        touristSynergyText = `Perfect ${estimatedMinutes}m charge syncs with ${tourMins}m tour of ${touristSpot.name}`;
      } else {
        touristSynergyText = `Explore ${touristSpot.name} (${touristSpot.distanceFromStationKm} km) while charging`;
      }
    }
    leisureScore = Math.min(100, leisureScore);

    // 3. Queue & Availability Score
    const availableChargers = Number(station.availableChargers || 1);
    const queueLength = Number(station.queueLength || 0);
    const queueScore = Math.max(10, Math.min(100, 70 + (availableChargers * 4) - (queueLength * 12)));

    // 4. Speed Score
    const speedScore = Math.min(100, (effectivePower / 60) * 100);

    // 5. Price Score
    const priceScore = normalizePrice(Number(station.pricePerKwh || 12), minPrice, maxPrice);

    // 6. En-route Corridor Bonus:
    // When driving inter-city (>20 km), en-route stations allow drivers to rest,
    // tour attractions, and recharge mid-journey before reaching destination.
    const isMidwayEnRoute = directDistanceKm > 20
      && dOriginToStation >= Math.min(10, directDistanceKm * 0.15)
      && dStationToDest >= Math.min(10, directDistanceKm * 0.15);
    const midwayBonus = isMidwayEnRoute ? 25 : 0;

    // Weighted Total Score:
    // Detour: 25%, Leisure: 25%, Availability/Queue: 20%, Speed: 15%, Price: 15% + MidwayBonus
    const totalScore = (
      (detourScore * 0.25)
      + (leisureScore * 0.25)
      + (queueScore * 0.20)
      + (speedScore * 0.15)
      + (priceScore * 0.15)
      + midwayBonus
    ) * (isBatterySafe ? 1.0 : 0.6); // Penalty if battery cannot safely reach

    // Free slot helper
    const freeSlot = station.slots && Array.isArray(station.slots)
      ? station.slots.find((s) => s.status === 'FREE')
      : null;

    let reason = touristSpot
      ? `🏛️ Best Leisure & Corridor Match: Explore ${touristSpot.name} while charging! Detour: +${detourKm.toFixed(1)} km, ${stationPower}kW DC fast charger.`
      : `⚡ Convenient corridor charger with +${detourKm.toFixed(1)} km detour, ${availableChargers} free bays, and ₹${station.pricePerKwh}/kWh.`;

    return {
      stationId: station.stationId,
      name: station.name,
      location: station.location,
      score: Number(totalScore.toFixed(1)),
      detourKm: Number(detourKm.toFixed(1)),
      distanceFromOriginKm: Number(dOriginToStation.toFixed(1)),
      distanceToDestKm: Number(dStationToDest.toFixed(1)),
      totalTripKm: Number(totalTripKm.toFixed(1)),
      chargerPowerKw: stationPower,
      pricePerKwh: Number(station.pricePerKwh || 12),
      availableChargers,
      queueLength,
      estimatedMinutes,
      batteryReachBuffer,
      isBatterySafe,
      slotId: freeSlot ? freeSlot.slotId : null,
      touristSpot,
      touristSynergyText,
      reason,
      slots: station.slots || []
    };
  }).filter(Boolean);

  // Sort descending by score
  evaluated.sort((a, b) => b.score - a.score);

  return {
    directDistanceKm,
    origin,
    destination,
    recommended: evaluated[0] || null,
    ranked: evaluated
  };
}

module.exports = {
  scoreCorridorStations
};
