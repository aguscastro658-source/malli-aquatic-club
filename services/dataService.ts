
import { AppRoute } from "../types";
import { supabase } from "./supabaseClient";

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
  card2Desc: "Sorteo manual realizado por la administración.",
  card3Title: "DNI",
  card3Desc: "El ganador solo muestra el DNI para el pase gratis."
};

const KEYS = {
  USER_SESSION: 'malli_user_session',
  ADMIN_AUTH: 'malli_admin_auth',
  SUPER_AUTH: 'malli_super_admin_auth'
};

export const dataService = {
  getConfig: async () => {
    const { data, error } = await supabase
      .from('malli_config')
      .select('config')
      .eq('id', 'default')
      .single();

    if (error || !data) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...data.config };
  },

  saveConfig: async (config: any) => {
    await supabase
      .from('malli_config')
      .upsert({ id: 'default', config, updated_at: new Date().toISOString() });
    window.dispatchEvent(new CustomEvent('malli_app_config_updated'));
  },

  getUserByDni: async (dni: string) => {
    const { data, error } = await supabase
      .from('malli_users')
      .select('*')
      .eq('dni', dni)
      .single();
    if (error) return null;
    return { ...data, name: data.nombre }; // Mapping internal name to app name
  },

  registerUser: async (name: string, dni: string, pass: string = '') => {
    const { data, error } = await supabase
      .from('malli_users')
      .upsert({
        dni,
        nombre: name,
        password: pass || dni,
        rol: 'usuario'
      }, { onConflict: 'dni' })
      .select()
      .single();

    if (error) throw error;
    return { ...data, name: data.nombre };
  },

  loginWithDni: async (dni: string, pass: string) => {
    const { data, error } = await supabase
      .from('malli_users')
      .select('*')
      .eq('dni', dni)
      .eq('password', pass)
      .single();

    if (error || !data) return null;
    return { ...data, name: data.nombre };
  },

  unregisterUser: async (dni: string) => {
    const user = await dataService.getUserByDni(dni);
    if (user) {
      await supabase
        .from('malli_departures')
        .insert({ dni: user.dni, nombre: user.name, left_at: new Date().toISOString() });
    }
    await supabase.from('malli_raffle_participants').delete().eq('dni', dni);
    await supabase.from('malli_users').delete().eq('dni', dni);
    window.dispatchEvent(new CustomEvent('malli_app_config_updated'));
  },

  updateHeartbeat: async (dni: string) => {
    await supabase
      .from('malli_raffle_participants')
      .update({ last_seen: new Date().toISOString() })
      .eq('dni', dni);
  },

  joinRaffle: async (user: { name: string, dni: string }) => {
    await supabase
      .from('malli_raffle_participants')
      .upsert({
        dni: user.dni,
        last_seen: new Date().toISOString(),
        inscripted_at: new Date().toISOString()
      }, { onConflict: 'dni' });
    window.dispatchEvent(new CustomEvent('malli_app_config_updated'));
  },

  leaveRaffle: async (dni: string) => {
    await supabase.from('malli_raffle_participants').delete().eq('dni', dni);
    window.dispatchEvent(new CustomEvent('malli_app_config_updated'));
  },

  getActiveParticipants: async () => {
    console.log('Fetching participants from Supabase...');

    // First attempt with JOIN - requires Foreign Key relationship
    const { data, error } = await supabase
      .from('malli_raffle_participants')
      .select(`
        dni,
        inscripted_at,
        last_seen,
        malli_users (
          nombre
        )
      `)
      .order('inscripted_at', { ascending: false });

    if (error) {
      console.warn('Joint fetch failed, trying fallback separate fetch:', error);

      // FALLBACK: Fetch participants only and then hydrate names
      const { data: partData, error: partError } = await supabase
        .from('malli_raffle_participants')
        .select('dni, inscripted_at, last_seen')
        .order('inscripted_at', { ascending: false });

      if (partError) {
        console.error('Fatal error fetching participants:', partError);
        return [];
      }

      // Fetch all user names in one go for hydration
      const { data: userData } = await supabase
        .from('malli_users')
        .select('dni, nombre');

      const nameMap = new Map((userData || []).map(u => [u.dni, u.nombre]));

      return partData.map((p: any) => ({
        dni: p.dni,
        name: nameMap.get(p.dni) || 'Candidato inscripto',
        inscriptedAt: p.inscripted_at,
        lastSeen: new Date(p.last_seen || Date.now()).getTime()
      }));
    }

    return (data || []).map((p: any) => {
      const userName = Array.isArray(p.malli_users)
        ? p.malli_users[0]?.nombre
        : p.malli_users?.nombre;

      return {
        dni: p.dni,
        name: userName || 'Candidato inscripto',
        inscriptedAt: p.inscripted_at,
        lastSeen: new Date(p.last_seen || Date.now()).getTime()
      };
    });
  },

  getDepartures: async () => {
    const { data, error } = await supabase
      .from('malli_departures')
      .select('*')
      .order('left_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];
    return data.map((d: any) => ({
      dni: d.dni,
      name: d.nombre,
      leftAt: new Date(d.left_at).toLocaleString()
    }));
  },

  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('malli_users')
      .select('*')
      .order('nombre', { ascending: true });

    if (error || !data) return [];
    return data.map((u: any) => ({
      ...u,
      name: u.nombre
    }));
  },

  isUserInscripted: async (dni: string) => {
    const { data, error } = await supabase
      .from('malli_raffle_participants')
      .select('dni')
      .eq('dni', dni)
      .single();
    return !!data;
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

  exportAllData: async () => {
    const config = await dataService.getConfig();
    const { data: users } = await supabase.from('malli_users').select('*');
    const participants = await dataService.getActiveParticipants();
    const departures = await dataService.getDepartures();

    const data = {
      config,
      users,
      activeRaffle: participants,
      departures
    };
    return JSON.stringify(data, null, 2);
  }
};
