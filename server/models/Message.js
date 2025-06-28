const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  encryptedText: {
    type: String,
    required: true // Encrypted version of the message
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderInfo: {
    name: String,
    avatar: String,
    color: String
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  roomName: {
    type: String,
    required: true // Store room name for quick access
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  messageType: {
    type: String,
    enum: ['text', 'system', 'invitation'],
    default: 'text'
  }
}, {
  timestamps: true
});

// Populate sender info before saving
messageSchema.pre('save', async function(next) {
  if (this.isNew && this.sender) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.sender);
      if (user) {
        this.senderInfo = {
          name: user.name,
          avatar: user.avatar,
          color: user.color
        };
      }
    } catch (error) {
      console.error('Error populating sender info:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
