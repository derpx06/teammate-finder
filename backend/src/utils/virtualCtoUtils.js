const CATEGORY_LABELS = {
  saas: 'SaaS',
  mobile: 'Mobile App',
  web3: 'Web3 / Blockchain',
  ai: 'AI / ML',
  ecommerce: 'E-commerce',
  other: 'General Product',
};
const VALID_CATEGORIES = new Set(Object.keys(CATEGORY_LABELS));
const VALID_COMMITMENTS = new Set(['flexible', 'part_time', 'full_time']);

const CATEGORY_KEYWORDS = {
  mobile: ['mobile', 'ios', 'android', 'react native', 'app store', 'play store'],
  web3: ['web3', 'blockchain', 'crypto', 'defi', 'nft', 'solidity', 'wallet'],
  ai: ['ai', 'ml', 'machine learning', 'llm', 'chatbot', 'recommendation', 'computer vision'],
  ecommerce: ['ecommerce', 'e-commerce', 'shop', 'store', 'cart', 'checkout', 'marketplace'],
  saas: ['saas', 'platform', 'dashboard', 'workspace', 'crm', 'b2b', 'subscription'],
};

const NAME_HINTS = [
  { pattern: /\bdog\b|\bpet\b|\bwalk\b/i, name: 'PawPath' },
  { pattern: /\bgym\b|\bfitness\b|\bworkout\b/i, name: 'FitCircle' },
  { pattern: /\bchat\b|\bmessage\b|\bcommunity\b/i, name: 'PulseLink' },
  { pattern: /\bmarket\b|\bshop\b|\bstore\b/i, name: 'MarketNest' },
  { pattern: /\btravel\b|\btrip\b/i, name: 'TripMosaic' },
  { pattern: /\beducation\b|\blearn\b|\bcourse\b/i, name: 'LearnBridge' },
  { pattern: /\bhealth\b|\bdoctor\b|\bclinic\b/i, name: 'CareRoute' },
];

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'app',
  'build',
  'create',
  'for',
  'help',
  'i',
  'in',
  'is',
  'make',
  'of',
  'platform',
  'project',
  'that',
  'the',
  'to',
  'want',
  'website',
  'with',
]);

const CATEGORY_STACKS = {
  saas: [
    'React',
    'TypeScript',
    'Node.js',
    'Express',
    'PostgreSQL',
    'Redis',
    'Docker',
  ],
  mobile: [
    'React Native',
    'Expo',
    'TypeScript',
    'Node.js',
    'Firebase',
    'Push Notifications',
  ],
  web3: [
    'React',
    'TypeScript',
    'Solidity',
    'Hardhat',
    'ethers.js',
    'Node.js',
    'PostgreSQL',
  ],
  ai: [
    'React',
    'TypeScript',
    'Python',
    'FastAPI',
    'PyTorch',
    'Vector Database',
    'Node.js',
  ],
  ecommerce: [
    'Next.js',
    'TypeScript',
    'Node.js',
    'Express',
    'PostgreSQL',
    'Stripe',
    'Redis',
  ],
  other: [
    'React',
    'TypeScript',
    'Node.js',
    'Express',
    'PostgreSQL',
  ],
};

