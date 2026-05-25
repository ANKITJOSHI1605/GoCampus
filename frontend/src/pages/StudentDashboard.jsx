import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import ScheduleTable from '../components/ScheduleTable';
import socket from '../services/socket';
import { AuthContext } from '../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeBuses, setActiveBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState(null);

  // New States for Geolocation & Waiting
  const [userLocation, setUserLocation] = useState(null);
  const [waitingForBus, setWaitingForBus] = useState(null);
  const [waitRemaining, setWaitRemaining] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // GEU Campus Coordinates (fallback)
  const CAMPUS_LAT = 30.2675;
  const CAMPUS_LNG = 77.9959;

  // Real-time clock effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Waitlist countdown effect (5 minutes = 300 seconds)
  useEffect(() => {
    if (waitingForBus && waitRemaining > 0) {
      const timer = setInterval(() => {
        setWaitRemaining(prev => {
          if (prev <= 1) {
            socket.emit('leaveWaitlist', { busId: waitingForBus });
            setWaitingForBus(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [waitingForBus, waitRemaining]);

  // Helper to calculate exact distance in KM between two lat/lng points
  const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
  };

  // Haversine ETA Calculation from Student Location
  const calculateETA = (lat, lng) => {
    if (!lat || !lng || !userLocation) return '--';
    const distanceKm = calculateDistanceKm(lat, lng, userLocation.lat, userLocation.lng);
    
    // Assume average city speed 20km/h
    const timeHours = distanceKm / 20;
    const timeMinutes = Math.round(timeHours * 60);
    return timeMinutes <= 1 ? 'Arriving' : `${timeMinutes} min`;
  };

  useEffect(() => {
    // Start tracking user location
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }

    const fetchBuses = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/buses`);
        const data = await response.json();
        
        const mapData = data
          .filter(bus => bus.currentLocation?.lat !== undefined && bus.currentLocation?.lng !== undefined)
          .map(bus => ({
            id: bus._id,
            busNumber: bus.busNumber,
            busCode: bus.busCode || '',
            driverName: bus.driverName,
            route: bus.route,
            lat: bus.currentLocation?.lat,
            lng: bus.currentLocation?.lng,
            seats: bus.availableSeats,
            routePath: bus.routePath || null
          }));
          
        // We do NOT call setActiveBuses(mapData) here so that the student map & live seat availability
        // strictly represent the 100% real-time connected active fleet.
      } catch (err) {
        console.error('Failed to fetch buses:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSettings = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/settings/schedule`);
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSettings();
    fetchBuses();

    // Fetch Persistent Notifications
    fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/notifications`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error(err));
    
    // Listen for live Admin Notifications
    const handleAdminAlert = (alert) => {
      setNotifications(prev => [alert, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    
    const handleBusUpdate = (updatedBus) => {
      setActiveBuses(prevBuses => {
        const exists = prevBuses.find(b => b.id === updatedBus.id);
        if (exists) {
          return prevBuses.map(b => b.id === updatedBus.id ? { 
            ...b, 
            lat: updatedBus.lat !== undefined ? updatedBus.lat : b.lat, 
            lng: updatedBus.lng !== undefined ? updatedBus.lng : b.lng,
            seats: updatedBus.seats !== undefined ? updatedBus.seats : b.seats,
            busNumber: updatedBus.busNumber || b.busNumber,
            busCode: updatedBus.busCode !== undefined ? updatedBus.busCode : b.busCode,
            driverName: updatedBus.driverName || b.driverName,
            route: updatedBus.route || b.route,
            routePath: updatedBus.routePath !== undefined ? updatedBus.routePath : b.routePath,
          } : b);
        } else {
          // New bus came online
          return [...prevBuses, {
            id: updatedBus.id,
            busNumber: updatedBus.busNumber || 'Unknown',
            busCode: updatedBus.busCode || '',
            driverName: updatedBus.driverName || 'Unknown',
            route: updatedBus.route || 'Unassigned',
            lat: updatedBus.lat,
            lng: updatedBus.lng,
            seats: updatedBus.seats,
            routePath: updatedBus.routePath || null,
          }];
        }
      });
    };
    
    const handleWaitlistUpdate = (data) => {
      if (waitingForBus && data.busId === waitingForBus) {
        // Waitlist info
      }
    };
    
    const handleSettingsUpdate = (data) => {
      setSettings(data);
    };

    const handleOnlineDriversList = (drivers) => {
      const mapData = drivers.map(d => ({
        id: d.busId,
        busNumber: d.busNumber,
        busCode: d.busCode || '',
        driverName: d.driverName,
        route: d.route || 'Unassigned',
        lat: d.lat,
        lng: d.lng,
        seats: d.seats,
        routePath: d.routePath || null
      }));
      setActiveBuses(mapData);
    };

    const handleDriverOffline = ({ busId }) => {
      setActiveBuses(prev => prev.filter(b => b.id !== busId));
    };

    socket.on('busUpdate', handleBusUpdate);
    socket.on('adminAlert', handleAdminAlert);
    socket.on('waitlistUpdate', handleWaitlistUpdate);
    socket.on('scheduleUpdated', handleSettingsUpdate);
    socket.on('onlineDriversList', handleOnlineDriversList);
    socket.on('driverOffline', handleDriverOffline);

    return () => {
       if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
       socket.off('busUpdate', handleBusUpdate);
       socket.off('adminAlert', handleAdminAlert);
       socket.off('waitlistUpdate', handleWaitlistUpdate);
       socket.off('scheduleUpdated', handleSettingsUpdate);
       socket.off('onlineDriversList', handleOnlineDriversList);
       socket.off('driverOffline', handleDriverOffline);
    };
  }, [waitingForBus]);

  // Filter buses that are within 2km of user location
  const nearbyBuses = activeBuses.filter(bus => {
    if (!userLocation || !bus.lat || !bus.lng) return false;
    const distance = calculateDistanceKm(bus.lat, bus.lng, userLocation.lat, userLocation.lng);
    return distance <= 2.0;
  });

  // Dynamic Fallback: If no buses are within 2km, auto-detect and display all active fleet buses in real time
  const busesToShow = nearbyBuses.length > 0 ? nearbyBuses : activeBuses;
  const isShowingAllBuses = nearbyBuses.length === 0 && activeBuses.length > 0;

  const handleWaitClick = (busId) => {
    if (waitingForBus === busId) {
      // Cancel waiting
      socket.emit('leaveWaitlist', { busId });
      setWaitingForBus(null);
      setWaitRemaining(0);
    } else {
      // If already waiting for another bus, leave that one first
      if (waitingForBus) {
        socket.emit('leaveWaitlist', { busId: waitingForBus });
      }
      socket.emit('joinWaitlist', { busId });
      setWaitingForBus(busId);
      setWaitRemaining(300); // 5 minutes in seconds
    }
  };

  const formatTimeRemaining = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar 
        role="Student" 
        userName={user?.name || 'Student'} 
        unreadCount={unreadCount} 
        notifications={notifications}
        onNotificationClick={() => {
          setUnreadCount(0);
        }}
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col lg:flex-row gap-6">
        
        {/* Main Tracking Area */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Live Bus Tracking</h2>
              <p className="text-sm text-gray-500">View real-time locations of campus buses</p>
            </div>
            <div className="flex gap-2">
               <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-semibold border ${isShowingAllBuses ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                 {isShowingAllBuses ? `${busesToShow.length} Active Fleet Buses` : `${busesToShow.length} Buses Active (Near 2km)`}
               </span>
            </div>
          </div>
          
          <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden relative min-h-[350px] lg:min-h-[500px]">
            {/* Embedded MapView */}
            <MapView buses={busesToShow} userLocation={userLocation} showCampus={true} destinationLocation={settings?.destinationLocation} />
          </div>
        </div>

        {/* Sidebar Info Area */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          
          {/* Active Fleet Status */}
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              🚍 {isShowingAllBuses ? 'Live Seat Availability (Active Fleet)' : 'Live Seat Availability (Near 2km)'}
            </h3>
            {!userLocation ? (
                <p className="text-sm text-yellow-600 font-medium animate-pulse">Acquiring your location to find nearby buses...</p>
            ) : busesToShow.length === 0 ? (
                <p className="text-sm text-gray-500">No active buses on route currently.</p>
            ) : (
                <ul className="space-y-4">
                  {busesToShow.map((bus) => (
                    <li key={bus.id} className="flex flex-col justify-start border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between w-full items-center mb-1">
                        <p className="font-bold text-sm text-blue-900">Bus {bus.busCode ? `${bus.busCode} (${bus.busNumber})` : bus.busNumber || 'UK07'}</p>
                        <span className={`text-xs font-black shadow-sm px-2.5 py-1 rounded-md ${bus.seats > 5 ? 'bg-green-100 text-green-700 border border-green-200' : bus.seats > 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                          {bus.seats !== undefined ? `${bus.seats} Seats Left` : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">📍 {bus.route || 'Unassigned Route'}</p>
                        <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          ETA: {calculateETA(bus.lat, bus.lng)}
                        </p>
                      </div>
                      <div className="mt-3 flex justify-end w-full">
                        <button 
                          onClick={() => handleWaitClick(bus.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded transition ${waitingForBus === bus.id ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
                        >
                          {waitingForBus === bus.id ? `Cancel Waiting (${formatTimeRemaining(waitRemaining)})` : 'Wait for this Bus'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
            )}
          </div>

          {/* Schedule Summary */}
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">📅 Today's Schedule</span>
            </h3>
            
            {/* Real Date and Time */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm font-semibold text-blue-900">
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-2xl font-black text-blue-600 mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>

            <ScheduleTable />
          </div>

          {/* Notifications */}
          <div id="notifications-section" className="bg-white p-5 rounded-xl shadow-sm border flex-1">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              📣 Admin Notifications
            </h3>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {notifications.length === 0 && <p className="text-sm text-gray-500">No active alerts.</p>}
              {notifications.map((notif, idx) => (
                <div key={notif._id || idx} className={`p-3 rounded border-l-4 ${notif.type === 'warning' ? 'bg-yellow-50 border-yellow-500' : 'bg-blue-50 border-blue-500'}`}>
                  <p className={`text-sm font-medium ${notif.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'}`}>{notif.message}</p>
                  <p className={`text-xs mt-1 ${notif.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`}>
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown Time'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default StudentDashboard;
