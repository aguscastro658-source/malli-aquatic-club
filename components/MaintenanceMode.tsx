
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';

interface MaintenanceModeProps {
  mariaBlocked?: boolean;
}

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ mariaBlocked }) => {
  const navigate = useNavigate();
  const [tapCount, setTapCount] = useState(0);
  const [isVibrating, setIsVibrating] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState({
    title: "MALLI AQUATIC CLUB",
    subtitle: "ESTA EN MANTENIMIENTO",
    message: "Estamos limpiando las piletas y optimizando el sistema para brindarte la mejor experiencia refrescante."
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('malli_app_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setMaintenanceConfig({
          title: config.maintenanceTitle || "MALLI AQUATIC CLUB",
          subtitle: mariaBlocked ? "ACCESO ADMINISTRATIVO RESTRINGIDO" : (config.maintenanceSubtitle || "ESTA EN MANTENIMIENTO"),
          message: mariaBlocked 
            ? "El acceso al panel administrativo ha sido suspendido temporalmente por la Dirección General."
            : (config.maintenanceMessage || "Estamos en mantenimiento técnico.")
        });
      } catch (e) { console.error(e); }
    }
  }, [mariaBlocked]);

  const handleIconClick = () => {
    const newCount = tapCount + 1;
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 200);

    if (newCount >= 5) {
      // Navegación forzada al área de seguridad (Panel Maria/Damian)
      navigate(AppRoute.ADMIN);
    } else {
      setTapCount(newCount);
      // Resetear contador si no hay clics en 2 segundos
      const timer = setTimeout(() => setTapCount(0), 2000);
      return () => clearTimeout(timer);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-sky-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden select-none">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
        <i className="fa-solid fa-water text-[40rem] absolute -top-20 -left-20 text-white"></i>
      </div>

      <div 
        onClick={handleIconClick}
        className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl relative z-10 cursor-pointer active:scale-90 transition-all duration-100 ${mariaBlocked ? 'bg-red-500 shadow-red-500/40' : 'bg-sky-500 shadow-sky-500/40'} ${isVibrating ? 'animate-bounce' : ''}`}
      >
        <i className={`fa-solid ${mariaBlocked ? 'fa-lock' : 'fa-screwdriver-wrench'} text-4xl text-white`}></i>
      </div>
      
      <div className="relative z-10 space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white font-outfit uppercase tracking-tighter leading-none">
          {maintenanceConfig.title}
        </h1>
        <h2 className={`text-xl md:text-2xl font-black font-outfit uppercase tracking-widest ${mariaBlocked ? 'text-red-400' : 'text-sky-400'}`}>
          {maintenanceConfig.subtitle}
        </h2>
      </div>
      
      <div className="relative z-10 max-w-md bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-md shadow-2xl">
        <p className="text-sky-100 font-medium text-base leading-relaxed italic">
          "{maintenanceConfig.message}"
        </p>
      </div>

      <div className="mt-20 opacity-10 text-[8px] font-black text-sky-700 uppercase tracking-[0.5em]">
        MALLI SECURITY v3.0 | BYPASS ACTIVADO PARA DIRECCIÓN
      </div>
    </div>
  );
};

export default MaintenanceMode;
