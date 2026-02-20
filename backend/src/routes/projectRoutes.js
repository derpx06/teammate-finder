const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');
const { generateVirtualCtoPlan, enhancePlanWithLlm } = require('../utils/virtualCtoUtils');
const { generateEmbedding, EMBEDDING_DIMENSION } = require('../utils/embeddingUtils');
const { searchLocalVectors } = require('../utils/vectorUtils');
const { ensureProjectGroupChat } = require('../utils/projectChatUtils');
const { toCleanText, improveTextWithGemini } = require('../utils/textEnhancementUtils');

const router = express.Router();
const VIRTUAL_CTO_CACHE_TTL_MS = Number(process.env.VIRTUAL_CTO_CACHE_TTL_MS) > 0
  ? Number(process.env.VIRTUAL_CTO_CACHE_TTL_MS)
  : 5 * 60 * 1000;
const VIRTUAL_CTO_CACHE_MAX_ITEMS = 200;
const virtualCtoPackageCache = new Map();
const VIRTUAL_CTO_IDEA_CATEGORIES = ['saas', 'mobile', 'ai', 'web3', 'ecommerce', 'other'];
const VIRTUAL_CTO_IDEA_PROMPTS = {
  saas: [
    'Build a SaaS platform that helps college teams manage hackathon tasks, deadlines, and ownership with live progress tracking.',
    'Create a startup CRM for early-stage founders to track leads, investor conversations, and follow-ups in one dashboard.',
    'Develop a team workspace that auto-generates sprint plans, PRD summaries, and milestone reports for product teams.',
  ],
  mobile: [
    'Build a mobile app that matches nearby learners for accountability sessions and shared study goals.',
    'Create a React Native app for local event discovery with group chats, RSVP management, and reminder notifications.',
    'Develop a mobile habit-coaching app with streak analytics, social accountability circles, and challenge mode.',
  ],
  ai: [
    'Build an AI copilot that reviews project descriptions and improves clarity, scope, and execution milestones.',
    'Create an AI interview simulator where users practice role-based questions and get personalized feedback.',
    'Develop an AI teammate recommendation engine that explains why each candidate is a fit for a project role.',
  ],
  web3: [
    'Build a Web3 contributor dashboard to track DAO tasks, bounties, and wallet-based contribution proofs.',
    'Create a blockchain-based credential verifier for hackathon submissions and project ownership validation.',
    'Develop a smart-contract-powered escrow platform for freelance milestone payments with dispute workflows.',
  ],
  ecommerce: [
    'Build an e-commerce analytics console for small brands with conversion funnels, retention cohorts, and campaign ROI.',
    'Create a social commerce app where creators launch limited drops and buyers receive live stock alerts.',
    'Develop an AI-assisted catalog optimizer that improves product titles, tags, and SEO descriptions for stores.',
  ],
  other: [
    'Build a project collaboration platform where creators can post ideas, recruit teammates, and track roadmap execution.',
    'Create a campus innovation network for students to find co-builders, mentors, and hackathon-ready project ideas.',
    'Develop a portfolio operating system that turns work history into impact stories, proof links, and recruiter-ready pages.',
  ],
};

function normalizeProjectType(status) {
  if (status === 'Completed') return 'completed';
  if (status === 'Pending') return 'pending';
  return 'active';
}

function formatDueDate(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function normalizeRoleInput(role) {
  if (!role || !role.title) return null;

  const title = String(role.title).trim();
  if (!title) return null;

  const skills = Array.isArray(role.skills)
    ? role.skills.map((skill) => String(skill).trim()).filter(Boolean)
    : String(role.skills || '')
      .split(',')
      .map((skill) => String(skill).trim())
      .filter(Boolean);

  const numericSpots = Number(role.spots);
  const spots = Number.isFinite(numericSpots) ? Math.max(1, Math.round(numericSpots)) : 1;

  const numericDurationHours = Number(role.durationHours);
  const durationHours =
    Number.isFinite(numericDurationHours) && numericDurationHours > 0
      ? Math.round(numericDurationHours)
      : null;

  return {
    title,
    skills,
    spots,
    durationHours,
  };
}

function normalizeSourceCodeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw);
  const candidate = hasScheme ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch (_error) {
    return '';
  }
}

function normalizeStringArray(values) {
  const baseValues = Array.isArray(values)
    ? values
    : String(values || '')
        .split(',')
        .map((value) => String(value || '').trim())
        .filter(Boolean);

  return Array.from(
    new Set(baseValues.map((value) => String(value || '').trim()).filter(Boolean))
  ).slice(0, 12);
}

