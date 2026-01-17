
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';
import { dataService } from '../services/dataService';

const UserPanel: React.FC = () => {
  const [raffleState, setRaffleState] = useState<'banner' | 'form' | 'success'>('banner');
  const [config, setConfig] = useState<any>(null);
  const [activeParticipants, setActiveParticipants] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    const cfg = dataService.getConfig();
    const user = dataService.getUserSession();
    
    if (!user) {
      navigate(AppRoute.LOGIN);
      return;
    }

    setConfig(cfg);
    setUserData(user);
    setActiveParticipants(dataService.getActiveParticipants());
    
    if (dataService.isUserInscripted(user.dni)) {
      setRaffleState('success');
    } else {
      const savedLocalState = localStorage.getItem('malli_user_raffle_state');
      if (savedLocalState) setRaffleState(savedLocalState as any);
    }
  };

  useEffect(() => {
    load();
    const configInterval = setInterval(load, 10000); 

    window.addEventListener('malli_app_config_updated', load);
    window.addEventListener('malli_logout_request', () => setShowLogoutModal(true));

    return () => {
      clearInterval(configInterval);
      window.removeEventListener('malli_app_config_updated', load);
    };
  }, []);

  useEffect(() => {
    if (!userData) return;

    dataService.updateHeartbeat(userData.dni);
    const heartbeat = setInterval(() => {
      dataService.updateHeartbeat(userData.dni);
    }, 20000);

    return () => clearInterval(heartbeat);
  }, [userData]);

  if (!userData || !config) return null;

  const isWinner = config.winner?.dni === userData.dni;

  const handleJoin = () => {
    dataService.joinRaffle(userData);
    localStorage.setItem('malli_user_raffle_state', 'success');
    setRaffleState('success');
  };

  const handleLogout = (mode: 'session' | 'full_delete') => {
    if (mode === 'full_delete') {
      dataService.unregisterUser(userData.dni);
    }
    dataService.logout();
    navigate(AppRoute.HOME);
  };

  if (isWinner) {
    return (
      <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto animate-in zoom-in duration-700">
         <div className="bg-sky-50 rounded-[4rem] border-4 border-sky-400 shadow-2xl overflow-hidden relative p-8 md:p-20 text-center">
            <div className="w-24 h-24 bg-sky-500 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl text-white animate-bounce shadow-2xl"><i className="fa-solid fa-crown"></i></div>
            <h1 className="text-4xl md:text-6xl font-black text-sky-900 font-outfit uppercase tracking-tighter mb-6 leading-none">{config.winnerViewTitle}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
               <div className="bg-white p-8 rounded-[3rem] shadow-xl border-2 border-sky-200">
                  <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mb-4">{config.winnerViewSub}</p>
                  <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tight mb-4">{config.rafflePrize}</h2>
                  <p className="text-sky-950 font-bold text-sm leading-relaxed italic border-t border-sky-50 pt-6 mt-4 opacity-80">"{config.winnerViewInstructions}"</p>
               </div>

               <div className="bg-stone-900 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center space-y-4">
                  <div className="bg-white p-4 rounded-3xl">
                     {/* QR Placeholder Visual */}
                     <div className="w-40 h-40 bg-stone-100 flex items-center justify-center relative overflow-hidden group">
                        <i className="fa-solid fa-qrcode text-8xl text-stone-300"></i>
                        <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 to-transparent"></div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-sky-500 animate-[scan_2s_infinite]"></div>
                     </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em] mb-1">CÓDIGO DE ACCESO</p>
                    <p className="text-white font-mono font-bold tracking-widest text-lg">DNI-{userData.dni}</p>
                  </div>
               </div>
            </div>
            
            <style>{`
              @keyframes scan {
                0% { top: 0; }
                100% { top: 100%; }
              }
            `}</style>
         </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-stone-900 font-outfit uppercase tracking-tighter leading-none">MI PANEL</h1>
          <div className="mt-4 inline-flex items-center bg-sky-50 px-4 py-2 rounded-2xl border border-sky-100">
             <i className="fa-solid fa-circle-check text-sky-500 mr-2 text-[10px]"></i>
             <span className="text-[10px] font-black uppercase tracking-widest text-sky-800">SESIÓN RECONOCIDA</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm sticky top-28 space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-sky-50 rounded-3xl mx-auto mb-4 flex items-center justify-center text-sky-400 text-3xl shadow-inner"><i className="fa-solid fa-user-check"></i></div>
              <h2 className="text-xl font-black text-stone-900 uppercase tracking-tighter">DATOS DEL USUARIO</h2>
            </div>
            <div className="space-y-6">
              <div><p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Nombre</p><p className="font-bold text-lg text-stone-800 uppercase">{userData.name}</p></div>
              <div><p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">ID (DNI)</p><p className="font-bold text-lg text-sky-600 tracking-widest">{userData.dni}</p></div>
            </div>
            <div className="p-5 bg-sky-50 rounded-[2rem] border border-sky-100">
               <p className="text-[10px] text-sky-800 font-black uppercase tracking-widest leading-relaxed mb-1">ℹ️ INFO DEL SORTEO:</p>
               <p className="text-[9px] text-sky-700 font-medium leading-relaxed italic">Tu lugar está asegurado. Una vez inscripto, participas aunque cierres la aplicación o salgas del navegador.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          {raffleState === 'banner' && (
            <div className="bg-sky-700 p-12 rounded-[4rem] text-white shadow-2xl min-h-[500px] flex flex-col justify-center animate-in zoom-in duration-500 relative overflow-hidden group">
              <i className="fa-solid fa-water absolute -right-10 -bottom-10 text-[20rem] opacity-5 group-hover:rotate-12 transition-transform duration-1000"></i>
              <div className="relative z-10">
                <span className="bg-white/10 text-sky-100 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-8 inline-block border border-white/10">Sorteo Disponible</span>
                <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-10 leading-none">{config.userPanelTitle}</h2>
                <button onClick={() => setRaffleState('form')} className="bg-white text-sky-900 px-12 py-6 rounded-full font-black text-base uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">POSTULARME AHORA</button>
              </div>
            </div>
          )}

          {raffleState === 'form' && (
            <div className="bg-white p-12 rounded-[4rem] border border-stone-200 shadow-2xl min-h-[500px] flex flex-col justify-center text-center animate-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 text-stone-900">¿CONFIRMAS PARTICIPAR?</h2>
              <p className="text-stone-500 font-medium mb-12 max-w-sm mx-auto leading-relaxed">Al confirmar, quedarás registrado permanentemente para el sorteo de hoy en el sistema de las piletas.</p>
              <button onClick={handleJoin} className="bg-sky-600 text-white py-6 px-12 rounded-full font-black text-base uppercase tracking-widest shadow-xl hover:bg-sky-700 active:scale-95 transition-all mx-auto">SÍ, CONFIRMO</button>
            </div>
          )}

          {raffleState === 'success' && (
            <div className="bg-sky-50 p-12 rounded-[4rem] border-2 border-sky-100 shadow-2xl min-h-[500px] flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-sky-600 rounded-full flex items-center justify-center mb-10 text-white text-5xl shadow-lg shadow-sky-200"><i className="fa-solid fa-check"></i></div>
              <h2 className="text-4xl font-black text-sky-900 uppercase tracking-tighter mb-6">¡ESTÁS PARTICIPANDO!</h2>
              <p className="text-sky-700 font-medium mb-12 max-w-xs mx-auto text-sm">Tu inscripción es válida hasta que se realice el sorteo. Puedes cerrar la aplicación, tu lugar ya está reservado.</p>
              <div className="w-full max-w-xs space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-sky-900"><span>Candidatos Inscriptos</span><span>{activeParticipants.length}</span></div>
                <div className="w-full h-3 bg-sky-200 rounded-full overflow-hidden border border-sky-300 shadow-inner">
                  <div className="h-full bg-sky-600 transition-all duration-1000 shadow-[0_0_15px_rgba(2,132,199,0.5)]" style={{ width: `${Math.min((activeParticipants.length / 30) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 md:p-12 shadow-2xl text-center border-4 border-sky-400 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-8 text-sky-600 text-3xl">
                <i className="fa-solid fa-right-from-bracket"></i>
              </div>
              <h3 className="text-3xl font-black text-stone-900 uppercase tracking-tighter mb-4 leading-none">GESTIÓN DE SESIÓN</h3>
              <p className="text-stone-500 font-medium text-xs mb-10 leading-relaxed italic">Selecciona cómo deseas salir del club:</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleLogout('session')} 
                  className="group w-full py-5 bg-sky-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-sky-700 transition-all flex flex-col items-center"
                >
                  <span>SALIR DE LA APP</span>
                  <span className="text-[8px] opacity-70 mt-1 font-bold">MANTENGO MI LUGAR EN EL SORTEO</span>
                </button>
                
                <button 
                  onClick={() => handleLogout('full_delete')} 
                  className="w-full py-5 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all flex flex-col items-center"
                >
                  <span>DARSE DE BAJA DEFINITIVA</span>
                  <span className="text-[8px] opacity-70 mt-1 font-bold">ELIMINAR MI REGISTRO Y SALIR DEL SORTEO</span>
                </button>
                
                <button 
                  onClick={() => setShowLogoutModal(false)} 
                  className="w-full py-4 text-stone-400 font-black text-[10px] uppercase tracking-widest hover:text-stone-600 transition-all mt-2"
                >
                  Volver al Panel
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPanel;
