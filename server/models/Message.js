const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
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
    type: String,
    default: 'general'
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date
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