const CATEGORY_ROLES = {
  saas: [
    {
      title: 'Frontend Engineer',
      skills: ['React', 'TypeScript', 'State Management', 'Tailwind CSS'],
      spots: 1,
      durationHours: 120,
    },
    {
      title: 'Backend Engineer',
      skills: ['Node.js', 'Express', 'PostgreSQL', 'API Design'],
      spots: 1,
      durationHours: 140,
    },
    {
      title: 'UI/UX Designer',
      skills: ['Figma', 'User Flows', 'Wireframing', 'Design Systems'],
      spots: 1,
      durationHours: 70,
    },
  ],
  mobile: [
    {
      title: 'Mobile App Developer',
      skills: ['React Native', 'Expo', 'TypeScript', 'Mobile UI'],
      spots: 1,
      durationHours: 150,
    },
    {
      title: 'Backend Engineer',
      skills: ['Node.js', 'Express', 'Firebase', 'Auth Flows'],
      spots: 1,
      durationHours: 120,
    },
    {
      title: 'UI/UX Designer',
      skills: ['Figma', 'Mobile UX', 'Prototyping'],
      spots: 1,
      durationHours: 80,
    },
  ],
  web3: [
    {
      title: 'Smart Contract Developer',
      skills: ['Solidity', 'Hardhat', 'OpenZeppelin', 'Smart Contract Testing'],
      spots: 1,
      durationHours: 160,
    },
    {
      title: 'Web3 Frontend Developer',
      skills: ['React', 'TypeScript', 'ethers.js', 'Wallet Integration'],
      spots: 1,
      durationHours: 130,
    },
    {
      title: 'Backend Engineer',
      skills: ['Node.js', 'Event Indexing', 'PostgreSQL', 'Security Best Practices'],
      spots: 1,
      durationHours: 110,
    },
  ],
  ai: [
    {
      title: 'ML Engineer',
      skills: ['Python', 'PyTorch', 'Model Evaluation', 'Prompt Engineering'],
      spots: 1,
      durationHours: 170,
    },
    {
      title: 'Backend AI Engineer',
      skills: ['FastAPI', 'Node.js', 'Vector Database', 'Inference APIs'],
      spots: 1,
      durationHours: 140,
    },
    {
      title: 'Frontend Engineer',
      skills: ['React', 'TypeScript', 'Data Visualization', 'UX for AI Flows'],
      spots: 1,
      durationHours: 120,
    },
  ],
  ecommerce: [
    {
      title: 'Frontend Engineer',
      skills: ['Next.js', 'React', 'TypeScript', 'Responsive UI'],
      spots: 1,
      durationHours: 130,
    },
    {
      title: 'Backend Engineer',
      skills: ['Node.js', 'Express', 'PostgreSQL', 'Payment Integrations'],
      spots: 1,
      durationHours: 150,
    },
    {
      title: 'UI/UX Designer',
      skills: ['Figma', 'Checkout UX', 'Conversion Design'],
      spots: 1,
      durationHours: 80,
    },
  ],
  other: [
    {
      title: 'Full Stack Developer',
      skills: ['React', 'TypeScript', 'Node.js', 'API Development'],
      spots: 1,
      durationHours: 140,
    },
    {
      title: 'UI/UX Designer',
      skills: ['Figma', 'User Journeys', 'Wireframing'],
      spots: 1,
      durationHours: 70,
    },
  ],
};

