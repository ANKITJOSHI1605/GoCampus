import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = ({ role, userName, unreadCount = 0, onNotificationClick, notifications = [], onLogout }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigate('/login');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (onNotificationClick) onNotificationClick();
  };

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl font-bold text-blue-600">GoCampus</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs px-2 py-1 rounded uppercase font-semibold">
              {role}
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 relative" ref={dropdownRef}>
            {/* Notification Bell */}
            <button 
              onClick={handleBellClick}
              className="relative p-2 text-gray-600 hover:text-blue-600 transition focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>

            {/* Dropdown Popover */}
            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                  <span className="font-bold text-gray-800 text-sm">Notifications</span>
                  {unreadCount > 0 && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No new notifications</div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div key={notif._id || idx} className={`p-3 border-b last:border-0 ${notif.type === 'warning' ? 'bg-yellow-50/30' : 'bg-blue-50/30'} hover:bg-gray-50 transition`}>
                        <div className="flex gap-2 items-start">
                          <span className="text-sm mt-0.5">{notif.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 leading-snug">{notif.message}</p>
                            <p className="text-[10px] text-gray-500 mt-1">
                              {notif.createdAt ? new Date(notif.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="hidden sm:block text-sm font-medium text-gray-700">
              Welcome, {userName || 'User'}
            </div>
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="text-xs sm:text-sm text-red-600 hover:text-white hover:bg-red-600 px-2 sm:px-3 py-1.5 border border-red-200 rounded transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100">
            <div className="text-center font-sans">
              <span className="text-4xl mb-3 inline-block">🚪</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Are you sure you want to log out?</h3>
              <p className="text-sm text-gray-500 mb-6">You will need to sign back in to access your dashboard.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowLogoutModal(false);
                    handleLogout();
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
