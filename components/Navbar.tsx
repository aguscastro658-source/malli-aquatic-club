
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';
import { dataService } from '../services/dataService';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [isSuperAuth, setIsSuperAuth] = useState(false);
  const [isUserAuth, setIsUserAuth] = useState(false);
  
  const isPanelPage = location.pathname === AppRoute.USER_PANEL || 
                     location.pathname === AppRoute.ADMIN || 
                     location.pathname === AppRoute.SUPER_ADMIN;

  const checkAuth = () => {
    setIsAdminAuth(dataService.isAdmin());
    setIsSuperAuth(dataService.isSuperAdmin());
    setIsUserAuth(dataService.getUserSession() !== null);
  };

  useEffect(() => {
    checkAuth();
    const handleCheck = () => checkAuth();
    window.addEventListener('malli_auth_changed', handleCheck);
    window.addEventListener('storage', handleCheck);
    
    return () => {
      window.removeEventListener('malli_auth_changed', handleCheck);
      window.removeEventListener('storage', handleCheck);
    };
  }, [location]);

  const handleLogoutClick = () => {
    if (isAdminAuth || isSuperAuth) {
      // Maria o Damian salen directamente y van al Inicio
      dataService.logout();
      navigate(AppRoute.HOME);
    } else {
      // Los usuarios ven el modal de confirmación
      window.dispatchEvent(new CustomEvent('malli_logout_request'));
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-sky-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-2">
            <Link to={AppRoute.HOME} className="flex items-center space-x-2 group">
              <div className="w-11 h-11 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6">
                <i className="fa-solid fa-water text-white text-xl"></i>
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-xl font-black font-outfit tracking-tighter text-sky-900 uppercase">
                  MALLI
                </span>
                <span className="text-[9px] font-bold text-sky-400 tracking-[0.2em] uppercase">
                  AQUATIC CLUB
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {isPanelPage ? (
              <>
                <Link 
                  to={AppRoute.HOME} 
                  className="hidden md:flex items-center space-x-2 px-5 py-2.5 bg-stone-100 text-stone-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-stone-200 transition-all active:scale-95"
                >
                  <i className="fa-solid fa-house"></i>
                  <span>Inicio</span>
                </Link>
                <button 
                  onClick={handleLogoutClick}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-100 transition-all active:scale-95 border border-red-100"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span>Salir</span>
                </button>
              </>
            ) : (
              <>
                {isUserAuth && (
                  <Link 
                    to={AppRoute.USER_PANEL} 
                    className="flex items-center space-x-2 px-5 py-2.5 bg-sky-100 text-sky-800 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-sky-200 transition-all active:scale-95 border border-sky-200"
                  >
                    <i className="fa-solid fa-circle-user"></i>
                    <span>Mi Panel</span>
                  </Link>
                )}

                {(isAdminAuth || isSuperAuth) ? (
                  <Link 
                    to={isSuperAuth ? AppRoute.SUPER_ADMIN : AppRoute.ADMIN} 
                    className="flex items-center space-x-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-black transition-all active:scale-95"
                  >
                    <i className="fa-solid fa-screwdriver-wrench"></i>
                    <span>Panel {isSuperAuth ? 'Damian' : 'Maria'}</span>
                  </Link>
                ) : (
                  <>
                    {!isUserAuth && (
                      <Link 
                        to={AppRoute.LOGIN} 
                        className="flex items-center space-x-2 px-5 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-sky-100 hover:bg-sky-700 transition-all active:scale-95"
                      >
                        <i className="fa-solid fa-user"></i>
                        <span>Ingresar</span>
                      </Link>
                    )}
                    <Link 
                      to={AppRoute.ADMIN} 
                      className="hidden md:flex items-center space-x-2 px-4 py-2.5 text-stone-400 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-stone-100 transition-all"
                    >
                      <i className="fa-solid fa-lock"></i>
                      <span>Admin</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
