const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');
const { searchLocalVectors } = require('../utils/vectorUtils');
const { generateEmbedding, buildProfileText } = require('../utils/embeddingUtils');
const { toCleanText, improveTextWithGemini } = require('../utils/textEnhancementUtils');
const {
    resolveGitHubUsername,
    buildGitHubSummaryForUser,
    getStoredGitHubSummary,
    fetchGitHubJson,
    formatGitHubRepo
} = require('../utils/githubUtils');


const EMBEDDING_DIMENSION = 768;
const SOCIAL_LINK_KEYS = ['linkedin', 'twitter', 'portfolio', 'other'];

function normalizeSocialLinks(input) {
    const source = input && typeof input === 'object' ? input : {};
    return SOCIAL_LINK_KEYS.reduce((acc, key) => {
        const raw = source[key];
        acc[key] = typeof raw === 'string' ? raw.trim() : '';
        return acc;
    }, {});
}

function hasAnySocialLink(user) {
    if (!user || typeof user !== 'object') return false;
    return SOCIAL_LINK_KEYS.some((key) => {
        const value = user?.socialLinks?.[key];
        return Boolean(String(value || '').trim());
    });
}

function toLowerSet(values = []) {
    return new Set(
        (Array.isArray(values) ? values : [])
            .map((value) => String(value || '').trim().toLowerCase())
            .filter(Boolean)
    );
}

function calculateProfileCompletion(user) {
    if (!user) return 0;

    const checkpoints = [
        Boolean(String(user.name || '').trim()),
        Number.isFinite(Number(user.age)),
        Boolean(String(user.qualifications || '').trim()),
        Boolean(String(user.role || '').trim()),
        Boolean(String(user.bio || '').trim()),
        Boolean(String(user.location || '').trim()),
        Boolean(String(user.website || '').trim()) || hasAnySocialLink(user),
        Array.isArray(user.skills) && user.skills.length > 0,
        Array.isArray(user.interests) && user.interests.length > 0,
        Boolean(user.githubId || user.githubUsername),
    ];

    const completed = checkpoints.filter(Boolean).length;
    return Math.round((completed / checkpoints.length) * 100);
}

function getProjectType(status) {
    if (status === 'Completed') return 'completed';
    if (status === 'Pending') return 'pending';
    return 'active';
}

function mapDashboardProject(project, currentUserId) {
    const ownerId = String(project?.owner?._id || project?.owner || '');
    const currentId = String(currentUserId || '');
    const members = Array.isArray(project?.members) ? project.members : [];
    const membership = members.find(
        (member) => String(member?.user?._id || member?.user || '') === currentId
    );
    const role = ownerId === currentId ? 'Owner' : (membership?.role || 'Member');
    const teamSize = Math.max(1, Number(project?.teamSize) || 1 + members.length);

    return {
        id: String(project?._id || ''),
        title: project?.title || 'Untitled Project',
        role,
        status: project?.status || 'In Progress',
        progress: Math.max(0, Math.min(100, Number(project?.progress) || 0)),
        teamSize,
        type: getProjectType(project?.status),
        updatedAt: project?.updatedAt || project?.createdAt || null,
    };
}

