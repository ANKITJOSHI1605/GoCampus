import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AdminManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personnel'); // 'personnel' or 'buses'
  
  // State
  const [users, setUsers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit States
  const [editingUser, setEditingUser] = useState(null);
  const [editingBus, setEditingBus] = useState(null);

  // Form States
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'driver' });
  const [busForm, setBusForm] = useState({ busNumber: '', capacity: '19', driverName: '', route: '' });

  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, busesRes] = await Promise.all([
        fetch(`${API_URL}/api/auth/users`),
        fetch(`${API_URL}/api/buses`)
      ]);
      const usersData = await usersRes.json();
      const busesData = await busesRes.json();
      // Filter out admins from personnel management
      if (Array.isArray(usersData)) {
        setUsers(usersData.filter(u => u.role === 'driver' || u.role === 'conductor'));
      }
      if (Array.isArray(busesData)) {
        setBuses(busesData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- User Handlers ---
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingUser;
    const url = isEdit ? `${API_URL}/api/auth/users/${editingUser._id}` : `${API_URL}/api/auth/users`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
      if (res.ok) {
        setEditingUser(null);
        setUserForm({ name: '', email: '', password: '', role: 'driver' });
        fetchData();
      } else {
        const error = await res.json();
        alert(error.message);
      }
    } catch (err) { alert(err.message); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch(`${API_URL}/api/auth/users/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  // --- Bus Handlers ---
  const handleBusSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingBus;
    const url = isEdit ? `${API_URL}/api/buses/${editingBus._id}` : `${API_URL}/api/buses`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(busForm)
      });
      if (res.ok) {
        setEditingBus(null);
        setBusForm({ busNumber: '', capacity: '19', driverName: '', route: '' });
        fetchData();
      } else {
        const error = await res.json();
        alert(error.message);
      }
    } catch (err) { alert(err.message); }
  };

  const handleDeleteBus = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bus?")) return;
    try {
      await fetch(`${API_URL}/api/buses/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar role="Admin" userName="System Admin" notifications={[]} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <button 
              onClick={() => navigate('/admin')}
              className="text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 mb-4 group transition shadow-sm border border-gray-200 w-max"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard Overview
            </button>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">Fleet & Personnel Management</h2>
            <p className="text-gray-500 text-sm mt-1">Manage staff, assign roles (Driver/Conductor), and update bus details.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white p-2 rounded-xl border flex gap-2 w-max">
          <button 
            onClick={() => setActiveTab('personnel')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'personnel' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            👨‍✈️ Personnel
          </button>
          <button 
            onClick={() => setActiveTab('buses')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'buses' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            🚍 Fleet (Buses)
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                
                {activeTab === 'personnel' ? (
                  <>
                    <h3 className="text-lg font-bold mb-4">{editingUser ? 'Edit Personnel' : 'Add New Personnel'}</h3>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                        <input required type="text" className="w-full border p-2 rounded bg-gray-50" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                        <input required type="email" className="w-full border p-2 rounded bg-gray-50" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                        <select className="w-full border p-2 rounded bg-gray-50" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                          <option value="driver">Driver (Drives Bus)</option>
                          <option value="conductor">Conductor (Manages Capacity)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{editingUser ? 'New Password (Optional)' : 'Password'}</label>
                        <input type="password" required={!editingUser} className="w-full border p-2 rounded bg-gray-50" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        {editingUser && (
                          <button type="button" onClick={() => { setEditingUser(null); setUserForm({ name: '', email: '', password: '', role: 'driver' }); }} className="flex-1 bg-gray-100 p-2 rounded text-gray-700 font-bold">Cancel</button>
                        )}
                        <button type="submit" className="flex-1 bg-blue-600 p-2 rounded text-white font-bold">{editingUser ? 'Update' : 'Create'}</button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold mb-4">{editingBus ? 'Edit Bus' : 'Add New Bus'}</h3>
                    <form onSubmit={handleBusSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bus Number (License)</label>
                        <input required type="text" className="w-full border p-2 rounded bg-gray-50" value={busForm.busNumber} onChange={e => setBusForm({...busForm, busNumber: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Seat Capacity</label>
                        <input required type="number" className="w-full border p-2 rounded bg-gray-50" value={busForm.capacity} onChange={e => setBusForm({...busForm, capacity: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assigned Personnel (Driver/Conductor)</label>
                        <input required type="text" placeholder="e.g. John Doe" className="w-full border p-2 rounded bg-gray-50" value={busForm.driverName} onChange={e => setBusForm({...busForm, driverName: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Route / Area (Optional)</label>
                        <input type="text" className="w-full border p-2 rounded bg-gray-50" value={busForm.route} onChange={e => setBusForm({...busForm, route: e.target.value})} />
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        {editingBus && (
                          <button type="button" onClick={() => { setEditingBus(null); setBusForm({ busNumber: '', capacity: '19', driverName: '', route: '' }); }} className="flex-1 bg-gray-100 p-2 rounded text-gray-700 font-bold">Cancel</button>
                        )}
                        <button type="submit" className="flex-1 bg-blue-600 p-2 rounded text-white font-bold">{editingBus ? 'Update' : 'Create'}</button>
                      </div>
                    </form>
                  </>
                )}

              </div>
            </div>

            {/* Right Column: List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                
                {activeTab === 'personnel' ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {users.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-500">No personnel found.</td></tr>}
                      {users.map(user => (
                        <tr key={user._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${user.role === 'conductor' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => { setEditingUser(user); setUserForm({ name: user.name, email: user.email, role: user.role, password: '' }); }} 
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold rounded-lg transition mr-2 shadow-sm border border-blue-100 inline-flex items-center gap-1">
                              <span>✏️</span> Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user._id)} 
                              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-lg transition shadow-sm border border-red-100 inline-flex items-center gap-1">
                              <span>🗑️</span> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Bus</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Capacity</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {buses.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-500">No buses found.</td></tr>}
                      {buses.map(bus => (
                        <tr key={bus._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-blue-700">{bus.busNumber}</div>
                            <div className="text-xs text-gray-500">{bus.route}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{bus.driverName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bus.capacity} Seats</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => { setEditingBus(bus); setBusForm({ busNumber: bus.busNumber, capacity: bus.capacity, driverName: bus.driverName, route: bus.route || '' }); }} 
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold rounded-lg transition mr-2 shadow-sm border border-blue-100 inline-flex items-center gap-1">
                              <span>✏️</span> Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteBus(bus._id)} 
                              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-lg transition shadow-sm border border-red-100 inline-flex items-center gap-1">
                              <span>🗑️</span> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default AdminManagement;
