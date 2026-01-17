
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';
import { dataService } from '../services/dataService';

const Login: React.FC = () => {
  const [dni, setDni] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'dni' | 'name'>('dni');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDniSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDni = dni.trim().replace(/\D/g, '');
    
    if (cleanDni.length !== 8) {
      setError('El DNI debe tener 8 números exactos.');
      return;
    }

    const existingUser = dataService.getUserByDni(cleanDni);
    if (existingUser) {
      dataService.setUserSession(existingUser);
      navigate(AppRoute.USER_PANEL);
    } else {
      setStep('name');
      setError('');
    }
  };

  const handleFullRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError('Por favor, ingresa tu nombre completo.');
      return;
    }
    const newUser = dataService.registerUser(name, dni);
    dataService.setUserSession(newUser);
    navigate(AppRoute.USER_PANEL);
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4 bg-sky-50">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 border border-sky-100 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-sky-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
            <i className="fa-solid fa-id-card text-white text-4xl"></i>
          </div>
          <h2 className="text-3xl font-black text-sky-900 font-outfit uppercase tracking-tighter">Acceso de Usuarios</h2>
          <p className="text-stone-400 mt-2 font-medium text-sm">Tu DNI es tu llave al club</p>
        </div>

        {step === 'dni' ? (
          <form onSubmit={handleDniSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-stone-500 mb-2 uppercase tracking-[0.2em]">DNI (8 dígitos)</label>
              <input 
                type="tel" 
                maxLength={8}
                required
                value={dni}
                onChange={(e) => { setDni(e.target.value.replace(/\D/g, '')); setError(''); }}
                className="w-full px-6 py-5 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-sky-500 outline-none transition-all font-black text-2xl tracking-[0.2em] text-center"
                placeholder="00000000"
              />
              {error && <p className="text-red-500 text-[10px] font-black mt-2 uppercase text-center">{error}</p>}
            </div>
            <button type="submit" className="w-full py-5 bg-sky-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-sky-700 transition-all active:scale-95 uppercase tracking-widest">
              CONTINUAR
            </button>
          </form>
        ) : (
          <form onSubmit={handleFullRegister} className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="bg-sky-50 p-4 rounded-2xl mb-4 text-center border border-sky-100">
               <p className="text-[10px] font-black text-sky-600 uppercase">DNI: {dni}</p>
               <p className="text-[11px] font-bold text-sky-900 mt-1">¡Eres nuevo! Completa tu registro:</p>
            </div>
            <div>
              <label className="block text-[10px] font-black text-stone-500 mb-2 uppercase tracking-[0.2em]">Nombre Completo</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-5 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-sky-500 outline-none transition-all font-bold text-lg"
                placeholder="Ej. Maria Garcia"
              />
            </div>
            <button type="submit" className="w-full py-5 bg-sky-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-sky-700 transition-all active:scale-95 uppercase tracking-widest">
              REGISTRAR Y ENTRAR
            </button>
            <button type="button" onClick={() => setStep('dni')} className="w-full text-[10px] font-black text-stone-400 uppercase tracking-widest">Volver</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
