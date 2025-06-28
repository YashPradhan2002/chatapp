const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all messages
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, room = 'general' } = req.query;
    
    const messages = await Message.find({ room })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('sender', 'name avatar color');

    // Reverse to get chronological order
    messages.reverse();

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new message
router.post('/', auth, async (req, res) => {
  try {
    const { text, room = 'general' } = req.body;

    const message = new Message({
      text,
      sender: req.user._id,
      room
    });

    await message.save();
    await message.populate('sender', 'name avatar color');

    res.status(201).json(message);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Edit message
router.put('/:messageId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    message.text = text;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'name avatar color');
    res.json(message);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOneAndDelete({
      _id: messageId,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