function toDateInputString(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  const day = String(dateValue.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTitleCase(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function hashString(value) {
  return String(value || '').split('').reduce((acc, char) => {
    return (acc * 31 + char.charCodeAt(0)) >>> 0;
  }, 0);
}

function uniqueCaseInsensitive(values = []) {
  const seen = new Set();
  return values.filter((value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return false;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function detectCategory(ideaText) {
  const lowered = String(ideaText || '').toLowerCase();
  const orderedCategories = ['mobile', 'web3', 'ai', 'ecommerce', 'saas'];
  for (const category of orderedCategories) {
    const keywords = CATEGORY_KEYWORDS[category] || [];
    if (keywords.some((keyword) => lowered.includes(keyword))) {
      return category;
    }
  }
  if (lowered.includes('website') || lowered.includes('web app')) return 'saas';
  return 'other';
}

function buildProjectName(ideaText, category) {
  const normalizedIdea = String(ideaText || '').trim();
  for (const entry of NAME_HINTS) {
    if (entry.pattern.test(normalizedIdea)) {
      return entry.name;
    }
  }

  const prefixesByCategory = {
    saas: ['Flow', 'Sync', 'Scale', 'Cloud'],
    mobile: ['Go', 'Pocket', 'Pulse', 'Swift'],
    web3: ['Chain', 'Block', 'Token', 'Ledger'],
    ai: ['Cortex', 'Signal', 'Neuro', 'Insight'],
    ecommerce: ['Cart', 'Shop', 'Market', 'Retail'],
    other: ['Nova', 'Launch', 'Orbit', 'Bridge'],
  };
  const suffixes = ['Hub', 'Link', 'Forge', 'Pilot', 'Nest', 'Core'];

  const words = normalizedIdea
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((word) => word && word.length > 2 && !STOP_WORDS.has(word));

  if (words.length > 0) {
    const seed = hashString(normalizedIdea);
    const rootWord = toTitleCase(words[seed % words.length]);
    const suffix = suffixes[seed % suffixes.length];
    return `${rootWord}${suffix}`;
  }

  const categoryPrefixes = prefixesByCategory[category] || prefixesByCategory.other;
  const seed = hashString(normalizedIdea || category);
  return `${categoryPrefixes[seed % categoryPrefixes.length]}${suffixes[seed % suffixes.length]}`;
}

function buildTechStack(category, ideaText) {
  const lowered = String(ideaText || '').toLowerCase();
  const baseStack = CATEGORY_STACKS[category] || CATEGORY_STACKS.other;
  const additions = [];

  if (lowered.includes('chat') || lowered.includes('message') || lowered.includes('real-time')) {
    additions.push('Socket.IO');
  }
  if (lowered.includes('payment') || lowered.includes('checkout')) {
    additions.push('Stripe');
  }
  if (lowered.includes('analytics') || lowered.includes('dashboard')) {
    additions.push('Product Analytics');
  }
  if (lowered.includes('notification')) {
    additions.push('Push Notifications');
  }

  return uniqueCaseInsensitive([...baseStack, ...additions]);
}

function buildRoles(category, ideaText) {
  const lowered = String(ideaText || '').toLowerCase();
  const baseRoles = CATEGORY_ROLES[category] || CATEGORY_ROLES.other;
  const roles = baseRoles.map((role) => ({ ...role, skills: [...role.skills] }));

  const hasRole = (titleKeyword) =>
    roles.some((role) => String(role.title).toLowerCase().includes(titleKeyword));

  if ((lowered.includes('chat') || lowered.includes('real-time')) && hasRole('backend')) {
    roles.forEach((role) => {
      if (String(role.title).toLowerCase().includes('backend')) {
        role.skills = uniqueCaseInsensitive([...role.skills, 'Socket.IO', 'WebSockets']);
      }
    });
  }

  if (lowered.includes('admin') || lowered.includes('analytics')) {
    roles.forEach((role) => {
      if (String(role.title).toLowerCase().includes('frontend')) {
        role.skills = uniqueCaseInsensitive([...role.skills, 'Dashboard UI', 'Charts']);
      }
    });
  }

  if ((lowered.includes('design') || lowered.includes('ux')) && !hasRole('designer')) {
    roles.push({
      title: 'UI/UX Designer',
      skills: ['Figma', 'UX Research', 'Wireframing'],
      spots: 1,
      durationHours: 60,
    });
  }

  return roles;
}

function chooseCommitment(category, ideaText) {
  const lowered = String(ideaText || '').toLowerCase();
  if (lowered.includes('weekend') || lowered.includes('side project')) return 'flexible';
  if (category === 'web3' || category === 'ai') return 'full_time';
  return 'part_time';
}

function estimateTimeline(category, ideaText) {
  const complexityByCategory = {
    saas: 10,
    mobile: 12,
    web3: 14,
    ai: 14,
    ecommerce: 11,
    other: 10,
  };
  let weeks = complexityByCategory[category] || 10;
  const lowered = String(ideaText || '').toLowerCase();

  if (lowered.includes('chat') || lowered.includes('real-time')) weeks += 1;
  if (lowered.includes('payment') || lowered.includes('blockchain')) weeks += 1;
  if (lowered.includes('marketplace')) weeks += 1;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 3);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + weeks * 7);

  return {
    startDate: toDateInputString(startDate),
    endDate: toDateInputString(endDate),
    estimatedWeeks: weeks,
  };
}

function buildDescription(projectName, category, ideaText, techStack) {
  const label = CATEGORY_LABELS[category] || CATEGORY_LABELS.other;
  const cleanedIdea = String(ideaText || '').trim().replace(/\s+/g, ' ');
  const stackPreview = techStack.slice(0, 3).join(', ');

  return [
    `${projectName} is a ${label.toLowerCase()} product built around the idea: "${cleanedIdea}".`,
    `The MVP will focus on a polished user flow, secure authentication, and reliable collaboration features to validate product-market fit quickly.`,
    `The recommended implementation stack starts with ${stackPreview}, allowing fast delivery and room to scale.`,
  ].join(' ');
}

function safeTrimmedString(value, fallback = '', maxLength = 240) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return fallback;
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength).trim();
}

function safeStringArray(values = [], { maxItems = 20, maxLength = 80 } = {}) {
  return uniqueCaseInsensitive(
    (Array.isArray(values) ? values : [])
      .map((value) => safeTrimmedString(value, '', maxLength))
      .filter(Boolean)
  ).slice(0, maxItems);
}

function inferSkillCategory(skill) {
  const value = String(skill || '').toLowerCase();
  if (/(react|next|vue|tailwind|ui|ux|figma|css|frontend)/.test(value)) return 'frontend';
  if (/(node|express|api|postgres|redis|backend|fastapi|firebase)/.test(value)) return 'backend';
  if (/(python|ml|ai|llm|pytorch|vector|prompt)/.test(value)) return 'ai';
  if (/(solidity|web3|hardhat|ethers|blockchain)/.test(value)) return 'web3';
  if (/(docker|devops|ci|infra|kubernetes|cloud)/.test(value)) return 'devops';
  if (/(product|analytics|research|design|strategy)/.test(value)) return 'product';
  return 'general';
}

function buildRequiredSkills(techStack, roles) {
  return uniqueCaseInsensitive([
    ...(Array.isArray(techStack) ? techStack : []),
    ...((Array.isArray(roles) ? roles : []).flatMap((role) =>
      Array.isArray(role?.skills) ? role.skills : []
    )),
  ]);
}

function buildSkillCards(techStack, roles, requiredSkills) {
  const stackSet = new Set((Array.isArray(techStack) ? techStack : []).map((skill) => String(skill).toLowerCase()));
  const usageCount = new Map();

  (Array.isArray(roles) ? roles : []).forEach((role) => {
    (Array.isArray(role?.skills) ? role.skills : []).forEach((skill) => {
      const key = String(skill || '').trim().toLowerCase();
      if (!key) return;
      usageCount.set(key, (usageCount.get(key) || 0) + 1);
    });
  });

  return (Array.isArray(requiredSkills) ? requiredSkills : []).map((skill) => {
    const key = String(skill || '').trim().toLowerCase();
    const frequency = usageCount.get(key) || 0;
    const inCoreStack = stackSet.has(key);
    const priority = frequency >= 2 || inCoreStack ? 'high' : 'medium';
    const category = inferSkillCategory(skill);

    return {
      skill,
      category,
      priority,
      whyItMatters: inCoreStack
        ? `Core stack dependency for reliable delivery.`
        : `Required in one or more delivery roles.`,
    };
  });
}

function buildRoadmap(estimatedWeeks = 10, roles = []) {
  const totalWeeks = Math.max(4, Number(estimatedWeeks) || 10);
  const split = [
    Math.max(1, Math.round(totalWeeks * 0.2)),
    Math.max(1, Math.round(totalWeeks * 0.25)),
    Math.max(1, Math.round(totalWeeks * 0.35)),
  ];
  const allocated = split.reduce((sum, value) => sum + value, 0);
  const finalPhaseWeeks = Math.max(1, totalWeeks - allocated);
  const phaseWeeks = [...split, finalPhaseWeeks];

  const roleTitles = (Array.isArray(roles) ? roles : [])
    .map((role) => String(role?.title || '').trim())
    .filter(Boolean);
  const leadRoles = roleTitles.slice(0, 3);

  let cursor = 1;
  const phases = [
    {
      phase: 'phase_1',
      title: 'Discovery and Scope',
      objective: 'Validate user problem, define MVP boundaries, and lock product requirements.',
      deliverables: ['MVP spec', 'User journeys', 'Architecture decision record'],
    },
    {
      phase: 'phase_2',
      title: 'Foundation Build',
      objective: 'Implement core platform scaffolding and data model.',
      deliverables: ['Auth and data model', 'Base UI system', 'Core APIs'],
    },
    {
      phase: 'phase_3',
      title: 'Feature Delivery',
      objective: 'Ship priority features and role-specific modules.',
      deliverables: ['End-to-end primary flows', 'Role-specific features', 'Telemetry instrumentation'],
    },
    {
      phase: 'phase_4',
      title: 'Hardening and Launch',
      objective: 'Stabilize product quality and prepare launch readiness.',
      deliverables: ['QA checklist', 'Performance tuning', 'Launch plan'],
    },
  ].map((phase, index) => {
    const durationWeeks = phaseWeeks[index];
    const startWeek = cursor;
    const endWeek = cursor + durationWeeks - 1;
    cursor = endWeek + 1;

    return {
      ...phase,
      startWeek,
      endWeek,
      durationWeeks,
      owners: leadRoles.length > 0 ? leadRoles : ['Founding Team'],
    };
  });

  return phases;
}

function normalizeRoadmap(roadmap = [], fallbackRoadmap = []) {
  if (!Array.isArray(roadmap) || roadmap.length === 0) return fallbackRoadmap;

  return roadmap
    .map((phase, index) => ({
      phase: safeTrimmedString(phase?.phase, `phase_${index + 1}`, 40),
      title: safeTrimmedString(phase?.title, `Phase ${index + 1}`, 80),
      objective: safeTrimmedString(phase?.objective, '', 280),
      startWeek: Math.max(1, Number(phase?.startWeek) || index + 1),
      endWeek: Math.max(1, Number(phase?.endWeek) || index + 1),
      durationWeeks: Math.max(1, Number(phase?.durationWeeks) || 1),
      deliverables: safeStringArray(phase?.deliverables || [], { maxItems: 6, maxLength: 120 }),
      owners: safeStringArray(phase?.owners || [], { maxItems: 6, maxLength: 80 }),
    }))
    .filter((phase) => phase.title);
}

function normalizeTechnicalRequirements(value, fallback = {}) {
  if (!value || typeof value !== 'object') return fallback;
  return {
    architecture: {
      frontend: safeStringArray(value?.architecture?.frontend || [], { maxItems: 10 }),
      backend: safeStringArray(value?.architecture?.backend || [], { maxItems: 10 }),
      integrations: safeStringArray(value?.architecture?.integrations || [], { maxItems: 10 }),
    },
    coreApis: safeStringArray(value?.coreApis || [], { maxItems: 12, maxLength: 120 }),
    quality: safeStringArray(value?.quality || [], { maxItems: 10, maxLength: 120 }),
    security: safeStringArray(value?.security || [], { maxItems: 10, maxLength: 120 }),
    infrastructure: safeStringArray(value?.infrastructure || [], { maxItems: 10, maxLength: 120 }),
    staffingAssumptions: safeStringArray(value?.staffingAssumptions || [], { maxItems: 10, maxLength: 120 }),
  };
}

function normalizeRisks(risks = [], fallback = []) {
  if (!Array.isArray(risks) || risks.length === 0) return fallback;
  return risks
    .map((item) => ({
      risk: safeTrimmedString(item?.risk, '', 220),
      mitigation: safeTrimmedString(item?.mitigation, '', 260),
    }))
    .filter((item) => item.risk && item.mitigation)
    .slice(0, 8);
}

function normalizeSuccessMetrics(metrics = [], fallback = []) {
  if (!Array.isArray(metrics) || metrics.length === 0) return fallback;
  return metrics
    .map((item) => ({
      metric: safeTrimmedString(item?.metric, '', 120),
      target: safeTrimmedString(item?.target, '', 200),
    }))
    .filter((item) => item.metric && item.target)
    .slice(0, 10);
}

function buildTechnicalRequirements(category, techStack, roles) {
  const roleTitles = (Array.isArray(roles) ? roles : [])
    .map((role) => String(role?.title || '').trim())
    .filter(Boolean);

  const coreApis = ['Authentication', 'Project CRUD', 'User Profile', 'Notifications'];
  const quality = ['Error monitoring', 'Logging', 'Automated smoke tests', 'Input validation'];
  const security = ['JWT/session hardening', 'Rate limiting', 'Secrets management', 'Access control'];
  const infrastructure = ['CI/CD pipeline', 'Environment separation', 'Backups', 'Health checks'];

  if (category === 'ai') {
    coreApis.push('Model inference API', 'Prompt/agent orchestration API');
    quality.push('Model quality evaluation');
  }
  if (category === 'web3') {
    coreApis.push('Wallet integration', 'On-chain event indexing');
    security.push('Smart contract audit checklist');
  }
  if (category === 'ecommerce') {
    coreApis.push('Checkout and payment API', 'Order management API');
    security.push('Payment fraud controls');
  }

  return {
    architecture: {
      frontend: (Array.isArray(techStack) ? techStack : []).filter((item) =>
        /(react|next|vue|tailwind|ui|css)/i.test(String(item || ''))
      ),
      backend: (Array.isArray(techStack) ? techStack : []).filter((item) =>
        /(node|express|fastapi|postgres|redis|api|firebase)/i.test(String(item || ''))
      ),
      integrations: ['Auth provider', 'Analytics', 'Email/notification provider'],
    },
    coreApis,
    quality,
    security,
    infrastructure,
    staffingAssumptions: roleTitles,
  };
}

function buildRisksAndMitigations(category) {
  const risks = [
    {
      risk: 'Scope expansion can delay MVP launch.',
      mitigation: 'Freeze MVP scope at end of phase 1 and defer non-critical ideas.',
    },
    {
      risk: 'Team bandwidth mismatch across roles.',
      mitigation: 'Track weekly capacity and rebalance tasks in sprint planning.',
    },
  ];

  if (category === 'ai') {
    risks.push({
      risk: 'Model output quality may vary by prompt and data quality.',
      mitigation: 'Add evaluation benchmarks and human review checkpoints.',
    });
  }

  if (category === 'web3') {
    risks.push({
      risk: 'On-chain security vulnerabilities.',
      mitigation: 'Use battle-tested libraries and run audit checklist before release.',
    });
  }

  return risks;
}

function buildSuccessMetrics(category) {
  const metrics = [
    { metric: 'MVP delivery', target: 'Core roadmap phases completed on planned timeline.' },
    { metric: 'Activation', target: '>=40% of signed-up users complete primary flow.' },
    { metric: 'Reliability', target: '<1% critical error rate on key journeys.' },
  ];

  if (category === 'ecommerce') {
    metrics.push({ metric: 'Checkout conversion', target: '>=20% product page to completed order.' });
  }
  if (category === 'saas') {
    metrics.push({ metric: 'Weekly active teams', target: 'Steady week-over-week growth for first 8 weeks.' });
  }
  if (category === 'ai') {
    metrics.push({ metric: 'Answer usefulness', target: '>=80% positive user feedback on AI outputs.' });
  }

  return metrics;
}

function generateVirtualCtoPlan(ideaText) {
  const normalizedIdea = String(ideaText || '').trim().replace(/\s+/g, ' ');
  const category = detectCategory(normalizedIdea);
  const title = buildProjectName(normalizedIdea, category);
  const techStack = buildTechStack(category, normalizedIdea);
  const roles = buildRoles(category, normalizedIdea);
  const commitment = chooseCommitment(category, normalizedIdea);
  const timeline = estimateTimeline(category, normalizedIdea);
  const description = buildDescription(title, category, normalizedIdea, techStack);
  const requiredSkills = buildRequiredSkills(techStack, roles);
  const skillCards = buildSkillCards(techStack, roles, requiredSkills);
  const roadmap = buildRoadmap(timeline.estimatedWeeks, roles);
  const technicalRequirements = buildTechnicalRequirements(category, techStack, roles);
  const risks = buildRisksAndMitigations(category);
  const successMetrics = buildSuccessMetrics(category);

  return {
    title,
    description,
    category,
    categoryLabel: CATEGORY_LABELS[category] || CATEGORY_LABELS.other,
    commitment,
    startDate: timeline.startDate,
    endDate: timeline.endDate,
    estimatedWeeks: timeline.estimatedWeeks,
    techStack,
    requiredSkills,
    skillCards,
    roadmap,
    technicalRequirements,
    risks,
    successMetrics,
    roles,
    summary: `Built a ${CATEGORY_LABELS[category] || 'project'} blueprint with ${roles.length} hiring roles and a ${timeline.estimatedWeeks}-week delivery plan.`,
    generationMode: 'heuristic',
  };
}

function mergeUniqueStrings(primary = [], secondary = []) {
  return uniqueCaseInsensitive([...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])]);
}

