const mongoose = require('mongoose');

const projectRoleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    spots: {
      type: Number,
      default: 1,
      min: 0,
    },
    durationHours: {
      type: Number,
      default: null,
      min: 1,
    },
  },
  { _id: false }
);

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      trim: true,
      default: 'Contributor',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const roadmapPhaseSchema = new mongoose.Schema(
  {
    phase: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    objective: {
      type: String,
      trim: true,
      default: '',
    },
    startWeek: {
      type: Number,
      min: 1,
      default: null,
    },
    endWeek: {
      type: Number,
      min: 1,
      default: null,
    },
    durationWeeks: {
      type: Number,
      min: 1,
      default: null,
    },
    deliverables: {
      type: [String],
      default: [],
    },
    owners: {
      type: [String],
      default: [],
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    sourceCodeUrl: {
      type: String,
      trim: true,
      default: '',
    },
    roles: {
      type: [projectRoleSchema],
      default: [],
    },
    roadmap: {
      type: [roadmapPhaseSchema],
      default: [],
    },
    members: {
      type: [projectMemberSchema],
      default: [],
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    commitment: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Review', 'Completed'],
      default: 'In Progress',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    teamSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    latestAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
