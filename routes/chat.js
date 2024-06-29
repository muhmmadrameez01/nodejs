const express = require('express');
const router = express.Router();
const Message = require('../models/chat.model');

// Fetch messages between two users
router.get('/:senderId/:recipientId', async (req, res) => {
  const { senderId, recipientId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId, recipientId },
        { senderId: recipientId, recipientId: senderId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
