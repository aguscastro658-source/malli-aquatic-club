
import React, { useState, useEffect } from 'react';

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
    const savedConfig = localStorage.getItem('malli_app_config');
    if (savedConfig) {
      try { setConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) })); } catch (e) {}
    }
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen pt-20 bg-[#f0f9ff] flex flex-col">
      <section className="px-4 py-8 md:py-16 max-w-7xl mx-auto w-full space-y-12">
        
        {/* Banner */}
        <div className="relative h-[450px] md:h-[550px] w-full rounded-[3.5rem] md:rounded-[4.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-1000">
          <img src={config.promoImage} alt="Piletas MALLI" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-sky-950/80 via-transparent to-transparent"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <span className="bg-sky-500/30 backdrop-blur-md text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-white/20">
              {currentDateTime.toLocaleDateString()} {currentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-10 max-w-4xl drop-shadow-2xl">
              {config.promoTitle}
            </h2>
            <button onClick={() => setShowRules(true)} className="bg-white text-sky-950 px-12 py-5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
              REGLAS DEL CLUB
            </button>
          </div>
        </div>

        {/* Triple Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-1000 delay-300">
           {[1, 2, 3].map(i => (
             <div key={i} className="bg-white p-8 rounded-[3rem] border border-sky-100 shadow-xl shadow-sky-500/5 group hover:bg-sky-600 transition-all duration-500">
                <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                   <i className={`fa-solid ${i === 1 ? 'fa-person-swimming' : i === 2 ? 'fa-ticket' : 'fa-id-card'} text-2xl text-sky-600 group-hover:text-white`}></i>
                </div>
                <h3 className="text-2xl font-black text-sky-900 uppercase tracking-tighter mb-2 group-hover:text-white transition-colors">
                  {config[`card${i}Title` as keyof typeof config] as string}
                </h3>
                <p className="text-stone-500 text-sm font-medium leading-relaxed group-hover:text-sky-100 transition-colors">
                  {config[`card${i}Desc` as keyof typeof config] as string}
                </p>
             </div>
           ))}
        </div>
      </section>

      {showRules && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-sky-950/80 backdrop-blur-sm" onClick={() => setShowRules(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="bg-sky-600 p-8 text-white relative">
              <button onClick={() => setShowRules(false)} className="absolute top-8 right-8 text-xl"><i className="fa-solid fa-xmark"></i></button>
              <h3 className="text-3xl font-black uppercase tracking-tighter">Reglas del Sorteo</h3>
            </div>
            <div className="p-10">
               <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200">
                 <p className="text-stone-600 font-medium leading-relaxed whitespace-pre-wrap">{config.raffleRules}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
