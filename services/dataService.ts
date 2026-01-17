
import { AppRoute } from "../types";

const DEFAULT_CONFIG = {
  promoTitle: "SORTEO DIARIO DE PASES LIBRES",
  promoImage: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=2000",
  rafflePrize: "PASE LIBRE TOTAL",
  raffleRules: "1. Ser usuario registrado.\n2. El sorteo se realiza entre todos los usuarios inscriptos.\n3. El ganador presenta su DNI en puerta.\n4. No es obligatorio mantener la app abierta para ganar.",
  userPanelTitle: "¡PARTICIPA POR TU PASE!",
  winnerViewTitle: "¡FELICIDADES!",
  winnerViewSub: "TU DNI ES TU PASE",
  winnerViewInstructions: "Preséntate en la entrada de las piletas con tu DNI físico para validar tu premio.",
  appStatus: 'active',
  adminAccessEnabled: true,
  lastSync: null,
  autoBackup: true,
  card1Title: "Piletas",
  card1Desc: "Círculos olímpicas. Piletas abiertas.",
  card2Title: "Sorteo",
  card2Desc: "Sorteo automático entre usuarios inscriptos.",
  card3Title: "DNI",
  card3Desc: "El ganador solo muestra el DNI para el pase gratis."
};

const KEYS = {
  CONFIG: 'malli_app_config',
  USERS: 'malli_registered_users',
  ACTIVE: 'malli_active_raffle',
  DEPARTURES: 'malli_user_departures',
  USER_SESSION: 'malli_user_session',
  ADMIN_AUTH: 'malli_admin_auth',
  SUPER_AUTH: 'malli_super_admin_auth'
};

export const dataService = {
  getConfig: () => {
    const saved = localStorage.getItem(KEYS.CONFIG);
    if (!saved) {
      localStorage.setItem(KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      return DEFAULT_CONFIG;
    }
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      localStorage.setItem(KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      return DEFAULT_CONFIG;
    }
  },

  saveConfig: (config: any) => {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('malli_app_config_updated'));
  },

  getUserByDni: (dni: string) => {
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    return users.find((u: any) => u.dni === dni);
  },

  registerUser: (name: string, dni: string) => {
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const newUser = {
      name,
      dni,
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().getTime()
    };
    if (!users.some((u: any) => u.dni === dni)) {
      users.push(newUser);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
    return newUser;
  },

  unregisterUser: (dni: string) => {
    const user = dataService.getUserByDni(dni);
    if (user) {
      const departures = JSON.parse(localStorage.getItem(KEYS.DEPARTURES) || '[]');
      departures.unshift({ ...user, leftAt: new Date().toLocaleString() });
      localStorage.setItem(KEYS.DEPARTURES, JSON.stringify(departures.slice(0, 10)));
    }
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const newUsers = users.filter((u: any) => u.dni !== dni);
    localStorage.setItem(KEYS.USERS, JSON.stringify(newUsers));
    dataService.leaveRaffle(dni);
    window.dispatchEvent(new CustomEvent('malli_app_config_updated'));
  },

  updateHeartbeat: (dni: string) => {
    const active = JSON.parse(localStorage.getItem(KEYS.ACTIVE) || '[]');
    const now = new Date().getTime();
    const index = active.findIndex((p: any) => p.dni === dni);
    if (index !== -1) {
      active[index].lastSeen = now;
      localStorage.setItem(KEYS.ACTIVE, JSON.stringify(active));
    }
  },

  joinRaffle: (user: { name: string, dni: string }) => {
    const active = JSON.parse(localStorage.getItem(KEYS.ACTIVE) || '[]');
    if (!active.some((p: any) => p.dni === user.dni)) {
      const newList = [...active, { ...user, lastSeen: new Date().getTime(), inscriptedAt: new Date().toISOString() }];
      localStorage.setItem(KEYS.ACTIVE, JSON.stringify(newList));
      window.dispatchEvent(new CustomEvent('malli_app_config_updated'));
    }
  },

  leaveRaffle: (dni: string) => {
    const active = JSON.parse(localStorage.getItem(KEYS.ACTIVE) || '[]');
    const newList = active.filter((p: any) => p.dni !== dni);
    localStorage.setItem(KEYS.ACTIVE, JSON.stringify(newList));
    window.dispatchEvent(new CustomEvent('malli_app_config_updated'));
  },

  getActiveParticipants: () => {
    return JSON.parse(localStorage.getItem(KEYS.ACTIVE) || '[]');
  },

  getDepartures: () => {
    return JSON.parse(localStorage.getItem(KEYS.DEPARTURES) || '[]');
  },

  isUserInscripted: (dni: string) => {
    const active = JSON.parse(localStorage.getItem(KEYS.ACTIVE) || '[]');
    return active.some((p: any) => p.dni === dni);
  },

  setUserSession: (user: any) => {
    localStorage.setItem(KEYS.USER_SESSION, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('malli_auth_changed'));
  },

  getUserSession: () => {
    const saved = localStorage.getItem(KEYS.USER_SESSION);
    return saved ? JSON.parse(saved) : null;
  },

  isAdmin: () => sessionStorage.getItem(KEYS.ADMIN_AUTH) === 'true',
  isSuperAdmin: () => sessionStorage.getItem(KEYS.SUPER_AUTH) === 'true',

  logout: () => {
    localStorage.removeItem(KEYS.USER_SESSION);
    localStorage.removeItem('malli_user_raffle_state');
    sessionStorage.removeItem(KEYS.ADMIN_AUTH);
    sessionStorage.removeItem(KEYS.SUPER_AUTH);
    window.dispatchEvent(new CustomEvent('malli_auth_changed'));
  },

  exportAllData: () => {
    const data = {
      config: dataService.getConfig(),
      users: JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
      activeRaffle: dataService.getActiveParticipants(),
      departures: dataService.getDepartures()
    };
    return JSON.stringify(data, null, 2);
  }
};
