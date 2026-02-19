import React, { useEffect, useMemo, useState } from 'react';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import AvailabilityCalendar from './AvailabilityCalendar';
import EditProfileModal from './EditProfileModal';
import ProfileProjectRecommendations from './ProfileProjectRecommendations';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { markdownToHtml } from '../../utils/markdownToHtml';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editInitialTab, setEditInitialTab] = useState('general');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [repos, setRepos] = useState([]);
    const [reposLoading, setReposLoading] = useState(false);
    const [githubSummary, setGithubSummary] = useState(null);

    const readStoredUser = () => {
        try {
            return JSON.parse(localStorage.getItem('authUser') || '{}');
        } catch (_error) {
            return {};
        }
    };

    const fallbackAvatar = useMemo(() => {
        const authUser = readStoredUser();
        return (
            authUser.avatar ||
            'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'
        );
    }, []);

    const normalizeUser = (profile) => ({
        ...profile,
        avatar: profile.avatar || fallbackAvatar,
        verified: Boolean(profile.onboardingCompleted),
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        availability: profile.availability || {},
        socialLinks: {
            linkedin: String(profile?.socialLinks?.linkedin || '').trim(),
            twitter: String(profile?.socialLinks?.twitter || '').trim(),
            portfolio: String(profile?.socialLinks?.portfolio || '').trim(),
            other: String(profile?.socialLinks?.other || '').trim(),
        },
    });

    const persistAuthUser = (profile) => {
        const { githubProfileReadme, ...profileWithoutReadme } = profile || {};
        localStorage.setItem(
            'authUser',
            JSON.stringify({
                ...readStoredUser(),
                ...profileWithoutReadme,
            })
        );
    };

    const fetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load profile');
            }

            const normalized = normalizeUser(data);
            setUser(normalized);
            persistAuthUser(normalized);
        } catch (fetchError) {
            setError(fetchError.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRepos = async () => {
        if (!user?.githubConnected) return;

        setReposLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/user/github/summary`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch GitHub summary');
            }

            setGithubSummary(data);
            setRepos(Array.isArray(data?.repos) ? data.repos : []);
        } catch (fetchError) {
            console.error("Failed to fetch GitHub summary", fetchError);
            setGithubSummary(null);
            setRepos([]);
        } finally {
            setReposLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (user?.githubConnected) {
            fetchRepos();
        } else {
            setGithubSummary(null);
            setRepos([]);
        }
    }, [user?.githubConnected]);

    const topLanguage = useMemo(() => {
        if (githubSummary?.stats?.topLanguage) {
            return githubSummary.stats.topLanguage;
        }

        if (!Array.isArray(repos) || repos.length === 0) {
            return 'N/A';
        }

        const languageMap = repos.reduce((acc, repo) => {
            if (repo.language) {
                acc[repo.language] = (acc[repo.language] || 0) + 1;
            }
            return acc;
        }, {});

        return Object.entries(languageMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    }, [githubSummary, repos]);

    const githubProfileUrl = useMemo(() => {
        if (githubSummary?.profile?.html_url) {
            return githubSummary.profile.html_url;
        }
        if (user?.githubUsername) {
            return `https://github.com/${user.githubUsername}`;
        }
        return null;
    }, [githubSummary, user?.githubUsername]);

    const profileReadme = githubSummary?.profileReadme || user?.githubProfileReadme || null;
    const profileReadmeHtml = typeof profileReadme?.renderedHtml === 'string'
        ? profileReadme.renderedHtml.trim()
        : '';
    const profileReadmeContent = typeof profileReadme?.content === 'string'
        ? profileReadme.content.trim()
        : '';
    const profileReadmeFallbackHtml = useMemo(
        () => (profileReadmeContent ? markdownToHtml(profileReadmeContent) : ''),
        [profileReadmeContent]
    );
    const safeProfileReadmeHtml = useMemo(
        () => sanitizeHtml(profileReadmeHtml || profileReadmeFallbackHtml),
        [profileReadmeHtml, profileReadmeFallbackHtml]
    );

    const handleSave = async (updatedUser) => {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: updatedUser.name,
                age: Number(updatedUser.age) || undefined,
                qualifications: updatedUser.qualifications,
                role: updatedUser.role,
                bio: updatedUser.bio,
                location: updatedUser.location,
                website: updatedUser.website,
                socialLinks: updatedUser.socialLinks || {},
                skills: updatedUser.skills || [],
                interests: updatedUser.interests || [],
                availability: updatedUser.availability || {},
                embedding: Array.isArray(updatedUser.embedding) ? updatedUser.embedding : undefined,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update profile');
        }

        const normalized = normalizeUser(data.user);
        setUser(normalized);
        persistAuthUser(normalized);
    };

    const openEditModal = (tab = 'general') => {
        setEditInitialTab(tab);
        setIsEditing(true);
    };

    if (loading) {
        return (
            <div className="mx-auto flex min-h-[50vh] max-w-7xl 2xl:max-w-screen-2xl items-center justify-center">
                <div className="surface-card rounded-2xl px-5 py-3 text-slate-600 inline-flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    Loading profile...
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="mx-auto max-w-7xl 2xl:max-w-screen-2xl">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                    {error || 'Unable to load profile'}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl 2xl:max-w-screen-2xl space-y-7 page-shell">
            <ProfileHeader
                user={user}
                onEdit={() => openEditModal('general')}
                onEditSkills={() => openEditModal('skills')}
                topLanguage={topLanguage}
                reposLoading={reposLoading}
                githubSummary={githubSummary}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Stats & Availability */}
                <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                    <ProfileStats user={user} />
                    <AvailabilityCalendar availability={user.availability} />
                </div>

                {/* Right Column - Interests & GitHub */}
                <div className="lg:col-span-2 space-y-6">
                    {/* GitHub Repositories */}
                    <div className="surface-card rounded-2xl p-5 sm:p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                <span className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c-2.433-.927-4.131-3.292-4.131-6.04 0-3.568 2.894-6.462 6.462-6.462s6.462 2.894 6.462 6.462c0 2.748-1.698 5.112-4.132 6.039v-3.293c0-1.12.394-1.85.823-2.222-2.671-.297-5.478-1.313-5.478-5.921 0-1.31.465-2.38 1.235-3.221-.124-.303-.535-1.524.118-3.176 0 0 1.006-.322 3.297 1.23 2.292-.266 3.298-.266 3.006.404.957-.266 1.983-.399 3.003-.404 2.293 1.552 3.301 1.23 3.301 1.23.652 1.652.241 2.873.117 3.176.767.84 1.236 1.911 1.236 3.221 0 4.597-2.805 5.624-5.467 5.931.344.299.654.829.761 1.604.686.307 2.423.837 3.493-.997 0 0 .634-1.153 1.839-1.237-1.089.745-.316 2.054-1.333 1.756-.705 1.956-6.666 4.908-6.666 1.416v2.234c0 .316.194.688.793.577 4.77-1.587 8.207-6.085 8.207-11.387 0-6.627-5.373-12-12-12z" /></svg>
                                </span>
                                GitHub Repositories
                            </h3>
                            {user.githubConnected && githubProfileUrl && (
                                <a
                                    href={githubProfileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                    View Profile
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                </a>
                            )}
                        </div>

                        {user.githubConnected ? (
                            reposLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {githubSummary?.stats ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <div className="text-xs text-gray-500 mb-1">Public Repos</div>
                                                    <div className="font-bold text-gray-900">{githubSummary.stats.publicRepos}</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <div className="text-xs text-gray-500 mb-1">Followers</div>
                                                    <div className="font-bold text-gray-900">{githubSummary.stats.followers}</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <div className="text-xs text-gray-500 mb-1">Following</div>
                                                    <div className="font-bold text-gray-900">{githubSummary.stats.following}</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <div className="text-xs text-gray-500 mb-1">Total Stars</div>
                                                    <div className="font-bold text-gray-900">{githubSummary.stats.totalStars}</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <div className="text-xs text-gray-500 mb-1">Total Forks</div>
                                                    <div className="font-bold text-gray-900">{githubSummary.stats.totalForks}</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <div className="text-xs text-gray-500 mb-1">Top Language</div>
                                                    <div className="font-bold text-gray-900">{githubSummary.stats.topLanguage}</div>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Top Languages</div>
                                                {Array.isArray(githubSummary.stats.topLanguages) && githubSummary.stats.topLanguages.length > 0 ? (
                                                    <div className="h-40 overflow-y-scroll pr-1 space-y-2">
                                                        {githubSummary.stats.topLanguages.map((entry) => (
                                                            <div key={entry.language} className="flex items-center justify-between text-sm bg-white rounded-lg px-2.5 py-1.5 border border-gray-100">
                                                                <span className="text-gray-700">{entry.language}</span>
                                                                <span className="text-gray-500">{entry.repoCount} repos</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-500">No language data available.</div>
                                                )}
                                            </div>

                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Profile README</div>
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
                                                        className="text-xs text-gray-700 bg-white border border-gray-100 rounded-lg p-2.5 h-56 overflow-y-scroll leading-relaxed
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
                                                    <div className="text-xs text-gray-500">
                                                        No GitHub profile README found yet.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}

                                    {repos.length > 0 ? (
                                        <div className="h-[460px] overflow-y-scroll pr-1 space-y-3.5">
                                            {repos.map((repo) => (
                                                <div key={repo.id} onClick={() => window.open(repo.html_url, '_blank')} className="group p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer bg-white">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                                                                {repo.name}
                                                            </h4>
                                                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{repo.description || "No description available"}</p>
                                                            {Array.isArray(repo.topics) && repo.topics.length > 0 ? (
                                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                                    {repo.topics.slice(0, 4).map((topic) => (
                                                                        <span key={topic} className="px-2 py-0.5 text-[11px] bg-gray-100 text-gray-600 rounded-md">
                                                                            #{topic}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : null}

                                                            <div className="flex items-center gap-4">
                                                                {repo.language && (
                                                                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                                        {repo.language}
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                                    {repo.stargazers_count}
                                                                </span>
                                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                                    Forks: {repo.forks_count || 0}
                                                                </span>
                                                                {repo.updated_at ? (
                                                                    <span className="text-xs text-gray-500">
                                                                        Updated {new Date(repo.updated_at).toLocaleDateString()}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-gray-500">No public repositories found</p>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-400" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c-2.433-.927-4.131-3.292-4.131-6.04 0-3.568 2.894-6.462 6.462-6.462s6.462 2.894 6.462 6.462c0 2.748-1.698 5.112-4.132 6.039v-3.293c0-1.12.394-1.85.823-2.222-2.671-.297-5.478-1.313-5.478-5.921 0-1.31.465-2.38 1.235-3.221-.124-.303-.535-1.524.118-3.176 0 0 1.006-.322 3.297 1.23 2.292-.266 3.298-.266 3.006.404.957-.266 1.983-.399 3.003-.404 2.293 1.552 3.301 1.23 3.301 1.23.652 1.652.241 2.873.117 3.176.767.84 1.236 1.911 1.236 3.221 0 4.597-2.805 5.624-5.467 5.931.344.299.654.829.761 1.604.686.307 2.423.837 3.493-.997 0 0 .634-1.153 1.839-1.237-1.089.745-.316 2.054-1.333 1.756-.705 1.956-6.666 4.908-6.666 1.416v2.234c0 .316.194.688.793.577 4.77-1.587 8.207-6.085 8.207-11.387 0-6.627-5.373-12-12-12z" /></svg>
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1">Connect GitHub</h4>
                                <p className="text-gray-500 text-sm mb-4">Link your account to showcase your repositories</p>
                                <button
                                    onClick={() => openEditModal('general')}
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                                >
                                    Go to Settings
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="surface-card rounded-2xl p-5 sm:p-6">
                        <h3 className="font-bold text-slate-900 text-lg mb-3">Project Interests</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            These were selected during onboarding and are used for matching.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {user.interests.length ? (
                                user.interests.map((interest) => (
                                    <span
                                        key={interest}
                                        className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-100"
                                    >
                                        {interest}
                                    </span>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500">No interests added yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ProfileProjectRecommendations
                userId={user.id || user._id || ''}
                userSkills={user.skills || []}
            />

            {isEditing && (
                <EditProfileModal
                    user={user}
                    onClose={() => setIsEditing(false)}
                    onSave={handleSave}
                    initialTab={editInitialTab}
                />
            )}
        </div>
    );
};

export default Profile;
