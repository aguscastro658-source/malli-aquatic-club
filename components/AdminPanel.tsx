
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';
import { dataService } from '../services/dataService';

const PINS = {
  MARIA: "625547",
  DAMIAN: "326426"
};

const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState<'raffle' | 'departures' | 'config' | 'winner-edit'>('raffle');
  const [config, setConfig] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [departures, setDepartures] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showWinnerPreview, setShowWinnerPreview] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const navigate = useNavigate();

  const loadData = () => {
    const cfg = dataService.getConfig();
    setConfig(cfg);
    setParticipants(dataService.getActiveParticipants());
    setDepartures(dataService.getDepartures());
    
    // Verificación de sesión activa
    const isAdmin = dataService.isAdmin();
    setIsAuthenticated(isAdmin);

    // Si Maria está dentro pero Damian le quita el acceso en tiempo real
    if (isAdmin && cfg.adminAccessEnabled === false) {
      dataService.logout();
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); 
    window.addEventListener('malli_app_config_updated', loadData);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('malli_app_config_updated', loadData);
    };
  }, []);

  const handlePinDigit = (digit: string) => {
    const newPin = (pin + digit).slice(0, 6);
    setPin(newPin);
    setAccessDenied(false);

    // 1. Acceso de DAMIAN (Superusuario) - Siempre permitido
    if (newPin === PINS.DAMIAN) {
      sessionStorage.setItem('malli_super_admin_auth', 'true');
      setPin('');
      window.dispatchEvent(new CustomEvent('malli_auth_changed'));
      navigate(AppRoute.SUPER_ADMIN);
      return;
    }

    // 2. Acceso de MARIA (Administradora) - Sujeto a activación de Damian
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
      // PIN Incorrecto
      setTimeout(() => setPin(''), 500);
    }
  };

  // Fix: Added missing updateConfig function to handle configuration updates and persistence
  const updateConfig = (newPartialConfig: any) => {
    const updated = { ...config, ...newPartialConfig };
    setConfig(updated);
    dataService.saveConfig(updated);
  };

  // Fix: Added missing handleDraw function to select a random winner from active participants
  const handleDraw = () => {
    if (participants.length === 0) return;
    setIsDrawing(true);
    
    // Simulating drawing process with a visual delay
    setTimeout(() => {
      const winnerIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[winnerIndex];
      updateConfig({ winner });
      setIsDrawing(false);
    }, 3000);
  };

  if (!config) return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-white font-black animate-pulse">SINCRONIZANDO...</div>;

  // Si no está autenticado, mostramos SIEMPRE el teclado numérico (PIN Pad)
  // Esto permite que Damian entre incluso si Maria está bloqueada
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl transition-all duration-500 ${accessDenied ? 'bg-red-600 animate-shake' : 'bg-sky-600'}`}>
          <i className={`fa-solid ${accessDenied ? 'fa-user-lock' : 'fa-shield-halved'} text-3xl text-white`}></i>
        </div>
        <h2 className="text-white font-black uppercase tracking-widest text-xl mb-2 text-center font-outfit">SEGURIDAD CENTRAL</h2>
        <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-12 text-center transition-colors ${accessDenied ? 'text-red-500' : 'text-stone-500'}`}>
          {accessDenied ? 'ACCESO ADMINISTRATIVO RESTRINGIDO' : 'Identificación Requerida'}
        </p>
        
        <div className="flex gap-3 mb-12">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${pin.length > i ? 'border-sky-500 bg-sky-500/20 text-sky-400' : 'border-stone-800 text-stone-700'}`}>
              {pin[i] ? '•' : ''}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} onClick={() => handlePinDigit(n.toString())} className="w-16 h-16 rounded-full bg-stone-900 text-white font-black text-xl hover:bg-stone-800 transition-all active:scale-90">
              {n}
            </button>
          ))}
          <button onClick={() => setPin('')} className="w-16 h-16 rounded-full bg-stone-900 text-stone-500 text-xs font-bold uppercase tracking-widest">C</button>
          <button onClick={() => handlePinDigit('0')} className="w-16 h-16 rounded-full bg-stone-900 text-white font-black text-xl">0</button>
          <button onClick={() => setPin(pin.slice(0, -1))} className="w-16 h-16 rounded-full bg-stone-900 text-white"><i className="fa-solid fa-delete-left"></i></button>
        </div>
        
        {accessDenied && (
          <p className="mt-8 text-red-500 text-[9px] font-black uppercase tracking-widest animate-bounce">
            Contacte al Superusuario para habilitar el panel
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <span className="bg-sky-100 text-sky-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-sky-200">MARIA | ADMINISTRADORA</span>
          <h1 className="text-4xl font-black text-stone-900 font-outfit uppercase tracking-tighter mt-2 leading-none">Gestión Total</h1>
        </div>
        <div className="flex gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 overflow-x-auto max-w-full">
          <button onClick={() => setActiveTab('raffle')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'raffle' ? 'bg-white text-sky-800 shadow-sm' : 'text-stone-500'}`}>Sorteo</button>
          <button onClick={() => setActiveTab('departures')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'departures' ? 'bg-white text-sky-800 shadow-sm' : 'text-stone-500'}`}>Bajas</button>
          <button onClick={() => setActiveTab('config')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'config' ? 'bg-white text-sky-800 shadow-sm' : 'text-stone-500'}`}>Piletas</button>
          <button onClick={() => setActiveTab('winner-edit')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'winner-edit' ? 'bg-white text-sky-800 shadow-sm' : 'text-stone-500'}`}>Ganador</button>
        </div>
      </div>

      {activeTab === 'raffle' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm text-center">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-8 text-stone-800">Candidatos Inscriptos</h3>
            <div className="text-7xl font-black text-sky-600 mb-4">{participants.length}</div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-10 italic">Inscripción permanente para el sorteo</p>
            <button 
              disabled={isDrawing || !!config.winner || participants.length === 0}
              onClick={handleDraw}
              className={`w-full py-6 rounded-3xl font-black text-lg uppercase transition-all ${isDrawing ? 'bg-stone-100 text-stone-400' : config.winner ? 'bg-stone-200 text-stone-500 cursor-not-allowed' : 'bg-sky-600 text-white hover:bg-sky-700 shadow-xl shadow-sky-100'}`}
            >
              {isDrawing ? 'SORTEANDO...' : config.winner ? 'GANADOR LISTO' : 'LANZAR SORTEO'}
            </button>
            <button onClick={() => { if(confirm("¿Limpiar ganador actual?")) { updateConfig({ winner: null }); } }} className="mt-6 text-[10px] font-black text-stone-300 uppercase hover:text-red-500 transition-colors tracking-widest">Borrar Ganador</button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm flex flex-col">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center text-stone-800">
              <i className="fa-solid fa-users text-sky-500 mr-3"></i> Base de Participantes
            </h3>
            <div className="flex-grow space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {participants.map((p, idx) => {
                const isOnline = (new Date().getTime() - p.lastSeen) < 60000;
                return (
                  <div key={idx} className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100 animate-in fade-in slide-in-from-left duration-300">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`}></div>
                      <div>
                        <span className="font-bold text-stone-800 uppercase text-xs block">{p.name}</span>
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                          {isOnline ? 'Navegando ahora' : 'Inscripto'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">DNI: {p.dni}</span>
                  </div>
                );
              })}
              {participants.length === 0 && <div className="text-center py-20 text-stone-300 italic text-xs uppercase font-black tracking-widest">Nadie inscripto por ahora...</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'departures' && (
        <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm animate-in slide-in-from-right duration-500">
          <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center text-red-600">
            <i className="fa-solid fa-user-slash mr-3"></i> Usuarios Desvinculados
          </h3>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-8">Historial de usuarios eliminados del registro</p>
          <div className="space-y-4">
            {departures.map((d, idx) => (
              <div key={idx} className="flex justify-between items-center p-6 bg-red-50/30 rounded-3xl border border-red-100">
                <div>
                  <span className="font-black text-stone-800 uppercase text-sm block">{d.name}</span>
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Baja definitiva: {d.leftAt}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-stone-400 block mb-1 uppercase tracking-widest">DNI RETIRADO</span>
                  <span className="text-xs font-black text-stone-700">{d.dni}</span>
                </div>
              </div>
            ))}
            {departures.length === 0 && <div className="text-center py-20 text-stone-300 italic text-xs uppercase font-black tracking-widest">No hay bajas registradas</div>}
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-8 animate-in slide-in-from-right duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Título Principal</label>
                 <input type="text" value={config.promoTitle} onChange={(e) => updateConfig({ promoTitle: e.target.value })} className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold focus:border-sky-500 outline-none" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Premio Diarios</label>
                 <input type="text" value={config.rafflePrize} onChange={(e) => updateConfig({ rafflePrize: e.target.value })} className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold focus:border-sky-500 outline-none" />
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Información de Piletas</label>
              <textarea value={config.raffleRules} onChange={(e) => updateConfig({ raffleRules: e.target.value })} className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl h-40 font-medium focus:border-sky-500 outline-none resize-none" />
           </div>
        </div>
      )}

      {activeTab === 'winner-edit' && (
        <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-6 animate-in slide-in-from-right duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800">Vista del Ganador</h3>
            <button onClick={() => setShowWinnerPreview(true)} className="px-6 py-2 bg-sky-100 text-sky-700 rounded-xl text-[10px] font-black uppercase tracking-widest">Ver como el usuario</button>
          </div>
          <div className="space-y-4">
            <input type="text" value={config.winnerViewTitle} onChange={(e) => updateConfig({ winnerViewTitle: e.target.value })} className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl font-black text-lg uppercase" placeholder="¡GANASTE!" />
            <input type="text" value={config.winnerViewSub} onChange={(e) => updateConfig({ winnerViewSub: e.target.value })} className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold uppercase" placeholder="Subtítulo" />
            <textarea value={config.winnerViewInstructions} onChange={(e) => updateConfig({ winnerViewInstructions: e.target.value })} className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl h-40 font-medium focus:border-sky-500 outline-none resize-none" placeholder="Instrucciones para el pase gratis..." />
          </div>
        </div>
      )}

      {showWinnerPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md" onClick={() => setShowWinnerPreview(false)}></div>
          <div className="relative w-full max-w-lg bg-sky-50 rounded-[4rem] border-4 border-sky-400 p-12 text-center animate-in zoom-in duration-500">
             <div className="w-24 h-24 bg-sky-500 rounded-full flex items-center justify-center mx-auto mb-8 text-white text-5xl animate-bounce shadow-xl"><i className="fa-solid fa-person-swimming"></i></div>
             <h1 className="text-4xl font-black text-sky-900 uppercase tracking-tighter mb-6 leading-tight">{config.winnerViewTitle}</h1>
             <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-sky-200 mb-8">
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-2">{config.winnerViewSub}</p>
                <h2 className="text-2xl font-black text-stone-900">{config.rafflePrize}</h2>
             </div>
             <p className="text-sky-900/70 font-bold text-base leading-relaxed italic p-6 bg-sky-200/30 rounded-3xl border border-sky-200/50">"{config.winnerViewInstructions}"</p>
             <button onClick={() => setShowWinnerPreview(false)} className="mt-8 px-8 py-3 bg-sky-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Cerrar Preview</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
