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
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
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

// Store active users (socket connections)
const activeUsers = new Map();

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
  console.log('User connected:', socket.user.name, socket.id);
  
  // Join chat room
  socket.on(SOCKET_EVENTS.JOIN, async () => {
    try {
      // Update user online status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: new Date()
      });

      // Store socket connection
      activeUsers.set(socket.id, {
        userId: socket.userId,
        user: socket.user,
        socketId: socket.id
      });
      
      // Get recent messages from database
      const recentMessages = await Message.find()
        .sort({ createdAt: -1 })
        .limit(MESSAGE_LIMIT)
        .populate('sender', 'name avatar color');
      
      // Reverse to get chronological order and format for frontend
      const formattedMessages = recentMessages.reverse().map(msg => ({
        id: msg._id.toString(),
        text: msg.text,
        user: {
          id: msg.sender._id.toString(),
          name: msg.sender.name,
          avatar: msg.sender.avatar,
          color: msg.sender.color
        },
        timestamp: msg.createdAt.toISOString(),
        edited: msg.edited
      }));

      socket.emit(SOCKET_EVENTS.JOINED, {
        user: socket.user,
        messages: formattedMessages
      });
      
      // Notify other users
      socket.broadcast.emit(SOCKET_EVENTS.USER_JOINED, socket.user);
      
      // Send current online users
      const onlineUsers = Array.from(activeUsers.values()).map(conn => conn.user);
      io.emit(SOCKET_EVENTS.ONLINE_USERS, onlineUsers);
    } catch (error) {
      console.error('Join error:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });
  
  // Handle new message
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (messageData) => {
    try {
      const user = activeUsers.get(socket.id);
      if (user) {
        // Save message to database
        const message = new Message({
          text: messageData.text,
          sender: socket.userId,
          room: 'general'
        });

        await message.save();
        await message.populate('sender', 'name avatar color');

        // Format message for frontend
        const formattedMessage = {
          id: message._id.toString(),
          text: message.text,
          user: {
            id: message.sender._id.toString(),
            name: message.sender.name,
            avatar: message.sender.avatar,
            color: message.sender.color
          },
          timestamp: message.createdAt.toISOString(),
          edited: message.edited
        };
        
        // Broadcast message to all users
        io.emit(SOCKET_EVENTS.NEW_MESSAGE, formattedMessage);
      }
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle typing indicator
  socket.on(SOCKET_EVENTS.TYPING, (isTyping) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit(SOCKET_EVENTS.USER_TYPING, {
        user: user.user,
        isTyping: isTyping
      });
    }
  });
  
  // Handle disconnection
  socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
    try {
      const user = activeUsers.get(socket.id);
      if (user) {
        // Update user offline status in database
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        });

        activeUsers.delete(socket.id);
        socket.broadcast.emit(SOCKET_EVENTS.USER_LEFT, user.user);
        
        // Send updated online users list
        const onlineUsers = Array.from(activeUsers.values()).map(conn => conn.user);
        io.emit(SOCKET_EVENTS.ONLINE_USERS, onlineUsers);
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
