const Chat = require('../models/Chat');
const Project = require('../models/Project');

function toUniqueObjectIds(values = []) {
  const unique = new Map();
  values.forEach((value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return;
    if (!unique.has(normalized)) {
      unique.set(normalized, value);
    }
  });
  return Array.from(unique.values());
}

function buildProjectParticipants(project) {
  if (!project) return [];
  const ownerId = project.owner?._id || project.owner;
  const memberIds = Array.isArray(project.members)
    ? project.members
        .map((member) => member?.user?._id || member?.user)
        .filter(Boolean)
    : [];

  return toUniqueObjectIds([ownerId, ...memberIds]);
}

function buildProjectChatName(project) {
  return String(project?.title || 'Project').trim() || 'Project';
}

async function ensureProjectGroupChat(projectOrId) {
  const projectId = projectOrId?._id || projectOrId;
  if (!projectId) {
    throw new Error('Project id is required to ensure group chat');
  }

  let project = projectOrId;
  if (!project?.title || !project?.owner) {
    project = await Project.findById(projectId).select('title owner members');
  }

  if (!project) {
    throw new Error('Project not found while ensuring group chat');
  }

  const participants = buildProjectParticipants(project);
  const chatName = buildProjectChatName(project);

  let chat = await Chat.findOne({ project: project._id, isGroupChat: true });
  if (!chat) {
    try {
      chat = await Chat.create({
        chatName,
        isGroupChat: true,
        project: project._id,
        participants,
      });
    } catch (error) {
      if (error?.code === 11000) {
        chat = await Chat.findOne({ project: project._id, isGroupChat: true });
      } else {
        throw error;
      }
    }
  }

  if (!chat) {
    throw new Error('Failed to create or fetch project group chat');
  }

  const currentParticipantIds = new Set(
    (chat.participants || []).map((id) => String(id))
  );
  const nextParticipantIds = new Set(participants.map((id) => String(id)));

  const hasSameParticipants =
    currentParticipantIds.size === nextParticipantIds.size &&
    [...currentParticipantIds].every((id) => nextParticipantIds.has(id));

  const shouldUpdateName = String(chat.chatName || '') !== chatName;
  if (!hasSameParticipants || shouldUpdateName) {
    chat.participants = participants;
    chat.chatName = chatName;
    await chat.save();
  }

  return chat;
}

module.exports = {
  ensureProjectGroupChat,
};
