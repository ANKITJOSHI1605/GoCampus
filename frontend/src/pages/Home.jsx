import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [activeFaq, setActiveFaq] = useState(null);

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

      {/* Meet the Team (About Us) Section */}
      <div className="bg-gray-50 py-24 relative z-10 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wider mb-3">
              👥 CORE TEAM
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900">Alpha squad</h2>
            <p className="text-gray-500 text-sm mt-2">The innovative minds designing the future of university transit.</p>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Rahul Singh Bisht',
                role: 'Leader',
                badge: 'Team Lead',
                init: 'RB',
                color: 'from-blue-500 to-indigo-600',
                github: 'https://github.com/RahulSGits',
                linkedin: 'https://www.linkedin.com/in/rahul-singh-bisht-818a91273'
              },
              {
                name: 'Varun Vohra',
                role: 'Member',
                badge: 'Core Developer',
                init: 'VV',
                color: 'from-purple-500 to-indigo-600'
              },
              {
                name: 'Ankit',
                role: 'Member',
                badge: 'Core Developer',
                init: 'AN',
                color: 'from-cyan-500 to-blue-600',
                github: 'https://github.com/ANKITJOSHI1605'
              },
              {
                name: 'Akshit Thapliyal',
                role: 'Member',
                badge: 'Core Developer',
                init: 'AT',
                color: 'from-emerald-500 to-teal-600',
                github: 'https://github.com/Akshit-Thapliyal'
              }
            ].map((member, idx) => (
              <div key={idx} className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 text-center transform hover:-translate-y-1">
                <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-tr ${member.color} flex items-center justify-center text-white text-3xl font-bold shadow-md shadow-indigo-100 mb-6 group-hover:scale-105 transition-transform duration-300 relative`}>
                  {member.init}
                  <span className="absolute -bottom-1.5 px-3 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-black tracking-widest uppercase border-2 border-white shadow-sm">
                    {member.role}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mt-1">{member.badge}</p>
                
                {/* Social Links */}
                <div className="flex justify-center gap-3 mt-4">
                  {member.github && (
                    <a href={member.github} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 hover:bg-gray-900 text-gray-400 hover:text-white rounded-xl transition duration-300 shadow-sm border border-gray-100" title="GitHub Profile">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                    </a>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 hover:bg-blue-700 text-gray-400 hover:text-white rounded-xl transition duration-300 shadow-sm border border-gray-100" title="LinkedIn Profile">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                    </a>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-center gap-4 text-gray-400 group-hover:text-blue-500 transition-colors">
                  <span className="text-xs font-semibold">Alpha Squad System Specialist</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="bg-white py-24 relative z-10 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wider mb-3">
              ❓ QUESTIONS
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-gray-500 text-sm mt-2">Have a question? We have all the answers covered right here.</p>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How does the real-time tracking work?',
                a: 'GoCampus connects directly to the driver\'s console through active high-speed WebSockets. Geolocation updates are pushed instantly in-memory, ensuring sub-second sync latency for the students map.'
              },
              {
                q: 'Are the shuttle arrival estimates (ETA) accurate?',
                a: 'Yes! The ETA calculations are computed directly on our backend using real-time route geometry from our caching OSRM server, reflecting distance and average transit speeds.'
              },
              {
                q: 'How do students join a shuttle waitlist?',
                a: 'Students can check available seat counts live on their dashboard, and tap the "Join Waitlist" button to secure a booking slot for the incoming shuttle instantly.'
              },
              {
                q: 'Who should I contact if I face a system issue?',
                a: 'You can reach out directly to the Alpha Squad administrators or notify system support on campus. Driver console alerts and server logs are actively monitored.'
              }
            ].map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50 hover:bg-white transition-colors duration-300">
                  <button 
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                  >
                    <span className="font-bold text-gray-900 text-base md:text-lg">{faq.q}</span>
                    <span className={`text-xl transition-transform duration-300 text-blue-600 ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-40 border-t border-gray-100 bg-white' : 'max-h-0'}`}>
                    <p className="px-6 py-5 text-gray-600 text-sm md:text-base leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
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
