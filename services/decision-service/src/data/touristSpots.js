/**
 * Tourist and Cultural Heritage Points of Interest (POIs) along key travel corridors.
 * Synchronized with OpenStreetMap tags (historic, tourism, leisure, amenity).
 */

const touristSpots = [
  {
    id: 'POI_MODHERA',
    name: 'Modhera Sun Temple & Surya Kund',
    category: 'Cultural Heritage & Monument',
    osmTag: 'historic=monument;religion=hindu;tourism=attraction',
    location: { latitude: 23.5835, longitude: 72.1332 },
    nearestCity: 'Modhera (Mehsana-Patan Highway)',
    corridor: 'Mehsana - Patan Corridor (SH-55 / SH-7)',
    rating: 4.9,
    recommendedTourMinutes: 45,
    tagline: '11th Century Architectural Wonder & India\'s 1st 24x7 Solar Village',
    description: 'Built by King Bhima I of the Solanki dynasty in 1026 CE. Features the majestic Surya Kund stepped water reservoir, the Sabha Mandapa with 52 intricately carved pillars representing the weeks of the year, and an alignment that captures equinox sun rays.',
    activities: [
      'Walk around the ancient Surya Kund stepwell',
      'Admire intricate sandstone carvings of the Sabha Mandapa',
      'Visit the clean solar-powered visitor interpretation center'
    ],
    amenities: ['Clean Restrooms', 'Cafe / Refreshments', 'EV Charging Bay', 'Wheelchair Friendly', 'Souvenir Stalls']
  },
  {
    id: 'POI_RANI_KI_VAV',
    name: 'Rani ki Vav (Queen\'s Stepwell)',
    category: 'UNESCO World Heritage Site',
    osmTag: 'historic=archaeological_site;heritage=unesco;tourism=attraction',
    location: { latitude: 23.8589, longitude: 72.1018 },
    nearestCity: 'Patan',
    corridor: 'Mehsana - Patan Corridor',
    rating: 4.9,
    recommendedTourMinutes: 60,
    tagline: 'Subterranean Masterpiece of Water Architecture',
    description: 'Constructed by Queen Udayamati in memory of King Bhima I. Features over 500 principal sculptures and over a thousand minor ones combining religious, mythological, and secular imagery.',
    activities: [
      'Descend into the 7-level subterranean stepped corridor',
      'Photograph pristine Dashavatara sculptures',
      'Stroll through landscaped manicured lawns'
    ],
    amenities: ['Garden Lawns', 'Ticket Counter', 'Restrooms', 'Local Patola Saree Displays']
  },
  {
    id: 'POI_ADALAJ_STEPWELL',
    name: 'Adalaj Stepwell (Rudabai Stepwell)',
    category: 'Heritage Monument',
    osmTag: 'historic=monument;tourism=attraction',
    location: { latitude: 23.1667, longitude: 72.5800 },
    nearestCity: 'Adalaj / Gandhinagar',
    corridor: 'Ahmedabad - Gandhinagar - Mehsana Highway',
    rating: 4.8,
    recommendedTourMinutes: 35,
    tagline: 'Intricate Indo-Islamic Octagonal Stepwell',
    description: 'Built in 1498 by Queen Rudadevi. An octagonal subterranean shaft with five storeys, carved pillars, and natural cooling geometry.',
    activities: [
      'Explore octagonal galleries with natural air-conditioning',
      'View Solanki-Islamic fusion stone friezes'
    ],
    amenities: ['Parking', 'Drinking Water', 'Gardens']
  },
  {
    id: 'POI_THOL_BIRD_SANCTUARY',
    name: 'Thol Bird Sanctuary & Ramsar Lake',
    category: 'Eco-Tourism & Nature',
    osmTag: 'leisure=nature_reserve;tourism=attraction',
    location: { latitude: 23.1415, longitude: 72.4042 },
    nearestCity: 'Thol (Near Sanand-Kadi Corridor)',
    corridor: 'Ahmedabad - Mehsana West Corridor',
    rating: 4.7,
    recommendedTourMinutes: 50,
    tagline: 'Ramsar Wetland Site Hosting 150+ Migratory Avian Species',
    description: 'Serene freshwater body surrounded by marshes. Home to flamingos, sarus cranes, and pelicans during winter months.',
    activities: [
      'Bird-watching trail along the water reservoir bund',
      'Peaceful morning/evening nature stroll'
    ],
    amenities: ['Watch Towers', 'Visitor Center', 'Eco-Walking Trails']
  },
  {
    id: 'POI_VADNAGAR_TORAN',
    name: 'Vadnagar Kirti Toran & Buddhist Relics',
    category: 'Ancient Archaeology',
    osmTag: 'historic=archaeological_site;tourism=attraction',
    location: { latitude: 23.7844, longitude: 72.6372 },
    nearestCity: 'Vadnagar',
    corridor: 'Mehsana - Visnagar - Vadnagar Corridor',
    rating: 4.7,
    recommendedTourMinutes: 45,
    tagline: '2,500-Year-Old Historic Citadel & Red Sandstone Torans',
    description: 'Famous for twin 40-foot 12th century triumphal arches (Kirti Torans) and excavated ancient Buddhist monasteries documented by Chinese traveler Hiuen Tsang.',
    activities: [
      'Marvel at the 40-foot Solanki stone arches',
      'Explore excavated Buddhist stupas and archaeological museum'
    ],
    amenities: ['Museum', 'Heritage Walk', 'Restrooms']
  },
  {
    id: 'POI_AKSHARDHAM_GANDHINAGAR',
    name: 'Akshardham Temple & Cultural Garden',
    category: 'Spiritual & Cultural Landmark',
    osmTag: 'amenity=place_of_worship;tourism=attraction',
    location: { latitude: 23.2292, longitude: 72.6738 },
    nearestCity: 'Gandhinagar',
    corridor: 'Gandhinagar - Ahmedabad Corridor',
    rating: 4.9,
    recommendedTourMinutes: 60,
    tagline: 'Pink Sandstone Architectural Wonder & Exhibition Gardens',
    description: 'Majestic 23-acre cultural complex dedicated to Indian heritage, art, and values. Features ornate stone mandirs and herbal gardens.',
    activities: [
      'Walk through the Sahajanand Van gardens',
      'Admire intricate sandstone stone carvings'
    ],
    amenities: ['Food Court (Premvati)', 'Luggage Counters', 'Shaded Courtyards', 'Restrooms']
  }
];

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

/**
 * Finds the best matching tourist spot near a given coordinate.
 * @param {Object} location - { latitude, longitude }
 * @param {number} maxRadiusKm - Max distance in km (default 12 km)
 * @returns {Object|null}
 */
function findNearbyTouristSpot(location, maxRadiusKm = 15) {
  if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
    return null;
  }

  let bestSpot = null;
  let minDistance = Infinity;

  for (const spot of touristSpots) {
    const dist = haversineDistanceKm(location, spot.location);
    if (dist <= maxRadiusKm && dist < minDistance) {
      minDistance = dist;
      bestSpot = {
        ...spot,
        distanceFromStationKm: Number(dist.toFixed(2)),
        walkingTimeMin: Math.max(2, Math.round((dist * 1000) / 80)) // ~80m per min walk
      };
    }
  }

  return bestSpot;
}

module.exports = {
  touristSpots,
  haversineDistanceKm,
  findNearbyTouristSpot
};
