const Settings = require('../models/Settings');

// In-memory cache to store computed street route paths and prevent rate limits
// Map<cacheKey, Array<{lat, lng}>>
const routeCache = new Map();

/**
 * Calculates a premium, highly accurate street road path from a bus location to campus
 * @param {string} busId 
 * @param {number} lat 
 * @param {number} lng 
 * @returns {Promise<Array<{lat: number, lng: number}>>}
 */
const getRouteForBus = async (busId, lat, lng) => {
  if (lat === undefined || lng === undefined || lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
    return null;
  }
  
  // 1. Basic caching to avoid repeated calls for the exact same coordinate (toFixed(3) is ~111 meters)
  const latFixed = Number(lat).toFixed(3);
  const lngFixed = Number(lng).toFixed(3);
  const cacheKey = `${busId}-${latFixed}-${lngFixed}`;
  
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }
  
  // 2. Fetch destination location from Settings database, fallback if missing
  let destLat = 30.2675;
  let destLng = 77.9959;
  try {
    const settings = await Settings.findOne({});
    if (settings && settings.destinationLocation && settings.destinationLocation.lat !== undefined) {
      destLat = settings.destinationLocation.lat;
      destLng = settings.destinationLocation.lng;
    }
  } catch (err) {
    console.error('Error fetching settings for routing:', err.message);
  }
  
  // 3. Query Open Source Routing Machine (OSRM)
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lngFixed},${latFixed};${destLng.toFixed(4)},${destLat.toFixed(4)}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const coordinates = data.routes[0].geometry.coordinates;
      const decodedPath = coordinates.map(coord => ({
        lat: coord[1],
        lng: coord[0]
      }));
      routeCache.set(cacheKey, decodedPath);
      return decodedPath;
    } else {
      console.warn(`OSRM returned non-Ok code for bus ${busId}:`, data.code);
    }
  } catch (err) {
    console.error(`Error requesting OSRM route for bus ${busId}:`, err.message);
  }
  
  // Fallback to straight geodesic line path if OSRM API failed
  return [
    { lat: Number(lat), lng: Number(lng) },
    { lat: destLat, lng: destLng }
  ];
};

module.exports = {
  getRouteForBus,
  routeCache
};
