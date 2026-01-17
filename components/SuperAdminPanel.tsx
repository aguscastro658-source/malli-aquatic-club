
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';
import { dataService } from '../services/dataService';

const SuperAdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'control' | 'lockscreen'>('control');
  const [appEnabled, setAppEnabled] = useState(true);
  const [adminAccessEnabled, setAdminAccessEnabled] = useState(true);
  const [licenseDays, setLicenseDays] = useState(30);
  const [maintenanceTitle, setMaintenanceTitle] = useState("MALLI AQUATIC CLUB");
  const [maintenanceSubtitle, setMaintenanceSubtitle] = useState("ESTA EN MANTENIMIENTO");
  const [maintenanceMessage, setMaintenanceMessage] = useState("Estamos limpiando las piscinas y optimizando el sistema para brindarte la mejor experiencia refrescante.");

  const [saveStatus, setSaveStatus] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('malli_super_admin_auth') === 'true';
    if (!auth) navigate(AppRoute.ADMIN);

    const config = dataService.getConfig();
    setAppEnabled(config.appStatus !== 'maintenance');
    setAdminAccessEnabled(config.adminAccessEnabled !== false);
    if (config.licenseDays !== undefined) setLicenseDays(config.licenseDays);
    if (config.maintenanceTitle) setMaintenanceTitle(config.maintenanceTitle);
    if (config.maintenanceSubtitle) setMaintenanceSubtitle(config.maintenanceSubtitle);
    if (config.maintenanceMessage) setMaintenanceMessage(config.maintenanceMessage);
  }, [navigate]);

  const handleSave = () => {
    const config = dataService.getConfig();

    const newConfig = {
      ...config,
      appStatus: appEnabled ? 'active' : 'maintenance',
      adminAccessEnabled,
      licenseDays,
      maintenanceTitle,
      maintenanceSubtitle,
      maintenanceMessage
    };

    dataService.saveConfig(newConfig);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleExportData = () => {
    const data = dataService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malli_bases_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleLogout = () => {
    dataService.logout();
    navigate(AppRoute.HOME);
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="bg-sky-100 text-sky-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-sky-200 shadow-sm">Master Access</span>
            <span className="bg-stone-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">DAMIAN</span>
          </div>
          <h1 className="text-4xl font-black text-stone-900 font-outfit uppercase tracking-tighter">CENTRAL MASTER</h1>
        </div>

        <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
          <button onClick={() => setActiveTab('control')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'control' ? 'bg-white text-sky-800 shadow-sm' : 'text-stone-500'}`}>General</button>
          <button onClick={() => setActiveTab('lockscreen')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'lockscreen' ? 'bg-white text-sky-800 shadow-sm' : 'text-stone-500'}`}>Bloqueo</button>
        </div>

        <button onClick={handleLogout} className="px-6 py-3 bg-stone-100 text-stone-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all">
          Salir
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {activeTab === 'control' && (
                <div className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-8 animate-in slide-in-from-left duration-500">
                  <h3 className="text-xl font-black text-stone-900 font-outfit uppercase tracking-tighter flex items-center">
                    <i className="fa-solid fa-power-off mr-3 text-sky-600"></i> Control Maestro
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-sky-50 rounded-3xl border border-sky-100">
                      <div>
                        <p className="font-black text-[10px] uppercase tracking-widest text-sky-900 mb-1">Estado de la App</p>
                        <p className="text-[9px] font-bold text-sky-600 uppercase italic">Activa / Mantenimiento</p>
                      </div>
                      <button
                        onClick={() => setAppEnabled(!appEnabled)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all shadow-lg ${appEnabled ? 'bg-sky-500 text-white' : 'bg-red-500 text-white'}`}
                      >
                        <i className={`fa-solid ${appEnabled ? 'fa-check' : 'fa-power-off'}`}></i>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-stone-900 rounded-3xl border border-stone-800">
                      <div>
                        <p className="font-black text-[10px] uppercase tracking-widest text-white mb-1">Acceso Maria/Admin</p>
                        <p className="text-[9px] font-bold text-stone-400 uppercase italic">Panel Administrativo</p>
                      </div>
                      <button
                        onClick={() => setAdminAccessEnabled(!adminAccessEnabled)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all shadow-lg ${adminAccessEnabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                      >
                        <i className={`fa-solid ${adminAccessEnabled ? 'fa-unlock' : 'fa-lock'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">Días de Licencia</label>
                    <div className="flex items-center space-x-4">
                      <button onClick={() => setLicenseDays(Math.max(0, licenseDays - 1))} className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500"><i className="fa-solid fa-minus"></i></button>
                      <input type="number" value={licenseDays} onChange={(e) => setLicenseDays(parseInt(e.target.value) || 0)} className="flex-grow text-center py-4 bg-stone-50 border border-stone-100 rounded-2xl text-2xl font-black text-stone-900 outline-none" />
                      <button onClick={() => setLicenseDays(licenseDays + 1)} className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500"><i className="fa-solid fa-plus"></i></button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'lockscreen' && (
                <div className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-6 animate-in slide-in-from-left duration-500">
                  <h3 className="text-xl font-black text-stone-900 font-outfit uppercase tracking-tighter flex items-center">
                    <i className="fa-solid fa-paint-roller mr-3 text-sky-600"></i> Pantalla de Bloqueo
                  </h3>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Título</label>
                    <input type="text" value={maintenanceTitle} onChange={(e) => setMaintenanceTitle(e.target.value)} className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Mensaje de Bloqueo</label>
                    <textarea value={maintenanceMessage} onChange={(e) => setMaintenanceMessage(e.target.value)} className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold outline-none h-32 resize-none" />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-stone-900 font-outfit uppercase tracking-tighter flex items-center mb-8">
                  <i className="fa-solid fa-circle-info mr-3 text-sky-600"></i> Resumen del Sistema
                </h3>

                <div className="space-y-6">
                  <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-sky-600 shadow-sm"><i className="fa-solid fa-calendar-day"></i></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Expiración</p>
                        <p className="font-bold text-stone-800">Licencia activa por {licenseDays} días</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 uppercase">Saludable</span>
                  </div>

                  <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-sky-600 shadow-sm"><i className="fa-solid fa-file-export"></i></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Respaldo</p>
                        <p className="font-bold text-stone-800">Exportar Bases de Datos</p>
                      </div>
                    </div>
                    <button onClick={handleExportData} className="text-[10px] font-black text-sky-600 uppercase tracking-widest hover:underline">Descargar JSON</button>
                  </div>
                </div>
              </div>

              <button onClick={handleSave} className={`w-full mt-8 py-6 rounded-3xl font-black text-base uppercase tracking-[0.2em] shadow-2xl transition-all ${saveStatus ? 'bg-sky-500 text-white' : 'bg-stone-950 text-white hover:bg-black active:scale-95'}`}>
                {saveStatus ? '¡ACCESO ACTUALIZADO!' : 'APLICAR CAMBIOS MAESTROS'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPanel;
