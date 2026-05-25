import React, { useState, useEffect } from 'react';
import socket from '../services/socket';

const ScheduleTable = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/settings/schedule`)
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error("Failed fetching settings", err));

    const handleScheduleUpdate = (updatedSettings) => {
      setSettings(updatedSettings);
    };

    socket.on('scheduleUpdated', handleScheduleUpdate);
    return () => socket.off('scheduleUpdated', handleScheduleUpdate);
  }, []);

  if (!settings) return <div className="text-sm text-gray-500 animate-pulse py-4">Loading schedule...</div>;

  const isTemp = settings.activeScheduleType === 'temporary';
  const activeSchedule = isTemp ? settings.temporarySchedule : settings.regularSchedule;

  return (
    <div className="bg-white border rounded-lg overflow-hidden w-full shadow-sm">
      {isTemp && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-3 py-2 text-yellow-800 text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-1.5"><span>⚠️</span> {settings.temporaryScheduleTitle}</span>
          <span className="bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded text-[10px] uppercase">Active</span>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100 text-gray-800 border-b">
              <th className="py-2 px-3 font-bold border-r">Route / Station</th>
              <th className="py-2 px-3 font-bold border-r whitespace-nowrap">1st Pickup</th>
              <th className="py-2 px-3 font-bold border-r whitespace-nowrap">2nd Pickup</th>
              <th className="py-2 px-3 font-bold whitespace-nowrap">3rd Pickup</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {activeSchedule?.pickups?.map((pickup, idx) => (
              <tr key={idx} className={`border-b ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                <td className={`py-2 px-3 border-r leading-tight ${idx === 0 ? 'font-semibold text-gray-900' : ''}`}>
                  {pickup.label}
                </td>
                <td className="py-2 px-3 border-r font-bold text-blue-600 whitespace-nowrap">{pickup.times[0] || '--'}</td>
                <td className="py-2 px-3 border-r font-bold text-blue-600 whitespace-nowrap">{pickup.times[1] || '--'}</td>
                <td className="py-2 px-3 font-bold text-blue-600 whitespace-nowrap">{pickup.times[2] || '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-blue-50/50 p-3 flex flex-col gap-2 border-t">
        <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide">University Departures</h4>
        <div className="grid grid-cols-3 gap-2">
          {activeSchedule?.departures?.map((dep, idx) => (
            <div key={idx} className={`flex flex-col items-center justify-center bg-white border border-blue-100 rounded py-2 px-1 shadow-sm ${!dep.time ? 'opacity-50' : ''}`}>
              <span className="font-semibold text-[10px] uppercase text-blue-600/80 mb-0.5 text-center leading-tight">{dep.label}</span>
              <span className="font-black text-sm text-blue-800">{dep.time || '--'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleTable;
