import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../services/socket';
import { AuthContext } from '../context/AuthContext';
import ScheduleTable from '../components/ScheduleTable';
import Navbar from '../components/Navbar';

const DriverDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [availableSeats, setAvailableSeats] = useState(19);
  const [lastUpdated, setLastUpdated] = useState('Waiting for GPS...');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [waitingPassengers, setWaitingPassengers] = useState(0);
  const seatsRef = useRef(availableSeats);
  const [assignedBusId, setAssignedBusId] = useState(null);
  const [assignedBusInfo, setAssignedBusInfo] = useState(null);
  const [allBuses, setAllBuses] = useState([]);
  const [busCode, setBusCode] = useState('');
  const busCodeRef = useRef(busCode);
  useEffect(() => { busCodeRef.current = busCode; }, [busCode]);
  const [gpsStatus, setGpsStatus] = useState('initializing');
  const [gpsError, setGpsError] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const watchIdRef = useRef(null);
  const lastEmitRef = useRef(0);

  const handleLogout = () => {
    if (assignedBusId) socket.emit('driverGoingOffline', { busId: assignedBusId });
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    logout();
    navigate('/login');
  };

  useEffect(() => { seatsRef.current = availableSeats; }, [availableSeats]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/buses`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        setAllBuses(data);
        const myBus = data.find(b => b.driverName?.toLowerCase().trim() === user?.name?.toLowerCase().trim()) || data[0];
        if (myBus) { 
          setAssignedBusId(myBus._id); 
          setAssignedBusInfo(myBus); 
          setAvailableSeats(myBus.availableSeats !== undefined ? myBus.availableSeats : myBus.capacity);
          setBusCode(myBus.busCode || '');
        }
      }).catch(console.error);
  }, [user]);

  const handleBusSelection = (e) => {
    const bus = allBuses.find(b => b._id === e.target.value);
    if (bus) {
      // Go offline from old bus if needed
      if (assignedBusId) socket.emit('driverGoingOffline', { busId: assignedBusId });
      
      setAssignedBusId(bus._id);
      setAssignedBusInfo(bus);
      setAvailableSeats(bus.availableSeats !== undefined ? bus.availableSeats : bus.capacity);
      setBusCode(bus.busCode || '');
      // Immediately emit new location for this bus if GPS is ready
      if (currentPosition) {
         socket.emit('updateLocation', { id: bus._id, lat: currentPosition.lat, lng: currentPosition.lng, seats: bus.availableSeats !== undefined ? bus.availableSeats : bus.capacity, driverName: user?.name, busCode: bus.busCode || '' });
      }
    }
  };

  const emitLocation = useCallback((lat, lng) => {
    if (!assignedBusId) return;
    const now = Date.now();
    if (now - lastEmitRef.current < 3000) return;
    lastEmitRef.current = now;
    socket.emit('updateLocation', { id: assignedBusId, lat, lng, seats: seatsRef.current, driverName: user?.name, busCode: busCodeRef.current });
    setLastUpdated(new Date().toLocaleTimeString());
  }, [assignedBusId, user?.name]);

  const handleBusCodeSubmit = () => {
    if (!assignedBusId) return;
    socket.emit('updateLocation', {
      id: assignedBusId,
      lat: currentPosition?.lat,
      lng: currentPosition?.lng,
      seats: availableSeats,
      driverName: user?.name,
      busCode: busCode
    });
    setAssignedBusInfo(prev => prev ? { ...prev, busCode } : null);
    alert(`Bus Display Number set to ${busCode || 'none'} successfully!`);
  };

  useEffect(() => {
    if (!assignedBusId) return;
    if (!navigator.geolocation) { setGpsStatus('error'); setGpsError('Geolocation not supported.'); return; }
    setGpsStatus('initializing');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus('active');
        setGpsError(null);
        emitLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) { setGpsStatus('denied'); setGpsError('Location permission denied. Please allow location access.'); }
        else if (err.code === err.POSITION_UNAVAILABLE) { setGpsStatus('error'); setGpsError('Location unavailable. Enable GPS on your device.'); }
        else { setGpsStatus('error'); setGpsError('Location request timed out. Retrying...'); }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );

    fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/notifications`)
      .then(r => r.json()).then(data => setNotifications(data)).catch(console.error);

    const handleAlert = (alert) => { setNotifications(p => [alert, ...p]); setUnreadCount(p => p + 1); };
    socket.on('adminAlert', handleAlert);

    const handleWaitlistUpdate = (data) => {
      if (data.busId === assignedBusId) {
        setWaitingPassengers(data.count);
      }
    };
    socket.on('waitlistUpdate', handleWaitlistUpdate);

    // Force emit location every 5 seconds to ensure students receive updates even if stationary
    const pingInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          emitLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
    }, 5000);

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      clearInterval(pingInterval);
      socket.off('adminAlert', handleAlert);
      socket.off('waitlistUpdate', handleWaitlistUpdate);
    };
  }, [assignedBusId, emitLocation]);

  const handleDecrease = () => {
    if (availableSeats > 0 && assignedBusId) {
      const s = availableSeats - 1; setAvailableSeats(s); setLastUpdated(new Date().toLocaleTimeString());
      socket.emit('updateLocation', { id: assignedBusId, lat: currentPosition?.lat, lng: currentPosition?.lng, seats: s, driverName: user?.name });
    }
  };
  const handleIncrease = () => {
    if (assignedBusId && assignedBusInfo && availableSeats < assignedBusInfo.capacity) {
      const s = availableSeats + 1; setAvailableSeats(s); setLastUpdated(new Date().toLocaleTimeString());
      socket.emit('updateLocation', { id: assignedBusId, lat: currentPosition?.lat, lng: currentPosition?.lng, seats: s, driverName: user?.name });
    }
  };

  const statusCfg = { initializing: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '📡 Acquiring GPS...', pulse: true }, active: { cls: 'bg-green-100 text-green-700 border-green-200', label: '📍 GPS Active', pulse: false }, error: { cls: 'bg-red-100 text-red-700 border-red-200', label: '⚠️ GPS Error', pulse: false }, denied: { cls: 'bg-red-100 text-red-700 border-red-200', label: '🚫 Location Denied', pulse: false } };
  const cfg = statusCfg[gpsStatus] || statusCfg.error;
  const GpsBadge = () => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {(cfg.pulse || gpsStatus === 'active') && <span className="relative flex h-2 w-2"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${gpsStatus === 'active' ? 'bg-green-400' : 'bg-yellow-400'}`}></span><span className={`relative inline-flex rounded-full h-2 w-2 ${gpsStatus === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span></span>}
      {cfg.label}
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative overflow-x-hidden">
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

      <Navbar 
        role={`Driver • Bus ${assignedBusInfo?.busNumber || "UK07"}`} 
        userName={user?.name || 'Driver'} 
        unreadCount={unreadCount} 
        notifications={notifications}
        onNotificationClick={() => setUnreadCount(0)}
        onLogout={handleLogout}
      />

      {/* Top Console Header */}
      <div className="z-10 flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-6 max-w-7xl mx-auto w-full gap-4">
        <div>
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border shadow-sm text-gray-800 rounded-full text-[10px] md:text-xs font-bold">
              <span>👤</span> {user?.name || 'Driver'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Driver Console</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg border border-blue-200 font-bold flex items-center gap-2 shadow-sm w-fit">
              <span className="text-base sm:text-lg">🧍</span>
              <span className="text-xs sm:text-sm">Waiting Passengers: <span className="text-lg sm:text-xl ml-1">{waitingPassengers}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* GPS Error Banner */}
      {gpsError && (
        <div className="z-10 mx-4 md:mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 max-w-7xl">
          <span className="text-xl">⚠️</span>
          <div><p className="text-sm font-semibold text-red-800">Location Error</p><p className="text-sm text-red-600 mt-0.5">{gpsError}</p></div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-grow z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6 max-w-7xl w-full mx-auto">
        
        {/* Left/Center Side: Control Panel Console */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Bus Selection Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🚍</span> My Vehicle Assignment
              </h2>
              <div className="mt-3">
                <select 
                  value={assignedBusId || ''} 
                  onChange={handleBusSelection}
                  className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                >
                  {allBuses.map(bus => (
                    <option key={bus._id} value={bus._id}>
                      Bus {bus.busNumber} (Route: {bus.route})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Make sure the correct bus is selected. 
                  <span className="font-semibold block mt-1 text-gray-800 text-[10px] uppercase">Registered Driver: {user?.name || assignedBusInfo?.driverName || 'Unknown'}</span>
                </p>
                <div className="mt-4 pt-3 border-t flex flex-col gap-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Set Live Bus Number (e.g. 1, 22, 44)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. 22" 
                      value={busCode} 
                      onChange={e => setBusCode(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs w-24 bg-gray-50 font-extrabold text-center focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    />
                    <button 
                      onClick={handleBusCodeSubmit}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm"
                    >
                      Set Number
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <GpsBadge />
              <span className="text-xs font-semibold text-gray-500">Last Ping: <span className="text-gray-900">{lastUpdated}</span></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] relative overflow-hidden">
            
            {/* Session details */}
            <div className="absolute top-4 left-4 md:left-6 flex items-center gap-2 text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>📍 Route: {assignedBusInfo?.route || 'ISBT to GEU'}</span>
            </div>

            <h2 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 mt-6 md:mt-4">Available Seats Left</h2>
            <div className="text-8xl sm:text-9xl md:text-[13rem] font-black text-[#1d2b36] leading-none tracking-tighter mb-6 md:mb-8">{availableSeats}</div>
            
            <div className="flex gap-6 md:gap-8 mb-6 md:mb-8 w-full max-w-sm md:max-w-md justify-center">
              <button 
                onClick={handleDecrease} 
                className="w-32 h-20 md:w-40 md:h-24 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 rounded-2xl flex items-center justify-center text-5xl md:text-6xl font-light transition border border-red-100 shadow-sm"
              >
                -
              </button>
              <button 
                onClick={handleIncrease} 
                className="w-32 h-20 md:w-40 md:h-24 bg-green-50 hover:bg-green-100 active:scale-95 text-green-600 rounded-2xl flex items-center justify-center text-5xl md:text-6xl font-light transition border border-green-100 shadow-sm"
              >
                +
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[10px] md:text-xs font-medium text-gray-400 border-t pt-4 w-full justify-center">
              <p>Last Broadcasted: <span className="text-gray-600 font-bold">{lastUpdated}</span></p>
              <span className="hidden sm:inline">•</span>
              <p>GPS Broadcast Status: <span className={`font-bold uppercase ${gpsStatus === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{gpsStatus}</span></p>
            </div>
          </div>

          {/* Coordinates Details Panel */}
          {currentPosition && (
            <div className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm rounded-2xl px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">Live Coordinates Stream</p>
                <p className="text-xs md:text-sm font-mono text-gray-800 mt-0.5">{currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}</p>
              </div>
              <div className="text-center sm:text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] md:text-xs font-semibold">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
                  Transmitting at 3s intervals
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Alerts and notifications panel */}
        <div className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm rounded-2xl p-4 md:p-6 flex flex-col h-[350px] lg:h-auto lg:min-h-[520px]">
          <h3 className="font-bold text-base md:text-lg text-gray-900 flex items-center gap-2 mb-4 border-b pb-3">
            <span>📣</span> System Broadcast Alerts
          </h3>
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 font-medium py-12 text-center">No active admin alerts today.</p>
            ) : (
              notifications.map((notif, idx) => (
                <div key={notif._id || idx} className={`p-3 md:p-4 rounded-xl border-l-4 shadow-sm ${notif.type === 'warning' ? 'bg-yellow-50/50 border-yellow-500 text-yellow-900' : 'bg-blue-50/50 border-blue-500 text-blue-900'}`}>
                  <p className="text-xs md:text-sm font-bold leading-snug">{notif.message}</p>
                  <p className="text-[9px] md:text-[10px] font-bold text-gray-400 mt-2 flex items-center gap-1">
                    ⏱️ {notif.createdAt ? new Date(notif.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Demo Alert'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Schedule Table Area */}
      <div className="z-10 p-4 md:p-6 max-w-7xl w-full mx-auto mb-8">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm rounded-2xl p-4 md:p-6">
          <h3 className="font-bold text-base md:text-lg text-gray-900 flex items-center gap-2 mb-4">
            <span>📅</span> Driver Shift Schedule
          </h3>
          <ScheduleTable />
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