function normalizeLlmPlan(basePlan, llmPlan = {}) {
  const mergedRoles = Array.isArray(llmPlan?.roles)
    ? llmPlan.roles
        .map((role) => ({
          title: String(role?.title || '').trim(),
          skills: mergeUniqueStrings(role?.skills || [], []),
          spots: Number.isFinite(Number(role?.spots)) ? Math.max(1, Math.round(Number(role.spots))) : 1,
          durationHours:
            Number.isFinite(Number(role?.durationHours)) && Number(role.durationHours) > 0
              ? Math.round(Number(role.durationHours))
              : null,
        }))
        .filter((role) => role.title)
    : basePlan.roles;

  const requiredSkills = safeStringArray(mergeUniqueStrings(basePlan.requiredSkills, llmPlan?.requiredSkills || []), {
    maxItems: 32,
    maxLength: 80,
  });
  const techStack = safeStringArray(mergeUniqueStrings(basePlan.techStack, llmPlan?.techStack || []), {
    maxItems: 16,
    maxLength: 60,
  });
  const normalizedCategory = safeTrimmedString(llmPlan?.category, basePlan.category, 30).toLowerCase();
  const category = VALID_CATEGORIES.has(normalizedCategory) ? normalizedCategory : basePlan.category;
  const normalizedCommitment = safeTrimmedString(llmPlan?.commitment, basePlan.commitment, 20).toLowerCase();
  const commitment = VALID_COMMITMENTS.has(normalizedCommitment)
    ? normalizedCommitment
    : basePlan.commitment;

  const roles = (Array.isArray(mergedRoles) ? mergedRoles : [])
    .map((role) => ({
      title: safeTrimmedString(role?.title, '', 80),
      skills: safeStringArray(role?.skills || [], { maxItems: 12, maxLength: 80 }),
      spots: Number.isFinite(Number(role?.spots)) ? Math.max(1, Math.round(Number(role.spots))) : 1,
      durationHours:
        Number.isFinite(Number(role?.durationHours)) && Number(role.durationHours) > 0
          ? Math.round(Number(role.durationHours))
          : null,
    }))
    .filter((role) => role.title && role.skills.length > 0)
    .slice(0, 10);

  const roadmap = normalizeRoadmap(llmPlan?.roadmap, basePlan.roadmap);
  const technicalRequirements = normalizeTechnicalRequirements(
    llmPlan?.technicalRequirements,
    basePlan.technicalRequirements
  );
  const risks = normalizeRisks(llmPlan?.risks, basePlan.risks);
  const successMetrics = normalizeSuccessMetrics(llmPlan?.successMetrics, basePlan.successMetrics);

  return {
    ...basePlan,
    title: safeTrimmedString(llmPlan?.title, basePlan.title, 120),
    description: safeTrimmedString(llmPlan?.description, basePlan.description, 1200),
    category,
    categoryLabel: CATEGORY_LABELS[category] || basePlan.categoryLabel,
    commitment,
    techStack,
    roles: roles.length > 0 ? roles : basePlan.roles,
    requiredSkills,
    roadmap,
    technicalRequirements,
    risks,
    successMetrics,
    summary: safeTrimmedString(llmPlan?.summary, basePlan.summary, 300),
    generationMode: llmPlan ? 'llm+heuristic' : basePlan.generationMode,
  };
}

