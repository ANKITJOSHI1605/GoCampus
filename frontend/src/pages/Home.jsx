import React from 'react'; 
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-2xl tracking-tighter">GoCampus</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-white hover:bg-blue-700 px-3 py-2 rounded-md font-medium transition">Login</Link>
              <Link to="/register" className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-md font-bold shadow-sm transition">Register</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Interactive Hero Section */}
      <main className="flex-grow relative flex items-center justify-center p-6 overflow-hidden">
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 to-indigo-100"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="max-w-4xl w-full text-center space-y-6 md:space-y-8 relative z-10 transition-all duration-1000 transform translate-y-0 opacity-100 px-4">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-xs md:text-sm font-bold tracking-wider mb-2 md:mb-4 animate-bounce">
            🚀 NEXT-GEN TRANSIT
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-900 tracking-tight drop-shadow-sm leading-tight">
            Smart University <br/> <span className="text-blue-600">Bus Tracking</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed">
            Never miss your campus bus again. Track routes in real-time, get exact arrival estimates, and plan your daily campus travel seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 md:pt-6">
            <Link to="/register" className="w-full sm:w-auto group relative px-8 py-3 md:py-4 bg-blue-600 text-white rounded-xl font-bold text-base md:text-lg shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 overflow-hidden">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Get Started <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
              <div className="absolute inset-0 h-full w-full scale-0 rounded-xl transition-all duration-300 group-hover:scale-100 group-hover:bg-white/20"></div>
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-3 md:py-4 bg-white/80 backdrop-blur-sm text-gray-800 border-2 border-gray-200 rounded-xl font-bold text-base md:text-lg shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
              Dashboard Login
            </Link>
          </div>
        </div>
      </main>

      {/* Interactive Features Outline */}
      <div className="bg-white py-24 relative z-10 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to move faster</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <div className="w-16 h-16 bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white rounded-2xl flex items-center justify-center mb-6 text-3xl transition-colors duration-300 shadow-sm">📍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">Live Tracking</h3>
              <p className="text-gray-600 leading-relaxed">See exactly where your bus is on the campus map in real-time through precise WebSockets.</p>
            </div>
            
            <div className="group p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-2xl hover:indigo-200 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden delay-100">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <div className="w-16 h-16 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center mb-6 text-3xl transition-colors duration-300 shadow-sm">⏰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">Instant ETA</h3>
              <p className="text-gray-600 leading-relaxed">Accurate arrival times calculated dynamically so you can optimize your schedule flawlessly.</p>
            </div>
            
            <div className="group p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-2xl hover:purple-200 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden delay-200">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <div className="w-16 h-16 bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white rounded-2xl flex items-center justify-center mb-6 text-3xl transition-colors duration-300 shadow-sm">🔔</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">Smart Alerts</h3>
              <p className="text-gray-600 leading-relaxed">Get notified about delays, route diversions, or emergency updates immediately from the system.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-6 text-center">
        <p>&copy; {new Date().getFullYear()} GoCampus - Graphic Era University. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
