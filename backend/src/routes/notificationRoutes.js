const express = require('express');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { ensureProjectGroupChat } = require('../utils/projectChatUtils');

const router = express.Router();

function toNotificationResponse(notification) {
  const sender = notification.sender || {};
  const project = notification.project || {};
  const senderId = sender?._id || sender;
  const projectId = project?._id || project;

  return {
    id: String(notification._id),
    type:
      notification.type === 'project_invite'
        ? 'invite'
        : notification.type === 'project_application'
        ? 'application'
        : notification.type === 'connection_request'
        ? 'invite'
        : 'alert',
    rawType: notification.type,
    title: notification.title || 'Notification',
    message: notification.message || '',
    time: notification.createdAt,
    isRead: Boolean(notification.isRead),
    status: notification.status || 'pending',
    inviteRole: notification.inviteRole || 'Contributor',
    roleTitle: notification.roleTitle || '',
    sender: {
      id: senderId ? String(senderId) : '',
      name: sender?.name || sender?.email || 'Unknown',
    },
    project: {
      id: projectId ? String(projectId) : '',
      title: project?.title || 'Project',
    },
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

async function createConnectionOutcomeNotification({
  requestNotification,
  actorUser,
  status,
}) {
  const actorName = actorUser?.name || actorUser?.email || 'A user';
  const wasAccepted = status === 'accepted';

  await Notification.create({
    recipient: requestNotification.sender,
    sender: actorUser._id,
    type: 'connection_response',
    title: wasAccepted
      ? 'Connection Request Accepted'
      : 'Connection Request Declined',
    message: wasAccepted
      ? `${actorName} accepted your connection request.`
      : `${actorName} declined your connection request.`,
    status: wasAccepted ? 'accepted' : 'rejected',
    isRead: false,
  });
}

// @desc    Send teammate connection request notification
// @route   POST /api/notification/connection-request
// @access  Private
router.post('/connection-request', protect, async (req, res) => {
  try {
    const recipientId = String(req.body?.recipientId || '').trim();
    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient id is required' });
    }

    if (String(recipientId) === String(req.user._id)) {
      return res
        .status(400)
        .json({ error: 'You cannot send a connection request to yourself' });
    }

    const isAlreadyConnected =
      Array.isArray(req.user?.connections) &&
      req.user.connections.some((id) => String(id) === recipientId);
    if (isAlreadyConnected) {
      return res.status(409).json({ error: 'You are already connected with this user' });
    }

    const recipientUser = await User.findById(recipientId).select('name email connections');
    if (!recipientUser) {
      return res.status(404).json({ error: 'Recipient user not found' });
    }

    const recipientConnections = Array.isArray(recipientUser?.connections)
      ? recipientUser.connections
      : [];
    if (recipientConnections.some((id) => String(id) === String(req.user._id))) {
      return res.status(409).json({ error: 'You are already connected with this user' });
    }

    const existingPendingRequest = await Notification.findOne({
      recipient: recipientId,
      sender: req.user._id,
      type: 'connection_request',
      status: 'pending',
    });

    if (existingPendingRequest) {
      return res
        .status(409)
        .json({ error: 'You already sent a pending connection request to this user' });
    }

    const incomingPendingRequest = await Notification.findOne({
      recipient: req.user._id,
      sender: recipientId,
      type: 'connection_request',
      status: 'pending',
    });

    if (incomingPendingRequest) {
      return res.status(409).json({
        error:
          'This user has already sent you a connection request. Check your notifications.',
      });
    }

    const senderName = req.user.name || req.user.email || 'Someone';
    const createdNotification = await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${senderName} wants to connect with you.`,
      status: 'pending',
      isRead: false,
    });

    await createdNotification.populate('sender', 'name email');
    await createdNotification.populate('project', 'title');

    return res.status(201).json({
      message: 'Connection request sent',
      notification: toNotificationResponse(createdNotification),
    });
  } catch (error) {
    if (error?.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid recipient id' });
    }
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ error: 'You already sent a pending connection request to this user' });
    }
    console.error('Send connection request error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Fetch current user's notifications
// @route   GET /api/notification
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name email')
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    const payload = notifications.map(toNotificationResponse);
    const unreadCount = payload.filter((notification) => !notification.isRead).length;

    return res.status(200).json({ notifications: payload, unreadCount });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notification/mark-all-read
// @access  Private
router.patch('/mark-all-read', protect, async (req, res) => {
  try {
    const now = new Date();
    const updateResult = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: now } }
    );

    return res.status(200).json({
      message: 'All notifications marked as read',
      modifiedCount: updateResult.modifiedCount || 0,
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Mark notification as read
// @route   PATCH /api/notification/:id/read
// @access  Private
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = notification.readAt || new Date();
    await notification.save();
    await notification.populate('sender', 'name email');
    await notification.populate('project', 'title');

    return res.status(200).json({
      message: 'Notification marked as read',
      notification: toNotificationResponse(notification),
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Accept an actionable notification
// @route   POST /api/notification/:id/accept
// @access  Private
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (
      !['project_invite', 'project_application', 'connection_request'].includes(
        notification.type
      )
    ) {
      return res.status(400).json({ error: 'This notification cannot be accepted' });
    }

    if (notification.status !== 'pending') {
      return res.status(400).json({ error: `Invite is already ${notification.status}` });
    }

    let project = null;

    if (notification.type === 'project_invite' || notification.type === 'project_application') {
      project = await Project.findById(notification.project);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    if (notification.type === 'project_invite') {
      const isOwner = String(project.owner) === String(req.user._id);
      const isAlreadyMember = (project.members || []).some(
        (member) => String(member.user) === String(req.user._id)
      );

      if (!isOwner && !isAlreadyMember) {
        project.members.push({
          user: req.user._id,
          role: notification.inviteRole || 'Contributor',
          joinedAt: new Date(),
        });
        project.teamSize = 1 + project.members.length;
        await project.save();
      }
    }

    if (notification.type === 'project_application') {
      if (String(project.owner) !== String(req.user._id)) {
        return res.status(403).json({ error: 'Only the project owner can accept applications' });
      }

      const applicantId = String(notification.sender);
      const isAlreadyMember = (project.members || []).some(
        (member) => String(member.user) === applicantId
      );

      if (!isAlreadyMember) {
        const requestedRoleTitle = String(notification.roleTitle || '').trim();
        const matchedRole = requestedRoleTitle
          ? (project.roles || []).find(
              (role) =>
                String(role?.title || '').trim().toLowerCase() ===
                requestedRoleTitle.toLowerCase()
            )
          : null;

        if (matchedRole && (Number(matchedRole.spots) || 0) < 1) {
          return res.status(400).json({ error: 'No spots left for this role' });
        }

        project.members.push({
          user: notification.sender,
          role: requestedRoleTitle || 'Contributor',
          joinedAt: new Date(),
        });

        if (matchedRole) {
          matchedRole.spots = Math.max(0, (Number(matchedRole.spots) || 0) - 1);
        }

        project.teamSize = 1 + project.members.length;
        await project.save();
      }

      const ownerName = req.user.name || req.user.email || 'Project Owner';
      await Notification.create({
        recipient: notification.sender,
        sender: req.user._id,
        type: 'project_application',
        project: project._id,
        roleTitle: notification.roleTitle || '',
        title: 'Application Accepted',
        message: `${ownerName} accepted your application for "${notification.roleTitle || 'Contributor'}" in "${project.title}".`,
        status: 'accepted',
        isRead: false,
      });
    }

    if (notification.type === 'connection_request') {
      const senderUser = await User.findById(notification.sender).select('_id');
      if (!senderUser) {
        return res.status(404).json({ error: 'Sender user not found' });
      }

      await Promise.all([
        User.updateOne(
          { _id: req.user._id },
          { $addToSet: { connections: senderUser._id } }
        ),
        User.updateOne(
          { _id: senderUser._id },
          { $addToSet: { connections: req.user._id } }
        ),
      ]);

      await createConnectionOutcomeNotification({
        requestNotification: notification,
        actorUser: req.user,
        status: 'accepted',
      });
    }

    if (
      notification.type === 'project_invite' ||
      notification.type === 'project_application'
    ) {
      try {
        await ensureProjectGroupChat(project);
      } catch (chatError) {
        console.error('Ensure project group chat on acceptance error:', chatError);
      }
    }

    const now = new Date();
    notification.status = 'accepted';
    notification.isRead = true;
    notification.readAt = now;
    notification.actedAt = now;
    await notification.save();
    await notification.populate('sender', 'name email');
    await notification.populate('project', 'title');

    return res.status(200).json({
      message:
        notification.type === 'project_application'
          ? 'Application accepted successfully'
          : notification.type === 'connection_request'
          ? 'Connection request accepted'
          : 'Invite accepted successfully',
      projectId: project ? String(project._id) : '',
      notification: toNotificationResponse(notification),
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Reject an actionable notification
// @route   POST /api/notification/:id/reject
// @access  Private
router.post('/:id/reject', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (
      !['project_invite', 'project_application', 'connection_request'].includes(
        notification.type
      )
    ) {
      return res.status(400).json({ error: 'This notification cannot be rejected' });
    }

    if (notification.status !== 'pending') {
      return res.status(400).json({ error: `Invite is already ${notification.status}` });
    }

    const now = new Date();
    notification.status = 'rejected';
    notification.isRead = true;
    notification.readAt = now;
    notification.actedAt = now;
    await notification.save();

    if (notification.type === 'connection_request') {
      await createConnectionOutcomeNotification({
        requestNotification: notification,
        actorUser: req.user,
        status: 'rejected',
      });
    }

    await notification.populate('sender', 'name email');
    await notification.populate('project', 'title');

    return res.status(200).json({
      message:
        notification.type === 'project_application'
          ? 'Application rejected'
          : notification.type === 'connection_request'
          ? 'Connection request rejected'
          : 'Invite rejected',
      notification: toNotificationResponse(notification),
    });
  } catch (error) {
    console.error('Reject invite error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
