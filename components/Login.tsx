import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';
import { dataService } from '../services/dataService';

const Login: React.FC = () => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'dni' | 'name'>('dni');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDni = dni.trim().replace(/\D/g, '');

    if (cleanDni.length !== 8) {
      setError('El DNI debe tener 8 números exactos.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (showPassword) {
        const user = await dataService.loginWithDni(cleanDni, password);
        if (user) {
          dataService.setUserSession(user);
          navigate(AppRoute.USER_PANEL);
        } else {
          setError('Clave incorrecta.');
        }
        return;
      }

      const autoUser = await dataService.loginWithDni(cleanDni, cleanDni);
      if (autoUser) {
        dataService.setUserSession(autoUser);
        navigate(AppRoute.USER_PANEL);
        return;
      }

      const userExists = await dataService.getUserByDni(cleanDni);
      if (userExists) {
        setShowPassword(true);
        setError('Este DNI requiere una clave especial.');
      } else {
        setStep('name');
      }
    } catch (err) {
      setError('Error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError('Por favor, ingresa tu nombre completo.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const regPassword = password || dni;
      const newUser = await dataService.registerUser(name, dni, regPassword);
      dataService.setUserSession(newUser);
      navigate(AppRoute.USER_PANEL);
    } catch (err: any) {
      setError('Error al registrar usuario: ' + (err.message || 'Error de conexión'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4 bg-[#f8fafc] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-sky-100 rounded-full blur-[100px] -z-10 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-50 rounded-full blur-[100px] -z-10 opacity-30"></div>

      <div className="max-w-lg w-full bg-white rounded-[3.5rem] shadow-[0_40px_100px_rgba(2,132,199,0.08)] p-10 md:p-14 border border-white/50 relative overflow-hidden animate-in zoom-in duration-700">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-sky-600"></div>

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-sky-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-sky-100">
            <i className="fa-solid fa-id-card text-white text-3xl"></i>
          </div>
          <h2 className="text-3xl font-black text-stone-900 font-outfit uppercase tracking-tighter mb-2">ACCESO USUARIOS</h2>
          <p className="text-stone-400 font-bold text-xs uppercase tracking-widest italic">Bienvenido al club</p>
        </div>

        {step === 'dni' ? (
          <form onSubmit={handleDniSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-stone-400 mb-2 uppercase tracking-[0.3em] text-center">NÚMERO DE DNI</label>
              <input
                type="tel"
                maxLength={8}
                required
                disabled={showPassword}
                value={dni}
                onChange={(e) => { setDni(e.target.value.replace(/\D/g, '')); setError(''); }}
                className={`w-full px-8 py-5 bg-stone-50 border-2 border-stone-100 rounded-[2rem] focus:border-sky-500 focus:bg-white outline-none transition-all font-black text-2xl md:text-3xl tracking-[0.2em] text-center text-stone-900 ${showPassword ? 'opacity-40 select-none' : 'shadow-inner'}`}
                placeholder="00000000"
              />
            </div>

            {showPassword && (
              <div className="animate-in slide-in-from-top-4 duration-500 space-y-3">
                <label className="block text-[10px] font-black text-sky-600 mb-2 uppercase tracking-[0.3em] text-center">CLAVE REQUERIDA</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full px-8 py-5 bg-sky-50 border-2 border-sky-200 rounded-[2rem] focus:border-sky-500 focus:bg-white outline-none transition-all font-black text-2xl md:text-3xl tracking-[0.4em] text-center text-sky-900 shadow-lg"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <div className="text-red-500 text-center animate-in fade-in duration-300">
                <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-6 bg-stone-950 text-white rounded-[2rem] font-black text-base md:text-lg shadow-2xl hover:bg-black active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {isLoading ? 'VERIFICANDO...' : 'ENTRAR'}
              </button>

              {showPassword && (
                <button
                  type="button"
                  onClick={() => { setShowPassword(false); setPassword(''); setError(''); }}
                  className="w-full mt-6 text-[10px] font-black text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors"
                >
                  Cambiar DNI
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleFullRegister} className="space-y-8 animate-in slide-in-from-right duration-500">
            <div className="bg-sky-50 p-6 rounded-[2.5rem] border border-sky-100 text-center">
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">DNI {dni}</p>
              <p className="text-base font-bold text-sky-900 leading-tight">¡Eres nuevo! Completa tu ficha</p>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-stone-400 mb-2 uppercase tracking-[0.3em] text-center">ESTÁNDAR DE NOMBRE</label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-8 py-5 bg-stone-50 border-2 border-stone-100 rounded-[2rem] focus:border-sky-500 focus:bg-white outline-none transition-all font-bold text-xl text-center text-stone-900"
                placeholder="Maria Garcia"
              />
            </div>

            {error && (
              <div className="text-red-500 text-center animate-in fade-in duration-300">
                <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
              </div>
            )}

            <div className="pt-2 space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-6 bg-sky-600 text-white rounded-[2rem] font-black text-base md:text-lg shadow-xl hover:bg-sky-700 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {isLoading ? 'REGISTRANDO...' : 'REGISTRARME'}
              </button>
              <button
                type="button"
                onClick={() => setStep('dni')}
                className="w-full text-[10px] font-black text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors"
              >
                Volver
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
