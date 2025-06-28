// Server constants
const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
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

const MESSAGE_LIMIT = 9999999999; // Set to a very high number to avoid hitting limits in practice

const CORS_OPTIONS = {
  origin: ["http://localhost:3000", "https://uchat-livid.vercel.app"],
  methods: ["GET", "POST"],
  credentials: true
};

module.exports = {
  SOCKET_EVENTS,
  MESSAGE_LIMIT,
  CORS_OPTIONS
};
