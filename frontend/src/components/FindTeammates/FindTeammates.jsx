import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Loader2, Sparkles, Users, Filter, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import FilterSidebar from './FilterSidebar';
import TeammateCard from './TeammateCard';
import TeammateDetailsModal from './TeammateDetailsModal';
import ComponentErrorBoundary from '../common/ComponentErrorBoundary';
import { API_BASE_URL } from '../../config/api';

const FindTeammates = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
    const [semanticQuery, setSemanticQuery] = useState('');
    const [filters, setFilters] = useState({
        skills: [],
        availability: [],
        experience: [],
    });
    const [teammates, setTeammates] = useState([]);
    const [semanticResults, setSemanticResults] = useState([]);
    const [isSemanticMode, setIsSemanticMode] = useState(false);
    const [semanticMeta, setSemanticMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [semanticLoading, setSemanticLoading] = useState(false);
    const [error, setError] = useState('');
    const [semanticError, setSemanticError] = useState('');
    const [connectError, setConnectError] = useState('');
    const [connectSuccess, setConnectSuccess] = useState('');
    const [connectingUserId, setConnectingUserId] = useState('');
    const [followError, setFollowError] = useState('');
    const [followSuccess, setFollowSuccess] = useState('');
    const [followingUserId, setFollowingUserId] = useState('');
    const [selectedTeammate, setSelectedTeammate] = useState(null);
    const [lastAutoSemanticQuery, setLastAutoSemanticQuery] = useState('');

    useEffect(() => {
        const queryFromUrl = searchParams.get('search') || '';
        if (queryFromUrl !== searchQuery) {
            setSearchQuery(queryFromUrl);
        }
    }, [searchParams, searchQuery]);

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        if (isSemanticMode && value.trim() !== semanticQuery.trim()) {
            setIsSemanticMode(false);
        }
        const nextParams = new URLSearchParams(searchParams);
        if (value.trim()) {
            nextParams.set('search', value.trim());
        } else {
            nextParams.delete('search');
        }
        setSearchParams(nextParams, { replace: true });
    };

    const fetchTeammates = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            const queryParams = new URLSearchParams();

            if (searchQuery) queryParams.append('search', searchQuery);
            if (filters.skills.length > 0) queryParams.append('skills', filters.skills.join(','));
            if (filters.availability.length > 0) queryParams.append('availability', filters.availability.join(','));
            if (filters.experience.length > 0) queryParams.append('experience', filters.experience.join(','));

            const response = await fetch(`${API_BASE_URL}/api/user?${queryParams.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch teammates');
            }

            const data = await response.json();
            setTeammates(data);
        } catch (requestError) {
            console.error('Error fetching teammates:', requestError);
            setError('Failed to load teammates. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters]);

    const isNaturalLanguageQuery = useCallback((value) => {
        const query = String(value || '').trim().toLowerCase();
        if (!query) return false;

        const words = query.split(/\s+/).filter(Boolean);
        const naturalLanguageHints = [
            'need',
            'looking',
            'find',
            'want',
            'someone',
            'who',
            'with',
            'for',
            'help',
            'expert',
            'developer',
            'engineer',
            'build',
            'create',
        ];

        if (words.length >= 4) return true;
        return naturalLanguageHints.some((hint) => query.includes(hint));
    }, []);

    const runSemanticSearch = useCallback(async (rawQuery, options = {}) => {
        const { mirrorInSmartInput = false, markAuto = false } = options;
        const normalizedQuery = String(rawQuery || '').trim();

        if (!normalizedQuery) {
            setIsSemanticMode(false);
            setSemanticResults([]);
            setSemanticMeta(null);
            setSemanticError('');
            return;
        }

        if (mirrorInSmartInput) {
            setSemanticQuery(normalizedQuery);
        }

        setSemanticLoading(true);
        setSemanticError('');
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${API_BASE_URL}/api/user/search-semantic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ queryText: normalizedQuery }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to run semantic search');
            }

            const results = Array.isArray(data.results) ? data.results : [];
            setSemanticResults(results);
            setSemanticMeta(data.meta || null);
            setIsSemanticMode(true);
            if (markAuto) {
                setLastAutoSemanticQuery(normalizedQuery);
            }
        } catch (searchError) {
            console.error('Semantic search failed:', searchError);
            setSemanticError(searchError.message || 'Semantic search failed');
        } finally {
            setSemanticLoading(false);
        }
    }, []);

    const handleSemanticSearch = async (event) => {
        event.preventDefault();
        await runSemanticSearch(semanticQuery, { mirrorInSmartInput: true });
    };

    const handlePrimarySearchSubmit = async (event) => {
        event.preventDefault();
        const normalizedQuery = searchQuery.trim();

        if (!normalizedQuery) {
            setIsSemanticMode(false);
            setSemanticResults([]);
            setSemanticMeta(null);
            setSemanticError('');
            fetchTeammates();
            return;
        }

        if (isNaturalLanguageQuery(normalizedQuery)) {
            await runSemanticSearch(normalizedQuery, { mirrorInSmartInput: true });
            return;
        }

        setIsSemanticMode(false);
        setSemanticError('');
        setSemanticMeta(null);
        fetchTeammates();
    };

    const clearSemanticSearch = () => {
        setSemanticQuery('');
        setSemanticError('');
        setSemanticResults([]);
        setSemanticMeta(null);
        setIsSemanticMode(false);
    };

    const handleConnect = useCallback(async (targetUser) => {
        if (targetUser?.isConnected) {
            return;
        }

        const recipientId = String(targetUser?._id || targetUser?.id || '').trim();
        if (!recipientId) return;

        setConnectError('');
        setConnectSuccess('');
        setConnectingUserId(recipientId);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/notification/connection-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ recipientId }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send connection request');
            }

            setConnectSuccess(data.message || `Connection request sent to ${targetUser?.name || 'user'}.`);
        } catch (requestError) {
            setConnectError(requestError.message || 'Failed to send connection request');
        } finally {
            setConnectingUserId('');
        }
    }, []);

    const updateFollowDataInList = useCallback((list, userId, isFollowed, followerCount) => {
        return (Array.isArray(list) ? list : []).map((user) => {
            const candidateId = String(user?._id || user?.id || '');
            if (candidateId !== userId) return user;
            return {
                ...user,
                isFollowedByCurrentUser: isFollowed,
                followerCount,
                starCount: followerCount,
            };
        });
    }, []);

    const handleToggleFollow = useCallback(async (targetUser) => {
        const targetUserId = String(targetUser?._id || targetUser?.id || '').trim();
        if (!targetUserId) return;

        const isFollowing = Boolean(targetUser?.isFollowedByCurrentUser);
        setFollowError('');
        setFollowSuccess('');
        setFollowingUserId(targetUserId);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/user/${targetUserId}/follow`, {
                method: isFollowing ? 'DELETE' : 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update follow status');
            }

            const nextIsFollowed = Boolean(data.isFollowedByCurrentUser);
            const nextFollowerCount = Number(data.followerCount) || 0;

            setTeammates((prev) => updateFollowDataInList(prev, targetUserId, nextIsFollowed, nextFollowerCount));
            setSemanticResults((prev) => updateFollowDataInList(prev, targetUserId, nextIsFollowed, nextFollowerCount));
            setSelectedTeammate((prev) => {
                if (!prev) return prev;
                const selectedId = String(prev?._id || prev?.id || '');
                if (selectedId !== targetUserId) return prev;
                return {
                    ...prev,
                    isFollowedByCurrentUser: nextIsFollowed,
                    followerCount: nextFollowerCount,
                    starCount: nextFollowerCount,
                };
            });
            setFollowSuccess(data.message || (nextIsFollowed ? 'User followed' : 'User unfollowed'));
        } catch (requestError) {
            setFollowError(requestError.message || 'Failed to update follow status');
        } finally {
            setFollowingUserId('');
        }
    }, [updateFollowDataInList]);

    useEffect(() => {
        const normalizedQuery = searchQuery.trim();
        if (isNaturalLanguageQuery(normalizedQuery)) {
            return undefined;
        }

        const timer = setTimeout(() => {
            fetchTeammates();
        }, 500);

        return () => clearTimeout(timer);
    }, [fetchTeammates, isNaturalLanguageQuery, searchQuery]);

    useEffect(() => {
        const normalizedQuery = searchQuery.trim();
        if (!isNaturalLanguageQuery(normalizedQuery)) {
            setLastAutoSemanticQuery('');
            return undefined;
        }
        if (isSemanticMode && semanticQuery.trim() === normalizedQuery) {
            return undefined;
        }
        if (lastAutoSemanticQuery === normalizedQuery) {
            return undefined;
        }

        const timer = setTimeout(() => {
            runSemanticSearch(normalizedQuery, { mirrorInSmartInput: true, markAuto: true });
        }, 450);

        return () => clearTimeout(timer);
    }, [
        isNaturalLanguageQuery,
        isSemanticMode,
        lastAutoSemanticQuery,
        runSemanticSearch,
        searchQuery,
        semanticQuery,
    ]);

    const displayedTeammates = isSemanticMode ? semanticResults : teammates;
    const isLoadingTeammates = isSemanticMode ? semanticLoading : loading;
    const activeFilterCount =
        filters.skills.length + filters.availability.length + filters.experience.length;

    const statusBanners = useMemo(
        () => [
            connectSuccess
                ? {
                    id: 'connect-success',
                    text: connectSuccess,
                    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                }
                : null,
            connectError
                ? {
                    id: 'connect-error',
                    text: connectError,
                    className: 'border-rose-200 bg-rose-50 text-rose-700',
                }
                : null,
            followSuccess
                ? {
                    id: 'follow-success',
                    text: followSuccess,
                    className: 'border-amber-200 bg-amber-50 text-amber-800',
                }
                : null,
            followError
                ? {
                    id: 'follow-error',
                    text: followError,
                    className: 'border-rose-200 bg-rose-50 text-rose-700',
                }
                : null,
        ].filter(Boolean),
        [connectSuccess, connectError, followSuccess, followError]
    );

    return (
        <div className="mx-auto max-w-7xl 2xl:max-w-screen-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(120deg,#0f172a_0%,#1e293b_56%,#075985_130%)] px-5 py-6 text-white shadow-[0_24px_56px_-38px_rgba(15,23,42,0.9)] sm:px-7 sm:py-8">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
                <div className="absolute -bottom-24 left-16 h-56 w-56 rounded-full bg-blue-400/25 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100">
                            <Sparkles size={13} />
                            Talent Discovery
                        </p>
                        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Find Teammates</h1>
                        <p className="mt-2 text-sm text-slate-200 sm:text-base">
                            Discover developers, designers, and builders with classic filtering or AI semantic matching.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                                {displayedTeammates.length} teammate{displayedTeammates.length !== 1 ? 's' : ''}
                            </span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                            </span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                                Mode: {isSemanticMode ? 'AI ranked' : 'Standard'}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-slate-100">
                        Natural-language search is supported in both search bars.
                    </div>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-4 xl:grid-cols-5">
                <div className="lg:col-span-1 xl:col-span-1">
                    <FilterSidebar filters={filters} setFilters={setFilters} />
                </div>

                <div className="space-y-5 lg:col-span-3 xl:col-span-4">
                    <section className="rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-sm sm:p-5">
                        <div className="mb-3 flex items-center gap-2 text-blue-700">
                            <Sparkles size={17} />
                            <h2 className="text-base font-bold sm:text-lg">AI Semantic Search</h2>
                        </div>
                        <p className="mb-4 text-sm text-slate-600">
                            Search by intent. Example: &quot;Need a crypto expert for smart contracts&quot;.
                        </p>

                        <form onSubmit={handleSemanticSearch} className="flex flex-col gap-3 sm:flex-row">
                            <input
                                type="text"
                                value={semanticQuery}
                                onChange={(event) => setSemanticQuery(event.target.value)}
                                placeholder="Describe the teammate you need..."
                                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                            <button
                                type="submit"
                                disabled={semanticLoading}
                                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {semanticLoading ? 'Searching...' : 'Smart Search'}
                            </button>

                            <button
                                type="button"
                                onClick={clearSemanticSearch}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                Clear
                            </button>
                        </form>

                        {semanticError ? (
                            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                                {semanticError}
                            </div>
                        ) : null}

                        {isSemanticMode ? (
                            <div className="mt-3 space-y-1.5 text-xs">
                                <div className="font-medium text-blue-700">Showing AI-ranked teammate matches.</div>
                                {semanticMeta?.indexedUsers === 0 ? (
                                    <div className="inline-block rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">
                                        No vector-indexed profiles yet. Showing fallback matches.
                                    </div>
                                ) : semanticMeta?.usedFallback ? (
                                    <div className="text-slate-600">
                                        Filled remaining results with keyword fallback because some users are not indexed yet.
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </section>

                    <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm sm:p-5">
                        <form onSubmit={handlePrimarySearchSubmit} className="space-y-2">
                            <div className="relative flex gap-2">
                                <Search
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Search by name/skill or natural language (e.g., need a Web3 teammate)..."
                                    value={searchQuery}
                                    onChange={(event) => handleSearchChange(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                                <button
                                    type="submit"
                                    className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Search
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1">
                                    <Users size={12} />
                                    {displayedTeammates.length} results
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1">
                                    <Filter size={12} />
                                    {activeFilterCount} filters active
                                </span>
                                {searchQuery.trim() ? (
                                    <button
                                        type="button"
                                        onClick={() => handleSearchChange('')}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-600 transition hover:bg-slate-200"
                                    >
                                        <X size={12} />
                                        Clear query
                                    </button>
                                ) : null}
                            </div>
                        </form>
                    </section>

                    {statusBanners.length > 0 ? (
                        <div className="space-y-2">
                            {statusBanners.map((banner) => (
                                <div
                                    key={banner.id}
                                    className={`rounded-xl border p-3 text-sm ${banner.className}`}
                                >
                                    {banner.text}
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {isLoadingTeammates ? (
                        <div className="flex min-h-[34vh] items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : (isSemanticMode ? semanticError : error) ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-rose-700">
                            {isSemanticMode ? semanticError : error}
                        </div>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {displayedTeammates.length > 0 ? (
                                displayedTeammates.map((user) => (
                                    <TeammateCard
                                        key={user._id || user.id || user.email}
                                        user={user}
                                        onViewDetails={setSelectedTeammate}
                                        onConnect={handleConnect}
                                        onToggleFollow={handleToggleFollow}
                                        isConnecting={connectingUserId === String(user._id || user.id || '')}
                                        isConnected={Boolean(user.isConnected)}
                                        isFollowLoading={followingUserId === String(user._id || user.id || '')}
                                        isFollowed={Boolean(user.isFollowedByCurrentUser)}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/90 px-6 py-12 text-center text-slate-500">
                                    <p className="text-lg font-semibold text-slate-900">
                                        {isSemanticMode ? 'No semantic matches found' : 'No teammates found'}
                                    </p>
                                    <p className="mt-1 text-sm">
                                        {isSemanticMode
                                            ? 'Try a broader AI query like "full-stack startup builder".'
                                            : 'Try adjusting your filters or search query.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ComponentErrorBoundary
                resetKey={selectedTeammate?._id || selectedTeammate?.id || 'none'}
                fallback={
                    selectedTeammate ? (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 sm:p-6">
                            <div className="w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
                                <h3 className="mb-2 text-lg font-bold text-gray-900">Unable to open teammate profile</h3>
                                <p className="mb-4 text-sm text-gray-600">
                                    Some profile data is invalid. Please close and try another teammate.
                                </p>
                                <button
                                    onClick={() => setSelectedTeammate(null)}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    ) : null
                }
            >
                <TeammateDetailsModal
                    user={selectedTeammate}
                    onClose={() => setSelectedTeammate(null)}
                />
            </ComponentErrorBoundary>
        </div>
    );
};

export default FindTeammates;
