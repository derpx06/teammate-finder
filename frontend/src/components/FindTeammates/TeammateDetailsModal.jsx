import React, { useEffect, useMemo, useState } from 'react';
import {
    X,
    MapPin,
    Briefcase,
    Clock,
    Globe,
    Mail,
    Github,
    CalendarDays,
    BadgeCheck,
    Loader2,
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { markdownToHtml } from '../../utils/markdownToHtml';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

const fallbackAvatar =
    'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';

const toSafeString = (value, fallback = '') => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || fallback;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return fallback;
};

const toStringArray = (value) => {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => toSafeString(item))
        .filter(Boolean);
};

const toDisplayDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
};

const toAbsoluteUrl = (value) => {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
};

const normalizeAvailability = (availability) => {
    if (!availability || typeof availability !== 'object') return [];
    return Object.entries(availability)
        .map(([day, slots]) => ({
            day,
            slots: Array.isArray(slots)
                ? slots.map((slot) => toSafeString(slot)).filter(Boolean)
                : [],
        }))
        .filter((item) => item.slots.length > 0);
};

const TeammateDetailsModal = ({ user, onClose }) => {
    const [detailedUser, setDetailedUser] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [githubSummary, setGithubSummary] = useState(null);
    const [githubLoading, setGithubLoading] = useState(false);
    const [githubError, setGithubError] = useState('');
    const teammateId = user?._id || user?.id;
    const activeUser = useMemo(() => {
        if (!user && !detailedUser) return null;
        return {
            ...(user || {}),
            ...(detailedUser || {}),
        };
    }, [user, detailedUser]);
    const activeUserId = activeUser?._id || activeUser?.id;
    const hasGithubConnection = Boolean(activeUser?.githubConnected || activeUser?.githubUsername);

    useEffect(() => {
        const fetchDetailedProfile = async () => {
            if (!teammateId) {
                setDetailedUser(user || null);
                setProfileError(user ? 'Showing available profile data. Full linked profile id was not found.' : '');
                setProfileLoading(false);
                setGithubSummary(null);
                setGithubError('');
                setGithubLoading(false);
                return;
            }

            setDetailedUser(null);
            setProfileLoading(true);
            setProfileError('');
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/api/user/${teammateId}/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch teammate profile');
                }
                setDetailedUser(data);
            } catch (error) {
                setDetailedUser(null);
                setProfileError(error.message || 'Unable to load full teammate profile');
            } finally {
                setProfileLoading(false);
            }
        };

        fetchDetailedProfile();
    }, [teammateId, user]);

    useEffect(() => {
        if (!activeUser) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, activeUser]);

    useEffect(() => {
        const fetchTeammateGitHubSummary = async () => {
            if (!activeUserId) {
                setGithubSummary(null);
                setGithubError('');
                setGithubLoading(false);
                return;
            }

            setGithubLoading(true);
            setGithubError('');
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/api/user/${activeUserId}/github/summary`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (!response.ok) {
                    if (response.status === 404) {
                        setGithubSummary(null);
                        setGithubError('');
                        return;
                    }
                    throw new Error(data.error || 'Failed to fetch teammate GitHub details');
                }
                setGithubSummary(data);
            } catch (error) {
                setGithubSummary(null);
                setGithubError(error.message || 'Unable to load teammate GitHub details');
            } finally {
                setGithubLoading(false);
            }
        };

        fetchTeammateGitHubSummary();
    }, [activeUserId]);

    const safeUser = activeUser
        ? {
            ...activeUser,
            id: toSafeString(activeUser._id || activeUser.id),
            name: toSafeString(activeUser.name, 'Unknown User'),
            role: toSafeString(activeUser.role, 'Member'),
            email: toSafeString(activeUser.email, 'Email not available'),
            bio: toSafeString(activeUser.bio),
            location: toSafeString(activeUser.location, 'Remote'),
            website: toSafeString(activeUser.website),
            githubUsername: toSafeString(activeUser.githubUsername),
            qualifications: toSafeString(activeUser.qualifications, 'N/A'),
            experienceLevel: toSafeString(activeUser.experienceLevel, 'Junior'),
            availabilityStatus: toSafeString(activeUser.availabilityStatus, 'Part-time'),
            age: toSafeString(activeUser.age, 'N/A'),
            avatar: toSafeString(activeUser.avatar),
            skills: toStringArray(activeUser.skills),
            interests: toStringArray(activeUser.interests),
            availability:
                activeUser.availability && typeof activeUser.availability === 'object'
                    ? activeUser.availability
                    : {},
            onboardingCompleted: Boolean(activeUser.onboardingCompleted),
            githubProfileReadme: activeUser.githubProfileReadme || null,
            githubSummaryCache: activeUser.githubSummaryCache || null,
            followerCount: Number(activeUser.followerCount) || 0,
            followingCount: Number(activeUser.followingCount) || 0,
            connectedCount: Number(activeUser.connectedCount) || 0,
            starCount: Number(activeUser.starCount ?? activeUser.followerCount) || 0,
            createdAt: activeUser.createdAt,
        }
        : null;

    const effectiveGithubSummary = githubSummary || safeUser?.githubSummaryCache || null;
    const effectiveGithubUsername = toSafeString(
        safeUser?.githubUsername || effectiveGithubSummary?.profile?.login
    );

    const availabilityRows = normalizeAvailability(safeUser?.availability);
    const websiteUrl = toAbsoluteUrl(safeUser?.website);
    const githubUrl = effectiveGithubUsername ? `https://github.com/${effectiveGithubUsername}` : null;
    const profileReadme = effectiveGithubSummary?.profileReadme || safeUser?.githubProfileReadme || null;
    const profileReadmeHtml =
        typeof profileReadme?.renderedHtml === 'string' ? profileReadme.renderedHtml.trim() : '';
    const profileReadmeContent =
        typeof profileReadme?.content === 'string' ? profileReadme.content.trim() : '';
    const profileReadmeFallbackHtml = useMemo(
        () => (profileReadmeContent ? markdownToHtml(profileReadmeContent) : ''),
        [profileReadmeContent]
    );
    const safeProfileReadmeHtml = useMemo(
        () => sanitizeHtml(profileReadmeHtml || profileReadmeFallbackHtml),
        [profileReadmeHtml, profileReadmeFallbackHtml]
    );
    const teammateRepos = Array.isArray(effectiveGithubSummary?.repos) ? effectiveGithubSummary.repos : [];
    const profileDescription = toSafeString(
        safeUser?.bio || effectiveGithubSummary?.profile?.bio,
        'No description added yet.'
    );
    const hasGitHubData = Boolean(
        hasGithubConnection
        || effectiveGithubUsername
        || effectiveGithubSummary?.profile?.login
        || teammateRepos.length
        || safeProfileReadmeHtml
        || (effectiveGithubSummary?.stats && Object.keys(effectiveGithubSummary.stats).length > 0)
    );
    const hasRenderableGitHubContent = Boolean(
        (effectiveGithubSummary?.stats && Object.keys(effectiveGithubSummary.stats).length > 0) || teammateRepos.length || safeProfileReadmeHtml
    );
    const topLanguage = effectiveGithubSummary?.stats?.topLanguage
        || Object.entries(
            teammateRepos.reduce((acc, repo) => {
                const language = toSafeString(repo?.language);
                if (language) {
                    acc[language] = (acc[language] || 0) + 1;
                }
                return acc;
            }, {})
        ).sort((a, b) => b[1] - a[1])[0]?.[0]
        || 'N/A';

    if (!user) return null;

    if (!safeUser) {
        return (
            <div
                className="fixed inset-0 z-50 bg-gray-900/60 p-4 sm:p-6 flex items-center justify-center"
                onClick={onClose}
            >
                <div
                    className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Teammate Profile</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <X size={22} />
                        </button>
                    </div>
                    <div className="p-8 flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Loader2 size={16} className="animate-spin" />
                        Loading linked profile...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-gray-900/60 p-4 sm:p-6 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Teammate Profile</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <img
                            src={safeUser.avatar || fallbackAvatar}
                            alt={safeUser.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
                        />
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{safeUser.name}</h3>
                            <p className="text-blue-600 font-medium">{safeUser.role}</p>
                            <p className="text-sm text-gray-500">
                                Joined {toDisplayDate(safeUser.createdAt)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    Stars: {safeUser.starCount}
                                </span>
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    Followers: {safeUser.followerCount}
                                </span>
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Following: {safeUser.followingCount}
                                </span>
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
                                    Connected: {safeUser.connectedCount}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
                            Profile Description
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {profileDescription}
                        </p>
                    </div>

                    {profileError ? (
                        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                            {profileError}
                        </div>
                    ) : null}

                    {profileLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 size={14} className="animate-spin" />
                            Loading full profile details...
                        </div>
                    ) : null}

                    <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700 flex items-center gap-2">
                            <Mail size={14} className="text-gray-500" />
                            <span>{safeUser.email}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700 flex items-center gap-2">
                            <Briefcase size={14} className="text-gray-500" />
                            <span>{safeUser.experienceLevel}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700 flex items-center gap-2">
                            <Clock size={14} className="text-gray-500" />
                            <span>{safeUser.availabilityStatus}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700 flex items-center gap-2">
                            <MapPin size={14} className="text-gray-500" />
                            <span>{safeUser.location}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700 flex items-center gap-2">
                            <BadgeCheck size={14} className="text-gray-500" />
                            <span>{safeUser.onboardingCompleted ? 'Onboarding complete' : 'Onboarding pending'}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700">
                            <span className="font-medium">Age:</span> {safeUser.age}
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700 md:col-span-2">
                            <span className="font-medium">Qualifications:</span>{' '}
                            {safeUser.qualifications}
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700 md:col-span-2">
                            <div className="flex flex-wrap gap-4">
                                {websiteUrl ? (
                                    <a
                                        href={websiteUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
                                    >
                                        <Globe size={14} />
                                        {safeUser.website}
                                    </a>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-gray-500">
                                        <Globe size={14} />
                                        Website not provided
                                    </span>
                                )}

                                {githubUrl ? (
                                    <a
                                        href={githubUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
                                    >
                                        <Github size={14} />
                                        @{effectiveGithubUsername}
                                    </a>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-gray-500">
                                        <Github size={14} />
                                        GitHub not connected
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white border border-gray-100 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                                Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {safeUser.skills.length > 0 ? (
                                    safeUser.skills.map((skill, index) => (
                                        <span
                                            key={`${skill}-${index}`}
                                            className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100"
                                        >
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-500">No skills listed.</span>
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                                Interests
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {safeUser.interests.length > 0 ? (
                                    safeUser.interests.map((interest, index) => (
                                        <span
                                            key={`${interest}-${index}`}
                                            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100"
                                        >
                                            {interest}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-500">No interests listed.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <CalendarDays size={14} />
                            Availability Schedule
                        </h4>
                        {availabilityRows.length > 0 ? (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {availabilityRows.map((item) => (
                                    <div
                                        key={item.day}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-gray-50 border border-gray-100 rounded-lg p-2.5"
                                    >
                                        <span className="text-sm font-medium text-gray-800 capitalize">
                                            {item.day}
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.slots.map((slot) => (
                                                <span
                                                    key={`${item.day}-${slot}`}
                                                    className="px-2 py-0.5 text-xs rounded-md bg-white border border-gray-200 text-gray-600"
                                                >
                                                    {slot}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No availability schedule provided.</p>
                        )}
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                            GitHub Projects & Stats
                        </h4>

                        {!hasGitHubData ? (
                            <p className="text-sm text-gray-500">GitHub is not connected for this user.</p>
                        ) : githubLoading && !hasRenderableGitHubContent ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 size={14} className="animate-spin" />
                                Loading GitHub data...
                            </div>
                        ) : githubError && !hasRenderableGitHubContent ? (
                            <p className="text-sm text-red-600">{githubError}</p>
                        ) : (
                            <div className="space-y-4">
                                {githubError && hasRenderableGitHubContent ? (
                                    <p className="text-xs text-amber-600">
                                        Live GitHub refresh failed, showing saved data.
                                    </p>
                                ) : null}
                                {effectiveGithubSummary?.stats ? (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <div className="text-xs text-gray-500 mb-1">Public Repos</div>
                                                <div className="font-bold text-gray-900">{effectiveGithubSummary.stats.publicRepos ?? 0}</div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <div className="text-xs text-gray-500 mb-1">Followers</div>
                                                <div className="font-bold text-gray-900">{effectiveGithubSummary.stats.followers ?? 0}</div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <div className="text-xs text-gray-500 mb-1">Following</div>
                                                <div className="font-bold text-gray-900">{effectiveGithubSummary.stats.following ?? 0}</div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <div className="text-xs text-gray-500 mb-1">Total Stars</div>
                                                <div className="font-bold text-gray-900">{effectiveGithubSummary.stats.totalStars ?? 0}</div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <div className="text-xs text-gray-500 mb-1">Total Forks</div>
                                                <div className="font-bold text-gray-900">{effectiveGithubSummary.stats.totalForks ?? 0}</div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <div className="text-xs text-gray-500 mb-1">Top Language</div>
                                                <div className="font-bold text-gray-900">{topLanguage}</div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                            <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                                Top Languages
                                            </div>
                                            {Array.isArray(effectiveGithubSummary.stats.topLanguages) && effectiveGithubSummary.stats.topLanguages.length > 0 ? (
                                                <div className="h-32 overflow-y-scroll pr-1 space-y-2">
                                                    {effectiveGithubSummary.stats.topLanguages.map((entry, index) => (
                                                        <div
                                                            key={`${toSafeString(entry?.language, 'language')}-${index}`}
                                                            className="flex items-center justify-between text-sm bg-white rounded-lg px-2.5 py-1.5 border border-gray-100"
                                                        >
                                                            <span className="text-gray-700">{toSafeString(entry?.language, 'N/A')}</span>
                                                            <span className="text-gray-500">{Number(entry?.repoCount) || 0} repos</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500">No language data available.</p>
                                            )}
                                        </div>
                                    </>
                                ) : null}

                                <div>
                                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                        Projects (GitHub Repositories)
                                    </h5>
                                    {teammateRepos.length > 0 ? (
                                        <div className="h-72 overflow-y-scroll pr-1 space-y-3">
                                            {teammateRepos.map((repo, index) => {
                                                const repoName = toSafeString(repo?.name, 'Untitled Repository');
                                                const repoUrl = toAbsoluteUrl(toSafeString(repo?.html_url));
                                                const repoLanguage = toSafeString(repo?.language);
                                                const repoDescription = toSafeString(repo?.description, 'No description available');
                                                const repoStars = Number(repo?.stargazers_count) || 0;
                                                const repoForks = Number(repo?.forks_count) || 0;
                                                const content = (
                                                    <>
                                                        <h6 className="font-semibold text-gray-900 text-sm mb-1">{repoName}</h6>
                                                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                                            {repoDescription}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                            {repoLanguage ? <span>{repoLanguage}</span> : null}
                                                            <span>Stars: {repoStars}</span>
                                                            <span>Forks: {repoForks}</span>
                                                        </div>
                                                    </>
                                                );

                                                if (!repoUrl) {
                                                    return (
                                                        <div
                                                            key={repo?.id || repo?.full_name || repoName || index}
                                                            className="block p-3 rounded-xl border border-gray-100 bg-gray-50/50"
                                                        >
                                                            {content}
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <a
                                                        key={repo?.id || repo?.full_name || repoName || index}
                                                        href={repoUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all"
                                                    >
                                                        {content}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No public repositories found.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                GitHub Profile README
                            </h4>
                            {profileReadme?.htmlUrl ? (
                                <a
                                    href={profileReadme.htmlUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                    Open on GitHub
                                </a>
                            ) : null}
                        </div>

                        {safeProfileReadmeHtml ? (
                            <div
                                className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-3 h-56 overflow-y-scroll leading-relaxed
                                [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mb-2
                                [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2
                                [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1.5
                                [&_p]:mb-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:mb-1
                                [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
                                [&_pre]:bg-gray-100 [&_pre]:rounded [&_pre]:p-2 [&_pre]:overflow-x-auto
                                [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3"
                                dangerouslySetInnerHTML={{ __html: safeProfileReadmeHtml }}
                            />
                        ) : (
                            <p className="text-sm text-gray-500">No profile README saved for this user yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeammateDetailsModal;
