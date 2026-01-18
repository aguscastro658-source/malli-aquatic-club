import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';
import { dataService } from '../services/dataService';

const PINS = {
  MARIA: "625547",
  DAMIAN: "326426"
};

const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'raffle' | 'users' | 'departures' | 'config' | 'winner-edit'>('raffle');
  const [pin, setPin] = useState('');
  const [config, setConfig] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departures, setDepartures] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showWinnerPreview, setShowWinnerPreview] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);
  const navigate = useNavigate();

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const cfg = await dataService.getConfig();

      // No sobrescribir la config si el usuario está editando textos para evitar el lag/pérdida de foco
      if (activeTab !== 'config' && activeTab !== 'winner-edit') {
        setConfig(cfg);
      }

      const parts = await dataService.getActiveParticipants();
      setParticipants(parts);

      const allUsers = await dataService.getAllUsers();
      setUsers(allUsers);

      const deps = await dataService.getDepartures();
      setDepartures(deps);

      setLastUpdated(new Date().toLocaleTimeString());

      const isAdmin = dataService.isAdmin();
      setIsAuthenticated(isAdmin);

      if (isAdmin && cfg.adminAccessEnabled === false) {
        dataService.logout();
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Error en AdminPanel loadData:', err);
    } finally {
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 5000);
    window.addEventListener('malli_app_config_updated', () => loadData());

    return () => {
      clearInterval(interval);
      window.removeEventListener('malli_app_config_updated', () => loadData());
    };
  }, [loadData]);

  const handlePinDigit = (digit: string) => {
    const newPin = (pin + digit).slice(0, 6);
    setPin(newPin);
    setAccessDenied(false);

    if (newPin === PINS.DAMIAN) {
      sessionStorage.setItem('malli_super_admin_auth', 'true');
      setPin('');
      window.dispatchEvent(new CustomEvent('malli_auth_changed'));
      navigate(AppRoute.SUPER_ADMIN);
      return;
    }

    if (newPin === PINS.MARIA) {
      if (config?.adminAccessEnabled === false) {
        setAccessDenied(true);
        setTimeout(() => { setPin(''); setAccessDenied(false); }, 2000);
        return;
      }
      sessionStorage.setItem('malli_admin_auth', 'true');
      setIsAuthenticated(true);
      setPin('');
      window.dispatchEvent(new CustomEvent('malli_auth_changed'));
    } else if (newPin.length === 6) {
      setTimeout(() => setPin(''), 500);
    }
  };

  const updateConfig = (newPartialConfig: any) => {
    const updated = { ...config, ...newPartialConfig };
    setConfig(updated);
  };

  const persistConfig = async () => {
    setSaveStatus(true);
    await dataService.saveConfig(config);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleDraw = async () => {
    if (participants.length === 0) return;
    setIsDrawing(true);

    setTimeout(async () => {
      const winnerIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[winnerIndex];
      const updated = { ...config, winner };
      setConfig(updated);
      await dataService.saveConfig(updated);
      setIsDrawing(false);
    }, 3000);
  };

  if (!config) return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-white font-black animate-pulse tracking-[0.3em]">SINCRONIZANDO SISTEMAS...</div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-900/10 rounded-full blur-[100px]"></div>

        <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-10 shadow-3xl transition-all duration-500 relative ${accessDenied ? 'bg-red-600 animate-shake' : 'bg-sky-600'}`}>
          <i className={`fa-solid ${accessDenied ? 'fa-user-lock' : 'fa-shield-halved'} text-3xl text-white`}></i>
        </div>

        <h2 className="text-white font-black uppercase tracking-[0.4em] text-xl mb-4 text-center font-outfit">SEGURIDAD CENTRAL</h2>
        <p className={`text-[9px] font-bold uppercase tracking-[0.5em] mb-12 text-center transition-colors ${accessDenied ? 'text-red-500' : 'text-stone-500'}`}>
          {accessDenied ? 'ACCESO RESTRINGIDO POR MAESTRO' : 'AUTENTICACIÓN REQUERIDA'}
        </p>

        <div className="flex gap-3 mb-16 px-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-300 ${pin.length > i ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-[0_0_15px_#0ea5e9]' : 'border-stone-800 text-stone-800'}`}>
              {pin[i] ? '•' : ''}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5 max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} onClick={() => handlePinDigit(n.toString())} className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-stone-900 text-white font-black text-xl hover:bg-stone-800 border border-stone-800 transition-all active:scale-90 shadow-md">
              {n}
            </button>
          ))}
          <button onClick={() => setPin('')} className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-stone-900 text-stone-500 text-[9px] font-black uppercase tracking-widest border border-stone-800/30">Borrar</button>
          <button onClick={() => handlePinDigit('0')} className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-stone-900 text-white font-black text-xl border border-stone-800">0</button>
          <button onClick={() => setPin(pin.slice(0, -1))} className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-stone-900 text-white flex items-center justify-center border border-stone-800">
            <i className="fa-solid fa-delete-left text-lg"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">

        {/* Admin Header Optimized */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-8 md:p-10 rounded-[3rem] border border-stone-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] relative overflow-hidden">
          {/* Subtle background glow for license */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

          <div className="flex-grow relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-sky-100 text-sky-800 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-sky-200">MARIA | CONTROL</span>
              <div className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-100 shadow-xs">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Sincronizado
              </div>

              {/* License Status Badge */}
              <div className="flex items-center bg-sky-950 text-sky-300 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-sky-900 shadow-lg">
                <i className="fa-solid fa-shield-check mr-2 text-sky-400"></i>
                Licencia: Activa
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-stone-900 font-outfit uppercase tracking-tighter leading-none">Gestión Operativa</h1>

            <div className="flex flex-wrap items-center gap-6 mt-4">
              <div>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest italic opacity-80 decoration-sky-200 underline-offset-4">Última actualización: {lastUpdated}</p>
              </div>

              {/* Detailed License Info */}
              <div className="flex items-center gap-3 py-1 px-4 bg-stone-50 rounded-xl border border-stone-100">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest leading-none">Días Restantes</span>
                  <span className="text-[12px] font-black text-sky-600">{config.licenseDays || 0} DÍAS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-stone-100 p-1.5 rounded-[2rem] border border-stone-200 w-full xl:w-auto overflow-x-auto whitespace-nowrap scrollbar-hide relative z-10">
            {[
              { id: 'raffle', label: 'Sorteo', icon: 'fa-trophy' },
              { id: 'users', label: 'Registrados', icon: 'fa-users' },
              { id: 'departures', label: 'Bajas', icon: 'fa-user-slash' },
              { id: 'config', label: 'Contenidos', icon: 'fa-pen-to-square' },
              { id: 'winner-edit', label: 'Ganador', icon: 'fa-crown' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-sky-800 shadow-md ring-1 ring-stone-100' : 'text-stone-500 hover:text-stone-800'}`}
              >
                <i className={`fa-solid ${tab.icon} ${activeTab === tab.id ? 'text-sky-600' : 'opacity-40'}`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Tabs Optimized */}
        <main className="min-h-[500px]">
          {activeTab === 'raffle' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-10 md:p-12 rounded-[3.5rem] border border-stone-100 shadow-lg text-center flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-sky-600"></div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black uppercase tracking-widest mb-10 text-stone-400 font-outfit">USUARIOS ACTIVOS</h3>
                  <div className="text-7xl md:text-8xl font-black text-sky-600 mb-6 drop-shadow-xl">{participants.length}</div>
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.3em] mb-12 italic">Candidatos listos para el sorteo</p>

                  <div className="space-y-4 max-w-sm mx-auto">
                    <button
                      disabled={isDrawing || !!config.winner || participants.length === 0}
                      onClick={handleDraw}
                      className={`w-full py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest transition-all ${isDrawing ? 'bg-stone-100 text-stone-300' : config.winner ? 'bg-green-50 text-green-600 border-2 border-green-100 cursor-default' : 'bg-stone-950 text-white hover:bg-black shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95'}`}
                    >
                      {isDrawing ? 'SORTEANDO...' : config.winner ? 'GANADOR LISTO' : 'LANZAR SORTEO'}
                    </button>
                    {config.winner && (
                      <button
                        onClick={() => { if (confirm("¿Limpiar ganador actual?")) { updateConfig({ winner: null }); } }}
                        className="text-[9px] font-black text-stone-300 uppercase hover:text-red-500 transition-colors tracking-[0.2em]"
                      >
                        Reiniciar Sistema de Sorteo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 md:p-12 rounded-[3.5rem] border border-stone-100 shadow-lg flex flex-col h-[500px]">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800 flex items-center font-outfit">
                    <i className="fa-solid fa-fire text-sky-600 mr-4"></i> En Competencia
                  </h3>
                  <button onClick={() => loadData(true)} className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 hover:text-sky-600 transition-all border border-stone-100 active:rotate-180">
                    <i className={`fa-solid fa-rotate ${isRefreshing ? 'animate-spin' : ''}`}></i>
                  </button>
                </div>

                <div className="flex-grow space-y-3 overflow-y-auto pr-4 custom-scrollbar">
                  {participants.map((p, idx) => {
                    const isOnline = (new Date().getTime() - p.lastSeen) < 60000;
                    return (
                      <div key={idx} className="flex justify-between items-center p-5 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 hover:border-sky-200 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]' : 'bg-stone-300'}`}></div>
                          <div>
                            <span className="font-black text-stone-800 uppercase text-xs block mb-1">{p.name}</span>
                            <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{isOnline ? 'EN LÍNEA' : 'OFFLINE'}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-black text-sky-600 bg-white px-3 py-1.5 rounded-xl border border-sky-50 shadow-xs">DNI: {p.dni}</span>
                      </div>
                    );
                  })}
                  {participants.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-stone-300 opacity-50 space-y-6">
                      <i className="fa-solid fa-magnifying-glass text-5xl"></i>
                      <p className="italic text-[10px] font-black uppercase tracking-widest">Buscando participantes...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white p-10 md:p-12 rounded-[3.5rem] border border-stone-100 shadow-lg animate-in slide-in-from-right duration-500">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-stone-800 font-outfit">USUARIOS REGISTRADOS</h3>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Base histórica: {users.length} inscritos</p>
                </div>
                <div className="bg-sky-50 text-sky-700 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest border border-sky-100">
                  ACTUALIZADO HOY
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {users.map((u, idx) => {
                  const participant = participants.find(p => p.dni === u.dni);
                  const isParticipating = !!participant;
                  const isOnline = participant ? (new Date().getTime() - participant.lastSeen < 60000) : false;

                  return (
                    <div key={idx} className="p-6 bg-stone-50 rounded-[2.5rem] border border-stone-100 hover:shadow-xl hover:border-sky-200 transition-all group relative">
                      <div className={`absolute top-6 right-6 w-3 h-3 rounded-full border-2 border-white shadow-sm ${isParticipating ? 'bg-green-500' : 'bg-red-400'} ${isOnline ? 'animate-pulse' : ''}`}></div>
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-stone-300 shadow-xs group-hover:bg-sky-600 group-hover:text-white transition-all mb-4">
                        <i className="fa-solid fa-user-circle text-xl"></i>
                      </div>
                      <h4 className="font-black text-stone-900 uppercase text-sm leading-tight mb-1 truncate">{u.name}</h4>
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-4">DNI {u.dni}</p>
                      <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${isParticipating ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'}`}>
                        {isParticipating ? 'COMPITIENDO' : 'SIN DEPÓSITO'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'departures' && (
            <div className="bg-white p-10 md:p-12 rounded-[3.5rem] border border-stone-100 shadow-lg animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-5 mb-12">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 text-xl shadow-xs">
                  <i className="fa-solid fa-user-slash"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-red-600 font-outfit leading-none">Historial de Bajas</h3>
                  <p className="text-stone-400 text-[10px] mt-2 uppercase font-black tracking-widest">Control administrativo hoy</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departures.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center p-6 bg-red-50/20 rounded-[2.5rem] border border-red-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-200 border border-red-50 shadow-sm"><i className="fa-solid fa-clock"></i></div>
                      <div>
                        <span className="font-black text-stone-800 uppercase text-sm block mb-1">{d.name}</span>
                        <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest">{d.leftAt}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-black text-stone-500">DNI {d.dni}</span>
                  </div>
                ))}
                {departures.length === 0 && (
                  <div className="col-span-full text-center py-20 text-stone-300 italic text-[10px] uppercase font-black tracking-widest opacity-60">No se han registrado bajas en esta sesión</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="bg-white p-10 md:p-12 rounded-[3.5rem] border border-stone-100 shadow-lg space-y-10 animate-in slide-in-from-right duration-500">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-stone-800 font-outfit">Contenidos de la App</h3>
                <p className="text-stone-400 text-[10px] uppercase font-black tracking-widest mt-1">Ajuste de textos públicos del club</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-4">CABECERA LANDING</label>
                  <input type="text" value={config.promoTitle} onChange={(e) => updateConfig({ promoTitle: e.target.value })} className="w-full px-6 py-5 bg-stone-50 border-2 border-stone-100 rounded-[2rem] font-black text-lg uppercase focus:border-sky-500 outline-none transition-all shadow-inner" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-4">EL PREMIO ACTUAL</label>
                  <input type="text" value={config.rafflePrize} onChange={(e) => updateConfig({ rafflePrize: e.target.value })} className="w-full px-6 py-5 bg-sky-50 border-2 border-sky-100 rounded-[2rem] font-black text-lg uppercase focus:border-sky-500 outline-none transition-all text-sky-800" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-4">BASES Y REGLAMENTO DEL CLUB</label>
                <textarea
                  value={config.raffleRules}
                  onChange={(e) => updateConfig({ raffleRules: e.target.value })}
                  className="w-full px-8 py-8 bg-stone-50 border-2 border-stone-100 rounded-[2.5rem] h-40 font-medium focus:border-sky-500 outline-none resize-none transition-all text-base shadow-inner"
                />
              </div>

              <div className="pt-6 border-t border-stone-100">
                <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em] mb-8 ml-4">TARJETAS INFORMATIVAS (LANDING)</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Tarjeta 1 */}
                  <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 space-y-4">
                    <p className="text-[9px] font-black text-sky-600 uppercase">Tarjeta 1 (Piletas)</p>
                    <input type="text" value={config.card1Title} onChange={(e) => updateConfig({ card1Title: e.target.value })} placeholder="Título" className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-sky-500" />
                    <textarea value={config.card1Desc} onChange={(e) => updateConfig({ card1Desc: e.target.value })} placeholder="Descripción" className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl font-medium text-[11px] h-20 outline-none focus:border-sky-500 resize-none" />
                  </div>

                  {/* Tarjeta 2 */}
                  <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 space-y-4">
                    <p className="text-[9px] font-black text-sky-600 uppercase">Tarjeta 2 (Sorteo)</p>
                    <input type="text" value={config.card2Title} onChange={(e) => updateConfig({ card2Title: e.target.value })} placeholder="Título" className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-sky-500" />
                    <textarea value={config.card2Desc} onChange={(e) => updateConfig({ card2Desc: e.target.value })} placeholder="Descripción" className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl font-medium text-[11px] h-20 outline-none focus:border-sky-500 resize-none" />
                  </div>

                  {/* Tarjeta 3 */}
                  <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 space-y-4">
                    <p className="text-[9px] font-black text-sky-600 uppercase">Tarjeta 3 (DNI)</p>
                    <input type="text" value={config.card3Title} onChange={(e) => updateConfig({ card3Title: e.target.value })} placeholder="Título" className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-sky-500" />
                    <textarea value={config.card3Desc} onChange={(e) => updateConfig({ card3Desc: e.target.value })} placeholder="Descripción" className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl font-medium text-[11px] h-20 outline-none focus:border-sky-500 resize-none" />
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={persistConfig}
                  className={`w-full py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest transition-all ${saveStatus ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-stone-950 text-white hover:bg-black active:scale-95'}`}
                >
                  {saveStatus ? '¡CAMBIOS GUARDADOS!' : 'GUARDAR TODOS LOS CAMBIOS'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'winner-edit' && (
            <div className="bg-white p-10 md:p-12 rounded-[3.5rem] border border-stone-100 shadow-lg space-y-8 animate-in slide-in-from-right duration-500">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-stone-800 font-outfit">Pantalla del Ganador</h3>
                  <p className="text-stone-400 text-[10px] uppercase font-black tracking-widest mt-1">Personaliza el diseño final del ticket</p>
                </div>
                <button
                  onClick={() => setShowWinnerPreview(true)}
                  className="bg-sky-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-700 transition-all shadow-lg active:scale-95"
                >
                  PROBAR PREVIEW DE USUARIO
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-4">GRITO DE VICTORIA</label>
                  <input type="text" value={config.winnerViewTitle} onChange={(e) => updateConfig({ winnerViewTitle: e.target.value })} className="w-full px-6 py-5 bg-stone-50 border-2 border-stone-100 rounded-[2rem] font-black text-xl uppercase focus:border-sky-500 outline-none" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-4">COMENTARIO EXTRA</label>
                  <input type="text" value={config.winnerViewSub} onChange={(e) => updateConfig({ winnerViewSub: e.target.value })} className="w-full px-6 py-5 bg-stone-50 border-2 border-stone-100 rounded-[2rem] font-bold text-base uppercase focus:border-sky-500 outline-none" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-4">INSTRUCCIONES FINALES</label>
                  <textarea value={config.winnerViewInstructions} onChange={(e) => updateConfig({ winnerViewInstructions: e.target.value })} className="w-full px-8 py-8 bg-stone-50 border-2 border-stone-100 rounded-[2.5rem] h-40 font-medium focus:border-sky-500 outline-none resize-none text-base" />
                </div>
              </div>

              <div className="mt-10">
                <button
                  onClick={persistConfig}
                  className={`w-full py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest transition-all ${saveStatus ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-stone-950 text-white hover:bg-black active:scale-95'}`}
                >
                  {saveStatus ? '¡CAMBIOS GUARDADOS!' : 'GUARDAR DISEÑO DE GANADOR'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modern High-End Winner Preview Optimized for PC */}
      {showWinnerPreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-xl" onClick={() => setShowWinnerPreview(false)}></div>
          <div className="relative w-full max-w-3xl bg-sky-50 rounded-[4rem] border-8 border-sky-400 p-8 md:p-14 text-center animate-in zoom-in duration-500 shadow-[0_0_150px_rgba(56,189,248,0.2)] overflow-hidden">

            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-400 rounded-full blur-[100px] animate-pulse"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-600 rounded-full blur-[100px] animate-pulse"></div>
            </div>

            <div className="w-24 h-24 bg-sky-600 rounded-full flex items-center justify-center mx-auto mb-8 text-white text-5xl shadow-3xl shadow-sky-400/30">
              <i className="fa-solid fa-crown"></i>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-sky-900 uppercase tracking-tighter mb-6 leading-none font-outfit">
              {config.winnerViewTitle}
            </h1>

            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[3rem] shadow-2xl border border-white mb-8 transform hover:scale-[1.01] transition-all">
              <span className="text-sky-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 block underline decoration-sky-200 underline-offset-4">{config.winnerViewSub}</span>
              <h2 className="text-xl md:text-2xl font-black text-stone-900 uppercase tracking-tight mb-4">{config.rafflePrize}</h2>
              <div className="h-px bg-sky-100 w-20 mx-auto mb-4"></div>
              <p className="text-sky-900 font-bold text-sm md:text-base leading-relaxed italic opacity-90 max-w-xl mx-auto">
                "{config.winnerViewInstructions}"
              </p>
            </div>

            <div className="bg-stone-950 p-10 rounded-[4rem] shadow-3xl inline-flex flex-col items-center space-y-5">
              <div className="bg-white p-5 rounded-[2rem] shadow-inner relative">
                <div className="w-32 h-32 md:w-36 md:h-36 bg-stone-50 flex items-center justify-center relative overflow-hidden group">
                  <i className="fa-solid fa-qrcode text-7xl text-stone-200 opacity-60"></i>
                  <div className="absolute top-0 left-0 w-full h-1 bg-sky-500 animate-[scan_2.5s_infinite] shadow-[0_0_10px_#0ea5e9]"></div>
                </div>
              </div>
              <div className="text-center px-4">
                <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.4em] mb-1.5">Usuario Ganador</p>
                <p className="text-white font-mono font-black tracking-widest text-lg md:text-xl uppercase truncate max-w-[280px]">
                  {config.winner ? config.winner.name : 'USUARIO EJEMPLO'}
                </p>
                <p className="text-sky-300 font-mono font-bold tracking-[0.2em] text-xs leading-none mt-1">
                  DNI {config.winner ? config.winner.dni : '00.000.000'}
                </p>
              </div>
            </div>

            <div className="mt-10">
              <button onClick={() => setShowWinnerPreview(false)} className="px-10 py-5 bg-stone-950 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
                Cerrar Ventana
              </button>
            </div>
          </div>

          <style>{`
            @keyframes scan {
              0% { top: 0; }
              100% { top: 100%; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
