const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { protect } = require('../middleware/authMiddleware');

// @desc    Send a message
// @route   POST /api/message
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { content, chatId } = req.body;

        if (!content || !chatId) {
            console.log('Invalid data passed into request');
            return res.sendStatus(400);
        }

        const chat = await Chat.findById(chatId).select('participants');
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const isParticipant = (chat.participants || []).some(
            (participantId) => String(participantId) === String(req.user._id)
        );
        if (!isParticipant) {
            return res.status(403).json({ error: 'You are not a participant of this chat' });
        }

        var newMessage = {
            sender: req.user._id,
            content: content,
            chat: chatId,
        };

        var message = await Message.create(newMessage);

        message = await message.populate('sender', 'name avatar');
        message = await message.populate('chat');
        message = await User.populate(message, {
            path: 'chat.participants',
            select: 'name email avatar',
        });

        await Chat.findByIdAndUpdate(req.body.chatId, {
            lastMessage: message,
        });

        res.json(message);
    } catch (error) {
        if (error?.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid chat id' });
        }
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Fetch all messages for a chat
// @route   GET /api/message/:chatId
// @access  Private
router.get('/:chatId', protect, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId).select('participants');
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const isParticipant = (chat.participants || []).some(
            (participantId) => String(participantId) === String(req.user._id)
        );
        if (!isParticipant) {
            return res.status(403).json({ error: 'You are not a participant of this chat' });
        }

        const messages = await Message.find({ chat: req.params.chatId })
            .populate('sender', 'name avatar email')
            .populate({
                path: 'chat',
                populate: {
                    path: 'project',
                    select: 'title'
                }
            });

        res.json(messages);
    } catch (error) {
        if (error?.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid chat id' });
        }
        res.status(400);
        throw new Error(error.message);
    }
});

module.exports = router;
