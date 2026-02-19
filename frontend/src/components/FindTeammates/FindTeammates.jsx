import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
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
        experience: []
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
        } catch (err) {
            console.error('Error fetching teammates:', err);
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

    // Debounce search
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

    // Auto-run semantic search when a natural-language query arrives from URL/global search.
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

    return (
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-shell">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Find Teammates</h1>
                    <p className="page-subtitle">Discover talented developers, designers, and creators for your next project.</p>
                </div>
            </div>

            <section className="mb-8 surface-card border border-blue-100 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-blue-700 mb-3">
                    <Sparkles size={18} />
                    <h2 className="text-base sm:text-lg font-bold">AI Semantic Search</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Search by meaning. Example: &quot;Need a crypto expert for smart contracts&quot;.
                </p>

                <form onSubmit={handleSemanticSearch} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={semanticQuery}
                        onChange={(event) => setSemanticQuery(event.target.value)}
                        placeholder="Describe the teammate you need..."
                        className="field-input flex-1 px-4 py-3"
                    />
                    <button
                        type="submit"
                        disabled={semanticLoading}
                        className="btn-primary px-5 py-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {semanticLoading ? 'Searching...' : 'Smart Search'}
                    </button>

                    <button
                        type="button"
                        onClick={clearSemanticSearch}
                        className="btn-secondary px-5 py-3"
                    >
                        Clear
                    </button>
                </form>

                {semanticError ? (
                    <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                        {semanticError}
                    </div>
                ) : null}

                {isSemanticMode ? (
                    <div className="mt-3 space-y-1">
                        <div className="text-xs font-medium text-blue-700">
                            Showing AI-ranked teammate matches.
                        </div>
                        {semanticMeta?.indexedUsers === 0 ? (
                            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 inline-block">
                                No vector-indexed profiles yet. Showing fallback matches.
                            </div>
                        ) : semanticMeta?.usedFallback ? (
                            <div className="text-xs text-gray-600">
                                Filled remaining results with keyword fallback because some users are not indexed yet.
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </section>

            {connectSuccess ? (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                    {connectSuccess}
                </div>
            ) : null}

            {connectError ? (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                    {connectError}
                </div>
            ) : null}

            {followSuccess ? (
                <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm">
                    {followSuccess}
                </div>
            ) : null}

            {followError ? (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                    {followError}
                </div>
            ) : null}

            <div className="grid lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1 xl:col-span-1">
                    <FilterSidebar filters={filters} setFilters={setFilters} />
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 xl:col-span-4">
                    {/* Search Bar */}
                    <form onSubmit={handlePrimarySearchSubmit} className="mb-6 space-y-2">
                        <div className="relative flex gap-2">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name/skill or natural language (e.g., need a Web3 teammate)..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="field-input w-full pl-12 pr-4 py-3 bg-white shadow-sm"
                            />
                            <button
                                type="submit"
                                className="btn-secondary px-4 py-3 text-sm"
                            >
                                Search
                            </button>
                        </div>
                        <div className="text-xs text-gray-500">
                            Natural language is supported in this search bar and the AI search box above.
                        </div>
                    </form>

                    {/* Results Grid */}
                    {isLoadingTeammates ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (isSemanticMode ? semanticError : error) ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center">
                            {isSemanticMode ? semanticError : error}
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedTeammates.length > 0 ? (
                                displayedTeammates.map(user => (
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
                                <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-lg font-medium text-gray-900">
                                        {isSemanticMode ? 'No semantic matches found' : 'No teammates found'}
                                    </p>
                                    <p className="mt-1">
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
                        <div className="fixed inset-0 z-50 bg-gray-900/60 p-4 sm:p-6 flex items-center justify-center">
                            <div className="surface-card w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to open teammate profile</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Some profile data is invalid. Please close and try another teammate.
                                </p>
                                <button
                                    onClick={() => setSelectedTeammate(null)}
                                    className="btn-primary px-4 py-2"
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
