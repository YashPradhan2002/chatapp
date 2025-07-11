// Application constants
export const APP_NAME = 'Uchat';

// UI Constants
export const UI_CONSTANTS = {
  SESSION_WARNING_TIME: 1 * 60 * 1000, // 1 minute before logout (reduced for 5-min timeout)
  TYPING_TIMEOUT: 1000, // 1 second
  MESSAGE_LIMIT: 100, // Keep only last 100 messages
  SCROLL_BEHAVIOR: 'smooth'
};

// Socket Events
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // User events
  JOIN: 'join', // Legacy - kept for compatibility
  JOINED: 'joined', // Legacy - kept for compatibility
  JOIN_ROOM: 'joinRoom',
  ROOM_JOINED: 'roomJoined',
  USER_JOINED: 'userJoined',
  USER_LEFT: 'userLeft',
  ONLINE_USERS: 'onlineUsers',
  
  // Message events
  SEND_MESSAGE: 'sendMessage',
  NEW_MESSAGE: 'newMessage',
  
  // Typing events
  TYPING: 'typing',
  USER_TYPING: 'userTyping',
  
  // Room events
  ROOM_CREATED: 'roomCreated',
  ROOM_UPDATED: 'roomUpdated',
  ROOM_DELETED: 'roomDeleted',
  INVITATION_RECEIVED: 'invitationReceived'
};

// User Activity Events
export const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove', 
  'keypress',
  'scroll',
  'touchstart',
  'click'
];

// Error Messages
export const ERROR_MESSAGES = {
  SESSION_EXPIRED: 'Your session has expired due to inactivity (5 min) or maximum duration (20 min). Please log in again.',
  CONNECTION_FAILED: 'Failed to connect to server. Please try again.',
  FETCH_PROFILES_FAILED: 'Failed to load user profiles. Please refresh the page.',
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  SEND_MESSAGE_FAILED: 'Failed to send message. Please try again.',
  ROOM_ACCESS_DENIED: 'Access denied to this room. You may need to enter the room password.',
  ROOM_NOT_FOUND: 'Room not found or no longer exists.',
  INVALID_INVITE_CODE: 'Invalid or expired invitation code.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  MESSAGE_SENT: 'Message sent successfully!'
};
