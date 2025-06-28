const express = require('express');
const Room = require('../models/Room');
const User = require('../models/User');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const { 
  generateRoomKey, 
  hashRoomPassword, 
  verifyRoomPassword, 
  generateInviteCode,
  encryptMessage,
  decryptMessage 
} = require('../utils/encryption');

const router = express.Router();

// Create a new room
router.post('/create', auth, async (req, res) => {
  try {
    const { name, description, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ error: 'Room name and password are required' });
    }

    // Check if user already has a room with this name
    const existingRoom = await Room.findOne({ 
      creator: req.user._id, 
      name: name.trim(),
      isActive: true 
    });
    
    if (existingRoom) {
      return res.status(400).json({ error: 'You already have a room with this name' });
    }

    // Hash the room password
    const hashedPassword = await hashRoomPassword(password);
    
    // Generate encryption key for the room
    const encryptionKey = generateRoomKey();

    // Create the room
    const room = new Room({
      name: name.trim(),
      description: description?.trim() || '',
      creator: req.user._id,
      password: hashedPassword,
      encryptionKey,
      members: [{
        user: req.user._id,
        role: 'admin',
        hasAccess: true // Creator automatically has access
      }]
    });

    await room.save();
    await room.populate('creator', 'name avatar color');
    await room.populate('members.user', 'name avatar color');

    res.status(201).json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        creator: room.creator,
        memberCount: room.members.length,
        createdAt: room.createdAt,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get user's rooms
router.get('/my-rooms', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { creator: req.user._id },
        { 'members.user': req.user._id }
      ],
      isActive: true
    })
    .populate('creator', 'name avatar color')
    .populate('members.user', 'name avatar color')
    .sort({ updatedAt: -1 });

    const formattedRooms = rooms.map(room => {
      const userMembership = room.members.find(m => m.user._id.toString() === req.user._id.toString());
      return {
        id: room._id,
        name: room.name,
        description: room.description,
        creator: room.creator,
        memberCount: room.members.length,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        role: userMembership?.role || 'member',
        hasAccess: userMembership?.hasAccess || false
      };
    });

    res.json({ success: true, rooms: formattedRooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Join room with password
router.post('/:roomId/join', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { password } = req.body;

    const room = await Room.findById(roomId);
    if (!room || !room.isActive) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is already a member
    const existingMember = room.members.find(m => m.user.toString() === req.user._id.toString());
    
    if (existingMember) {
      if (existingMember.hasAccess) {
        return res.json({ 
          success: true, 
          message: 'Already have access to this room',
          hasAccess: true 
        });
      }
      
      // User is member but needs to enter password
      if (!password) {
        return res.status(400).json({ error: 'Password required for first access' });
      }
      
      const isPasswordValid = await verifyRoomPassword(password, room.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid room password' });
      }
      
      // Grant access
      existingMember.hasAccess = true;
      await room.save();
      
      return res.json({ 
        success: true, 
        message: 'Access granted to room',
        hasAccess: true 
      });
    }

    // New member joining
    if (!password) {
      return res.status(400).json({ error: 'Password required to join room' });
    }

    const isPasswordValid = await verifyRoomPassword(password, room.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid room password' });
    }

    // Check room capacity
    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Add user to room
    room.members.push({
      user: req.user._id,
      role: 'member',
      hasAccess: true
    });

    await room.save();

    res.json({ 
      success: true, 
      message: 'Successfully joined room',
      hasAccess: true 
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Send invitation
router.post('/:roomId/invite', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const room = await Room.findById(roomId);
    if (!room || !room.isActive) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is a member and can invite
    const userMembership = room.members.find(m => m.user.toString() === req.user._id.toString());
    if (!userMembership) {
      return res.status(403).json({ error: 'You are not a member of this room' });
    }

    // Find the user to invite
    const invitedUser = await User.findOne({ name: username.trim() });
    if (!invitedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const isAlreadyMember = room.members.some(m => m.user.toString() === invitedUser._id.toString());
    if (isAlreadyMember) {
      return res.status(400).json({ error: 'User is already a member of this room' });
    }

    // Check for existing pending invitation
    const existingInvite = room.invitations.find(inv => 
      inv.invitedUser.toString() === invitedUser._id.toString() && 
      inv.status === 'pending'
    );
    
    if (existingInvite) {
      return res.status(400).json({ error: 'User already has a pending invitation' });
    }

    // Create invitation
    const inviteCode = generateInviteCode();
    room.invitations.push({
      invitedBy: req.user._id,
      invitedUser: invitedUser._id,
      inviteCode,
      status: 'pending'
    });

    await room.save();

    res.json({
      success: true,
      message: `Invitation sent to ${username}`,
      inviteCode
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Accept invitation
router.post('/accept-invite/:inviteCode', auth, async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const room = await Room.findOne({
      'invitations.inviteCode': inviteCode,
      'invitations.status': 'pending',
      isActive: true
    }).populate('invitations.invitedBy', 'name');

    if (!room) {
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }

    const invitation = room.invitations.find(inv => 
      inv.inviteCode === inviteCode && 
      inv.invitedUser.toString() === req.user._id.toString()
    );

    if (!invitation) {
      return res.status(403).json({ error: 'This invitation is not for you' });
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await room.save();
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check room capacity
    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Add user to room
    room.members.push({
      user: req.user._id,
      role: 'member',
      hasAccess: false // Will need to enter password on first access
    });

    // Update invitation status
    invitation.status = 'accepted';

    await room.save();

    res.json({
      success: true,
      message: `Successfully accepted invitation to ${room.name}`,
      room: {
        id: room._id,
        name: room.name,
        description: room.description
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Get room messages (encrypted)
router.get('/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const room = await Room.findById(roomId);
    if (!room || !room.isActive) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user has access to this room
    const userMembership = room.members.find(m => m.user.toString() === req.user._id.toString());
    if (!userMembership || !userMembership.hasAccess) {
      return res.status(403).json({ error: 'Access denied to this room' });
    }

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('sender', 'name avatar color');

    // Decrypt messages
    const decryptedMessages = messages.reverse().map(msg => {
      try {
        const decryptedText = decryptMessage(msg.encryptedText, room.encryptionKey);
        return {
          id: msg._id,
          text: decryptedText,
          user: {
            id: msg.sender._id,
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
          id: msg._id,
          text: '[Message could not be decrypted]',
          user: {
            id: msg.sender._id,
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

    res.json({
      success: true,
      messages: decryptedMessages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
