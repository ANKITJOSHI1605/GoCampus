import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import ScheduleTable from '../components/ScheduleTable';
import socket from '../services/socket';

const AdminDashboard = () => {
  const navigate = useNavigate();
  // State
  const [stats, setStats] = useState({ totalBuses: 0, totalRoutes: 0, registeredDrivers: 0, registeredStudents: 0 });

  const [currentView, setCurrentView] = useState('overview'); // 'overview', 'buses', 'routes', 'drivers', 'students'
  const [detailData, setDetailData] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSearchQuery, setDetailSearchQuery] = useState('');

  const handleCardClick = async (type) => {
    setCurrentView(type);
    setDetailLoading(true);
    setDetailSearchQuery('');
    try {
      let url = '';
      if (type === 'buses' || type === 'activeBuses') {
        url = `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/buses`;
      } else if (type === 'routes') {
        url = `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/routes`;
      } else if (type === 'drivers') {
        url = `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/auth/users?role=driver`;
      } else if (type === 'students') {
        url = `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/auth/users?role=student`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (type === 'activeBuses') {
        const onlineIds = onlineDriversRef.current.map(d => d.busId);
        setDetailData(Array.isArray(data) ? data.filter(bus => onlineIds.includes(bus._id)).map(bus => {
          const onlineInfo = onlineDriversRef.current.find(od => od.busId === bus._id);
          return {
            ...bus,
            status: 'On Route',
            availableSeats: onlineInfo?.seats !== undefined ? onlineInfo.seats : bus.availableSeats
          };
        }) : []);
      } else if (type === 'buses') {
        setDetailData(Array.isArray(data) ? data.map(bus => {
          const isOnline = onlineDriversRef.current.some(od => od.busId === bus._id);
          const onlineInfo = onlineDriversRef.current.find(od => od.busId === bus._id);
          return {
            ...bus,
            status: isOnline ? 'On Route' : 'Idle',
            availableSeats: isOnline && onlineInfo?.seats !== undefined ? onlineInfo.seats : bus.availableSeats
          };
        }) : []);
      } else {
        setDetailData(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed fetching detailed view data', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const [activeDrivers, setActiveDrivers] = useState([]);
  const [livePositions, setLivePositions] = useState([]);
  const onlineDriversRef = useRef([]);
  
  // Modal States
  const [showBusModal, setShowBusModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  
  // Form States
  const [newBus, setNewBus] = useState({ busNumber: '', capacity: '', driverName: '', route: 'Unassigned' });
  const [newRoute, setNewRoute] = useState({ name: '', description: '' });

  // Notifications State
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Settings / Timetable State
  const [settings, setSettings] = useState(null);
  const [editSettings, setEditSettings] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const handleSendAlert = async (e) => {
    e.preventDefault();
    if (!alertMessage.trim()) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: alertMessage, type: alertType })
      });
      const savedAlert = await res.json();
      
      socket.emit('sendAdminAlert', savedAlert);
      setAlertMessage('');
      setTimeout(() => alert('Alert broadcasted successfully!'), 100);
    } catch (err) {
      console.error('Failed sending alert', err);
    }
  };

  useEffect(() => {
    // Analytics Hydration
    fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/analytics`)
      .then(res => res.json())
      .then(data => {
        setStats({
          totalBuses: data.totalBuses || 0,
          totalRoutes: data.totalRoutes || 0,
          registeredDrivers: data.registeredDrivers || 0,
          registeredStudents: data.registeredStudents || 0
        });
      })
      .catch(err => console.error("Analytics Error: ", err));

    // Initial Hydration from DataStore
    fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/buses`)
      .then(res => res.json())
      .then(data => {
        const tableData = data.map((bus) => {
          const isOnline = onlineDriversRef.current.some(od => od.busId === bus._id);
          const onlineInfo = onlineDriversRef.current.find(od => od.busId === bus._id);
          return {
            id: bus._id,
            name: bus.driverName,
            bus: bus.busNumber,
            busCode: bus.busCode || '',
            route: bus.route || 'Unassigned',
            status: isOnline ? 'On Route' : 'Idle',
            seats: isOnline && onlineInfo?.seats !== undefined ? onlineInfo.seats : bus.availableSeats,
            time: isOnline ? 'Live Now' : 'Offline'
          };
        });
        setActiveDrivers(tableData);

        const mapPositions = data
          .filter(bus => bus.currentLocation?.lat !== undefined && bus.currentLocation?.lng !== undefined)
          .map(bus => ({
            id: bus._id,
            busNumber: bus.busNumber,
            busCode: bus.busCode || '',
            driverName: bus.driverName,
            route: bus.route,
            lat: bus.currentLocation.lat,
            lng: bus.currentLocation.lng,
            seats: bus.availableSeats,
            routePath: bus.routePath || null
          }));
        // We do NOT call setLivePositions(mapPositions) here so that the active tracking map and counts
        // strictly reflect the 100% real-time connected online active fleet.
      })
      .catch(err => console.error(err));
      
    // Real-Time Syncing across stack directly from Driver
    socket.on('busUpdate', (updatedBus) => {
      // Update online drivers reference
      const existsInRef = onlineDriversRef.current.some(d => d.busId === updatedBus.id);
      if (!existsInRef) {
        onlineDriversRef.current = [...onlineDriversRef.current, {
          busId: updatedBus.id,
          busNumber: updatedBus.busNumber,
          busCode: updatedBus.busCode || '',
          driverName: updatedBus.driverName,
          route: updatedBus.route || 'Unassigned',
          lat: updatedBus.lat,
          lng: updatedBus.lng,
          seats: updatedBus.seats,
          routePath: updatedBus.routePath
        }];
      } else {
        onlineDriversRef.current = onlineDriversRef.current.map(d => d.busId === updatedBus.id ? {
          ...d,
          lat: updatedBus.lat,
          lng: updatedBus.lng,
          seats: updatedBus.seats !== undefined ? updatedBus.seats : d.seats,
          busCode: updatedBus.busCode !== undefined ? updatedBus.busCode : d.busCode,
          driverName: updatedBus.driverName || d.driverName,
          route: updatedBus.route || d.route,
          routePath: updatedBus.routePath !== undefined ? updatedBus.routePath : d.routePath
        } : d);
      }

      // Update fleet table
      setActiveDrivers(prev => {
        const busExists = prev.find(d => d.id === updatedBus.id);
        if (busExists) {
            return prev.map(d => d.id === updatedBus.id ? { 
                ...d, 
                time: 'Live Now',
                status: 'On Route',
                busCode: updatedBus.busCode !== undefined ? updatedBus.busCode : d.busCode,
                seats: updatedBus.seats !== undefined ? updatedBus.seats : d.seats
            } : d);
        } else {
            return prev;
        }
      });

      // Update live map positions
      if (updatedBus.lat !== undefined && updatedBus.lng !== undefined) {
        setLivePositions(prev => {
          const exists = prev.find(b => b.id === updatedBus.id);
          if (exists) {
            return prev.map(b => b.id === updatedBus.id ? {
              ...b,
              lat: updatedBus.lat,
              lng: updatedBus.lng,
              seats: updatedBus.seats !== undefined ? updatedBus.seats : b.seats,
              busNumber: updatedBus.busNumber || b.busNumber,
              busCode: updatedBus.busCode !== undefined ? updatedBus.busCode : b.busCode,
              driverName: updatedBus.driverName || b.driverName,
              route: updatedBus.route || b.route,
              routePath: updatedBus.routePath !== undefined ? updatedBus.routePath : b.routePath,
            } : b);
          } else {
            return [...prev, {
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
      }

      // Update detailData in real time
      setDetailData(prev => {
        const exists = prev.some(item => item._id === updatedBus.id);
        if (exists) {
          return prev.map(item => {
            if (item._id === updatedBus.id) {
              return {
                ...item,
                currentLocation: { lat: updatedBus.lat, lng: updatedBus.lng },
                availableSeats: updatedBus.seats,
                driverName: updatedBus.driverName || item.driverName,
                route: updatedBus.route || item.route,
                busCode: updatedBus.busCode !== undefined ? updatedBus.busCode : item.busCode,
                status: updatedBus.status || item.status || 'On Route',
                lastUpdated: updatedBus.lastUpdated
              };
            }
            return item;
          });
        } else if (currentView === 'buses' || currentView === 'activeBuses') {
          return [...prev, {
            _id: updatedBus.id,
            busNumber: updatedBus.busNumber,
            busCode: updatedBus.busCode || '',
            driverName: updatedBus.driverName,
            route: updatedBus.route,
            capacity: 19,
            availableSeats: updatedBus.seats,
            status: 'On Route',
            currentLocation: { lat: updatedBus.lat, lng: updatedBus.lng },
            lastUpdated: updatedBus.lastUpdated
          }];
        }
        return prev;
      });
    });

    socket.on('driverOffline', ({ busId }) => {
      onlineDriversRef.current = onlineDriversRef.current.filter(d => d.busId !== busId);
      setLivePositions(prev => prev.filter(b => b.id !== busId));
      setActiveDrivers(prev => prev.map(d => d.id === busId ? { ...d, time: 'Offline', status: 'Idle' } : d));
      setDetailData(prev => {
        if (currentView === 'activeBuses') {
          return prev.filter(item => item._id !== busId);
        }
        return prev.map(item => item._id === busId ? { ...item, status: 'Idle' } : item);
      });
    });

    // Initial Notifications Fetch
    fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/notifications`)
      .then(res => res.json())
      .then(data => setAdminNotifications(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Settings Sync
    fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/settings/schedule`)
      .then(res => res.json())
      .then(data => { setSettings(data); setEditSettings(data); })
      .catch(err => console.error(err));

    const handleAdminAlert = (alert) => {
      setAdminNotifications(prev => [alert, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    
    const handleScheduleUpdate = (updated) => {
      setSettings(updated);
      setEditSettings(updated);
    };

    const handleOnlineDriversList = (drivers) => {
      onlineDriversRef.current = drivers;
      const mapPositions = drivers.map(d => ({
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
      setLivePositions(mapPositions);

      // Reconcile activeDrivers table
      setActiveDrivers(prev => {
        return prev.map(d => {
          const onlineDriver = drivers.find(od => od.busId === d.id);
          if (onlineDriver) {
            return {
              ...d,
              status: 'On Route',
              time: 'Live Now',
              seats: onlineDriver.seats !== undefined ? onlineDriver.seats : d.seats
            };
          } else {
            return {
              ...d,
              status: 'Idle',
              time: 'Offline'
            };
          }
        });
      });
    };

    socket.on('onlineDriversList', handleOnlineDriversList);
    socket.on('adminAlert', handleAdminAlert);
    socket.on('scheduleUpdated', handleScheduleUpdate);

    return () => {
      socket.off('busUpdate');
      socket.off('driverOffline');
      socket.off('onlineDriversList', handleOnlineDriversList);
      socket.off('adminAlert', handleAdminAlert);
      socket.off('scheduleUpdated', handleScheduleUpdate);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar 
        role="Admin" 
        userName="System Admin" 
        unreadCount={unreadCount} 
        notifications={adminNotifications}
        onNotificationClick={() => {
          setUnreadCount(0);
          document.getElementById('admin-alerts')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Options */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">System Overview</h2>
            <p className="text-gray-500 text-sm mt-1">Manage operations, fleet, and schedules.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/admin/manage')}
              className="px-5 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 flex items-center shadow-md shadow-blue-200 transition transform hover:-translate-y-0.5">
              <span className="mr-2">⚙️</span> Manage Fleet & Personnel
            </button>
          </div>
        </div>

        {currentView === 'overview' ? (
          <>
            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Map, Fleet & Schedule */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Live Tracking Map - Left Side */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">📍 Live Fleet Tracking</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Real-time GPS positions of all buses</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                      livePositions.length > 0 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      {livePositions.length > 0 && <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>}
                      {livePositions.length} Live
                    </span>
                  </div>
                  <div className="h-[400px] lg:h-[500px]">
                    <MapView buses={livePositions} showCampus={true} destinationLocation={settings?.destinationLocation} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Active Fleet</h3>
                    <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver / Bus</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Route</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Seats</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {activeDrivers.map((driver) => (
                          <tr key={driver.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                                  {driver.name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                                  <div className="text-xs text-gray-500">{driver.busCode ? `Bus ${driver.busCode} (${driver.bus})` : driver.bus}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{driver.route}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-800 bg-blue-100 rounded-lg">
                                {driver.seats !== undefined ? driver.seats : '--'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                driver.status === 'On Route' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {driver.status === 'On Route' ? <span className="mr-1 w-2 h-2 rounded-full bg-green-500 mt-1"></span> : null}
                                {driver.status}
                              </span>
                              <div className="text-xs text-gray-500 mt-1 ml-1">Update: {driver.time}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">📅 Master Schedule</h3>
                    <button 
                      onClick={() => setShowScheduleModal(true)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      ✏️ Edit Timetables
                    </button>
                  </div>
                  <ScheduleTable />
                </div>
              </div>

              {/* Right Column: Stats, Quick Actions & System Health */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Stats Cards in a 2x2 grid on right side */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Total Buses', value: stats.totalBuses, icon: '🚍', color: 'bg-blue-100 text-blue-800', type: 'buses' },
                    { label: 'Active Buses', value: livePositions.length, icon: '🟢', color: 'bg-green-100 text-green-800', type: 'activeBuses' },
                    { label: 'Registered Drivers', value: stats.registeredDrivers, icon: '👨‍✈️', color: 'bg-indigo-100 text-indigo-800', type: 'drivers' },
                    { label: 'Registered Students', value: stats.registeredStudents, icon: '🎓', color: 'bg-purple-100 text-purple-800', type: 'students' }
                  ].map((stat, idx) => {
                    const isActive = currentView === stat.type;
                    return (
                      <button 
                        key={idx} 
                        onClick={() => handleCardClick(stat.type)}
                        className={`bg-white p-4 rounded-xl shadow-sm border text-left transition w-full hover:scale-[1.03] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                          isActive 
                            ? 'border-blue-500 ring-2 ring-blue-500/20' 
                            : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50/10'
                        }`}
                      >
                        <div className={`w-10 h-10 mb-3 rounded-lg flex items-center justify-center text-xl ${stat.color}`}>
                          {stat.icon}
                        </div>
                        <div>
                          <p className="text-2xl font-extrabold text-gray-900 leading-none">{stat.value}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1">{stat.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* System Alerts */}
                <div id="admin-alerts" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">System Alerts</h3>
                  
                  <form onSubmit={handleSendAlert} className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Broadcast Message</p>
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={alertMessage}
                        onChange={(e) => setAlertMessage(e.target.value)}
                        placeholder="Enter alert message..." 
                        className="w-full text-sm p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                        required
                      />
                      <div className="flex gap-2">
                        <select 
                          value={alertType} 
                          onChange={(e) => setAlertType(e.target.value)}
                          className="text-sm p-2 bg-white border border-gray-200 rounded-lg focus:outline-none"
                        >
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                        </select>
                        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition">
                          Send Alert
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {adminNotifications.length === 0 && <p className="text-sm text-gray-500">No active alerts.</p>}
                    {adminNotifications.map((notif, idx) => (
                      <div key={notif._id || idx} className={`relative flex items-start gap-3 p-3 rounded-lg border group ${notif.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                        <span className="text-lg">{notif.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                        <div className="flex-1 pr-6">
                          <p className="text-sm font-bold">{notif.message}</p>
                          <p className={`text-xs mt-1 ${notif.type === 'warning' ? 'text-yellow-700' : 'text-blue-700'}`}>
                            {new Date(notif.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        {notif._id && (
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/notifications/${notif._id}`, { method: 'DELETE' });
                                if(res.ok) {
                                  setAdminNotifications(prev => prev.filter(n => n._id !== notif._id));
                                }
                              } catch(err) { console.error('Failed to delete alert', err); }
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white/50 hover:bg-white rounded-md text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Alert"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CSV Export */}
                <div className="bg-gradient-to-tr from-gray-800 relative overflow-hidden to-gray-900 p-6 rounded-2xl shadow-lg text-white border border-gray-700">
                  <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-2">Need a Report?</h3>
                    <p className="text-gray-300 text-sm mb-4">Download the latest monthly analytics report detailing attendance and GPS tracking.</p>
                    <button 
                      onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8,ID,Name,Bus,Route,Status\n" + 
                                           activeDrivers.map(d => `${d.id},${d.name},${d.bus},${d.route},${d.status}`).join('\n');
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "gocampus_report.csv");
                        document.body.appendChild(link);
                        link.click();
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 py-2 rounded-lg font-bold text-sm shadow-md transition">
                      Export CSV Data
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 space-y-6">
            {/* Detailed Table Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
              <div>
                <button 
                  onClick={() => setCurrentView('overview')}
                  className="text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 mb-4 group transition shadow-sm border border-gray-200"
                >
                  <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard Overview
                </button>
                <h3 className="text-xl font-bold text-gray-900 capitalize flex items-center gap-2">
                  {currentView === 'buses' && '🚍 Buses Directory'}
                  {currentView === 'activeBuses' && '🚍 Active Buses Directory'}
                  {currentView === 'routes' && '🛣️ Transit Shuttle Routes'}
                  {currentView === 'drivers' && '👨‍✈️ Authorized Drivers'}
                  {currentView === 'students' && '🎓 Registered Students Directory'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {currentView === 'buses' && 'Real-time capacities, assignments, and statuses of all shuttle buses.'}
                  {currentView === 'activeBuses' && 'Real-time tracking of active and online shuttle buses on the routes.'}
                  {currentView === 'routes' && 'Official transport routing tracks loaded on Graphic Era shuttle lines.'}
                  {currentView === 'drivers' && 'Driver profiles authorized to run transport consoles and stream GPS.'}
                  {currentView === 'students' && 'Student directory profiles registered to use transit monitoring.'}
                </p>
              </div>

              <div className="w-full sm:w-72">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
                  <input 
                    type="text"
                    placeholder={
                      currentView === 'activeBuses' ? 'Search active buses...' :
                      currentView === 'buses' ? 'Search buses...' :
                      currentView === 'routes' ? 'Search routes...' :
                      currentView === 'drivers' ? 'Search drivers...' :
                      currentView === 'students' ? 'Search students...' :
                      'Search...'
                    }
                    value={detailSearchQuery}
                    onChange={(e) => setDetailSearchQuery(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {detailLoading ? (
              <div className="py-24 text-center text-gray-500 font-medium">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Retrieving transport registry...
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-xl">
                {(() => {
                  const filteredData = detailData.filter(item => {
                    const query = detailSearchQuery.toLowerCase();
                    if (currentView === 'buses' || currentView === 'activeBuses') {
                      return (
                        (item.busNumber || '').toLowerCase().includes(query) ||
                        (item.driverName || '').toLowerCase().includes(query) ||
                        (item.route || '').toLowerCase().includes(query)
                      );
                    } else if (currentView === 'routes') {
                      return (
                        (item.name || '').toLowerCase().includes(query) ||
                        (item.description || '').toLowerCase().includes(query)
                      );
                    } else { // users (drivers/students)
                      return (
                        (item.name || '').toLowerCase().includes(query) ||
                        (item.email || '').toLowerCase().includes(query)
                      );
                    }
                  });

                  if (filteredData.length === 0) {
                    return (
                      <div className="text-center py-20 bg-gray-50">
                        <p className="text-gray-400 text-5xl mb-3">📂</p>
                        <p className="text-gray-500 font-semibold">No records match your search criteria</p>
                        <p className="text-sm text-gray-400 mt-1">Try refining your filter or query term.</p>
                      </div>
                    );
                  }

                  return (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        {(currentView === 'buses' || currentView === 'activeBuses') && (
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bus Number</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seats Available</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Driver</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Route</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        )}
                        {currentView === 'routes' && (
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                          </tr>
                        )}
                        {(currentView === 'drivers' || currentView === 'students') && (
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Registered</th>
                          </tr>
                        )}
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredData.map((item, idx) => (
                          <tr key={item._id || idx} className="hover:bg-gray-50/50 transition">
                            {(currentView === 'buses' || currentView === 'activeBuses') && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">{item.busCode ? `Bus ${item.busCode} (${item.busNumber})` : item.busNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">{item.capacity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`px-2 py-1 rounded text-xs font-black ${
                                    (item.availableSeats !== undefined ? item.availableSeats : item.capacity) > 10
                                      ? 'bg-green-50 text-green-700 border border-green-100'
                                      : 'bg-red-50 text-red-700 border border-red-100'
                                  }`}>
                                    {item.availableSeats !== undefined ? item.availableSeats : item.capacity} Seats Left
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{item.driverName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.route || 'Unassigned'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    item.status === 'On Route' ? 'bg-green-100 text-green-800' : item.status === 'Maintenance' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                              </>
                            )}
                            {currentView === 'routes' && (
                              <>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-sm">{item.description || 'No description provided.'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                              </>
                            )}
                            {(currentView === 'drivers' || currentView === 'students') && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                                    item.role === 'driver' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                                  }`}>
                                    {item.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Demo Seed'}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals natively persisting to Backend Data sources */}

      {showScheduleModal && editSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>✏️</span> Manage Timetables</h2>
            
            {/* Toggle Section */}
            <div className="mb-6 p-4 bg-gray-50 border rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900">Active Schedule Profile</h4>
                <p className="text-xs text-gray-500">Select which timetable should be currently visible to all users.</p>
              </div>
              <div className="flex bg-gray-200 p-1 rounded-lg">
                <button 
                  onClick={() => setEditSettings({...editSettings, activeScheduleType: 'regular'})}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition ${editSettings.activeScheduleType === 'regular' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Regular
                </button>
                <button 
                  onClick={() => setEditSettings({...editSettings, activeScheduleType: 'temporary'})}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition ${editSettings.activeScheduleType === 'temporary' ? 'bg-yellow-100 text-yellow-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Temporary (Exams)
                </button>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/settings/schedule`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editSettings)
                });
                if(res.ok) {
                    alert('Settings updated successfully!');
                    setShowScheduleModal(false);
                } else {
                    alert('Failed to update settings');
                }
              } catch (err) { alert(err) }
            }}>

            {/* Destination Location Settings */}
            <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
              <h4 className="font-bold text-gray-900 border-b pb-2 mb-3">📍 Global Destination Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination Name</label>
                  <input 
                    type="text" 
                    className="w-full border p-2 rounded text-sm bg-gray-50"
                    value={editSettings.destinationLocation?.name || ''} 
                    onChange={e => setEditSettings({...editSettings, destinationLocation: {...editSettings.destinationLocation, name: e.target.value}})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Latitude</label>
                  <input 
                    type="number" step="any"
                    className="w-full border p-2 rounded text-sm bg-gray-50"
                    value={editSettings.destinationLocation?.lat || ''} 
                    onChange={e => setEditSettings({...editSettings, destinationLocation: {...editSettings.destinationLocation, lat: parseFloat(e.target.value)}})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Longitude</label>
                  <input 
                    type="number" step="any"
                    className="w-full border p-2 rounded text-sm bg-gray-50"
                    value={editSettings.destinationLocation?.lng || ''} 
                    onChange={e => setEditSettings({...editSettings, destinationLocation: {...editSettings.destinationLocation, lng: parseFloat(e.target.value)}})}
                  />
                </div>
              </div>
            </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Regular Schedule Editor */}
                <div className="space-y-4">
                  <h3 className="font-bold text-blue-900 border-b pb-2">Regular Timetable</h3>
                  
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Pickups</h4>
                    {editSettings.regularSchedule?.pickups?.map((pickup, idx) => (
                      <div key={`reg-p-${idx}`} className="mb-3 p-3 border rounded-lg bg-gray-50">
                        <input 
                          type="text" 
                          value={pickup.label}
                          onChange={(e) => {
                            const newPickups = [...editSettings.regularSchedule.pickups];
                            newPickups[idx].label = e.target.value;
                            setEditSettings({...editSettings, regularSchedule: {...editSettings.regularSchedule, pickups: newPickups}});
                          }}
                          className="w-full text-xs font-bold p-1 mb-2 border-b bg-transparent outline-none"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          {[0, 1, 2].map(timeIdx => (
                            <input 
                              key={`reg-p-${idx}-t-${timeIdx}`}
                              type="text" 
                              placeholder="e.g. 7:00 AM"
                              value={pickup.times[timeIdx] || ''}
                              onChange={(e) => {
                                const newPickups = [...editSettings.regularSchedule.pickups];
                                newPickups[idx].times[timeIdx] = e.target.value;
                                setEditSettings({...editSettings, regularSchedule: {...editSettings.regularSchedule, pickups: newPickups}});
                              }}
                              className="w-full text-xs p-1 border rounded"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Departures</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {editSettings.regularSchedule?.departures?.map((dep, idx) => (
                        <div key={`reg-d-${idx}`} className="flex gap-2">
                          <input 
                            type="text" 
                            value={dep.label}
                            onChange={(e) => {
                              const newDeps = [...editSettings.regularSchedule.departures];
                              newDeps[idx].label = e.target.value;
                              setEditSettings({...editSettings, regularSchedule: {...editSettings.regularSchedule, departures: newDeps}});
                            }}
                            className="w-1/2 text-xs p-1.5 border rounded bg-gray-50"
                          />
                          <input 
                            type="text" 
                            value={dep.time}
                            placeholder="e.g. 1:15 PM"
                            onChange={(e) => {
                              const newDeps = [...editSettings.regularSchedule.departures];
                              newDeps[idx].time = e.target.value;
                              setEditSettings({...editSettings, regularSchedule: {...editSettings.regularSchedule, departures: newDeps}});
                            }}
                            className="w-1/2 text-xs p-1.5 border rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Temporary Schedule Editor */}
                <div className="space-y-4">
                  <h3 className="font-bold text-yellow-800 border-b pb-2">Temporary Timetable</h3>
                  
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Schedule Notice / Title</h4>
                    <input 
                      type="text" 
                      value={editSettings.temporaryScheduleTitle || ''}
                      onChange={(e) => setEditSettings({...editSettings, temporaryScheduleTitle: e.target.value})}
                      className="w-full text-sm p-2 border rounded border-yellow-300 bg-yellow-50"
                    />
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Pickups</h4>
                    {editSettings.temporarySchedule?.pickups?.map((pickup, idx) => (
                      <div key={`temp-p-${idx}`} className="mb-3 p-3 border rounded-lg bg-gray-50">
                        <input 
                          type="text" 
                          value={pickup.label}
                          onChange={(e) => {
                            const newPickups = [...editSettings.temporarySchedule.pickups];
                            newPickups[idx].label = e.target.value;
                            setEditSettings({...editSettings, temporarySchedule: {...editSettings.temporarySchedule, pickups: newPickups}});
                          }}
                          className="w-full text-xs font-bold p-1 mb-2 border-b bg-transparent outline-none"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          {[0, 1, 2].map(timeIdx => (
                            <input 
                              key={`temp-p-${idx}-t-${timeIdx}`}
                              type="text" 
                              placeholder="Leave blank if unused"
                              value={pickup.times[timeIdx] || ''}
                              onChange={(e) => {
                                const newPickups = [...editSettings.temporarySchedule.pickups];
                                newPickups[idx].times[timeIdx] = e.target.value;
                                setEditSettings({...editSettings, temporarySchedule: {...editSettings.temporarySchedule, pickups: newPickups}});
                              }}
                              className="w-full text-xs p-1 border rounded"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Departures</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {editSettings.temporarySchedule?.departures?.map((dep, idx) => (
                        <div key={`temp-d-${idx}`} className="flex gap-2">
                          <input 
                            type="text" 
                            value={dep.label}
                            onChange={(e) => {
                              const newDeps = [...editSettings.temporarySchedule.departures];
                              newDeps[idx].label = e.target.value;
                              setEditSettings({...editSettings, temporarySchedule: {...editSettings.temporarySchedule, departures: newDeps}});
                            }}
                            className="w-1/2 text-xs p-1.5 border rounded bg-gray-50"
                          />
                          <input 
                            type="text" 
                            value={dep.time}
                            placeholder="Leave blank if unused"
                            onChange={(e) => {
                              const newDeps = [...editSettings.temporarySchedule.departures];
                              newDeps[idx].time = e.target.value;
                              setEditSettings({...editSettings, temporarySchedule: {...editSettings.temporarySchedule, departures: newDeps}});
                            }}
                            className="w-1/2 text-xs p-1.5 border rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              <div className="mt-8 pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-6 py-2 bg-gray-100 font-bold rounded-lg text-gray-700">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 font-bold rounded-lg text-white hover:bg-blue-700 transition">Save & Broadcast Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