function buildSuggestedMatches(currentUser, users) {
    const mySkills = toLowerSet(currentUser?.skills || []);
    const myRole = String(currentUser?.role || '').trim().toLowerCase();

    return (Array.isArray(users) ? users : [])
        .map((candidate) => {
            const candidateSkills = Array.isArray(candidate?.skills) ? candidate.skills : [];
            const candidateSkillSet = toLowerSet(candidateSkills);
            const overlapCount = [...mySkills].filter((skill) => candidateSkillSet.has(skill)).length;
            const unionCount = new Set([...mySkills, ...candidateSkillSet]).size;
            const skillMatch = unionCount > 0 ? Math.round((overlapCount / unionCount) * 100) : 0;
            const roleMatch =
                myRole && String(candidate?.role || '').trim().toLowerCase() === myRole ? 10 : 0;
            const profileDepthBonus = Math.min(10, candidateSkillSet.size * 2);
            const matchScore = Math.min(99, Math.max(0, skillMatch + roleMatch + profileDepthBonus));

            const highlightedSkills =
                overlapCount > 0
                    ? candidateSkills.filter((skill) =>
                        mySkills.has(String(skill || '').trim().toLowerCase())
                    )
                    : candidateSkills;

            return {
                id: String(candidate?._id || ''),
                name: candidate?.name || candidate?.email || 'Teammate',
                role: candidate?.role || 'Member',
                matchScore,
                matchLabel: `${matchScore}%`,
                skills: highlightedSkills.slice(0, 4),
            };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 6);
}

function buildSkillGapSummary(currentUser, projects) {
    const mySkills = toLowerSet(currentUser?.skills || []);
    const activeProjects = (Array.isArray(projects) ? projects : []).filter(
        (project) => getProjectType(project?.status) === 'active'
    );

    const missingByProject = activeProjects.map((project) => {
        const requiredSkills = new Set(
            (Array.isArray(project?.roles) ? project.roles : [])
                .flatMap((role) => (Array.isArray(role?.skills) ? role.skills : []))
                .map((skill) => String(skill || '').trim())
                .filter(Boolean)
        );

        const missingSkills = [...requiredSkills].filter(
            (skill) => !mySkills.has(String(skill || '').trim().toLowerCase())
        );

        return {
            projectId: String(project?._id || ''),
            missingSkills,
        };
    });

    const impactedProjects = missingByProject.filter((item) => item.missingSkills.length > 0).length;
    const uniqueMissingSkills = Array.from(
        new Set(missingByProject.flatMap((item) => item.missingSkills))
    );

    return {
        impactedProjects,
        missingSkills: uniqueMissingSkills.slice(0, 10),
    };
}

function toPublicUserPayload(user, currentUserFollowingSet = new Set()) {
    const normalizedUser = typeof user?.toObject === 'function' ? user.toObject() : (user || {});
    const normalizedUserId = String(normalizedUser?._id || normalizedUser?.id || '');
    const followerCount = Array.isArray(normalizedUser?.followers)
        ? normalizedUser.followers.length
        : 0;
    const followingCount = Array.isArray(normalizedUser?.following)
        ? normalizedUser.following.length
        : 0;
    const connectedCount = Array.isArray(normalizedUser?.connections)
        ? normalizedUser.connections.length
        : 0;
    const starCount = followerCount;
    const { followers, following, connections, ...rest } = normalizedUser;

    return {
        ...rest,
        followerCount,
        followingCount,
        connectedCount,
        starCount,
        isFollowedByCurrentUser: currentUserFollowingSet.has(normalizedUserId),
    };
}

function tokenizeSearchText(text) {
    return String(text || '')
        .toLowerCase()
        .split(/[^a-z0-9+#.-]+/g)
        .map((token) => token.trim())
        .filter(Boolean);
}

function buildUserSearchDocument(user) {
    return [
        user?.name,
        user?.email,
        user?.role,
        user?.bio,
        ...(Array.isArray(user?.skills) ? user.skills : []),
        ...(Array.isArray(user?.interests) ? user.interests : []),
    ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');
}

function buildKeywordFallbackMatches(queryText, users = [], limit = 10) {
    const tokens = tokenizeSearchText(queryText);
    if (tokens.length === 0) return [];

    return (Array.isArray(users) ? users : [])
        .map((userDoc) => {
            const user = typeof userDoc?.toObject === 'function' ? userDoc.toObject() : userDoc;
            const haystack = buildUserSearchDocument(user);
            const matchCount = tokens.reduce(
                (count, token) => (haystack.includes(token) ? count + 1 : count),
                0
            );
            const score = tokens.length > 0 ? matchCount / tokens.length : 0;
            return { user, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(1, Number(limit) || 10))
        .map(({ user, score }) => ({
            ...(() => {
                const { embedding, ...rest } = user || {};
                return rest;
            })(),
            semanticScore: Number(score.toFixed(6)),
            semanticSource: 'keyword-fallback',
        }));
}

// @desc    Get user's GitHub repositories
// @route   GET /api/user/github/repos
// @access  Private
router.get('/github/repos', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user || (!user.githubUsername && !user.githubId)) {
            return res.status(404).json({ error: 'GitHub account not connected' });
        }

        const githubUsername = await resolveGitHubUsername(user);

        if (!githubUsername) {
            return res.status(404).json({ error: 'GitHub username not found. Please reconnect GitHub.' });
        }

        const repos = await fetchGitHubJson(
            `/users/${encodeURIComponent(githubUsername)}/repos?sort=updated&per_page=100`,
            { Accept: 'application/vnd.github+json' }
        );

        const formattedRepos = (Array.isArray(repos) ? repos : []).map(formatGitHubRepo);

        res.json(formattedRepos);

    } catch (error) {
        console.error('Get GitHub repos error:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message || 'Server error' });
    }
});

// @desc    Get complete GitHub summary for connected user
// @route   GET /api/user/github/summary
// @access  Private
router.get('/github/summary', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user || (!user.githubUsername && !user.githubId)) {
            return res.status(404).json({ error: 'GitHub account not connected' });
        }

        const githubUsername = await resolveGitHubUsername(user);
        if (!githubUsername) {
            return res.status(404).json({ error: 'GitHub username not found. Please reconnect GitHub.' });
        }

        const summary = await buildGitHubSummaryForUser(user, githubUsername);
        res.json(summary);
    } catch (error) {
        console.error('Get GitHub summary error:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message || 'Server error' });
    }
});

// @desc    Get complete GitHub summary for a teammate
// @route   GET /api/user/:userId/github/summary
// @access  Private
router.get('/:userId/github/summary', protect, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const storedSummary = getStoredGitHubSummary(targetUser);
        if (storedSummary) {
            return res.json(storedSummary);
        }

        if (!targetUser.githubUsername && !targetUser.githubId) {
            return res.status(404).json({ error: 'GitHub account not connected for this user' });
        }

        const githubUsername = await resolveGitHubUsername(targetUser);
        if (!githubUsername) {
            return res.status(404).json({ error: 'GitHub username not found for this user' });
        }

        // Cache miss: fetch once from GitHub, persist in MongoDB, and return.
        const summary = await buildGitHubSummaryForUser(targetUser, githubUsername);
        return res.json(summary);
    } catch (error) {
        if (error?.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        console.error('Get teammate GitHub summary error:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message || 'Server error' });
    }
});

// @desc    Get dashboard summary for current user
// @route   GET /api/user/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id).select(
            'name email age qualifications role bio location website socialLinks skills interests githubId githubUsername'
        );

        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [projects, pendingInvitesCount, candidates] = await Promise.all([
            Project.find({
                $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
            })
                .sort({ updatedAt: -1 })
                .limit(50),
            Notification.countDocuments({
                recipient: req.user._id,
                type: 'project_invite',
                status: 'pending',
            }),
            User.find({ _id: { $ne: req.user._id } })
                .select('name email role skills')
                .limit(80),
        ]);

        const mappedProjects = projects.map((project) => mapDashboardProject(project, req.user._id));
        const activeProjects = mappedProjects.filter((project) => project.type === 'active');
        const pendingProjects = mappedProjects.filter((project) => project.type === 'pending');
        const completedProjects = mappedProjects.filter((project) => project.type === 'completed');

        const suggestedMatches = buildSuggestedMatches(currentUser, candidates);
        const skillGaps = buildSkillGapSummary(currentUser, projects);

        return res.json({
            user: {
                id: String(currentUser._id),
                name: currentUser.name || currentUser.email || 'Developer',
                role: currentUser.role || 'Member',
            },
            stats: {
                activeProjects: activeProjects.length,
                pendingProjects: pendingProjects.length,
                completedProjects: completedProjects.length,
                pendingInvites: pendingInvitesCount,
                suggestedMatches: suggestedMatches.length,
                profileCompletion: calculateProfileCompletion(currentUser),
            },
            activeProjects: activeProjects.slice(0, 8),
            suggestedMatches,
            skillGaps,
        });
    } catch (error) {
        console.error('Get dashboard summary error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @desc    Search teammates using local semantic vector similarity
// @route   POST /api/user/search-semantic
// @access  Private
router.post('/search-semantic', protect, async (req, res) => {
    try {
        const { queryText = '', queryVector: providedQueryVector } = req.body || {};
        const connectedUserIds = new Set(
            (Array.isArray(req.user?.connections) ? req.user.connections : []).map((id) => String(id))
        );
        const followingUserIds = new Set(
            (Array.isArray(req.user?.following) ? req.user.following : []).map((id) => String(id))
        );

        let normalizedQuery;
        if (queryText) {
            // Generate embedding on the backend
            normalizedQuery = await generateEmbedding(queryText);
        } else if (Array.isArray(providedQueryVector) && providedQueryVector.length === EMBEDDING_DIMENSION) {
            // Support legacy queryVector if provided (optional)
            normalizedQuery = providedQueryVector.map((value) => Number(value));
        } else {
            return res.status(400).json({ error: 'Either queryText or a valid queryVector must be provided' });
        }


        const allCandidates = await User.find({
            _id: { $ne: req.user._id },
        }).select(
            '+embedding name email age qualifications role bio location website socialLinks skills interests availability onboardingCompleted experienceLevel availabilityStatus githubId githubUsername githubProfileReadme githubSummaryCache followers following connections createdAt'
        );

        const indexedCandidates = allCandidates.filter(
            (user) => Array.isArray(user?.embedding) && user.embedding.length === EMBEDDING_DIMENSION
        );

        const rankedUsers = searchLocalVectors(normalizedQuery, indexedCandidates, 10).map((user) => {
            const { githubId, ...rest } = user;
            const publicUser = toPublicUserPayload(rest, followingUserIds);
            return {
                ...publicUser,
                githubConnected: Boolean(githubId || user.githubUsername),
                isConnected: connectedUserIds.has(String(user?._id || user?.id || '')),
                semanticSource: 'vector',
            };
        });

        if (rankedUsers.length >= 10) {
            return res.status(200).json({
                results: rankedUsers,
                meta: {
                    indexedUsers: indexedCandidates.length,
                    usedFallback: false,
                },
            });
        }

        const remainingSlots = 10 - rankedUsers.length;
        const usedIds = new Set(
            rankedUsers.map((user) => String(user?._id || user?.id || ''))
        );
        const nonIndexedCandidates = allCandidates.filter(
            (user) => !Array.isArray(user?.embedding) || user.embedding.length !== EMBEDDING_DIMENSION
        );
        const fallbackCandidates = buildKeywordFallbackMatches(queryText, nonIndexedCandidates, remainingSlots)
            .filter((user) => !usedIds.has(String(user?._id || user?.id || '')))
            .map((user) => {
                const { githubId, ...rest } = user;
                const publicUser = toPublicUserPayload(rest, followingUserIds);
                return {
                    ...publicUser,
                    githubConnected: Boolean(githubId || user.githubUsername),
                    isConnected: connectedUserIds.has(String(user?._id || user?.id || '')),
                };
            });

        return res.status(200).json({
            results: [...rankedUsers, ...fallbackCandidates].slice(0, 10),
            meta: {
                indexedUsers: indexedCandidates.length,
                usedFallback: fallbackCandidates.length > 0,
            },
        });
    } catch (error) {
        console.error('Semantic teammate search error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.age = req.body.age || user.age;
            user.qualifications = req.body.qualifications || user.qualifications;
            user.role = req.body.role || user.role;
            user.bio = req.body.bio || user.bio;
            user.location = req.body.location || user.location;
            if (req.body.website !== undefined) {
                user.website = String(req.body.website || '').trim();
            }

            if (req.body.socialLinks && typeof req.body.socialLinks === 'object') {
                const currentSocialLinks =
                    user.socialLinks && typeof user.socialLinks.toObject === 'function'
                        ? user.socialLinks.toObject()
                        : (user.socialLinks || {});
                user.socialLinks = {
                    ...currentSocialLinks,
                    ...normalizeSocialLinks(req.body.socialLinks),
                };
            }

            if (req.body.skills) user.skills = req.body.skills;
            if (req.body.interests) user.interests = req.body.interests;
            if (req.body.availability) user.availability = req.body.availability;

            // Trigger embedding update if relevant fields changed or if missing
            const fieldsForEmbedding = ['name', 'role', 'skills', 'bio', 'interests'];
            const shouldUpdateEmbedding = fieldsForEmbedding.some(field => req.body[field] !== undefined) ||
                !user.embedding || user.embedding.length !== EMBEDDING_DIMENSION;

            if (shouldUpdateEmbedding) {
                try {
                    const profileText = buildProfileText(user);
                    user.embedding = await generateEmbedding(profileText);
                } catch (embError) {
                    console.error('Error auto-updating embedding in profile update:', embError);
                    // Continue with save even if embedding fails (maybe fallback to keyword later)
                }
            }


            // Mark onboarding as completed if basic info is present
            if (user.name && user.age && user.qualifications) {
                user.onboardingCompleted = true;
            } else if (req.body.onboardingCompleted) {
                user.onboardingCompleted = req.body.onboardingCompleted;
            }

            const updatedUser = await user.save();

            res.json({
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    age: updatedUser.age,
                    qualifications: updatedUser.qualifications,
                    role: updatedUser.role,
                    bio: updatedUser.bio,
                    location: updatedUser.location,
                    website: updatedUser.website,
                    socialLinks: normalizeSocialLinks(updatedUser.socialLinks),
                    githubConnected: Boolean(updatedUser.githubId || updatedUser.githubUsername),
                    githubUsername: updatedUser.githubUsername,
                    githubProfileReadme: updatedUser.githubProfileReadme || null,
                    googleConnected: Boolean(updatedUser.googleId),
                    skills: updatedUser.skills,
                    interests: updatedUser.interests,
                    availability: updatedUser.availability,
                    followerCount: Array.isArray(updatedUser.followers) ? updatedUser.followers.length : 0,
                    followingCount: Array.isArray(updatedUser.following) ? updatedUser.following.length : 0,
                    connectedCount: Array.isArray(updatedUser.connections) ? updatedUser.connections.length : 0,
                    starCount: Array.isArray(updatedUser.followers) ? updatedUser.followers.length : 0,
                    onboardingCompleted: updatedUser.onboardingCompleted,
                    createdAt: updatedUser.createdAt
                }
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @desc    Improve profile bio text
// @route   POST /api/user/profile/improve-bio
// @access  Private
router.post('/profile/improve-bio', protect, async (req, res) => {
    try {
        const bio = toCleanText(req.body?.bio, 1400);
        if (!bio) {
            return res.status(400).json({ error: 'bio is required' });
        }

        if (bio.length < 20) {
            return res.status(400).json({
                error: 'Please add a little more context before auto-improving your bio',
            });
        }

        const role = toCleanText(req.body?.role, 120);
        const location = toCleanText(req.body?.location, 120);
        const skills = Array.isArray(req.body?.skills)
            ? req.body.skills.map((skill) => toCleanText(skill, 50)).filter(Boolean).slice(0, 12)
            : [];
        const interests = Array.isArray(req.body?.interests)
            ? req.body.interests.map((item) => toCleanText(item, 50)).filter(Boolean).slice(0, 12)
            : [];

        const result = await improveTextWithGemini(bio, 'profile', {
            role,
            location,
            skills,
            interests,
        });

        return res.status(200).json({
            bio: result.text,
            meta: { mode: result.mode },
        });
    } catch (error) {
        console.error('Improve profile bio error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                id: user._id,
                name: user.name,
                email: user.email,
                age: user.age,
                qualifications: user.qualifications,
                role: user.role,
                bio: user.bio,
                location: user.location,
                website: user.website,
                socialLinks: normalizeSocialLinks(user.socialLinks),
                githubConnected: Boolean(user.githubId || user.githubUsername),
                githubUsername: user.githubUsername,
                githubProfileReadme: user.githubProfileReadme || null,
                googleConnected: Boolean(user.googleId),
                skills: user.skills,
                interests: user.interests,
                availability: user.availability,
                followerCount: Array.isArray(user.followers) ? user.followers.length : 0,
                followingCount: Array.isArray(user.following) ? user.following.length : 0,
                connectedCount: Array.isArray(user.connections) ? user.connections.length : 0,
                starCount: Array.isArray(user.followers) ? user.followers.length : 0,
                onboardingCompleted: user.onboardingCompleted,
                createdAt: user.createdAt
            });

            // Background sync if cache is missing or stale (e.g., > 24h)
            const githubUsername = user.githubUsername;
            if (githubUsername) {
                const cache = user.githubSummaryCache;
                const isStale = !cache?.fetchedAt || (Date.now() - new Date(cache.fetchedAt).getTime() > 24 * 60 * 60 * 1000);
                if (isStale) {
                    buildGitHubSummaryForUser(user, githubUsername).catch(err => {
                        console.error('Background profile GitHub sync failed:', err);
                    });
                }
            }
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @desc    Follow a user
// @route   POST /api/user/:userId/follow
// @access  Private
router.post('/:userId/follow', protect, async (req, res) => {
    try {
        const targetUserId = String(req.params.userId || '').trim();
        const currentUserId = String(req.user._id);

        if (!targetUserId) {
            return res.status(400).json({ error: 'User id is required' });
        }

        if (targetUserId === currentUserId) {
            return res.status(400).json({ error: 'You cannot follow yourself' });
        }

        const targetUser = await User.findById(targetUserId).select('_id followers following');
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        await Promise.all([
            User.updateOne(
                { _id: req.user._id },
                { $addToSet: { following: targetUser._id } }
            ),
            User.updateOne(
                { _id: targetUser._id },
                { $addToSet: { followers: req.user._id } }
            ),
        ]);

        const refreshedTarget = await User.findById(targetUser._id).select('_id followers following');
        return res.status(200).json({
            message: 'User followed',
            userId: String(refreshedTarget._id),
            followerCount: Array.isArray(refreshedTarget.followers) ? refreshedTarget.followers.length : 0,
            followingCount: Array.isArray(refreshedTarget.following) ? refreshedTarget.following.length : 0,
            starCount: Array.isArray(refreshedTarget.followers) ? refreshedTarget.followers.length : 0,
            isFollowedByCurrentUser: true,
        });
    } catch (error) {
        if (error?.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        console.error('Follow user error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @desc    Unfollow a user
// @route   DELETE /api/user/:userId/follow
// @access  Private
router.delete('/:userId/follow', protect, async (req, res) => {
    try {
        const targetUserId = String(req.params.userId || '').trim();
        const currentUserId = String(req.user._id);

        if (!targetUserId) {
            return res.status(400).json({ error: 'User id is required' });
        }

        if (targetUserId === currentUserId) {
            return res.status(400).json({ error: 'You cannot unfollow yourself' });
        }

        const targetUser = await User.findById(targetUserId).select('_id followers following');
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        await Promise.all([
            User.updateOne(
                { _id: req.user._id },
                { $pull: { following: targetUser._id } }
            ),
            User.updateOne(
                { _id: targetUser._id },
                { $pull: { followers: req.user._id } }
            ),
        ]);

        const refreshedTarget = await User.findById(targetUser._id).select('_id followers following');
        return res.status(200).json({
            message: 'User unfollowed',
            userId: String(refreshedTarget._id),
            followerCount: Array.isArray(refreshedTarget.followers) ? refreshedTarget.followers.length : 0,
            followingCount: Array.isArray(refreshedTarget.following) ? refreshedTarget.following.length : 0,
            starCount: Array.isArray(refreshedTarget.followers) ? refreshedTarget.followers.length : 0,
            isFollowedByCurrentUser: false,
        });
    } catch (error) {
        if (error?.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        console.error('Unfollow user error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @desc    Get teammate profile by id
// @route   GET /api/user/:userId/profile
// @access  Private
router.get('/:userId/profile', protect, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.userId).select('-passwordHash');
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        const followingUserIds = new Set(
            (Array.isArray(req.user?.following) ? req.user.following : []).map((id) => String(id))
        );

        // Background sync if cache is missing or stale (e.g., > 24h)
        const githubUsername = targetUser.githubUsername;
        if (githubUsername) {
            const cache = targetUser.githubSummaryCache;
            const isStale = !cache?.fetchedAt || (Date.now() - new Date(cache.fetchedAt).getTime() > 24 * 60 * 60 * 1000);
            if (isStale) {
                buildGitHubSummaryForUser(targetUser, githubUsername).catch(err => {
                    console.error('Background teammate GitHub sync failed:', err);
                });
            }
        }

        return res.json({
            id: targetUser._id,
            name: targetUser.name,
            email: targetUser.email,
            age: targetUser.age,
            qualifications: targetUser.qualifications,
            role: targetUser.role,
            bio: targetUser.bio,
            location: targetUser.location,
            website: targetUser.website,
            socialLinks: normalizeSocialLinks(targetUser.socialLinks),
            githubConnected: Boolean(targetUser.githubId || targetUser.githubUsername),
            githubUsername: targetUser.githubUsername,
            githubProfileReadme: targetUser.githubProfileReadme || null,
            githubSummaryCache: targetUser.githubSummaryCache || null,
            googleConnected: Boolean(targetUser.googleId),
            skills: targetUser.skills,
            interests: targetUser.interests,
            availability: targetUser.availability,
            onboardingCompleted: targetUser.onboardingCompleted,
            experienceLevel: targetUser.experienceLevel,
            availabilityStatus: targetUser.availabilityStatus,
            followerCount: Array.isArray(targetUser.followers) ? targetUser.followers.length : 0,
            followingCount: Array.isArray(targetUser.following) ? targetUser.following.length : 0,
            connectedCount: Array.isArray(targetUser.connections) ? targetUser.connections.length : 0,
            starCount: Array.isArray(targetUser.followers) ? targetUser.followers.length : 0,
            isFollowedByCurrentUser: followingUserIds.has(String(targetUser._id)),
            createdAt: targetUser.createdAt,
        });
    } catch (error) {
        if (error?.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        console.error('Get teammate profile error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @desc    Search all users
// @route   GET /api/user?search=
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { search, skills, availability, experience } = req.query;
        const connectedUserIds = new Set(
            (Array.isArray(req.user?.connections) ? req.user.connections : []).map((id) => String(id))
        );
        const followingUserIds = new Set(
            (Array.isArray(req.user?.following) ? req.user.following : []).map((id) => String(id))
        );

        const query = { _id: { $ne: req.user._id } };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { role: { $regex: search, $options: 'i' } },
                { bio: { $regex: search, $options: 'i' } }
            ];
        }

        if (skills) {
            const skillsArray = skills.split(',').filter(s => s.trim() !== '');
            if (skillsArray.length > 0) {
                // Find users who have at least one of the selected skills
                query.skills = { $in: skillsArray.map(s => new RegExp(`^${s}$`, 'i')) };
            }
        }

        if (availability) {
            const availabilityArray = availability.split(',').filter(s => s.trim() !== '');
            if (availabilityArray.length > 0) {
                query.availabilityStatus = { $in: availabilityArray };
            }
        }

        if (experience) {
            const experienceArray = experience.split(',').filter(s => s.trim() !== '');
            if (experienceArray.length > 0) {
                query.experienceLevel = { $in: experienceArray };
            }
        }

        const users = await User.find(query).select('-passwordHash -googleId -githubSummaryCache -githubProfileReadme');
        const sanitizedUsers = users.map((user) => {
            const plainUser = user.toObject();
            const { githubId, ...rest } = plainUser;
            const publicUser = toPublicUserPayload(rest, followingUserIds);
            return {
                ...publicUser,
                githubConnected: Boolean(githubId || plainUser.githubUsername),
                isConnected: connectedUserIds.has(String(plainUser?._id || plainUser?.id || '')),
            };
        });
        res.json(sanitizedUsers);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
