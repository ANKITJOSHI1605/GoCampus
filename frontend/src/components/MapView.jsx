import React, { useEffect, useState, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = "AIzaSyA3CzCZlkh_2xIEBnZTm2xDPaoN5N3pq_k";

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
  borderRadius: '0.5rem',
};

const defaultCenter = { lat: 30.2675, lng: 77.9959 };
const libraries = ['geometry'];

const premiumColors = [
  '#3b82f6', // Premium Blue
  '#10b981', // Harmonious Emerald
  '#f59e0b', // Sleek Amber
  '#ec4899', // Rich Pink
  '#8b5cf6', // Electric Violet
  '#06b6d4', // Bright Cyan
];

const getBusColor = (busId, totalBusesCount) => {
  if (totalBusesCount === 1) {
    return '#3b82f6'; // Forced Premium Blue if only 1 bus is active
  }
  if (!busId) return premiumColors[0];
  let hash = 0;
  for (let i = 0; i < busId.length; i++) {
    hash = busId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % premiumColors.length;
  return premiumColors[colorIndex];
};

const MapView = ({ buses = [], center, showCampus = true, userLocation = null, destinationLocation = { lat: 30.2675, lng: 77.9959, name: 'Graphic Era Hill University' } }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [map, setMap] = useState(null);
  const [routePaths, setRoutePaths] = useState({});
  const [userRoutePath, setUserRoutePath] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);
  
  const fetchingCache = useRef(new Set());

  const onLoad = React.useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  const validBuses = useMemo(() => buses.filter(
    (bus) => bus.lat !== undefined && bus.lng !== undefined && bus.lat !== null && bus.lng !== null && !isNaN(bus.lat) && !isNaN(bus.lng)
  ), [buses]);

  // Fetch proper street directions using modern, zero-dependency OSRM API (client-side fallback)
  useEffect(() => {
    if (!isLoaded) return;

    validBuses.forEach(async (bus) => {
      // If the bus already has routePath supplied by the backend, skip client-side fetch entirely!
      if (bus.routePath && Array.isArray(bus.routePath) && bus.routePath.length > 0) return;

      const destLat = destinationLocation?.lat || 30.2675;
      const destLng = destinationLocation?.lng || 77.9959;
      
      // Cache key includes destination coords so if destination changes, route is recomputed
      const cacheKey = `${bus.id}-${bus.lat.toFixed(3)}-${bus.lng.toFixed(3)}-${destLat.toFixed(3)}-${destLng.toFixed(3)}`;
      if (routePaths[bus.id]?.cacheKey === cacheKey || fetchingCache.current.has(cacheKey)) return;

      fetchingCache.current.add(cacheKey);

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${bus.lng},${bus.lat};${destLng},${destLat}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates;
          const decodedPath = coordinates.map(coord => ({
            lat: coord[1],
            lng: coord[0]
          }));
          
          setRoutePaths((prev) => ({
            ...prev,
            [bus.id]: { path: decodedPath, cacheKey }
          }));
        } else {
          console.warn(`OSRM failed for bus ${bus.id}`);
        }
      } catch (err) {
        console.error(`Error requesting OSRM route for bus ${bus.id}:`, err);
      } finally {
        fetchingCache.current.delete(cacheKey);
      }
    });
  }, [validBuses, isLoaded, routePaths, destinationLocation?.lat, destinationLocation?.lng]);

  // Fetch directions for User Location to Destination
  useEffect(() => {
    if (!isLoaded || !window.google || !userLocation || userLocation.lat === undefined || userLocation.lng === undefined || userLocation.lat === null || userLocation.lng === null) return;
    
    const cacheKey = `user-${Number(userLocation.lat).toFixed(3)}-${Number(userLocation.lng).toFixed(3)}`;
    if (userRoutePath?.cacheKey === cacheKey || fetchingCache.current.has(cacheKey)) return;

    fetchingCache.current.add(cacheKey);

    const fetchUserRoute = async () => {
      try {
        const requestBody = {
          origin: { location: { latLng: { latitude: userLocation.lat, longitude: userLocation.lng } } },
          destination: { location: { latLng: { latitude: destinationLocation.lat, longitude: destinationLocation.lng } } },
          travelMode: "WALK" // Assuming student walks to campus or uses it as a walking/driving guide
        };

        const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask": "routes.polyline.encodedPolyline"
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const encodedPolyline = data.routes[0].polyline.encodedPolyline;
          const decodedPath = window.google.maps.geometry.encoding.decodePath(encodedPolyline);
          
          setUserRoutePath({ path: decodedPath, cacheKey });
        }
      } catch (err) {
        console.error(`Error fetching user route:`, err);
      }
    };

    fetchUserRoute();
  }, [userLocation, isLoaded, destinationLocation?.lat, destinationLocation?.lng, userRoutePath]);

  // Fit bounds whenever buses update
  useEffect(() => {
    if (!map || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    if (showCampus && destinationLocation && destinationLocation.lat !== undefined && destinationLocation.lng !== undefined) {
      bounds.extend({ lat: destinationLocation.lat, lng: destinationLocation.lng });
      hasPoints = true;
    }

    if (userLocation) {
      bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
      hasPoints = true;
    }

    validBuses.forEach((b) => {
      bounds.extend({ lat: b.lat, lng: b.lng });
      hasPoints = true;
    });

    if (hasPoints) {
      map.fitBounds(bounds);
    }
  }, [map, validBuses, userLocation, showCampus, destinationLocation?.lat, destinationLocation?.lng]);

  if (!isLoaded) {
    return <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border font-semibold text-gray-500 shadow-sm">Loading Google Maps...</div>;
  }

  const initialCenter = center && Array.isArray(center) && center.length === 2 
    ? { lat: center[0], lng: center[1] } 
    : defaultCenter;

  return (
    <div className="w-full h-full min-h-[400px] relative rounded-lg overflow-hidden border shadow-sm">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
        onClick={() => setActiveMarker(null)}
      >
        {/* Campus Marker */}
        {showCampus && destinationLocation && destinationLocation.lat !== undefined && destinationLocation.lng !== undefined && (
          <Marker 
            position={{ lat: destinationLocation.lat, lng: destinationLocation.lng }}
            label={{ text: "🏫", fontSize: "24px" }}
            title={destinationLocation.name || "Campus Destination"}
            onClick={() => setActiveMarker("campus")}
          >
            {activeMarker === "campus" && (
              <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                <div className="font-sans">
                  <h3 className="font-bold text-gray-900 border-b pb-1 mb-1">🏫 {destinationLocation.name || "Campus Destination"}</h3>
                  <p className="text-sm text-gray-600">Destination Location</p>
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}

        {/* User Marker and Route */}
        {userLocation && userLocation.lat !== undefined && userLocation.lng !== undefined && (
          <>
            <Marker 
              position={{ lat: userLocation.lat, lng: userLocation.lng }}
              label={{ text: "🧍", fontSize: "24px" }}
              title="Your Location"
              onClick={() => setActiveMarker("user")}
            >
              {activeMarker === "user" && (
                <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                  <div className="font-sans">
                    <h3 className="font-bold text-gray-900 border-b pb-1 mb-1">🧍 Your Location</h3>
                    <p className="text-sm text-gray-600">Waiting Point</p>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          </>
        )}

        {/* Bus Markers and Routes */}
        {validBuses.map((bus) => (
          <React.Fragment key={bus.id}>
            {/* Driving Route - Premium street road directions or fallback */}
            <Polyline
              path={bus.routePath || routePaths[bus.id]?.path || [
                { lat: bus.lat, lng: bus.lng },
                { lat: destinationLocation?.lat || 30.2675, lng: destinationLocation?.lng || 77.9959 }
              ]}
              options={{
                strokeColor: getBusColor(bus.id, validBuses.length),
                strokeOpacity: (bus.routePath || routePaths[bus.id]) ? 0.8 : 0, // Geodesic line uses dashed icons, so set main stroke to transparent
                strokeWeight: 5,
                icons: !(bus.routePath || routePaths[bus.id]) ? [{
                  icon: {
                    path: 'M 0,-2 0,2',
                    strokeOpacity: 0.8,
                    scale: 3,
                    strokeColor: getBusColor(bus.id, validBuses.length)
                  },
                  offset: '0',
                  repeat: '16px'
                }] : []
              }}
            />

            {/* Custom Bus Marker */}
            <Marker
              position={{ lat: bus.lat, lng: bus.lng }}
              label={{ text: "🚌", fontSize: "24px" }}
              title={bus.busCode ? `Bus ${bus.busCode} (${bus.busNumber})` : `Bus ${bus.busNumber || 'Unknown'}`}
              onClick={() => setActiveMarker(`bus-${bus.id}`)}
              zIndex={100}
            >
              {activeMarker === `bus-${bus.id}` && (
                <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                  <div className="font-sans p-1">
                    <h3 className="font-bold text-gray-900 border-b pb-1 mb-2">🚌 Bus {bus.busCode ? `${bus.busCode} (${bus.busNumber})` : bus.busNumber}</h3>
                    <p className="text-sm text-gray-700 mb-1"><span className="font-semibold text-gray-900">Driver:</span> {bus.driverName}</p>
                    <p className="text-sm text-gray-700 mb-2"><span className="font-semibold text-gray-900">Route:</span> {bus.route || 'Unassigned'}</p>
                    {bus.seats !== undefined && (
                      <div className="bg-blue-50/50 rounded-lg border border-blue-100 p-2 flex justify-between items-center mt-2">
                        <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Seats Available</span>
                        <span className="text-lg font-black text-blue-600">{bus.seats}</span>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-1.5 bg-green-50 rounded-full px-2 py-1 w-fit border border-green-100">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span>
                      <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Live GPS</span>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          </React.Fragment>
        ))}
      </GoogleMap>
    </div>
  );
};

export default MapView;