function normalizeRoadmapInput(roadmap) {
  if (!Array.isArray(roadmap)) return [];

  return roadmap
    .map((phase, index) => {
      const title = String(phase?.title || '').trim();
      const objective = String(phase?.objective || '').trim();
      const normalizedTitle = title || (objective ? `Phase ${index + 1}` : '');
      if (!normalizedTitle) return null;

      const startWeekInput = Number(phase?.startWeek);
      const endWeekInput = Number(phase?.endWeek);
      const durationWeeksInput = Number(phase?.durationWeeks);

      const startWeek = Number.isFinite(startWeekInput) && startWeekInput > 0
        ? Math.round(startWeekInput)
        : null;
      const endWeek = Number.isFinite(endWeekInput) && endWeekInput > 0
        ? Math.round(endWeekInput)
        : null;
      const durationWeeks = Number.isFinite(durationWeeksInput) && durationWeeksInput > 0
        ? Math.round(durationWeeksInput)
        : startWeek && endWeek
          ? Math.max(1, endWeek - startWeek + 1)
          : null;

      const normalizedStartWeek = startWeek && endWeek && endWeek < startWeek ? endWeek : startWeek;
      const normalizedEndWeek = startWeek && endWeek && endWeek < startWeek ? startWeek : endWeek;
      const rawProgress = Number(phase?.progress);
      const progress = Number.isFinite(rawProgress)
        ? Math.max(0, Math.min(100, Math.round(rawProgress)))
        : 0;

      return {
        phase: String(phase?.phase || `phase_${index + 1}`).trim(),
        title: normalizedTitle,
        objective,
        startWeek: normalizedStartWeek,
        endWeek: normalizedEndWeek,
        durationWeeks,
        deliverables: normalizeStringArray(phase?.deliverables || []),
        owners: normalizeStringArray(phase?.owners || []),
        progress,
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function calculateRoadmapProgress(roadmap = []) {
  const normalizedRoadmap = Array.isArray(roadmap) ? roadmap : [];
  if (normalizedRoadmap.length === 0) return 0;

  const phaseProgressValues = normalizedRoadmap.map((phase) => {
    const raw = Number(phase?.progress);
    if (!Number.isFinite(raw)) return 0;
    return Math.max(0, Math.min(100, Math.round(raw)));
  });

  const total = phaseProgressValues.reduce((sum, value) => sum + value, 0);
  return Math.round(total / normalizedRoadmap.length);
}

function toSlug(value, fallback = 'project-starter-kit') {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || fallback;
}

function parseGitHubRepoFromUrl(sourceCodeUrl) {
  const raw = String(sourceCodeUrl || '').trim();
  if (!raw) return null;

  try {
    const normalized = raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : `https://${raw}`;
    const url = new URL(normalized);
    if (!/github\.com$/i.test(url.hostname)) return null;

    const segments = url.pathname
      .replace(/^\//, '')
      .replace(/\.git$/i, '')
      .split('/')
      .filter(Boolean);
    if (segments.length < 2) return null;

    return {
      owner: segments[0],
      repo: segments[1],
      fullName: `${segments[0]}/${segments[1]}`,
    };
  } catch (_error) {
    return null;
  }
}

async function githubApiRequest(path, options = {}) {
  const {
    method = 'GET',
    token = '',
    body = null,
    accept = 'application/vnd.github+json',
  } = options;

  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      'User-Agent': 'DevCraft-BroCoders',
      Accept: accept,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      'X-GitHub-Api-Version': '2022-11-28',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '');

  if (!response.ok) {
    const error = new Error(
      (payload && typeof payload === 'object' ? payload.message : '') || 'GitHub API request failed'
    );
    error.statusCode = response.status;
    throw error;
  }

  return payload;
}

function buildStarterReadme(project) {
  const roadmap = Array.isArray(project?.roadmap) ? project.roadmap : [];
  const roles = Array.isArray(project?.roles) ? project.roles : [];
  const techStack = Array.from(
    new Set(
      roles
        .flatMap((role) => (Array.isArray(role?.skills) ? role.skills : []))
        .map((skill) => String(skill || '').trim())
        .filter(Boolean)
    )
  );

  const roadmapSection = roadmap.length
    ? roadmap
        .map((phase, index) => {
          const title = String(phase?.title || `Phase ${index + 1}`).trim();
          const objective = String(phase?.objective || '').trim();
          return `- **${title}**${objective ? `: ${objective}` : ''}`;
        })
        .join('\n')
    : '- MVP Planning\n- Core Development\n- QA + Launch';

  const roleSection = roles.length
    ? roles
        .map((role) => {
          const roleTitle = String(role?.title || 'Contributor').trim();
          const skills = Array.isArray(role?.skills) ? role.skills.join(', ') : '';
          return `- **${roleTitle}**${skills ? ` (${skills})` : ''}`;
        })
        .join('\n')
    : '- Product Engineer\n- Frontend Engineer\n- Backend Engineer';

  return `# ${String(project?.title || 'Project').trim()}

${String(project?.description || '').trim()}

## Problem
Add a concise problem statement here.

## Solution
Describe your solution and value proposition.

## Tech Stack
${techStack.length ? techStack.map((item) => `- ${item}`).join('\n') : '- JavaScript\n- React\n- Node.js\n- MongoDB'}

## Team Roles
${roleSection}

## Roadmap
${roadmapSection}

## Getting Started
1. Clone the repo
2. Follow setup notes in \`frontend/README.md\` and \`backend/README.md\`
3. Create your first issues and sprint board

## License
MIT
`;
}

function buildStarterFiles(project) {
  const titleSlug = toSlug(project?.title, 'project');
  const readme = buildStarterReadme(project);

  const files = [
    {
      path: 'README.md',
      content: readme,
      message: 'docs: add generated project README',
    },
    {
      path: '.gitignore',
      content: `node_modules
dist
build
.env
.env.local
.DS_Store
coverage
.idea
.vscode
`,
      message: 'chore: add gitignore',
    },
    {
      path: 'docs/TECH_STACK.md',
      content: `# Tech Stack

## Frontend
- React
- Tailwind CSS

## Backend
- Node.js
- Express
- MongoDB

## Suggested Integrations
- Auth provider
- Analytics
- CI/CD
`,
      message: 'docs: add tech stack guide',
    },
    {
      path: 'frontend/README.md',
      content: `# Frontend

## Setup
1. Install dependencies
2. Start dev server

## Suggested Structure
- \`src/components\`
- \`src/pages\`
- \`src/services\`
- \`src/styles\`
`,
      message: 'docs: add frontend starter notes',
    },
    {
      path: 'backend/README.md',
      content: `# Backend

## Setup
1. Install dependencies
2. Configure env vars
3. Start API server

## Suggested Structure
- \`routes/\`
- \`models/\`
- \`services/\`
- \`utils/\`
`,
      message: 'docs: add backend starter notes',
    },
    {
      path: 'tasks/BACKLOG.md',
      content: `# Backlog

## Sprint 0
- [ ] Project setup and architecture
- [ ] Define acceptance criteria

## Sprint 1
- [ ] Build MVP flows
- [ ] Add core API endpoints

## Sprint 2
- [ ] QA, polish, and demo prep
`,
      message: 'docs: add starter backlog',
    },
    {
      path: `src/${titleSlug}.placeholder`,
      content: 'Starter placeholder file generated by DevCraft.\n',
      message: 'chore: add starter placeholder',
    },
  ];

  return files;
}

function buildStarterIssues(project) {
  const roadmap = Array.isArray(project?.roadmap) ? project.roadmap : [];
  const roles = Array.isArray(project?.roles) ? project.roles : [];
  const issues = [
    {
      title: 'Define MVP scope and acceptance criteria',
      body: `Project: ${project?.title || 'Untitled'}\n\nAlign on MVP scope, success metrics, and release checklist.`,
      labels: ['planning'],
    },
    {
      title: 'Set up frontend and backend starter architecture',
      body: 'Create base folders, linting, environment setup, and deployment scripts.',
      labels: ['setup', 'tech-debt'],
    },
  ];

  roadmap.slice(0, 5).forEach((phase, index) => {
    issues.push({
      title: `Roadmap: ${String(phase?.title || `Phase ${index + 1}`).trim()}`,
      body: String(phase?.objective || 'Complete this roadmap milestone and capture deliverables.'),
      labels: ['roadmap'],
    });
  });

  roles.slice(0, 5).forEach((role) => {
    issues.push({
      title: `Recruit ${String(role?.title || 'Contributor').trim()}`,
      body: `Required skills: ${Array.isArray(role?.skills) ? role.skills.join(', ') : 'N/A'}`,
      labels: ['hiring'],
    });
  });

  return issues.slice(0, 10);
}

async function createOrUpdateRepoFile({ owner, repo, path, content, token, message }) {
  const encodedPath = String(path || '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  let existingSha = null;
  try {
    const existing = await githubApiRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`,
      { token }
    );
    existingSha = existing?.sha || null;
  } catch (error) {
    if (error?.statusCode !== 404) {
      throw error;
    }
  }

  return githubApiRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`,
    {
      method: 'PUT',
      token,
      body: {
        message: message || `chore: add ${path}`,
        content: Buffer.from(String(content || ''), 'utf8').toString('base64'),
        ...(existingSha ? { sha: existingSha } : {}),
      },
    }
  );
}

function wait(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withGitHubRetry(task, options = {}) {
  const attempts = Number(options?.attempts) > 0 ? Number(options.attempts) : 4;
  const delayMs = Number(options?.delayMs) > 0 ? Number(options.delayMs) : 350;
  const retriableStatusCodes = new Set(
    Array.isArray(options?.retriableStatusCodes) && options.retriableStatusCodes.length > 0
      ? options.retriableStatusCodes
      : [404, 409, 429, 500, 502, 503, 504]
  );

  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      const shouldRetry =
        attempt < attempts &&
        (retriableStatusCodes.has(Number(error?.statusCode)) ||
          String(error?.message || '').toLowerCase().includes('fetch failed'));
      if (!shouldRetry) {
        throw error;
      }
      await wait(delayMs * attempt);
    }
  }

  throw lastError || new Error('GitHub request failed');
}

function normalizeContributor(item = {}) {
  return {
    id: String(item?.id || ''),
    login: item?.login || '',
    avatarUrl: item?.avatar_url || '',
    profileUrl: item?.html_url || '',
    contributions: Number(item?.contributions) || 0,
    type: item?.type || 'User',
  };
}

function mapLanguageBreakdown(languageBytes = {}) {
  const entries = Object.entries(languageBytes || {}).map(([language, bytes]) => ({
    language,
    bytes: Number(bytes) || 0,
  }));
  const total = entries.reduce((sum, item) => sum + item.bytes, 0);
  return entries
    .sort((a, b) => b.bytes - a.bytes)
    .map((item) => ({
      ...item,
      percentage: total > 0 ? Number(((item.bytes / total) * 100).toFixed(1)) : 0,
    }));
}

function isProjectMember(project, userId) {
  const normalizedUserId = String(userId || '');
  if (!normalizedUserId) return false;
  return Array.isArray(project?.members)
    ? project.members.some(
        (member) => String(member?.user?._id || member?.user || '') === normalizedUserId
      )
    : false;
}

function isProjectCollaborator(project, userId) {
  const normalizedUserId = String(userId || '');
  if (!normalizedUserId) return false;
  const ownerId = String(project?.owner?._id || project?.owner || '');
  if (ownerId && ownerId === normalizedUserId) return true;
  return isProjectMember(project, normalizedUserId);
}

function estimateProjectWeeks(project = {}) {
  const startDate = new Date(project.startDate || project.createdAt || Date.now());
  const endDate = new Date(project.endDate || Date.now());

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 8;
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs <= 0) return 8;

  const diffWeeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(4, Math.min(52, diffWeeks));
}

function buildFallbackRoadmap(project = {}) {
  const totalWeeks = estimateProjectWeeks(project);
  const split = [
    Math.max(1, Math.round(totalWeeks * 0.2)),
    Math.max(1, Math.round(totalWeeks * 0.25)),
    Math.max(1, Math.round(totalWeeks * 0.35)),
  ];
  const allocated = split.reduce((sum, value) => sum + value, 0);
  const phaseWeeks = [...split, Math.max(1, totalWeeks - allocated)];
  const roleOwners = (Array.isArray(project.roles) ? project.roles : [])
    .map((role) => String(role?.title || '').trim())
    .filter(Boolean)
    .slice(0, 3);

  let weekCursor = 1;
  const defaultPhases = [
    {
      phase: 'phase_1',
      title: 'Discovery and Planning',
      objective: 'Finalize scope, goals, and implementation plan.',
      deliverables: ['Scope doc', 'Milestones', 'Task backlog'],
    },
    {
      phase: 'phase_2',
      title: 'Foundation Setup',
      objective: 'Set up project architecture, environments, and core modules.',
      deliverables: ['Repo setup', 'Core architecture', 'Initial APIs'],
    },
    {
      phase: 'phase_3',
      title: 'Feature Development',
      objective: 'Implement and integrate key user-facing features.',
      deliverables: ['Core features', 'Integration tests', 'Feedback iteration'],
    },
    {
      phase: 'phase_4',
      title: 'Stabilization and Launch',
      objective: 'Polish, test, and prepare for release.',
      deliverables: ['QA pass', 'Performance checks', 'Launch checklist'],
    },
  ];

  return defaultPhases.map((phase, index) => {
    const durationWeeks = phaseWeeks[index];
    const startWeek = weekCursor;
    const endWeek = weekCursor + durationWeeks - 1;
    weekCursor = endWeek + 1;

    return {
      ...phase,
      startWeek,
      endWeek,
      durationWeeks,
      progress: 0,
      owners: roleOwners.length > 0 ? roleOwners : ['Project Team'],
    };
  });
}

function tokenizeText(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9+#.-]+/g)
    .map((token) => token.trim())
    .filter(Boolean);
}

function buildVirtualCtoCacheKey(userId, rawIdea) {
  return `${String(userId || '')}::${String(rawIdea || '').trim().toLowerCase()}`;
}

function cleanupVirtualCtoCache() {
  const now = Date.now();
  for (const [key, entry] of virtualCtoPackageCache.entries()) {
    if (!entry || Number(entry.expiresAt) <= now) {
      virtualCtoPackageCache.delete(key);
    }
  }

  if (virtualCtoPackageCache.size <= VIRTUAL_CTO_CACHE_MAX_ITEMS) return;
  const keys = [...virtualCtoPackageCache.keys()];
  const overflow = virtualCtoPackageCache.size - VIRTUAL_CTO_CACHE_MAX_ITEMS;
  for (let index = 0; index < overflow; index += 1) {
    virtualCtoPackageCache.delete(keys[index]);
  }
}

function readVirtualCtoCache(cacheKey) {
  cleanupVirtualCtoCache();
  const cached = virtualCtoPackageCache.get(cacheKey);
  if (!cached) return null;
  if (Number(cached.expiresAt) <= Date.now()) {
    virtualCtoPackageCache.delete(cacheKey);
    return null;
  }
  return cached.value || null;
}

function writeVirtualCtoCache(cacheKey, payload) {
  cleanupVirtualCtoCache();
  virtualCtoPackageCache.set(cacheKey, {
    value: payload,
    expiresAt: Date.now() + VIRTUAL_CTO_CACHE_TTL_MS,
  });
}

function toLowerSkillSet(skills = []) {
  return new Set(
    (Array.isArray(skills) ? skills : [])
      .map((skill) => String(skill || '').trim().toLowerCase())
      .filter(Boolean)
  );
}

function getPlanRequiredSkills(plan) {
  return Array.isArray(plan?.requiredSkills)
    ? plan.requiredSkills.map((skill) => String(skill || '').trim()).filter(Boolean)
    : [];
}

function scoreSkillMatch(requiredSkills = [], candidateSkills = []) {
  const required = toLowerSkillSet(requiredSkills);
  const candidate = toLowerSkillSet(candidateSkills);

  if (required.size === 0) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const matchedSkills = [...required].filter((skill) => candidate.has(skill));
  const missingSkills = [...required].filter((skill) => !candidate.has(skill));
  const score = matchedSkills.length / required.size;

  return {
    score: Number(score.toFixed(6)),
    matchedSkills,
    missingSkills,
  };
}

function buildArchitectQuery(plan, rawIdea) {
  const roleTitles = (Array.isArray(plan?.roles) ? plan.roles : [])
    .map((role) => String(role?.title || '').trim())
    .filter(Boolean)
    .join(', ');

  const requiredSkills = getPlanRequiredSkills(plan).join(', ');
  const techStack = (Array.isArray(plan?.techStack) ? plan.techStack : []).join(', ');

  return [
    `Idea: ${String(rawIdea || '').trim()}`,
    `Category: ${String(plan?.categoryLabel || plan?.category || '').trim()}`,
    roleTitles ? `Roles: ${roleTitles}` : '',
    requiredSkills ? `Required Skills: ${requiredSkills}` : '',
    techStack ? `Tech Stack: ${techStack}` : '',
  ]
    .filter(Boolean)
    .join('. ');
}

function mapArchitectCandidate(user, metadata = {}) {
  return {
    id: String(user?._id || user?.id || ''),
    name: user?.name || user?.email || 'Teammate',
    email: user?.email || '',
    role: user?.role || 'Member',
    skills: Array.isArray(user?.skills) ? user.skills : [],
    semanticScore: Number(metadata.semanticScore || 0),
    skillMatchScore: Number(metadata.skillMatchScore || 0),
    matchScore: Number(metadata.matchScore || 0),
    matchedSkills: Array.isArray(metadata.matchedSkills) ? metadata.matchedSkills : [],
    missingSkills: Array.isArray(metadata.missingSkills) ? metadata.missingSkills : [],
    matchSource: metadata.matchSource || 'skill',
    githubConnected: Boolean(user?.githubId || user?.githubUsername),
  };
}

async function findArchitectCandidates({ plan, rawIdea, currentUserId, limit = 6 }) {
  const normalizedLimit = Math.max(1, Math.min(10, Number(limit) || 6));
  const requiredSkills = getPlanRequiredSkills(plan);
  const queryTokens = tokenizeText(`${rawIdea} ${requiredSkills.join(' ')}`);
  const queryText = buildArchitectQuery(plan, rawIdea);

  const candidates = await User.find({ _id: { $ne: currentUserId } })
    .select(
      '+embedding name email role skills bio interests experienceLevel availabilityStatus githubId githubUsername'
    )
    .limit(300);

  const indexedCandidates = candidates.filter(
    (candidate) =>
      Array.isArray(candidate?.embedding) && candidate.embedding.length === EMBEDDING_DIMENSION
  );

  let semanticResults = [];
  if (indexedCandidates.length > 0) {
    try {
      const queryVector = await generateEmbedding(queryText);
      semanticResults = searchLocalVectors(queryVector, indexedCandidates, normalizedLimit * 4);
    } catch (error) {
      console.error('Virtual CTO semantic candidate search failed:', error?.message || error);
      semanticResults = [];
    }
  }

  const semanticMap = new Map(
    semanticResults.map((entry) => [String(entry?._id || entry?.id || ''), entry])
  );

  const scoredCandidates = candidates
    .map((candidateDoc) => {
      const candidate = typeof candidateDoc?.toObject === 'function'
        ? candidateDoc.toObject()
        : candidateDoc;
      const candidateId = String(candidate?._id || candidate?.id || '');
      const semanticScore = Number(semanticMap.get(candidateId)?.semanticScore || 0);
      const skillAnalysis = scoreSkillMatch(requiredSkills, candidate?.skills || []);
      const userText = [
        candidate?.role,
        candidate?.bio,
        ...(Array.isArray(candidate?.skills) ? candidate.skills : []),
      ]
        .join(' ')
        .toLowerCase();
      const keywordHits = queryTokens.reduce(
        (count, token) => (userText.includes(token) ? count + 1 : count),
        0
      );
      const keywordScore =
        queryTokens.length > 0 ? Number((keywordHits / queryTokens.length).toFixed(6)) : 0;

      const matchScore = Number(
        (semanticScore * 0.55 + skillAnalysis.score * 0.35 + keywordScore * 0.1).toFixed(6)
      );

      return mapArchitectCandidate(candidate, {
        semanticScore,
        skillMatchScore: skillAnalysis.score,
        matchScore,
        matchedSkills: skillAnalysis.matchedSkills,
        missingSkills: skillAnalysis.missingSkills,
        matchSource: semanticScore > 0 ? 'semantic+skills' : 'skills+keyword',
      });
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, normalizedLimit);

  return scoredCandidates;
}

function computeSetIntersectionSize(setA, setB) {
  let count = 0;
  for (const value of setA) {
    if (setB.has(value)) count += 1;
  }
  return count;
}

function buildCandidateTeammateSuggestions(candidates = [], requiredSkills = []) {
  const normalizedCandidates = Array.isArray(candidates) ? candidates : [];
  const required = toLowerSkillSet(requiredSkills);
  const suggestions = [];

  for (let index = 0; index < normalizedCandidates.length; index += 1) {
    for (let peerIndex = index + 1; peerIndex < normalizedCandidates.length; peerIndex += 1) {
      const candidateA = normalizedCandidates[index];
      const candidateB = normalizedCandidates[peerIndex];
      const skillsA = toLowerSkillSet(candidateA?.skills || []);
      const skillsB = toLowerSkillSet(candidateB?.skills || []);
      const union = new Set([...skillsA, ...skillsB]);
      const overlapRequired = computeSetIntersectionSize(required, union);
      const overlapBetweenCandidates = computeSetIntersectionSize(skillsA, skillsB);
      const complementarity = Math.max(0, union.size - overlapBetweenCandidates);
      const coverageScore = required.size > 0 ? overlapRequired / required.size : 0;
      const synergyScore = Number((coverageScore * 0.7 + (complementarity / Math.max(1, union.size)) * 0.3).toFixed(6));

      if (synergyScore <= 0) continue;

      const uncovered = [...required].filter((skill) => !union.has(skill)).slice(0, 5);
      suggestions.push({
        pair: [
          { id: candidateA.id, name: candidateA.name },
          { id: candidateB.id, name: candidateB.name },
        ],
        synergyScore,
        coveredSkills: [...required].filter((skill) => union.has(skill)).slice(0, 8),
        uncoveredSkills: uncovered,
        recommendation:
          uncovered.length === 0
            ? 'Strong pair for immediate execution.'
            : `Strong pair; add one teammate for: ${uncovered.join(', ')}`,
      });
    }
  }

  return suggestions.sort((a, b) => b.synergyScore - a.synergyScore).slice(0, 5);
}

async function buildEcosystemInsights(currentUserId) {
  const [projectSnapshot, skillSnapshot, userCount] = await Promise.all([
    Project.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$category', 'General'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    User.aggregate([
      { $match: { _id: { $ne: currentUserId } } },
      { $unwind: { path: '$skills', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: { $toLower: '$skills' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    User.countDocuments(),
  ]);

  return {
    activeCommunitySize: userCount,
    topProjectCategories: projectSnapshot.map((item) => ({
      category: String(item?._id || 'General'),
      projects: Number(item?.count || 0),
    })),
    topCommunitySkills: skillSnapshot.map((item) => ({
      skill: String(item?._id || '').trim(),
      users: Number(item?.count || 0),
    })),
  };
}

function buildUserContext(user = {}) {
  return {
    id: String(user?._id || ''),
    name: user?.name || '',
    role: user?.role || '',
    skills: Array.isArray(user?.skills) ? user.skills : [],
    interests: Array.isArray(user?.interests) ? user.interests : [],
    availabilityStatus: user?.availabilityStatus || '',
  };
}

function hashVirtualCtoTextSeed(value = '') {
  return String(value || '').split('').reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) >>> 0, 0);
}

function normalizeVirtualCtoCategory(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized.includes('mobile')) return 'mobile';
  if (normalized.includes('web3') || normalized.includes('blockchain') || normalized.includes('crypto')) return 'web3';
  if (normalized.includes('ai') || normalized.includes('ml') || normalized.includes('machine')) return 'ai';
  if (normalized.includes('ecommerce') || normalized.includes('e-commerce') || normalized.includes('market')) return 'ecommerce';
  if (normalized.includes('saas') || normalized.includes('dashboard') || normalized.includes('platform')) return 'saas';
  return 'other';
}

function isVirtualCtoIdeaSuggestionRequest(rawIdea = '') {
  const normalized = String(rawIdea || '').trim().toLowerCase();
  if (!normalized) return false;
  if (/^(build|create|make)\b/.test(normalized) && normalized.length >= 20) return false;

  const explicitPatterns = [
    /\bsuggest\b.*\b(projec|project|idea)/i,
    /\brecommend\b.*\b(projec|project|idea)/i,
    /\bgive me\b.*\b(projec|project|idea)/i,
    /\bproject ideas?\b/i,
    /\bideas? for hackathon\b/i,
    /\bwhat should i build\b/i,
    /\bany\b.*\bproject\b/i,
    /\bneed\b.*\bproject\b/i,
  ];
  if (explicitPatterns.some((pattern) => pattern.test(normalized))) return true;

  const queryTokens = tokenizeText(normalized);
  const hasGenericIntent =
    normalized.includes('project') ||
    normalized.includes('projec') ||
    normalized.includes('idea');
  const hasSpecificDomain = /(dashboard|marketplace|chat|social|mobile|saas|web3|ai|ml|ecommerce|fintech|edtech|health|crm|booking|analytics|automation|portfolio|app|tool|website|system)/i.test(normalized);

  return hasGenericIntent && !hasSpecificDomain && queryTokens.length <= 8;
}

function buildVirtualCtoAgentDirective(rawIdea = '') {
  const normalized = String(rawIdea || '').trim().toLowerCase();
  const tokenCount = tokenizeText(normalized).length;
  const suggestionIntent = isVirtualCtoIdeaSuggestionRequest(rawIdea);

  if (suggestionIntent) {
    return {
      mode: 'suggest_projects',
      modeLabel: 'Project Suggestions',
      reason: 'Prompt asks for ideas or is too broad for direct blueprint execution.',
      nextAction: 'Return multiple project ideas tailored to the user profile and ecosystem.',
      confidence: 0.92,
    };
  }

  if (normalized.length >= 12 && tokenCount >= 3) {
    return {
      mode: 'build_blueprint',
      modeLabel: 'Blueprint Generation',
      reason: 'Prompt contains enough implementation context to build a full plan.',
      nextAction: 'Generate project blueprint with stack, roadmap, roles, and teammate suggestions.',
      confidence: 0.88,
    };
  }

  return {
    mode: 'suggest_projects',
    modeLabel: 'Project Suggestions',
    reason: 'Prompt is short/ambiguous. Starting with ideas is the safest first step.',
    nextAction: 'Return curated project ideas; user can pick one for full blueprint generation.',
    confidence: 0.72,
  };
}

function inferVirtualCtoPreferredCategories(user = {}, ecosystemInsights = null) {
  const scores = new Map(VIRTUAL_CTO_IDEA_CATEGORIES.map((category) => [category, 0]));
  const userText = [
    user?.role,
    user?.bio,
    ...(Array.isArray(user?.skills) ? user.skills : []),
    ...(Array.isArray(user?.interests) ? user.interests : []),
  ]
    .join(' ')
    .toLowerCase();

  const keywordMap = {
    mobile: ['mobile', 'android', 'ios', 'react native', 'flutter'],
    web3: ['web3', 'blockchain', 'crypto', 'solidity', 'defi'],
    ai: ['ai', 'ml', 'machine learning', 'llm', 'data science', 'prompt'],
    ecommerce: ['ecommerce', 'e-commerce', 'shop', 'store', 'checkout', 'payments'],
    saas: ['saas', 'dashboard', 'b2b', 'platform', 'analytics', 'crm'],
  };

  Object.entries(keywordMap).forEach(([category, keywords]) => {
    const hits = keywords.reduce((count, keyword) => (
      userText.includes(keyword) ? count + 1 : count
    ), 0);
    if (hits > 0) {
      scores.set(category, (scores.get(category) || 0) + hits * 1.6);
    }
  });

  const communityCategories = Array.isArray(ecosystemInsights?.topProjectCategories)
    ? ecosystemInsights.topProjectCategories
    : [];
  communityCategories.slice(0, 5).forEach((item) => {
    const category = normalizeVirtualCtoCategory(item?.category || '');
    const projects = Number(item?.projects) || 0;
    const communityWeight = Math.min(2.4, Math.max(0.6, projects / 4));
    scores.set(category, (scores.get(category) || 0) + communityWeight);
  });

  const rankedCategories = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  return uniqueCaseInsensitive([...rankedCategories, ...VIRTUAL_CTO_IDEA_CATEGORIES]).slice(0, 5);
}

function buildVirtualCtoIdeaAlignmentReason(plan = {}, user = {}) {
  const userSkillSet = new Set(
    (Array.isArray(user?.skills) ? user.skills : [])
      .map((skill) => String(skill || '').trim().toLowerCase())
      .filter(Boolean)
  );
  const userInterestSet = new Set(
    (Array.isArray(user?.interests) ? user.interests : [])
      .map((interest) => String(interest || '').trim().toLowerCase())
      .filter(Boolean)
  );
  const requiredSkills = (Array.isArray(plan?.requiredSkills) ? plan.requiredSkills : [])
    .map((skill) => String(skill || '').trim().toLowerCase())
    .filter(Boolean);
  const matchedSkills = requiredSkills.filter((skill) => userSkillSet.has(skill));

  if (matchedSkills.length > 0) {
    return `Fits your skills: ${matchedSkills.slice(0, 3).join(', ')}`;
  }

  const planText = [
    plan?.title,
    plan?.summary,
    plan?.description,
    plan?.categoryLabel,
  ]
    .join(' ')
    .toLowerCase();
  const matchedInterests = [...userInterestSet].filter((interest) => planText.includes(interest));
  if (matchedInterests.length > 0) {
    return `Aligned with your interests: ${matchedInterests.slice(0, 3).join(', ')}`;
  }

  const userRole = String(user?.role || '').trim();
  if (userRole) {
    return `Good fit for your role focus: ${userRole}`;
  }

  return 'Balanced scope for a strong hackathon demo and clear execution.';
}

function buildVirtualCtoIdeaSuggestions({ rawIdea, user, ecosystemInsights, limit = 6 }) {
  const preferredCategories = inferVirtualCtoPreferredCategories(user, ecosystemInsights);
  const fallbackCategories = VIRTUAL_CTO_IDEA_CATEGORIES;
  const categoryQueue = uniqueCaseInsensitive([...preferredCategories, ...fallbackCategories]);
  const seed = hashVirtualCtoTextSeed(rawIdea || user?._id || Date.now());

  const promptPool = [];
  categoryQueue.forEach((category, categoryIndex) => {
    const prompts = Array.isArray(VIRTUAL_CTO_IDEA_PROMPTS[category]) ? VIRTUAL_CTO_IDEA_PROMPTS[category] : [];
    if (prompts.length === 0) return;

    const offset = (seed + categoryIndex) % prompts.length;
    for (let index = 0; index < prompts.length; index += 1) {
      promptPool.push(prompts[(index + offset) % prompts.length]);
    }
  });

  const uniquePrompts = uniqueCaseInsensitive(promptPool).slice(0, Math.max(3, Number(limit) || 6));
  return uniquePrompts.map((ideaPrompt, index) => {
    const plan = generateVirtualCtoPlan(ideaPrompt);
    return {
      id: `idea_${index + 1}`,
      prompt: ideaPrompt,
      title: plan?.title || `Project Idea ${index + 1}`,
      summary: plan?.summary || String(plan?.description || '').slice(0, 220),
      category: plan?.category || 'other',
      categoryLabel: plan?.categoryLabel || 'General Product',
      techStack: Array.isArray(plan?.techStack) ? plan.techStack.slice(0, 6) : [],
      roles: (Array.isArray(plan?.roles) ? plan.roles : []).slice(0, 3).map((role) => role?.title).filter(Boolean),
      estimatedWeeks: Number(plan?.estimatedWeeks) || null,
      commitment: plan?.commitment || '',
      alignmentReason: buildVirtualCtoIdeaAlignmentReason(plan, user),
    };
  });
}

async function buildVirtualCtoPackage({ rawIdea, user }) {
  const startedAt = Date.now();
  const cacheKey = buildVirtualCtoCacheKey(user?._id, rawIdea);
  const cachedPayload = readVirtualCtoCache(cacheKey);
  if (cachedPayload) {
    return {
      ...cachedPayload,
      meta: {
        ...(cachedPayload?.meta || {}),
        cached: true,
        generatedInMs: Date.now() - startedAt,
      },
    };
  }

  const ecosystemInsights = await buildEcosystemInsights(user?._id);
  const basePlan = generateVirtualCtoPlan(rawIdea);

  let plan = basePlan;
  try {
    plan = await enhancePlanWithLlm(basePlan, rawIdea, {
      userContext: buildUserContext(user),
      ecosystemInsights,
    });
  } catch (error) {
    console.error('Virtual CTO LLM enhancement fallback:', error?.message || error);
  }

  const candidates = await findArchitectCandidates({
    plan,
    rawIdea,
    currentUserId: user?._id,
    limit: 8,
  });
  const teammateSuggestions = buildCandidateTeammateSuggestions(
    candidates,
    getPlanRequiredSkills(plan)
  );

  const payload = {
    plan,
    candidates,
    teammateSuggestions,
    ecosystemInsights,
    meta: {
      generationMode: plan?.generationMode || 'heuristic',
      requiredSkillsCount: Array.isArray(plan?.requiredSkills) ? plan.requiredSkills.length : 0,
      candidatesCount: candidates.length,
      teammatePairSuggestionsCount: teammateSuggestions.length,
      cached: false,
      generatedInMs: Date.now() - startedAt,
    },
  };
  writeVirtualCtoCache(cacheKey, payload);
  return payload;
}

function writeStreamChunk(res, payload) {
  res.write(`${JSON.stringify(payload)}\n`);
}

function uniqueCaseInsensitive(values = []) {
  const seen = new Set();
  const result = [];
  for (const rawValue of Array.isArray(values) ? values : []) {
    const value = String(rawValue || '').trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function buildProjectAnalysisIdea(project = {}, teamMembers = []) {
  const rolesText = (Array.isArray(project?.roles) ? project.roles : [])
    .map((role) => {
      const title = String(role?.title || '').trim();
      const skills = Array.isArray(role?.skills) ? role.skills.join(', ') : '';
      const spots = Number(role?.spots) || 0;
      return `${title} (skills: ${skills}; open spots: ${spots})`;
    })
    .filter(Boolean)
    .join(' | ');

  const teamText = (Array.isArray(teamMembers) ? teamMembers : [])
    .map((member) => {
      const name = member?.name || member?.email || 'Member';
      const role = member?.projectRole || 'Contributor';
      const skills = Array.isArray(member?.skills) ? member.skills.join(', ') : '';
      return `${name} as ${role} (skills: ${skills})`;
    })
    .join(' | ');

  return [
    `Project title: ${project?.title || ''}`,
    `Description: ${project?.description || ''}`,
    `Source code: ${project?.sourceCodeUrl || 'Not provided'}`,
    `Category: ${project?.category || 'General'}`,
    `Commitment: ${project?.commitment || 'Flexible'}`,
    `Current open roles: ${rolesText || 'None'}`,
    `Current team (${teamMembers.length} members): ${teamText || 'No team members listed'}`,
    `Goal: analyze skill gaps, propose required skills, and recommend openings and candidates.`,
  ]
    .filter(Boolean)
    .join('. ');
}

function getRoleRequiredSkills(role) {
  return uniqueCaseInsensitive(
    (Array.isArray(role?.skills) ? role.skills : []).map((skill) => String(skill || '').trim())
  );
}

function scoreRoleCandidate(role, candidate) {
  const roleSkills = new Set(getRoleRequiredSkills(role).map((skill) => skill.toLowerCase()));
  const candidateSkills = new Set(
    (Array.isArray(candidate?.skills) ? candidate.skills : [])
      .map((skill) => String(skill || '').trim().toLowerCase())
      .filter(Boolean)
  );
  if (roleSkills.size === 0) return { score: 0, matchedSkills: [] };

  const matchedSkills = [...roleSkills].filter((skill) => candidateSkills.has(skill));
  return {
    score: Number((matchedSkills.length / roleSkills.size).toFixed(6)),
    matchedSkills,
  };
}

function buildRoleCandidateMatches(roles = [], candidates = [], topPerRole = 8) {
  return (Array.isArray(roles) ? roles : [])
    .map((role) => {
      const rankedCandidates = (Array.isArray(candidates) ? candidates : [])
        .map((candidate) => {
          const roleScore = scoreRoleCandidate(role, candidate);
          const blendedScore = Number(
            (roleScore.score * 0.7 + Number(candidate?.matchScore || 0) * 0.3).toFixed(6)
          );
          return {
            ...candidate,
            roleScore: roleScore.score,
            matchedRoleSkills: roleScore.matchedSkills,
            blendedRoleScore: blendedScore,
          };
        })
        .filter((candidate) => candidate.roleScore > 0)
        .sort((a, b) => b.blendedRoleScore - a.blendedRoleScore)
        .slice(0, Math.max(1, Number(topPerRole) || 8));

      return {
        role: {
          title: String(role?.title || '').trim(),
          skills: getRoleRequiredSkills(role),
          spots: Number(role?.spots) > 0 ? Number(role.spots) : 1,
        },
        candidates: rankedCandidates,
      };
    })
    .filter((entry) => entry.role.title);
}

function mergeSuggestedRolesIntoProject(project, suggestedRoles = []) {
  const currentRoles = Array.isArray(project?.roles) ? project.roles : [];
  const currentByTitle = new Map(
    currentRoles.map((role) => [String(role?.title || '').trim().toLowerCase(), role])
  );

  let updated = false;
  for (const suggestedRole of Array.isArray(suggestedRoles) ? suggestedRoles : []) {
    const title = String(suggestedRole?.title || '').trim();
    if (!title) continue;
    const key = title.toLowerCase();
    const suggestedSkills = getRoleRequiredSkills(suggestedRole);

    if (currentByTitle.has(key)) {
      const existing = currentByTitle.get(key);
      const mergedSkills = uniqueCaseInsensitive([
        ...(Array.isArray(existing?.skills) ? existing.skills : []),
        ...suggestedSkills,
      ]);
      if (mergedSkills.length !== (Array.isArray(existing?.skills) ? existing.skills.length : 0)) {
        existing.skills = mergedSkills;
        updated = true;
      }
      if (Number(existing?.spots) < 1) {
        existing.spots = 1;
        updated = true;
      }
      continue;
    }

    currentRoles.push({
      title,
      skills: suggestedSkills,
      spots: Number(suggestedRole?.spots) > 0 ? Number(suggestedRole.spots) : 1,
      durationHours:
        Number.isFinite(Number(suggestedRole?.durationHours)) && Number(suggestedRole.durationHours) > 0
          ? Number(suggestedRole.durationHours)
          : null,
    });
    updated = true;
  }

  if (updated) {
    project.roles = currentRoles;
  }
  return updated;
}

function toProjectListItem(project, currentUserId = null) {
  const ownerId = String(project?.owner?._id || project?.owner || '');
  const normalizedCurrentUserId = currentUserId ? String(currentUserId) : '';
  const normalizedMembers = Array.isArray(project?.members) ? project.members : [];
  const computedTeamSize = 1 + normalizedMembers.length;

  let role = 'Owner';
  if (normalizedCurrentUserId && ownerId !== normalizedCurrentUserId) {
    const membership = normalizedMembers.find(
      (member) => String(member?.user?._id || member?.user || '') === normalizedCurrentUserId
    );
    role = membership?.role || 'Member';
  }

  const roadmap =
    Array.isArray(project?.roadmap) && project.roadmap.length > 0
      ? project.roadmap
      : buildFallbackRoadmap(project);
  const derivedProgress = calculateRoadmapProgress(roadmap);
  const normalizedProgress = roadmap.length > 0
    ? derivedProgress
    : Number(project.progress) || 0;

  return {
    id: String(project._id),
    title: project.title,
    status: project.status,
    role,
    description: project.description,
    teamSize: Math.max(1, project.teamSize || computedTeamSize),
    dueDate: formatDueDate(project.endDate),
    progress: normalizedProgress,
    type: normalizeProjectType(project.status),
    category: project.category,
    sourceCodeUrl: String(project.sourceCodeUrl || '').trim(),
    commitment: project.commitment,
    startDate: project.startDate,
    endDate: project.endDate,
    roles: project.roles || [],
    roadmapPhaseCount: roadmap.length,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function formatReadableDate(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function sanitizeProjectAnalysis(analysis) {
  if (!analysis || typeof analysis !== 'object') return null;

  const safeAnalysis = {
    analyzedAt: analysis.analyzedAt || null,
    autoUpdated: Boolean(analysis.autoUpdated),
    plan: analysis.plan || null,
    requiredSkills: Array.isArray(analysis.requiredSkills) ? analysis.requiredSkills : [],
    projectSkillGap: Array.isArray(analysis.projectSkillGap) ? analysis.projectSkillGap : [],
    candidates: Array.isArray(analysis.candidates) ? analysis.candidates : [],
    teammateSuggestions: Array.isArray(analysis.teammateSuggestions)
      ? analysis.teammateSuggestions
      : [],
    roleCandidateMatches: Array.isArray(analysis.roleCandidateMatches)
      ? analysis.roleCandidateMatches
      : [],
    meta: analysis.meta && typeof analysis.meta === 'object' ? analysis.meta : {},
  };

  return safeAnalysis;
}

function toProjectDetail(project, currentUser) {
  const owner = project.owner || {};
  const ownerId = String(owner._id || project.owner || '');
  const currentUserId = String(currentUser?._id || '');
  const isOwner = ownerId === currentUserId;
  const commitmentLabel = project.commitment
    ? String(project.commitment).replace(/_/g, ' ')
    : 'Flexible';

  const requiredSkills = Array.from(
    new Set(
      (project.roles || [])
        .flatMap((role) => (Array.isArray(role.skills) ? role.skills : []))
        .map((skill) => String(skill).trim())
        .filter(Boolean)
    )
  );

  const userSkills = new Set(
    Array.isArray(currentUser?.skills)
      ? currentUser.skills.map((skill) => String(skill).trim().toLowerCase())
      : []
  );

  const missingSkills = requiredSkills.filter(
    (skill) => !userSkills.has(String(skill).toLowerCase())
  );

  const normalizedMembers = Array.isArray(project.members) ? project.members : [];
  const isMember = normalizedMembers.some(
    (member) => String(member?.user?._id || member?.user || '') === currentUserId
  );
  const teamMembers = normalizedMembers
    .map((member) => {
      const user = member?.user || {};
      const userId = user?._id || member?.user;
      if (!userId) return null;
      return {
        id: String(userId),
        name: user.name || user.email || 'Team Member',
        role: member?.role || 'Contributor',
        isLead: false,
        avatar:
          user.avatar ||
          'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
      };
    })
    .filter(Boolean);

  const sourceRoadmap =
    Array.isArray(project?.roadmap) && project.roadmap.length > 0
      ? project.roadmap
      : buildFallbackRoadmap(project);
  const derivedProgress = calculateRoadmapProgress(sourceRoadmap);
  const normalizedProgress = sourceRoadmap.length > 0
    ? derivedProgress
    : Number(project.progress) || 0;

  return {
    id: String(project._id),
    title: project.title,
    status: project.status,
    progress: normalizedProgress,
    shortDescription: project.description,
    fullDescription: project.description,
    category: project.category || 'General',
    sourceCodeUrl: String(project.sourceCodeUrl || '').trim(),
    startDate: formatReadableDate(project.startDate || project.createdAt),
    isOwner,
    isMember,
    ownerId,
    missingSkills,
    roles: (project.roles || []).map((role, index) => ({
      id: role.id || `${project._id}-${index}`,
      title: role.title,
      skills: Array.isArray(role.skills) ? role.skills : [],
      commitment: commitmentLabel,
      spots: Number.isFinite(Number(role.spots)) ? Number(role.spots) : 1,
      durationHours: Number(role.durationHours) || null,
    })),
    roadmap: sourceRoadmap.map((phase, index) => {
      const normalizedStartWeek = Number(phase?.startWeek);
      const normalizedEndWeek = Number(phase?.endWeek);
      const normalizedDurationWeeks = Number(phase?.durationWeeks);
      return {
        id: `${project._id}-roadmap-${index}`,
        phase: String(phase?.phase || `phase_${index + 1}`),
        title: String(phase?.title || `Phase ${index + 1}`),
        objective: String(phase?.objective || ''),
        startWeek:
          Number.isFinite(normalizedStartWeek) && normalizedStartWeek > 0
            ? normalizedStartWeek
            : null,
        endWeek:
          Number.isFinite(normalizedEndWeek) && normalizedEndWeek > 0 ? normalizedEndWeek : null,
        durationWeeks:
          Number.isFinite(normalizedDurationWeeks) && normalizedDurationWeeks > 0
            ? normalizedDurationWeeks
            : null,
        deliverables: normalizeStringArray(phase?.deliverables || []),
        owners: normalizeStringArray(phase?.owners || []),
        progress: Number.isFinite(Number(phase?.progress))
          ? Math.max(0, Math.min(100, Math.round(Number(phase.progress))))
          : 0,
      };
    }),
    team: [
      {
        id: ownerId,
        name: owner.name || owner.email || 'Project Owner',
        role: 'Project Owner',
        isLead: true,
        avatar:
          owner.avatar ||
          'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
      },
      ...teamMembers,
    ],
    latestAnalysis: isOwner ? sanitizeProjectAnalysis(project.latestAnalysis) : null,
  };
}

function toBazaarFeedItems(projects, query = {}, options = {}) {
  const search = String(query.search || '')
    .trim()
    .toLowerCase();
  const skill = String(query.skill || '')
    .trim()
    .toLowerCase();
  const currentUserId = String(options.currentUserId || '');
  const pendingApplicationProjectIds =
    options.pendingApplicationProjectIds instanceof Set
      ? options.pendingApplicationProjectIds
      : new Set(
          (Array.isArray(options.pendingApplicationProjectIds)
            ? options.pendingApplicationProjectIds
            : []
          )
            .map((id) => String(id || '').trim())
            .filter(Boolean)
        );

  const items = projects.flatMap((project) => {
    const owner = project.owner || {};
    const ownerId = String(owner._id || project.owner || '');
    const projectId = String(project._id || '');
    const isOwner = Boolean(currentUserId) && ownerId === currentUserId;
    const isMember = Boolean(currentUserId) && isProjectMember(project, currentUserId);
    const hasPendingApplication = pendingApplicationProjectIds.has(projectId);

    return (project.roles || [])
      .filter((role) => role && role.title && (Number(role.spots) || 0) > 0)
      .map((role, index) => {
        const roleSkills = Array.isArray(role.skills) ? role.skills : [];
        const roleSpots = Number(role.spots) || 1;
        return {
          id: `${project._id}-${index}`,
          projectId,
          projectTitle: project.title,
          projectDescription: project.description,
          projectCategory: project.category || 'General',
          projectStatus: project.status,
          projectProgress: Number(project.progress) || 0,
          projectCommitment: project.commitment || 'Flexible',
          owner: {
            id: ownerId,
            name: owner.name || owner.email || 'Project Owner',
          },
          roleTitle: role.title,
          skills: roleSkills,
          spots: roleSpots,
          durationHours: Number(role.durationHours) || null,
          applied: hasPendingApplication,
          canApply: roleSpots > 0 && !isOwner && !isMember && !hasPendingApplication,
          isOwner,
          isMember,
          postedAt: project.updatedAt || project.createdAt,
        };
      });
  });

  return items
    .filter((item) => {
      if (skill) {
        const hasSkill = item.skills.some(
          (itemSkill) => String(itemSkill).trim().toLowerCase() === skill
        );
        if (!hasSkill) return false;
      }

      if (!search) return true;

      const searchCorpus = [
        item.projectTitle,
        item.projectDescription,
        item.projectCategory,
        item.roleTitle,
        item.owner?.name,
        ...(item.skills || []),
      ]
        .join(' ')
        .toLowerCase();
      return searchCorpus.includes(search);
    })
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
}

function buildProjectAgentCorpus(item = {}) {
  return [
    item?.projectTitle,
    item?.projectDescription,
    item?.projectCategory,
    item?.projectCommitment,
    item?.roleTitle,
    item?.owner?.name,
    ...(Array.isArray(item?.skills) ? item.skills : []),
  ]
    .map((value) => String(value || '').toLowerCase())
    .join(' ');
}

function normalizeLevel(value) {
  return String(value || '').trim().toLowerCase();
}

function mapExperienceLevel(value) {
  const normalized = normalizeLevel(value);
  if (normalized === 'expert') return 4;
  if (normalized === 'senior') return 3;
  if (normalized === 'mid-level' || normalized === 'mid level' || normalized === 'mid') return 2;
  if (normalized === 'junior') return 1;
  return 0;
}

function inferRequiredExperienceLevel(item = {}) {
  const roleText = `${item?.roleTitle || ''} ${item?.projectDescription || ''}`.toLowerCase();
  if (/\bexpert\b/.test(roleText)) return 4;
  if (/\bsenior\b/.test(roleText)) return 3;
  if (/\bmid[- ]?level\b|\bintermediate\b/.test(roleText)) return 2;
  if (/\bjunior\b/.test(roleText)) return 1;
  return 0;
}

function scoreProjectCommitmentFit(projectCommitment, userAvailabilityStatus) {
  const commitment = normalizeLevel(projectCommitment);
  const availability = normalizeLevel(userAvailabilityStatus);
  if (!availability || !commitment) return 0.45;

  if (commitment.includes('full') || commitment.includes('40h')) {
    if (availability === 'full-time') return 1;
    if (availability === 'part-time') return 0.45;
    if (availability === 'weekends') return 0.2;
    return 0.35;
  }

  if (commitment.includes('part')) {
    if (availability === 'part-time' || availability === 'full-time') return 1;
    if (availability === 'weekends') return 0.6;
    return 0.7;
  }

  if (commitment.includes('weekend')) {
    if (availability === 'weekends' || availability === 'full-time') return 1;
    if (availability === 'part-time') return 0.6;
    return 0.65;
  }

  return 0.6;
}

function scoreProjectRoleAlignment(roleText = '', userRole = '') {
  const normalizedRole = normalizeLevel(userRole);
  if (!normalizedRole) return { score: 0, matchedRoleTerms: [] };

  const roleCorpus = String(roleText || '').toLowerCase();
  const roleTokens = tokenizeText(normalizedRole).filter((token) => token.length > 2);
  if (roleTokens.length === 0) return { score: 0, matchedRoleTerms: [] };

  const matchedRoleTerms = roleTokens.filter((token) => roleCorpus.includes(token));
  const score = matchedRoleTerms.length / roleTokens.length;
  return {
    score: Number(score.toFixed(6)),
    matchedRoleTerms,
  };
}

function scoreProjectInterestAlignment(item = {}, userInterestSet = new Set()) {
  if (!(userInterestSet instanceof Set) || userInterestSet.size === 0) {
    return { score: 0, matchedInterests: [] };
  }

  const corpus = buildProjectAgentCorpus(item);
  const matchedInterests = [...userInterestSet].filter((interest) => corpus.includes(interest));
  const score = matchedInterests.length / userInterestSet.size;
  return {
    score: Number(score.toFixed(6)),
    matchedInterests,
  };
}

function scoreProjectAgentItem(item = {}, queryText = '', queryTokens = [], userContext = {}) {
  const userSkillSet = userContext?.skillSet instanceof Set ? userContext.skillSet : new Set();
  const userInterestSet = userContext?.interestSet instanceof Set ? userContext.interestSet : new Set();
  const userConnectionIds = userContext?.connectionIds instanceof Set ? userContext.connectionIds : new Set();
  const userFollowingIds = userContext?.followingIds instanceof Set ? userContext.followingIds : new Set();
  const corpus = buildProjectAgentCorpus(item);
  if (!corpus) return { score: 0, reasons: [] };

  const normalizedQuery = String(queryText || '').trim().toLowerCase();
  const matchedTerms = queryTokens.filter((token) => corpus.includes(token));
  const termCoverage = queryTokens.length > 0 ? matchedTerms.length / queryTokens.length : 0;
  const phraseBoost = normalizedQuery && corpus.includes(normalizedQuery) ? 1 : 0;

  const roleSkills = (Array.isArray(item?.skills) ? item.skills : [])
    .map((skill) => String(skill || '').trim().toLowerCase())
    .filter(Boolean);
  const uniqueRoleSkills = [...new Set(roleSkills)];
  const matchedSkills = uniqueRoleSkills.filter((skill) => userSkillSet.has(skill));
  const skillAlignment = uniqueRoleSkills.length > 0 ? matchedSkills.length / uniqueRoleSkills.length : 0;
  const roleAlignmentResult = scoreProjectRoleAlignment(
    `${item?.roleTitle || ''} ${item?.projectTitle || ''} ${item?.projectDescription || ''}`,
    userContext?.role || ''
  );
  const interestAlignmentResult = scoreProjectInterestAlignment(item, userInterestSet);
  const commitmentFit = scoreProjectCommitmentFit(
    item?.projectCommitment || '',
    userContext?.availabilityStatus || ''
  );

  const requiredExperience = inferRequiredExperienceLevel(item);
  const userExperience = mapExperienceLevel(userContext?.experienceLevel || '');
  const experienceAlignment =
    requiredExperience <= 0 || userExperience <= 0
      ? 0.55
      : Math.max(0, 1 - Math.abs(requiredExperience - userExperience) / 3);

  const postedAtMs = new Date(item?.postedAt || Date.now()).getTime();
  const ageDays = Number.isFinite(postedAtMs)
    ? Math.max(0, (Date.now() - postedAtMs) / (1000 * 60 * 60 * 24))
    : 999;
  const freshness = Math.max(0, 1 - ageDays / 30);
  const spots = Number(item?.spots) || 0;
  const availabilityBoost = Math.min(1, spots / 4);
  const ownerId = String(item?.owner?.id || '').trim();
  const networkBoost =
    ownerId && (userConnectionIds.has(ownerId) || userFollowingIds.has(ownerId)) ? 1 : 0;

  const score = Number(
    (
      termCoverage * 0.34 +
      phraseBoost * 0.12 +
      skillAlignment * 0.2 +
      roleAlignmentResult.score * 0.1 +
      interestAlignmentResult.score * 0.08 +
      commitmentFit * 0.06 +
      experienceAlignment * 0.05 +
      freshness * 0.03 +
      availabilityBoost * 0.01 +
      networkBoost * 0.01
    ).toFixed(6)
  );

  const reasons = [];
  if (matchedTerms.length > 0) {
    reasons.push(`Matched terms: ${matchedTerms.slice(0, 4).join(', ')}`);
  }
  if (matchedSkills.length > 0) {
    reasons.push(`Skill overlap: ${matchedSkills.slice(0, 4).join(', ')}`);
  }
  if (roleAlignmentResult.matchedRoleTerms.length > 0) {
    reasons.push(`Role fit: ${roleAlignmentResult.matchedRoleTerms.slice(0, 3).join(', ')}`);
  }
  if (interestAlignmentResult.matchedInterests.length > 0) {
    reasons.push(
      `Interest fit: ${interestAlignmentResult.matchedInterests.slice(0, 3).join(', ')}`
    );
  }
  if (commitmentFit >= 0.9) {
    reasons.push('Commitment matches your availability');
  }
  if (experienceAlignment >= 0.8) {
    reasons.push('Experience level aligns well');
  }
  if (networkBoost > 0) {
    reasons.push('Owner is in your network');
  }
  if (freshness > 0.65) {
    reasons.push('Recently active project');
  }
  if (spots > 1) {
    reasons.push(`${spots} open spots`);
  }

  return {
    score,
    reasons,
    matchedTerms,
    matchedSkills,
    matchedInterests: interestAlignmentResult.matchedInterests,
    matchedRoleTerms: roleAlignmentResult.matchedRoleTerms,
  };
}

async function notifyConnectionsAboutNewProject({ ownerId, ownerName, project }) {
  const owner = await User.findById(ownerId).select('connections');
  const rawConnections = Array.isArray(owner?.connections) ? owner.connections : [];
  const connectionIds = rawConnections
    .map((id) => String(id))
    .filter(Boolean)
    .filter((id) => id !== String(ownerId));

  if (connectionIds.length === 0) return 0;

  const existingUsers = await User.find({ _id: { $in: connectionIds } }).select('_id');
  const recipientIds = existingUsers.map((user) => user._id);

  if (recipientIds.length === 0) return 0;

  const notifications = recipientIds.map((recipientId) => ({
    recipient: recipientId,
    sender: ownerId,
    type: 'connection_project_created',
    project: project._id,
    title: 'New Project by Your Connection',
    message: `${ownerName} created a new project: "${project.title}".`,
    isRead: false,
  }));

  await Notification.insertMany(notifications, { ordered: false });
  return notifications.length;
}

// @desc    Create a new project
// @route   POST /api/project
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      category = '',
      sourceCodeUrl = '',
      roles = [],
      roadmap = [],
      startDate = null,
      endDate = null,
      commitment = '',
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const normalizedRoles = Array.isArray(roles)
      ? roles.map(normalizeRoleInput).filter(Boolean)
      : [];
    const normalizedRoadmap = normalizeRoadmapInput(roadmap);
    const computedProgress = calculateRoadmapProgress(normalizedRoadmap);
    const normalizedSourceCodeUrl = normalizeSourceCodeUrl(sourceCodeUrl);

    if (String(sourceCodeUrl || '').trim() && !normalizedSourceCodeUrl) {
      return res.status(400).json({
        error: 'Invalid source code URL. Use a valid http/https Git repository link.',
      });
    }

    const project = await Project.create({
      owner: req.user._id,
      title: String(title).trim(),
      description: String(description).trim(),
      category: String(category || '').trim(),
      sourceCodeUrl: normalizedSourceCodeUrl,
      roles: normalizedRoles,
      roadmap: normalizedRoadmap,
      startDate: startDate || null,
      endDate: endDate || null,
      commitment: String(commitment || '').trim(),
      members: [],
      status: computedProgress === 100 ? 'Completed' : 'In Progress',
      progress: computedProgress,
      teamSize: 1,
    });

    try {
      await ensureProjectGroupChat(project);
    } catch (chatError) {
      console.error('Ensure project group chat error:', chatError);
    }

    const ownerName = req.user.name || req.user.email || 'Someone';
    try {
      await notifyConnectionsAboutNewProject({
        ownerId: req.user._id,
        ownerName,
        project,
      });
    } catch (notifyError) {
      console.error('Project connection notification error:', notifyError);
    }

    return res.status(201).json({
      message: 'Project created successfully',
      project: toProjectListItem(project),
    });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Generate a project blueprint from a raw idea (Virtual CTO)
// @route   POST /api/project/virtual-cto/plan
// @access  Private
router.post('/virtual-cto/plan', protect, async (req, res) => {
  try {
    const rawIdea = String(req.body?.idea || '').trim();
    if (!rawIdea) {
      return res.status(400).json({ error: 'idea is required' });
    }

    const agentDirective = buildVirtualCtoAgentDirective(rawIdea);

    if (agentDirective.mode === 'suggest_projects') {
      const startedAt = Date.now();
      const ecosystemInsights = await buildEcosystemInsights(req.user?._id);
      const suggestedIdeas = buildVirtualCtoIdeaSuggestions({
        rawIdea,
        user: req.user,
        ecosystemInsights,
        limit: 6,
      });

      return res.status(200).json({
        suggestedIdeas,
        ecosystemInsights,
        agentDirective,
        meta: {
          generationMode: 'idea_suggestions',
          suggestionIntent: true,
          suggestedIdeasCount: suggestedIdeas.length,
          agentDirective,
          generatedInMs: Date.now() - startedAt,
        },
      });
    }

    if (rawIdea.length < 12) {
      return res.status(400).json({
        error: 'Please provide a bit more detail so the Virtual CTO can generate a useful plan',
      });
    }

    const payload = await buildVirtualCtoPackage({
      rawIdea,
      user: req.user,
    });

    payload.agentDirective = agentDirective;
    payload.meta = {
      ...(payload.meta || {}),
      agentDirective,
    };

    return res.status(200).json(payload);
  } catch (error) {
    console.error('Virtual CTO plan generation error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Stream Virtual CTO plan generation progress and result
// @route   POST /api/project/virtual-cto/stream
// @access  Private
router.post('/virtual-cto/stream', protect, async (req, res) => {
  const rawIdea = String(req.body?.idea || '').trim();
  if (!rawIdea) {
    return res.status(400).json({ error: 'idea is required' });
  }

  const agentDirective = buildVirtualCtoAgentDirective(rawIdea);
  const suggestionIntent = agentDirective.mode === 'suggest_projects';
  if (!suggestionIntent && rawIdea.length < 12) {
    return res.status(400).json({
      error: 'Please provide a bit more detail so the Virtual CTO can generate a useful plan',
    });
  }

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  try {
    if (suggestionIntent) {
      const startedAt = Date.now();
      writeStreamChunk(res, {
        type: 'status',
        message: `Agent mode: ${agentDirective.modeLabel}. ${agentDirective.nextAction}`,
      });
      writeStreamChunk(res, { type: 'status', message: 'Gathering personalized project ideas...' });
      const ecosystemInsights = await buildEcosystemInsights(req.user?._id);
      const suggestedIdeas = buildVirtualCtoIdeaSuggestions({
        rawIdea,
        user: req.user,
        ecosystemInsights,
        limit: 6,
      });
      const payload = {
        suggestedIdeas,
        ecosystemInsights,
        agentDirective,
        meta: {
          generationMode: 'idea_suggestions',
          suggestionIntent: true,
          suggestedIdeasCount: suggestedIdeas.length,
          agentDirective,
          generatedInMs: Date.now() - startedAt,
        },
      };

      writeStreamChunk(res, { type: 'insights', data: ecosystemInsights || null });
      writeStreamChunk(res, { type: 'idea_suggestions', data: suggestedIdeas });
      writeStreamChunk(res, {
        type: 'status',
        message: `Found ${suggestedIdeas.length} project ideas for you. Pick one to generate a full blueprint.`,
      });
      writeStreamChunk(res, { type: 'done', data: payload });
      return res.end();
    }

    writeStreamChunk(res, {
      type: 'status',
      message: `Agent mode: ${agentDirective.modeLabel}. ${agentDirective.nextAction}`,
    });
    writeStreamChunk(res, { type: 'status', message: 'Analyzing project idea...' });
    writeStreamChunk(res, { type: 'status', message: 'Building architecture and roadmap...' });
    const payload = await buildVirtualCtoPackage({
      rawIdea,
      user: req.user,
    });
    payload.agentDirective = agentDirective;
    payload.meta = {
      ...(payload.meta || {}),
      agentDirective,
    };
    writeStreamChunk(res, { type: 'insights', data: payload.ecosystemInsights || null });
    writeStreamChunk(res, { type: 'plan', data: payload.plan || null });
    writeStreamChunk(res, { type: 'candidates', data: payload.candidates || [] });
    writeStreamChunk(
      res,
      { type: 'teammate_suggestions', data: payload.teammateSuggestions || [] }
    );
    writeStreamChunk(res, {
      type: 'status',
      message:
        payload?.meta?.cached
          ? 'Loaded cached result for faster response.'
          : `Completed in ${payload?.meta?.generatedInMs || 0}ms.`,
    });

    writeStreamChunk(res, { type: 'done', data: payload });
    return res.end();
  } catch (error) {
    console.error('Virtual CTO stream error:', error);
    writeStreamChunk(res, {
      type: 'error',
      message: error?.message || 'Virtual CTO stream failed',
    });
    return res.end();
  }
});

// @desc    Improve project description text
// @route   POST /api/project/improve-description
// @access  Private
router.post('/improve-description', protect, async (req, res) => {
  try {
    const description = toCleanText(req.body?.description, 1600);
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }

    if (description.length < 20) {
      return res.status(400).json({
        error: 'Please provide a little more detail before auto-improving the description',
      });
    }

    const title = toCleanText(req.body?.title, 120);
    const category = toCleanText(req.body?.category, 60);
    const roleTitles = Array.isArray(req.body?.roles)
      ? req.body.roles
          .map((role) => toCleanText(role?.title, 80))
          .filter(Boolean)
          .slice(0, 8)
      : [];

    const result = await improveTextWithGemini(description, 'project', {
      title,
      category,
      roleTitles,
    });

    return res.status(200).json({
      description: result.text,
      meta: { mode: result.mode },
    });
  } catch (error) {
    console.error('Improve project description error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Apply to an open project role
// @route   POST /api/project/:id/apply
// @access  Private
router.post('/:id/apply', protect, async (req, res) => {
  try {
    const roleTitleInput = String(req.body?.roleTitle || '').trim();
    if (!roleTitleInput) {
      return res.status(400).json({ error: 'roleTitle is required to apply' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const ownerId = String(project.owner);
    const applicantId = String(req.user._id);

    if (ownerId === applicantId) {
      return res.status(400).json({ error: 'Project owner cannot apply to own project' });
    }

    const isAlreadyMember = (project.members || []).some(
      (member) => String(member.user) === applicantId
    );
    if (isAlreadyMember) {
      return res.status(400).json({ error: 'You are already a member of this project' });
    }

    const normalizedRequestedRole = roleTitleInput.toLowerCase();
    const matchingRole = (project.roles || []).find(
      (role) => String(role?.title || '').trim().toLowerCase() === normalizedRequestedRole
    );

    if (!matchingRole) {
      return res.status(404).json({ error: 'Requested role not found in this project' });
    }

    if ((Number(matchingRole.spots) || 0) < 1) {
      return res.status(400).json({ error: 'No spots left for this role' });
    }

    const existingPendingApplication = await Notification.findOne({
      recipient: project.owner,
      sender: req.user._id,
      project: project._id,
      type: 'project_application',
      status: 'pending',
    });

    if (existingPendingApplication) {
      return res.status(409).json({ error: 'You already have a pending application for this project' });
    }

    const applicantName = req.user.name || req.user.email || 'A user';
    const createdNotification = await Notification.create({
      recipient: project.owner,
      sender: req.user._id,
      type: 'project_application',
      project: project._id,
      roleTitle: matchingRole.title,
      title: 'New Project Application',
      message: `${applicantName} applied for "${matchingRole.title}" in "${project.title}".`,
      status: 'pending',
      isRead: false,
    });

    return res.status(201).json({
      message: 'Application submitted successfully',
      notificationId: String(createdNotification._id),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'You already have a pending application for this project' });
    }
    console.error('Apply to project error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Fetch current user's projects
// @route   GET /api/project/my
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).sort({ updatedAt: -1 });
    return res.status(200).json({
      projects: projects.map((project) => toProjectListItem(project, req.user._id)),
    });
  } catch (error) {
    console.error('Fetch my projects error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Fetch Project Bazaar feed (all open roles)
// @route   GET /api/project/bazaar
// @access  Private
router.get('/bazaar', protect, async (req, res) => {
  try {
    const [projects, pendingApplications] = await Promise.all([
      Project.find({
        status: { $ne: 'Completed' },
      }).populate('owner', 'name email'),
      Notification.find({
        sender: req.user._id,
        type: 'project_application',
        status: 'pending',
        project: { $ne: null },
      }).select('project'),
    ]);

    const pendingApplicationProjectIds = new Set(
      (Array.isArray(pendingApplications) ? pendingApplications : [])
        .map((notification) => String(notification?.project || '').trim())
        .filter(Boolean)
    );

    const items = toBazaarFeedItems(projects, req.query || {}, {
      currentUserId: req.user._id,
      pendingApplicationProjectIds,
    });

    return res.status(200).json({
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('Fetch project bazaar error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Agent search for project-role matches using query + user profile context
// @route   POST /api/project/agent-search
// @access  Private
router.post('/agent-search', protect, async (req, res) => {
  try {
    const queryText = String(req.body?.queryText || '').trim();
    if (queryText.length < 3) {
      return res.status(400).json({ error: 'queryText must be at least 3 characters' });
    }

    const [projects, pendingApplications] = await Promise.all([
      Project.find({
        status: { $ne: 'Completed' },
      }).populate('owner', 'name email'),
      Notification.find({
        sender: req.user._id,
        type: 'project_application',
        status: 'pending',
        project: { $ne: null },
      }).select('project'),
    ]);

    const pendingApplicationProjectIds = new Set(
      (Array.isArray(pendingApplications) ? pendingApplications : [])
        .map((notification) => String(notification?.project || '').trim())
        .filter(Boolean)
    );

    const baseItems = toBazaarFeedItems(projects, {}, {
      currentUserId: req.user._id,
      pendingApplicationProjectIds,
    });

    const queryTokens = tokenizeText(queryText);
    const userSkillSet = new Set(
      (Array.isArray(req.user?.skills) ? req.user.skills : [])
        .map((skill) => String(skill || '').trim().toLowerCase())
        .filter(Boolean)
    );
    const userInterestSet = new Set(
      (Array.isArray(req.user?.interests) ? req.user.interests : [])
        .map((interest) => String(interest || '').trim().toLowerCase())
        .filter(Boolean)
    );
    const userConnectionIds = new Set(
      (Array.isArray(req.user?.connections) ? req.user.connections : [])
        .map((id) => String(id || '').trim())
        .filter(Boolean)
    );
    const userFollowingIds = new Set(
      (Array.isArray(req.user?.following) ? req.user.following : [])
        .map((id) => String(id || '').trim())
        .filter(Boolean)
    );

    const userContext = {
      role: req.user?.role || '',
      availabilityStatus: req.user?.availabilityStatus || '',
      experienceLevel: req.user?.experienceLevel || '',
      skillSet: userSkillSet,
      interestSet: userInterestSet,
      connectionIds: userConnectionIds,
      followingIds: userFollowingIds,
    };

    const ranked = baseItems
      .map((item) => {
        const scored = scoreProjectAgentItem(item, queryText, queryTokens, userContext);
        return {
          ...item,
          agentScore: scored.score,
          agentReasons: scored.reasons,
          matchedTerms: scored.matchedTerms,
          matchedSkills: scored.matchedSkills,
          matchedInterests: scored.matchedInterests,
          matchedRoleTerms: scored.matchedRoleTerms,
        };
      })
      .filter((item) => item.canApply && item.agentScore > 0)
      .sort((a, b) => {
        if (b.agentScore !== a.agentScore) return b.agentScore - a.agentScore;
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      })
      .slice(0, 12);

    return res.status(200).json({
      results: ranked,
      meta: {
        queryText,
        totalCandidates: baseItems.length,
        returned: ranked.length,
        contextAware: true,
      },
    });
  } catch (error) {
    console.error('Agent project search error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Add an open role to project (owner only)
// @route   POST /api/project/:id/roles
// @access  Private
router.post('/:id/roles', protect, async (req, res) => {
  try {
    const normalizedRole = normalizeRoleInput(req.body || {});
    if (!normalizedRole) {
      return res.status(400).json({ error: 'Role title is required' });
    }

    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (String(project.owner?._id || project.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the project owner can post open roles' });
    }

    project.roles.push(normalizedRole);
    await project.save();

    return res.status(201).json({
      message: 'Open role posted successfully',
      project: toProjectDetail(project, req.user),
    });
  } catch (error) {
    console.error('Post open role error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Invite a user to a project (owner only)
// @route   POST /api/project/:id/invite
// @access  Private
router.post('/:id/invite', protect, async (req, res) => {
  try {
    const { userId, email, role } = req.body || {};

    if (!userId && !email) {
      return res.status(400).json({ error: 'Provide userId or email to invite' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the project owner can invite members' });
    }

    let invitedUser = null;
    if (userId) {
      invitedUser = await User.findById(userId);
    } else if (email) {
      invitedUser = await User.findOne({ email: String(email).trim().toLowerCase() });
    }

    if (!invitedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (String(invitedUser._id) === String(project.owner)) {
      return res.status(400).json({ error: 'Project owner is already part of this project' });
    }

    const existingMember = (project.members || []).some(
      (member) => String(member.user) === String(invitedUser._id)
    );
    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member of this project' });
    }

    const existingPendingInvite = await Notification.findOne({
      recipient: invitedUser._id,
      project: project._id,
      type: 'project_invite',
      status: 'pending',
    });

    if (existingPendingInvite) {
      return res.status(409).json({ error: 'A pending invite already exists for this user' });
    }

    const inviteRole = String(role || 'Contributor').trim() || 'Contributor';
    const senderName = req.user.name || req.user.email || 'A project owner';
    const notification = await Notification.create({
      recipient: invitedUser._id,
      sender: req.user._id,
      type: 'project_invite',
      project: project._id,
      inviteRole,
      title: 'Project Invitation',
      message: `${senderName} invited you to join "${project.title}" as ${inviteRole}.`,
      status: 'pending',
      isRead: false,
    });

    return res.status(201).json({
      message: 'Invitation sent successfully',
      notification: {
        id: String(notification._id),
        recipientId: String(invitedUser._id),
        projectId: String(project._id),
        inviteRole: notification.inviteRole,
        status: notification.status,
        createdAt: notification.createdAt,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'A pending invite already exists for this user' });
    }
    console.error('Invite member error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update project progress (owner only)
// @route   PATCH /api/project/:id/progress
// @access  Private
router.patch('/:id/progress', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (String(project.owner?._id || project.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the project owner can update progress' });
    }

    const roundedProgress = calculateRoadmapProgress(project.roadmap || []);
    project.progress = roundedProgress;

    if (roundedProgress === 100) {
      project.status = 'Completed';
    } else if (project.status === 'Completed') {
      project.status = 'In Progress';
    }

    await project.save();

    return res.status(200).json({
      message: 'Project progress recalculated from roadmap',
      project: toProjectDetail(project, req.user),
    });
  } catch (error) {
    console.error('Update project progress error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update project source code URL (owner or team member)
// @route   PATCH /api/project/:id/source-code
// @access  Private
router.patch('/:id/source-code', protect, async (req, res) => {
  try {
    if (!Object.prototype.hasOwnProperty.call(req.body || {}, 'sourceCodeUrl')) {
      return res.status(400).json({ error: 'sourceCodeUrl is required' });
    }

    const rawSourceCodeUrl = String(req.body?.sourceCodeUrl || '').trim();
    const normalizedSourceCodeUrl = normalizeSourceCodeUrl(rawSourceCodeUrl);
    if (rawSourceCodeUrl && !normalizedSourceCodeUrl) {
      return res.status(400).json({
        error: 'Invalid source code URL. Use a valid http/https Git repository link.',
      });
    }

    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!isProjectCollaborator(project, req.user._id)) {
      return res.status(403).json({
        error: 'Only project owner or team members can update source code URL',
      });
    }

    project.sourceCodeUrl = normalizedSourceCodeUrl;
    await project.save();

    return res.status(200).json({
      message: normalizedSourceCodeUrl
        ? 'Project source code URL updated'
        : 'Project source code URL removed',
      project: toProjectDetail(project, req.user),
    });
  } catch (error) {
    console.error('Update project source code URL error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update project roadmap (owner only)
// @route   PATCH /api/project/:id/roadmap
// @access  Private
router.patch('/:id/roadmap', protect, async (req, res) => {
  try {
    if (!Object.prototype.hasOwnProperty.call(req.body || {}, 'roadmap')) {
      return res.status(400).json({ error: 'roadmap array is required' });
    }

    if (!Array.isArray(req.body.roadmap)) {
      return res.status(400).json({ error: 'roadmap must be an array' });
    }

    const normalizedRoadmap = normalizeRoadmapInput(req.body.roadmap);
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (String(project.owner?._id || project.owner) !== String(req.user._id)) {
      return res.status(403).json({
        error: 'Only the project owner can update roadmap',
      });
    }

    project.roadmap = normalizedRoadmap;
    const derivedProgress = calculateRoadmapProgress(normalizedRoadmap);
    project.progress = derivedProgress;

    if (derivedProgress === 100) {
      project.status = 'Completed';
    } else if (project.status === 'Completed') {
      project.status = 'In Progress';
    }

    await project.save();

    return res.status(200).json({
      message: 'Project roadmap updated and progress recalculated',
      project: toProjectDetail(project, req.user),
    });
  } catch (error) {
    console.error('Update project roadmap error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Analyze project, update openings/skills, and suggest candidates
// @route   POST /api/project/:id/analyze
// @access  Private
router.post('/:id/analyze', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email skills role');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const ownerId = String(project.owner?._id || project.owner || '');
    const requesterId = String(req.user._id || '');
    const requesterIsOwner = ownerId === requesterId;
    if (!requesterIsOwner) {
      return res.status(403).json({ error: 'Only the project owner can analyze this project' });
    }

    const projectTeamMembers = [
      {
        id: ownerId,
        name: project.owner?.name || project.owner?.email || 'Project Owner',
        email: project.owner?.email || '',
        projectRole: 'Project Owner',
        skills: [],
      },
      ...(Array.isArray(project.members) ? project.members : []).map((member) => ({
        id: String(member?.user?._id || member?.user || ''),
        name: member?.user?.name || member?.user?.email || 'Team Member',
        email: member?.user?.email || '',
        projectRole: member?.role || 'Contributor',
        skills: Array.isArray(member?.user?.skills) ? member.user.skills : [],
      })),
    ];

    const rawIdea = buildProjectAnalysisIdea(project, projectTeamMembers);
    const virtualCtoPayload = await buildVirtualCtoPackage({
      rawIdea,
      user: req.user,
    });

    const suggestedRoles = Array.isArray(virtualCtoPayload?.plan?.roles)
      ? virtualCtoPayload.plan.roles
      : [];
    const requiredSkills = getPlanRequiredSkills(virtualCtoPayload?.plan);
    const projectCurrentSkills = uniqueCaseInsensitive(
      (Array.isArray(project.roles) ? project.roles : [])
        .flatMap((role) => (Array.isArray(role?.skills) ? role.skills : []))
        .map((skill) => String(skill || '').trim())
    );
    const projectSkillGap = requiredSkills.filter(
      (skill) => !projectCurrentSkills.map((s) => s.toLowerCase()).includes(String(skill).toLowerCase())
    );

    const autoUpdated = mergeSuggestedRolesIntoProject(project, suggestedRoles);

    const roleCandidateMatches = buildRoleCandidateMatches(
      toProjectDetail(project, req.user).roles || [],
      virtualCtoPayload.candidates || [],
      10
    );

    const analyzedAt = new Date().toISOString();
    const savedAnalysis = {
      analyzedAt,
      autoUpdated,
      plan: virtualCtoPayload.plan || null,
      requiredSkills,
      projectSkillGap,
      candidates: virtualCtoPayload.candidates || [],
      teammateSuggestions: virtualCtoPayload.teammateSuggestions || [],
      roleCandidateMatches,
      meta: virtualCtoPayload.meta || {},
    };

    project.latestAnalysis = savedAnalysis;
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');
    const updatedProjectDetail = toProjectDetail(updatedProject || project, req.user);

    return res.status(200).json({
      message: autoUpdated
        ? 'Project analyzed and openings updated automatically.'
        : 'Project analyzed successfully.',
      analyzedAt,
      autoUpdated,
      project: updatedProjectDetail,
      analysis: savedAnalysis,
    });
  } catch (error) {
    console.error('Project analyze error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Open positions from latest project analysis (owner only)
// @route   POST /api/project/:id/open-positions
// @access  Private
router.post('/:id/open-positions', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (String(project.owner?._id || project.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the project owner can open positions' });
    }

    const suggestedRoles = Array.isArray(project?.latestAnalysis?.plan?.roles)
      ? project.latestAnalysis.plan.roles
      : [];

    if (suggestedRoles.length === 0) {
      return res.status(400).json({
        error: 'No analyzed role suggestions found. Analyze the project first.',
      });
    }

    const updated = mergeSuggestedRolesIntoProject(project, suggestedRoles);
    if (!updated) {
      return res.status(200).json({
        message: 'All analyzed positions are already open.',
        updated: false,
        project: toProjectDetail(project, req.user),
      });
    }

    await project.save();

    const refreshed = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    return res.status(200).json({
      message: 'Open positions were added from the latest analysis.',
      updated: true,
      project: toProjectDetail(refreshed || project, req.user),
    });
  } catch (error) {
    console.error('Open positions from analysis error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Create GitHub starter kit for a project (owner only)
// @route   POST /api/project/:id/github/starter-kit
// @access  Private
router.post('/:id/github/starter-kit', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (String(project.owner?._id || project.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the project owner can create a starter kit' });
    }

    const githubToken = String(req.body?.githubToken || '').trim();
    if (!githubToken) {
      return res.status(400).json({
        error: 'githubToken is required. Use a GitHub token with repository write access.',
      });
    }

    const repoName = toSlug(req.body?.repoName || project.title, `project-${String(project._id).slice(-6)}`);
    const visibilityInput = String(req.body?.visibility || 'private').toLowerCase();
    const isPrivate = visibilityInput !== 'public';
    const shouldCreateIssues = req.body?.createIssues !== false;
    const shouldCreateBoilerplate = req.body?.createBoilerplate !== false;
    const starterDescription = String(req.body?.description || project.description || '').trim().slice(0, 220);

    const authenticatedUser = await githubApiRequest('/user', { token: githubToken });
    const ownerLogin = String(authenticatedUser?.login || '').trim();
    if (!ownerLogin) {
      return res.status(400).json({ error: 'Unable to resolve GitHub account from token' });
    }

    let createdRepo = null;
    try {
      createdRepo = await githubApiRequest('/user/repos', {
        method: 'POST',
        token: githubToken,
        body: {
          name: repoName,
          private: isPrivate,
          description: starterDescription || `Starter kit for ${project.title}`,
          // Initialize default branch so contents API can create/update files reliably.
          auto_init: true,
        },
      });
    } catch (createRepoError) {
      // If repo already exists in the authenticated account, continue with that repo.
      if (createRepoError?.statusCode === 422) {
        createdRepo = await githubApiRequest(
          `/repos/${encodeURIComponent(ownerLogin)}/${encodeURIComponent(repoName)}`,
          { token: githubToken }
        );
      } else {
        throw createRepoError;
      }
    }

    const repoUrl = String(createdRepo?.html_url || '').trim();
    if (!repoUrl) {
      return res.status(500).json({ error: 'GitHub repository created but URL was not returned' });
    }

    // Give GitHub a short window to make the newly created repository fully available.
    await withGitHubRetry(
      () =>
        githubApiRequest(
          `/repos/${encodeURIComponent(ownerLogin)}/${encodeURIComponent(repoName)}`,
          { token: githubToken }
        ),
      { attempts: 4, delayMs: 450, retriableStatusCodes: [404, 409, 500, 502, 503, 504] }
    );

    const filesCreated = [];
    const warnings = [];
    if (shouldCreateBoilerplate) {
      const starterFiles = buildStarterFiles(project);
      for (const file of starterFiles) {
        try {
          await withGitHubRetry(
            () =>
              createOrUpdateRepoFile({
                owner: ownerLogin,
                repo: repoName,
                path: file.path,
                content: file.content,
                token: githubToken,
                message: file.message,
              }),
            { attempts: 4, delayMs: 450, retriableStatusCodes: [404, 409, 500, 502, 503, 504] }
          );
          filesCreated.push(file.path);
        } catch (fileError) {
          warnings.push(`Unable to create file "${file.path}": ${fileError?.message || 'Unknown error'}`);
        }
      }
    } else {
      try {
        await withGitHubRetry(
          () =>
            createOrUpdateRepoFile({
              owner: ownerLogin,
              repo: repoName,
              path: 'README.md',
              content: buildStarterReadme(project),
              token: githubToken,
              message: 'docs: add generated project README',
            }),
          { attempts: 4, delayMs: 450, retriableStatusCodes: [404, 409, 500, 502, 503, 504] }
        );
        filesCreated.push('README.md');
      } catch (fileError) {
        warnings.push(`Unable to create file "README.md": ${fileError?.message || 'Unknown error'}`);
      }
    }

    const labelsToCreate = [
      { name: 'planning', color: '0E8A16', description: 'Planning and scope items' },
      { name: 'setup', color: '1D76DB', description: 'Project setup tasks' },
      { name: 'roadmap', color: '5319E7', description: 'Roadmap execution items' },
      { name: 'hiring', color: 'D93F0B', description: 'Recruitment related items' },
      { name: 'tech-debt', color: 'BFDADC', description: 'Refactor and cleanup tasks' },
    ];

    for (const label of labelsToCreate) {
      try {
        await githubApiRequest(
          `/repos/${encodeURIComponent(ownerLogin)}/${encodeURIComponent(repoName)}/labels`,
          {
            method: 'POST',
            token: githubToken,
            body: label,
          }
        );
      } catch (labelError) {
        if (labelError?.statusCode !== 422) {
          warnings.push(`Unable to create label "${label.name}": ${labelError.message}`);
        }
      }
    }

    const issuesCreated = [];
    if (shouldCreateIssues) {
      const starterIssues = buildStarterIssues(project);
      for (const issue of starterIssues) {
        try {
          const createdIssue = await githubApiRequest(
            `/repos/${encodeURIComponent(ownerLogin)}/${encodeURIComponent(repoName)}/issues`,
            {
              method: 'POST',
              token: githubToken,
              body: issue,
            }
          );
          issuesCreated.push({
            number: createdIssue?.number,
            title: createdIssue?.title,
            url: createdIssue?.html_url,
          });
        } catch (issueError) {
          warnings.push(`Unable to create issue "${issue.title}": ${issueError.message}`);
        }
      }
    }

    project.sourceCodeUrl = repoUrl;
    await project.save();

    const refreshed = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    return res.status(201).json({
      message:
        warnings.length > 0
          ? 'GitHub starter kit created with partial warnings'
          : 'GitHub starter kit created successfully',
      project: toProjectDetail(refreshed || project, req.user),
      repo: {
        name: repoName,
        fullName: `${ownerLogin}/${repoName}`,
        url: repoUrl,
        private: isPrivate,
      },
      filesCreated,
      issuesCreated,
      warnings,
    });
  } catch (error) {
    console.error('Create GitHub starter kit error:', error);
    if (error?.statusCode === 401) {
      return res.status(401).json({ error: 'Invalid GitHub token or missing permissions' });
    }
    if (error?.statusCode === 403) {
      return res.status(403).json({
        error: 'GitHub denied this action. Ensure your token has repo write permissions.',
      });
    }
    if (error?.statusCode === 404) {
      return res.status(404).json({
        error: 'GitHub repository endpoint was not reachable yet. Please retry once in a few seconds.',
      });
    }
    if (error?.statusCode === 422) {
      return res.status(409).json({
        error: 'Repository creation failed. The repository name may already exist in your account.',
      });
    }
    if (error?.statusCode === 409) {
      return res.status(409).json({
        error: 'Repository is not ready for file creation yet. Try again or initialize the repo first.',
      });
    }
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
});

// @desc    Fetch GitHub repository insights for project source code URL
// @route   GET /api/project/:id/github/insights
// @access  Private
router.get('/:id/github/insights', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email');
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const repoRef = parseGitHubRepoFromUrl(project.sourceCodeUrl);
    if (!repoRef) {
      return res.status(400).json({
        error: 'No valid GitHub repository is linked to this project yet.',
      });
    }

    const githubToken =
      String(req.query?.githubToken || '').trim() || String(req.headers['x-github-token'] || '').trim();

    const [repoDetails, contributorsRaw, languagesRaw, commitsRaw, openIssuesRaw] = await Promise.all([
      withGitHubRetry(
        () =>
          githubApiRequest(`/repos/${encodeURIComponent(repoRef.owner)}/${encodeURIComponent(repoRef.repo)}`, {
            token: githubToken,
          }),
        { attempts: 3, delayMs: 300, retriableStatusCodes: [404, 429, 500, 502, 503, 504] }
      ),
      withGitHubRetry(
        () =>
          githubApiRequest(
            `/repos/${encodeURIComponent(repoRef.owner)}/${encodeURIComponent(repoRef.repo)}/contributors?per_page=20`,
            { token: githubToken }
          ),
        { attempts: 3, delayMs: 300, retriableStatusCodes: [404, 429, 500, 502, 503, 504] }
      ),
      withGitHubRetry(
        () =>
          githubApiRequest(
            `/repos/${encodeURIComponent(repoRef.owner)}/${encodeURIComponent(repoRef.repo)}/languages`,
            { token: githubToken }
          ),
        { attempts: 3, delayMs: 300, retriableStatusCodes: [404, 429, 500, 502, 503, 504] }
      ),
      withGitHubRetry(
        () =>
          githubApiRequest(
            `/repos/${encodeURIComponent(repoRef.owner)}/${encodeURIComponent(repoRef.repo)}/commits?per_page=12`,
            { token: githubToken }
          ),
        { attempts: 3, delayMs: 300, retriableStatusCodes: [404, 429, 500, 502, 503, 504] }
      ),
      withGitHubRetry(
        () =>
          githubApiRequest(
            `/repos/${encodeURIComponent(repoRef.owner)}/${encodeURIComponent(repoRef.repo)}/issues?state=open&per_page=50`,
            { token: githubToken }
          ),
        { attempts: 3, delayMs: 300, retriableStatusCodes: [404, 429, 500, 502, 503, 504] }
      ),
    ]);

    const contributors = (Array.isArray(contributorsRaw) ? contributorsRaw : [])
      .map(normalizeContributor)
      .slice(0, 12);
    const totalContributions = contributors.reduce(
      (sum, contributor) => sum + (Number(contributor.contributions) || 0),
      0
    );
    const languages = mapLanguageBreakdown(languagesRaw || {});
    const recentActivity = (Array.isArray(commitsRaw) ? commitsRaw : []).map((commit) => ({
      sha: String(commit?.sha || '').slice(0, 7),
      message: String(commit?.commit?.message || '').split('\n')[0].slice(0, 140),
      author: commit?.commit?.author?.name || commit?.author?.login || 'Unknown',
      date: commit?.commit?.author?.date || null,
      url: commit?.html_url || '',
    }));
    const openIssues = (Array.isArray(openIssuesRaw) ? openIssuesRaw : []).filter(
      (item) => !item?.pull_request
    );

    return res.status(200).json({
      repo: {
        fullName: repoDetails?.full_name || repoRef.fullName,
        htmlUrl: repoDetails?.html_url || project.sourceCodeUrl,
        description: repoDetails?.description || '',
        defaultBranch: repoDetails?.default_branch || 'main',
        visibility: repoDetails?.visibility || (repoDetails?.private ? 'private' : 'public'),
      },
      stats: {
        stars: Number(repoDetails?.stargazers_count) || 0,
        forks: Number(repoDetails?.forks_count) || 0,
        watchers: Number(repoDetails?.watchers_count) || 0,
        openIssues: openIssues.length,
        contributors: contributors.length,
        totalContributions,
        sizeKb: Number(repoDetails?.size) || 0,
      },
      contributors,
      languages,
      recentActivity,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Fetch project GitHub insights error:', error);
    if (error?.statusCode === 404) {
      return res.status(404).json({
        error:
          'GitHub repository not found (or private without token). Add a valid GitHub token to load private repo stats.',
      });
    }
    if (error?.statusCode === 403) {
      return res.status(403).json({ error: 'GitHub rate limit reached. Please try again shortly.' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Fetch a project by id
// @route   GET /api/project/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json({
      project: toProjectDetail(project, req.user),
    });
  } catch (error) {
    console.error('Fetch project detail error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Delete a project
// @route   DELETE /api/project/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is project owner
    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'User not authorized to delete this project' });
    }

    await project.deleteOne();

    return res.status(200).json({ message: 'Project removed' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
