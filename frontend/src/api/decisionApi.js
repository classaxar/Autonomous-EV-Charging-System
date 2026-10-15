import client from './client';
import axios from 'axios';

/**
 * Standard Gujarat corridor presets for quick testing and one-click travel selection
 */
export const PRESET_LOCATIONS = [
  { name: 'Mehsana City / Highway Bypass', latitude: 23.5880, longitude: 72.3693, type: 'origin' },
  { name: 'Patan (Rani ki Vav / Historic Capital)', latitude: 23.8584, longitude: 72.1017, type: 'destination' },
  { name: 'Modhera (Sun Temple & Solar Hub)', latitude: 23.5835, longitude: 72.1332, type: 'waypoint' },
  { name: 'Ahmedabad (SG Highway / Iscon)', latitude: 23.0300, longitude: 72.5080, type: 'origin' },
  { name: 'Gandhinagar (Infocity / Akshardham)', latitude: 23.2156, longitude: 72.6369, type: 'origin' },
  { name: 'Vadnagar (Ancient Buddhist & Toran City)', latitude: 23.7844, longitude: 72.6372, type: 'destination' },
  { name: 'Ambaji (Temple Town / Aravalli)', latitude: 24.3320, longitude: 72.8530, type: 'destination' }
];

/**
 * Request an AI-driven charging station recommendation.
 */
export async function recommendChargingStation(payload) {
  const response = await client.post('/api/decision/recommend', payload);
  return response.data.data;
}

/**
 * Request an AI-driven route corridor & smart leisure recommendation.
 * Syncs the route with OpenStreetMap and pairs charging with cultural tourist destinations.
 *
 * @param {Object} payload
 * @param {Object} payload.origin - { latitude, longitude, name }
 * @param {Object} payload.destination - { latitude, longitude, name }
 * @param {number} [payload.currentBattery] - Current SoC %
 * @param {number} [payload.targetBattery] - Target SoC %
 * @param {number} [payload.maxDetourKm] - Max allowable detour off highway in km
 */
export async function recommendCorridorTrip(payload) {
  const response = await client.post('/api/decision/corridor-recommend', payload);
  return response.data.data;
}

/**
 * Fetch regional tourist and cultural heritage spots.
 */
export async function getTouristSpots(params = {}) {
  const response = await client.get('/api/decision/tourist-spots', { params });
  return response.data.data;
}

/**
 * OpenStreetMap Nominatim Geocoding search with built-in regional fallback
 */
export async function searchOpenStreetMap(query) {
  if (!query || query.trim().length < 2) return [];

  const lower = query.toLowerCase().trim();
  const matchedPresets = PRESET_LOCATIONS.filter((p) => p.name.toLowerCase().includes(lower));

  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${query}, Gujarat, India`,
        format: 'json',
        limit: 5,
        addressdetails: 1
      },
      headers: {
        'Accept-Language': 'en'
      },
      timeout: 4000
    });

    const osmResults = (res.data || []).map((item) => ({
      name: item.display_name.split(',').slice(0, 3).join(','),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      source: 'OpenStreetMap'
    }));

    return [...matchedPresets, ...osmResults].slice(0, 6);
  } catch {
    // If offline or rate-limited, fallback gracefully to preset locations
    return matchedPresets.length > 0 ? matchedPresets : [
      { name: `${query} (Est. Location)`, latitude: 23.5880, longitude: 72.3693 }
    ];
  }
}
