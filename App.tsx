
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AdminPanel from './components/AdminPanel';
import SuperAdminPanel from './components/SuperAdminPanel';
import Login from './components/Login';
import UserPanel from './components/UserPanel';
import MaintenanceMode from './components/MaintenanceMode';
import { AppRoute } from './types';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [isMaintenance, setIsMaintenance] = useState(false);

  const checkMaintenance = async () => {
    try {
      const config = await dataService.getConfig();
      setIsMaintenance(config.appStatus === 'maintenance');
    } catch (e) {
      setIsMaintenance(false);
    }
  };

  useEffect(() => {
    checkMaintenance();
    window.addEventListener('malli_app_config_updated', checkMaintenance);
    return () => window.removeEventListener('malli_app_config_updated', checkMaintenance);
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#f0f9ff]">
        {(!isMaintenance || window.location.hash.includes('/admin') || window.location.hash.includes('/super-admin')) && <Navbar />}

        <main className="flex-grow">
          {isMaintenance ? (
            <Routes>
              <Route path={AppRoute.ADMIN} element={<AdminPanel />} />
              <Route path={AppRoute.SUPER_ADMIN} element={<SuperAdminPanel />} />
              <Route path="*" element={<MaintenanceMode />} />
            </Routes>
          ) : (
            <Routes>
              <Route path={AppRoute.HOME} element={<LandingPage />} />
              <Route path={AppRoute.LOGIN} element={<Login />} />
              <Route path={AppRoute.ADMIN} element={<AdminPanel />} />
              <Route path={AppRoute.SUPER_ADMIN} element={<SuperAdminPanel />} />
              <Route path={AppRoute.USER_PANEL} element={<UserPanel />} />
              <Route path="*" element={<LandingPage />} />
            </Routes>
          )}
        </main>

        {(!isMaintenance || window.location.hash.includes('/admin') || window.location.hash.includes('/super-admin')) && (
          <footer className="bg-sky-950 py-16 px-4 text-sky-400">
            <div className="max-w-7xl mx-auto text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center border-b border-sky-900/50 pb-10 mb-10">
                <div className="flex items-center space-x-3 mb-8 md:mb-0">
                  <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fa-solid fa-water text-white text-xl"></i>
                  </div>
                  <div className="flex flex-col -space-y-1">
                    <span className="text-2xl font-black font-outfit tracking-tighter text-white uppercase">
                      MALLI
                    </span>
                    <span className="text-[9px] font-bold text-sky-500 tracking-[0.2em] uppercase">
                      AQUATIC CLUB
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center text-xs font-black uppercase tracking-widest text-sky-700">
                <p>© 2024 MALLI AQUATIC CLUB. DIVERSIÓN Y SOL BAJO CONTROL.</p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                  <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                  <a href="#" className="hover:text-white transition-colors">Términos</a>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>
    </Router>
  );
};

export default App;
