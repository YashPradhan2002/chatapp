const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { SOCKET_EVENTS, MESSAGE_LIMIT, CORS_OPTIONS } = require('./constants');
const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');
const { encryptMessage, decryptMessage } = require('./utils/encryption');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const roomRoutes = require('./routes/rooms');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: CORS_OPTIONS
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// Store active users (socket connections) - now organized by room
const activeUsers = new Map(); // socketId -> user info
const roomConnections = new Map(); // roomId -> Set of socketIds

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    console.log('🔐 Socket authentication attempt from:', socket.handshake.address);
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log('❌ No token provided');
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ User not found for token');
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    console.log('✅ Socket authenticated for user:', user.name);
    next();
  } catch (error) {
    console.log('❌ Socket authentication error:', error.message);
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
  console.log('🔌 User connected:', socket.user.name, socket.id);
  
  // Join a specific room
  socket.on(SOCKET_EVENTS.JOIN_ROOM, async (data) => {
    console.log('👥 User joining room:', socket.user.name, 'Room:', data.roomId);
    try {
      const { roomId } = data;
      
      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      // Find the room and verify user access
      const room = await Room.findById(roomId);
      if (!room || !room.isActive) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Check if user is a member with access
      const userMembership = room.members.find(m => 
        m.user.toString() === socket.userId && m.hasAccess
      );
      
      if (!userMembership) {
        socket.emit('error', { message: 'Access denied to this room' });
        return;
      }

      // Update user online status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: new Date()
      });

      // Store socket connection with room info
      activeUsers.set(socket.id, {
        userId: socket.userId,
        user: socket.user,
        socketId: socket.id,
        roomId: roomId,
        room: room
      });

      // Add to room connections
      if (!roomConnections.has(roomId)) {
        roomConnections.set(roomId, new Set());
      }
      roomConnections.get(roomId).add(socket.id);
      
      // Join socket room
      socket.join(roomId);
      
      // Get recent messages from database for this room
      const recentMessages = await Message.find({ room: roomId })
        .sort({ createdAt: -1 })
        .limit(MESSAGE_LIMIT)
        .populate('sender', 'name avatar color');
      
      // Decrypt and format messages
      const formattedMessages = recentMessages.reverse().map(msg => {
        try {
          const decryptedText = decryptMessage(msg.encryptedText, room.encryptionKey);
          return {
            id: msg._id.toString(),
            text: decryptedText,
            user: {
              id: msg.sender._id.toString(),
              name: msg.sender.name,
              avatar: msg.sender.avatar,
              color: msg.sender.color
            },
            timestamp: msg.createdAt.toISOString(),
            edited: msg.edited,
            messageType: msg.messageType
          };
        } catch (decryptError) {
          console.error('Message decryption error:', decryptError);
          return {
            id: msg._id.toString(),
            text: '[Message could not be decrypted]',
            user: {
              id: msg.sender._id.toString(),
              name: msg.sender.name,
              avatar: msg.sender.avatar,
              color: msg.sender.color
            },
            timestamp: msg.createdAt.toISOString(),
            edited: msg.edited,
            messageType: 'system'
          };
        }
      });

      socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
        user: {
          id: socket.user._id.toString(),
          name: socket.user.name,
          avatar: socket.user.avatar,
          color: socket.user.color
        },
        room: {
          id: room._id,
          name: room.name,
          description: room.description
        },
        messages: formattedMessages
      });
      
      // Notify other users in the room
      socket.to(roomId).emit(SOCKET_EVENTS.USER_JOINED, {
        id: socket.user._id.toString(),
        name: socket.user.name,
        avatar: socket.user.avatar,
        color: socket.user.color
      });
      
      // Send current online users for this room
      const roomSocketIds = roomConnections.get(roomId) || new Set();
      const onlineUsers = Array.from(roomSocketIds)
        .map(socketId => activeUsers.get(socketId))
        .filter(conn => conn)
        .map(conn => ({
          id: conn.user._id.toString(),
          name: conn.user.name,
          avatar: conn.user.avatar,
          color: conn.user.color
        }));
      
      console.log('📋 Sending online users list for room:', room.name, onlineUsers.map(u => u.name));
      io.to(roomId).emit(SOCKET_EVENTS.ONLINE_USERS, onlineUsers);
      
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });
  
  // Handle new message in room
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (messageData) => {
    try {
      const userConnection = activeUsers.get(socket.id);
      if (!userConnection) {
        socket.emit('error', { message: 'User not connected to any room' });
        return;
      }

      const { roomId, room } = userConnection;
      const { text } = messageData;

      if (!text || text.trim().length === 0) {
        socket.emit('error', { message: 'Message text is required' });
        return;
      }

      // Encrypt the message
      const encryptedText = encryptMessage(text.trim(), room.encryptionKey);

      // Save encrypted message to database
      const message = new Message({
        text: text.trim(), // Store original for backup/admin purposes
        encryptedText,
        sender: socket.userId,
        room: roomId,
        roomName: room.name,
        messageType: 'text'
      });

      await message.save();
      await message.populate('sender', 'name avatar color');

      // Format message for frontend (with decrypted text)
      const formattedMessage = {
        id: message._id.toString(),
        text: text.trim(),
        user: {
          id: message.sender._id.toString(),
          name: message.sender.name,
          avatar: message.sender.avatar,
          color: message.sender.color
        },
        timestamp: message.createdAt.toISOString(),
        edited: message.edited,
        messageType: message.messageType
      };
      
      // Broadcast message to all users in the room
      io.to(roomId).emit(SOCKET_EVENTS.NEW_MESSAGE, formattedMessage);
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle typing indicator
  socket.on(SOCKET_EVENTS.TYPING, (isTyping) => {
    const userConnection = activeUsers.get(socket.id);
    if (userConnection) {
      // Broadcast typing to users in the same room
      socket.to(userConnection.roomId).emit(SOCKET_EVENTS.USER_TYPING, {
        user: userConnection.user,
        isTyping: isTyping
      });
    }
  });
  
  // Handle disconnection
  socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
    try {
      const userConnection = activeUsers.get(socket.id);
      if (userConnection) {
        const { roomId, user } = userConnection;
        
        // Update user offline status in database
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        });

        // Remove from active users
        activeUsers.delete(socket.id);
        
        // Remove from room connections
        if (roomConnections.has(roomId)) {
          roomConnections.get(roomId).delete(socket.id);
          if (roomConnections.get(roomId).size === 0) {
            roomConnections.delete(roomId);
          }
        }
        
        // Notify other users in the room
        socket.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, user);
        
        // Send updated online users list for the room
        const roomSocketIds = roomConnections.get(roomId) || new Set();
        const onlineUsers = Array.from(roomSocketIds)
          .map(socketId => activeUsers.get(socketId))
          .filter(conn => conn)
          .map(conn => conn.user);
        
        io.to(roomId).emit(SOCKET_EVENTS.ONLINE_USERS, onlineUsers);
      }
      console.log('User disconnected:', socket.user?.name || 'Unknown', socket.id);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
});

// Legacy API endpoints for compatibility
app.get('/api/profiles', async (req, res) => {
  try {
    const users = await User.find({}).select('-password').limit(10);
    res.json(users);
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Uchat server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Uchat server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
});
