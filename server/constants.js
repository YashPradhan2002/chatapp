// Server constants
const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // User events
  JOIN: 'join',
  JOINED: 'joined',
  USER_JOINED: 'userJoined',
  USER_LEFT: 'userLeft',
  ONLINE_USERS: 'onlineUsers',
  
  // Message events
  SEND_MESSAGE: 'sendMessage',
  NEW_MESSAGE: 'newMessage',
  
  // Typing events
  TYPING: 'typing',
  USER_TYPING: 'userTyping'
};

const MESSAGE_LIMIT = 100;

const CORS_OPTIONS = {
  origin: ["http://localhost:3000", "https://your-frontend-domain.com"],
  methods: ["GET", "POST"],
  credentials: true
};

module.exports = {
  SOCKET_EVENTS,
  MESSAGE_LIMIT,
  CORS_OPTIONS
};
