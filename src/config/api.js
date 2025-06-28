// API Configuration
const API_CONFIG = {
  BASE_URL: 'https://uchat-w1wy.onrender.com',
  ENDPOINTS: {
    PROFILES: '/api/profiles',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    MESSAGES: '/api/messages',
    HEALTH: '/api/health',
    
    // Room endpoints
    ROOMS: '/api/rooms',
    CREATE_ROOM: '/api/rooms/create',
    MY_ROOMS: '/api/rooms/my-rooms',
    JOIN_ROOM: '/api/rooms/:roomId/join',
    INVITE_USER: '/api/rooms/:roomId/invite',
    ACCEPT_INVITE: '/api/rooms/accept-invite/:inviteCode',
    ROOM_MESSAGES: '/api/rooms/:roomId/messages'
  },
  
  // Session Configuration
  SESSION_TIMEOUT: 5 * 60 * 1000, // 5 minutes of inactivity
  MAX_SESSION_DURATION: 20 * 60 * 1000, // 20 minutes maximum session
  
  // Storage Keys
  STORAGE_KEYS: {
    SESSION: 'uchat_session',
    LAST_ACTIVITY: 'uchat_last_activity',
    SESSION_START: 'uchat_session_start'
  },
  
  // Socket Configuration
  SOCKET_OPTIONS: {
    cors: {
      origin: ["http://localhost:3000", "https://uchat-livid.vercel.app"],
      methods: ["GET", "POST"]
    }
  }
};

export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
};

export const getSocketUrl = () => {
  return API_CONFIG.BASE_URL;
};

export const getSessionTimeout = () => {
  return API_CONFIG.SESSION_TIMEOUT;
};

export const getMaxSessionDuration = () => {
  return API_CONFIG.MAX_SESSION_DURATION;
};

export const getStorageKey = (key) => {
  return API_CONFIG.STORAGE_KEYS[key];
};

export default API_CONFIG;
