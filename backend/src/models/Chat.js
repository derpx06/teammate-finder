const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
      default: '',
    },
    isGroupChat: {
      type: Boolean,
      default: false,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index(
  { project: 1, isGroupChat: 1 },
  {
    unique: true,
    partialFilterExpression: { isGroupChat: true, project: { $exists: true, $ne: null } },
  }
);

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
