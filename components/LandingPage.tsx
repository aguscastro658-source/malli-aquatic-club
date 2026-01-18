import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

const DEFAULT_CONFIG = {
  promoTitle: "SORTEO DIARIO DE PASES LIBRES",
  promoImage: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=2000",
  raffleRules: "1. Ser usuario registrado.\n2. Sorteo automático al llegar a 15 usuarios o a las 22:00 hs para el día siguiente.\n3. El ganador presenta su DNI en puerta para el pase gratis.",
  card1Title: "Piletas",
  card1Desc: "Círculos olímpicas. Piletas abiertas.",
  card2Title: "Sorteo",
  card2Desc: "Sorteo automático al llegar a 15 participantes.",
  card3Title: "DNI",
  card3Desc: "El ganador solo muestra el DNI para el pase gratis."
};

const LandingPage: React.FC = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showRules, setShowRules] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);

    const loadConfig = async () => {
      const savedConfig = await dataService.getConfig();
      setConfig(prev => ({ ...prev, ...savedConfig }));
    };

    loadConfig();
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen pt-20 bg-[#f8fafc] flex flex-col overflow-x-hidden">
      <section className="px-4 py-8 md:py-16 max-w-6xl mx-auto w-full space-y-12 md:space-y-16">

        {/* Hero Section with Glassmorphism */}
        <div className="relative h-[450px] md:h-[550px] w-full rounded-[3.5rem] md:rounded-[4.5rem] overflow-hidden shadow-[0_40px_100px_rgba(2,132,199,0.1)] animate-in zoom-in duration-1000">
          <img src={config.promoImage} alt="Piletas MALLI" className="absolute inset-0 w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-[3s]" />
          <div className="absolute inset-0 bg-gradient-to-t from-sky-950/90 via-sky-950/20 to-transparent"></div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="bg-white/10 backdrop-blur-xl text-white px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-8 border border-white/20 shadow-2xl">
              {currentDateTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} • {currentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-10 max-w-4xl drop-shadow-2xl font-outfit">
              {config.promoTitle}
            </h1>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowRules(true)}
                className="group bg-white text-sky-950 px-10 py-5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] shadow-3xl hover:bg-sky-50 transition-all flex items-center gap-3 active:scale-95"
              >
                Reglas del Club
                <i className="fa-solid fa-chevron-right group-hover:translate-x-1 transition-transform"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards with Premium Styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 animate-in slide-in-from-bottom duration-1000 delay-300">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-10 md:p-12 rounded-[3.5rem] border border-stone-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] group hover:bg-sky-600 hover:shadow-sky-500/20 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-sky-50 rounded-full opacity-50 group-hover:opacity-10 group-hover:scale-150 transition-all duration-700"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-sky-50 rounded-[1.5rem] flex items-center justify-center mb-8 md:mb-10 group-hover:bg-white/20 transition-all group-hover:rotate-6 shadow-inner">
                  <i className={`fa-solid ${i === 1 ? 'fa-person-swimming' : i === 2 ? 'fa-ticket' : 'fa-id-card'} text-2xl md:text-3xl text-sky-600 group-hover:text-white`}></i>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-stone-900 uppercase tracking-tighter mb-4 group-hover:text-white transition-colors leading-none font-outfit">
                  {config[`card${i}Title` as keyof typeof config] as string}
                </h3>
                <p className="text-stone-500 text-sm md:text-base font-medium leading-relaxed group-hover:text-sky-50 transition-colors">
                  {config[`card${i}Desc` as keyof typeof config] as string}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section Optimized for Desktop */}
        <div className="bg-stone-900 rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-600 opacity-10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6 md:mb-8 leading-none font-outfit">
              ¿AÚN NO ERES SOCIO?
            </h2>
            <p className="text-stone-400 text-sm md:text-lg font-medium mb-10 md:mb-12 italic opacity-80">
              Inscríbete en segundos con tu DNI y empieza a participar de los sorteos y beneficios especiales del club.
            </p>
            <a
              href="#/login"
              className="inline-block bg-sky-600 text-white px-12 py-5 md:py-6 rounded-full text-sm md:text-base font-black uppercase tracking-widest hover:bg-sky-500 shadow-2xl shadow-sky-900/40 transition-all active:scale-95"
            >
              UNIKRME AL CLUB
            </a>
          </div>
        </div>
      </section>

      {/* Optimized Modal for Rules */}
      {showRules && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md" onClick={() => setShowRules(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-[3rem] md:rounded-[4rem] shadow-3xl overflow-hidden animate-in zoom-in duration-500">
            <div className="bg-sky-600 p-10 md:p-12 text-white relative">
              <button onClick={() => setShowRules(false)} className="absolute top-8 right-8 text-xl hover:scale-110 transition-transform"><i className="fa-solid fa-xmark"></i></button>
              <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none font-outfit">Reglas del Club</h3>
            </div>
            <div className="p-10 md:p-14">
              <div className="bg-stone-50 p-8 md:p-10 rounded-[2.5rem] border border-stone-200 shadow-inner">
                <p className="text-stone-600 font-bold text-base md:text-lg leading-relaxed whitespace-pre-wrap italic">
                  "{config.raffleRules}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