function parseJsonObject(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const direct = (() => {
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  })();
  if (direct && typeof direct === 'object') return direct;

  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch && fencedMatch[1]) {
    try {
      const parsed = JSON.parse(fencedMatch[1]);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_error) {
      return null;
    }
  }

  try {
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace < 0 || lastBrace <= firstBrace) return null;
    const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (_error) {
    return null;
  }
}

async function enhancePlanWithLlm(basePlan, ideaText, context = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return basePlan;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const promptPayload = {
    idea: String(ideaText || '').trim(),
    userContext: context?.userContext || {},
    ecosystemInsights: context?.ecosystemInsights || {},
    basePlan,
  };

  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS) > 0
      ? Number(process.env.GEMINI_TIMEOUT_MS)
      : 12000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  'You are a senior CTO agent. Think carefully and return implementation-ready JSON only. Do not output markdown.',
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text:
                    `Input JSON:\n${JSON.stringify(promptPayload)}\n` +
                    'Return JSON with fields you want to refine: ' +
                    'title, description, category, commitment, techStack, requiredSkills, roles, roadmap, technicalRequirements, risks, successMetrics, summary.',
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Gemini plan enhancement failed (${response.status}): ${errorText.slice(0, 200)}`
        );
      }

      const payload = await response.json();
      const llmText =
        payload?.candidates?.[0]?.content?.parts
          ?.map((part) => String(part?.text || ''))
          .join('') || '';
      const llmPlan = parseJsonObject(llmText);
      if (!llmPlan) {
        throw new Error('Gemini returned non-JSON or invalid JSON object');
      }

      return normalizeLlmPlan(basePlan, llmPlan);
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;
      if (isLastAttempt) {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return basePlan;
}

module.exports = {
  generateVirtualCtoPlan,
  enhancePlanWithLlm,
};
