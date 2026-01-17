
export interface AIResponse {
  text: string;
  timestamp: string;
  role: 'user' | 'model';
}

export enum AppRoute {
  HOME = '/',
  LOGIN = '/login',
  ADMIN = '/admin',
  SUPER_ADMIN = '/super-admin',
  USER_PANEL = '/user-panel'
}
