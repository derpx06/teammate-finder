const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const Project = require('../models/Project');
const { protect } = require('../middleware/authMiddleware');
const { ensureProjectGroupChat } = require('../utils/projectChatUtils');

// @desc    Create or access a one-on-one chat
// @route   POST /api/chat
// @access  Private
router.post('/', protect, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'UserId param not sent with request' });
  }

  if (String(userId) === String(req.user._id)) {
    return res.status(400).json({ error: 'Cannot create direct chat with yourself' });
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { participants: { $elemMatch: { $eq: req.user._id } } },
      { participants: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate('participants', '-passwordHash')
    .populate('lastMessage')
    .populate('project', 'title');

  isChat = await User.populate(isChat, {
    path: 'lastMessage.sender',
    select: 'name email avatar',
  });

  if (isChat.length > 0) {
    return res.send(isChat[0]);
  }

  const chatData = {
    chatName: '',
    isGroupChat: false,
    participants: [req.user._id, userId],
  };

  try {
    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: createdChat._id })
      .populate('participants', '-passwordHash')
      .populate('project', 'title');
    return res.status(200).json(fullChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Create or access a project's group chat
// @route   GET /api/chat/project/:projectId
// @access  Private
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).select('title owner members');
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const currentUserId = String(req.user._id);
    const isOwner = String(project.owner) === currentUserId;
    const isMember = (project.members || []).some(
      (member) => String(member?.user) === currentUserId
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ error: 'You are not part of this project' });
    }

    const projectChat = await ensureProjectGroupChat(project);
    let fullChat = await Chat.findById(projectChat._id)
      .populate('participants', '-passwordHash')
      .populate('lastMessage')
      .populate('project', 'title');

    fullChat = await User.populate(fullChat, {
      path: 'lastMessage.sender',
      select: 'name email avatar',
    });

    return res.status(200).json(fullChat);
  } catch (error) {
    if (error?.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid project id' });
    }
    console.error('Access project chat error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Fetch all chats for a user
// @route   GET /api/chat
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    Chat.find({ participants: { $elemMatch: { $eq: req.user._id } } })
      .populate('participants', '-passwordHash')
      .populate('lastMessage')
      .populate('project', 'title')
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: 'lastMessage.sender',
          select: 'name email avatar',
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = router;
