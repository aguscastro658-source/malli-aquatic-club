import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';
import { dataService } from '../services/dataService';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';

const UserPanel: React.FC = () => {
  const [raffleState, setRaffleState] = useState<'banner' | 'form' | 'success'>('banner');
  const [config, setConfig] = useState<any>(null);
  const [activeParticipants, setActiveParticipants] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewingWinnerScreen, setViewingWinnerScreen] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const cfg = await dataService.getConfig();
      const user = dataService.getUserSession();

      if (!user) {
        navigate(AppRoute.LOGIN);
        return;
      }

      setConfig(cfg);
      setUserData(user);
      const participants = await dataService.getActiveParticipants();
      setActiveParticipants(participants);

      const inscripted = await dataService.isUserInscripted(user.dni);
      if (inscripted) {
        setRaffleState('success');
      } else {
        const savedLocalState = localStorage.getItem('malli_user_raffle_state');
        if (savedLocalState === 'success') {
          setRaffleState('banner');
          localStorage.removeItem('malli_user_raffle_state');
        } else if (savedLocalState) {
          setRaffleState(savedLocalState as any);
        }
      }
    } catch (err) {
      console.error("Error loading panel:", err);
    } finally {
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [navigate]);

  useEffect(() => {
    load();
    const configInterval = setInterval(() => load(), 10000);

    window.addEventListener('malli_app_config_updated', () => load());
    window.addEventListener('malli_logout_request', () => setShowLogoutModal(true));

    return () => {
      clearInterval(configInterval);
      window.removeEventListener('malli_app_config_updated', () => load());
    };
  }, [load]);

  // Success Effect (Confetti when winning detected)
  useEffect(() => {
    if (config?.winner?.dni === userData?.dni) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [config?.winner?.dni, userData?.dni]);

  useEffect(() => {
    if (!userData) return;
    dataService.updateHeartbeat(userData.dni);
    const heartbeat = setInterval(() => dataService.updateHeartbeat(userData.dni), 20000);
    return () => clearInterval(heartbeat);
  }, [userData]);

  if (!userData || !config) return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const isWinner = config.winner?.dni === userData.dni;
  const isParticipating = raffleState === 'success';

  const handleJoin = async () => {
    try {
      await dataService.joinRaffle(userData);
      localStorage.setItem('malli_user_raffle_state', 'success');
      setRaffleState('success');

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#ffffff', '#7dd3fc']
      });
      load();
    } catch (err) {
      alert("Hubo un error al unirte. Intenta de nuevo.");
    }
  };

  const handleLogout = async (mode: 'session' | 'full_delete') => {
    if (mode === 'full_delete') {
      await dataService.unregisterUser(userData.dni);
    }
    dataService.logout();
    navigate(AppRoute.HOME);
  };

  if (isWinner && viewingWinnerScreen) {
    return (
      <div className="min-h-screen bg-stone-950 pt-16 pb-12 px-4 flex items-center justify-center overflow-x-hidden">
        <div className="max-w-3xl w-full bg-sky-50 rounded-[3rem] md:rounded-[4rem] border-4 md:border-8 border-sky-400 shadow-[0_0_100px_rgba(56,189,248,0.3)] overflow-hidden relative p-8 md:p-12 lg:p-16 text-center animate-in zoom-in duration-700">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-400 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-600 rounded-full blur-[100px] animate-pulse"></div>
          </div>

          <div className="w-20 h-20 md:w-24 md:h-24 bg-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 text-3xl md:text-5xl text-white animate-bounce shadow-[0_20px_50px_rgba(2,132,199,0.4)]">
            <i className="fa-solid fa-crown"></i>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-sky-900 font-outfit uppercase tracking-tighter mb-4 md:mb-6 leading-none drop-shadow-sm">
            {config.winnerViewTitle}
          </h1>

          <div className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-white mb-8 md:mb-10 transform hover:scale-[1.01] transition-transform">
            <span className="text-sky-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-2 md:mb-3 block underline decoration-sky-200 underline-offset-4">{config.winnerViewSub}</span>
            <h2 className="text-xl md:text-3xl font-black text-stone-900 uppercase tracking-tight mb-4">{config.rafflePrize}</h2>
            <div className="h-px bg-sky-100 w-16 md:w-20 mx-auto mb-4 scale-x-110"></div>
            <p className="text-sky-900 font-bold text-sm md:text-base leading-relaxed italic opacity-90 max-w-xl mx-auto">
              "{config.winnerViewInstructions}"
            </p>
          </div>

          <div className="bg-stone-950 p-8 md:p-10 rounded-[3.5rem] md:rounded-[4rem] shadow-3xl inline-flex flex-col items-center space-y-4 md:space-y-6 max-w-full">
            <div className="bg-white p-4 md:p-5 rounded-[2rem] shadow-inner relative">
              <div className="w-28 h-28 md:w-40 md:h-40 bg-stone-50 flex items-center justify-center relative overflow-hidden">
                <i className="fa-solid fa-qrcode text-6xl md:text-8xl text-stone-200 opacity-50"></i>
                <div className="absolute top-0 left-0 w-full h-1 bg-sky-500 animate-[scan_2.5s_infinite] shadow-[0_0_10px_#0ea5e9]"></div>
              </div>
            </div>
            <div className="px-4">
              <p className="text-[9px] md:text-[10px] font-black text-sky-400 uppercase tracking-[0.4em] mb-1 text-center">GANADOR VALIDADO</p>
              <p className="text-white font-mono font-black tracking-widest text-lg md:text-2xl uppercase mb-1 text-center truncate max-w-[250px] md:max-w-none">{userData.name}</p>
              <p className="text-sky-300 font-mono font-bold tracking-[0.2em] text-xs md:text-base leading-none text-center italic">DNI: {userData.dni}</p>
            </div>
          </div>

          <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setViewingWinnerScreen(false)}
              className="w-full md:w-auto px-10 py-5 bg-white text-sky-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-50 transition-all shadow-xl flex items-center justify-center gap-3 border border-sky-100"
            >
              <i className="fa-solid fa-circle-arrow-left"></i>
              Regresar al Panel
            </button>
            <p className="text-sky-900/40 text-[9px] font-black uppercase tracking-widest hidden md:block">•</p>
            <p className="text-sky-900/60 text-[9px] font-black uppercase tracking-widest italic">Ticket Individual de Usuario</p>
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
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Winner Banner Persistent Notification */}
        {isWinner && (
          <div className="p-5 md:p-6 bg-gradient-to-r from-sky-600 to-sky-500 rounded-3xl shadow-xl shadow-sky-200 border-2 border-white flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-500 group">
            <div className="flex items-center gap-4 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-crown text-white"></i>
              </div>
              <div className="text-center md:text-left">
                <h3 className="font-black text-base md:text-lg uppercase tracking-tight leading-none">¡YA ERES GANADOR!</h3>
                <p className="text-[9px] uppercase font-black tracking-widest opacity-80 mt-1">Pulsa para ver tu ticket de acceso</p>
              </div>
            </div>
            <button
              onClick={() => setViewingWinnerScreen(true)}
              className="w-full md:w-auto bg-white text-sky-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-50 hover:shadow-inner transition-all shadow-lg active:scale-95"
            >
              Ver Mi Ticket Premium
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-top duration-700">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-stone-900 text-white text-[9px] md:text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-sm">SISTEMA MALLI</span>
              <div className="flex items-center bg-white border border-stone-200 px-3 py-1.5 rounded-full shadow-xs">
                <div className={`w-2 h-2 rounded-full mr-2 ${isParticipating ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[8px] md:text-[9px] font-black uppercase text-stone-600 tracking-widest">
                  {isParticipating ? 'PARTICIPANDO' : 'NO PARTICIPANDO'}
                </span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-stone-900 font-outfit uppercase tracking-tighter leading-none">
              HOLA, <span className="text-sky-600">{userData.name.split(' ')[0]}</span>
            </h1>
          </div>

          <button
            onClick={() => load(true)}
            disabled={isRefreshing}
            className="flex items-center self-start md:self-center gap-3 bg-white border border-stone-100 px-6 py-4 rounded-3xl hover:bg-stone-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 group"
          >
            <i className={`fa-solid fa-rotate ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}></i>
            {isRefreshing ? 'Sincronizando...' : 'Actualizar Estado'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
          {/* User Info Card */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-stone-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] relative overflow-hidden">
              <i className="fa-solid fa-user-check absolute -right-6 -bottom-6 text-9xl text-stone-50/50"></i>

              <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 text-2xl shadow-inner">
                  <i className="fa-solid fa-fingerprint"></i>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Nombre Registrado</p>
                    <p className="text-lg md:text-xl font-black text-stone-900 uppercase leading-tight">{userData.name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Documento DNI</p>
                    <p className="text-lg md:text-xl font-black text-sky-600 tracking-[0.15em]">{userData.dni}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-50">
                  <p className="text-[9px] md:text-[10px] text-stone-400 font-bold leading-relaxed italic uppercase tracking-wider">
                    Estado: {isParticipating ? 'Candidato Confirmado' : 'Sin Inscripción de Hoy'}
                  </p>
                </div>
              </div>
            </div>


          </div>

          {/* Main Action Area */}
          <div className="lg:col-span-8">
            <div className="h-full min-h-[400px] md:min-h-[500px]">
              {raffleState === 'banner' && (
                <div className="h-full bg-stone-900 p-10 md:p-16 rounded-[4rem] text-white shadow-2xl flex flex-col justify-center animate-in zoom-in duration-700 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-sky-600 opacity-10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                  <i className="fa-solid fa-ticket-simple absolute -right-12 -bottom-12 text-[15rem] md:text-[20rem] opacity-5 group-hover:rotate-12 transition-transform duration-1000"></i>

                  <div className="relative z-10 max-w-lg">
                    <span className="bg-sky-600/20 text-sky-400 px-5 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-8 inline-block border border-sky-400/20">
                      DISPONIBLE HOY
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter mb-6 leading-none">
                      {config.userPanelTitle || 'SOLICITAR PASE LIBRE'}
                    </h2>
                    <p className="text-stone-400 text-sm md:text-lg font-medium mb-10 opacity-90 leading-relaxed italic">
                      Participar es gratis como usuario del club. Solo presiona el botón y ya estás dentro.
                    </p>
                    <button
                      onClick={() => setRaffleState('form')}
                      className="bg-white text-stone-900 px-10 md:px-14 py-5 md:py-6 rounded-full font-black text-sm md:text-lg uppercase tracking-widest shadow-xl hover:bg-sky-50 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-4 group/btn"
                    >
                      INSCRIBIRME
                      <i className="fa-solid fa-chevron-right text-xs md:text-sm group-hover/btn:translate-x-1 transition-transform"></i>
                    </button>
                  </div>
                </div>
              )}

              {raffleState === 'form' && (
                <div className="h-full bg-white p-10 md:p-16 rounded-[4rem] border border-stone-100 shadow-xl flex flex-col justify-center text-center animate-in slide-in-from-right duration-500 relative">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-sky-600 rounded-t-[4rem]"></div>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-sky-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner rotate-3">
                    <i className="fa-solid fa-user-plus text-sky-500 text-2xl md:text-3xl"></i>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-stone-900 leading-none font-outfit">CONFIRMACIÓN</h2>
                  <p className="text-stone-400 text-sm md:text-lg font-medium mb-12 max-w-sm mx-auto leading-relaxed">
                    ¿Deseas ingresar a la base de candidatos para el próximo sorteo?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={handleJoin}
                      className="w-full sm:w-auto bg-stone-900 text-white py-5 md:py-6 px-12 md:px-16 rounded-[2rem] font-black text-xs md:text-lg uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all"
                    >
                      SÍ, ENTRAR
                    </button>
                    <button
                      onClick={() => setRaffleState('banner')}
                      className="w-full sm:w-auto bg-stone-50 text-stone-400 py-4 md:py-5 px-8 md:px-10 rounded-[2rem] font-black text-[10px] md:text-sm uppercase tracking-widest hover:text-stone-600 transition-all"
                    >
                      Volver
                    </button>
                  </div>
                </div>
              )}

              {raffleState === 'success' && (
                <div className="h-full bg-white p-8 md:p-12 rounded-[4rem] border border-stone-100 shadow-[0_30px_80px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center animate-in zoom-in duration-700">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8 md:mb-10">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl md:text-4xl shadow-lg animate-bounce">
                      <i className="fa-solid fa-check"></i>
                    </div>

                    <div className="bg-stone-950 p-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center space-y-3 transform hover:scale-105 transition-transform duration-500">
                      <div className="bg-white p-3 rounded-[1.5rem] shadow-inner relative">
                        <div className="w-32 h-32 bg-white flex items-center justify-center relative overflow-hidden">
                          <QRCodeSVG
                            value={JSON.stringify({ dni: userData.dni, type: 'registration_verify' })}
                            size={128}
                            level="H"
                            includeMargin={false}
                          />
                          <div className="absolute top-0 left-0 w-full h-1 bg-sky-500 animate-[scan_2.5s_infinite] shadow-[0_0_10px_#0ea5e9] opacity-30"></div>
                        </div>
                      </div>
                      <p className="text-[8px] font-black text-sky-400 uppercase tracking-[0.3em]">CÓDIGO DE ACCESO</p>
                    </div>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-black text-stone-900 uppercase tracking-tighter mb-4 leading-none font-outfit">
                    INSCRIPCIÓN <br className="hidden md:block" /> CONFIRMADA
                  </h2>
                  <p className="text-stone-400 text-xs md:text-sm font-bold mb-8 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
                    Muestra este código al administrador para validar tu presencia física en el complejo.
                  </p>

                  <div className="w-full max-w-xs bg-stone-50 p-5 md:p-6 rounded-[2rem] border border-stone-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">PARTICIPANTES</p>
                        <p className="text-xl md:text-2xl font-black text-sky-600">{activeParticipants.length}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        VIRTUAL
                      </div>
                    </div>

                    <div className="relative pt-1">
                      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all duration-[3000ms]"
                          style={{ width: `${Math.min((activeParticipants.length / 30) * 100, 100)}%` }}
                        ></div>
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Session Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 text-center">
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md" onClick={() => setShowLogoutModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[4rem] p-10 md:p-14 shadow-3xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-stone-50 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-stone-400 text-2xl md:text-3xl shadow-inner transform -rotate-12 group-hover:rotate-0 transition-transform">
              <i className="fa-solid fa-user-gear"></i>
            </div>
            <h3 className="text-3xl font-black text-stone-900 uppercase tracking-tighter mb-4 leading-none font-outfit">OPCIONES</h3>
            <p className="text-stone-400 font-medium text-xs md:text-sm mb-10 md:mb-12">Gestiona tu estancia en el club:</p>

            <div className="space-y-4">
              <button
                onClick={() => handleLogout('session')}
                className="group w-full p-6 bg-stone-50 border border-stone-100 rounded-[2.5rem] hover:border-sky-500 hover:bg-sky-50 transition-all flex items-center justify-between text-left"
              >
                <div>
                  <span className="block font-black text-stone-800 text-[10px] md:text-xs uppercase tracking-widest mb-1 group-hover:text-sky-900">Solo Salir</span>
                  <span className="text-[9px] md:text-[10px] text-stone-400 font-medium italic">Vuelve pronto sin perder tu cupo.</span>
                </div>
                <i className="fa-solid fa-chevron-right text-stone-200 group-hover:text-sky-500 group-hover:translate-x-1 transition-all"></i>
              </button>

              <button
                onClick={() => handleLogout('full_delete')}
                className="group w-full p-6 bg-red-50/30 border border-transparent rounded-[2.5rem] hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-between text-left"
              >
                <div>
                  <span className="block font-black text-red-600 text-[10px] md:text-xs uppercase tracking-widest mb-1">Baja Definitiva</span>
                  <span className="text-[9px] md:text-[10px] text-red-400 font-medium italic">Borrar cuenta y salir del sorteo.</span>
                </div>
                <i className="fa-solid fa-user-minus text-red-200 group-hover:text-red-500 transition-all"></i>
              </button>

              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-4 text-stone-400 font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] hover:text-stone-800 transition-all mt-4"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPanel;
