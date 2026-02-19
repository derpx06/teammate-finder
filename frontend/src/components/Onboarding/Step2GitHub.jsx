import React, { useEffect, useRef, useState } from 'react';
import { Github, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config/api';

const Step2GitHub = ({ formData, updateFormData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [repoCount, setRepoCount] = useState(0);
    const [topLanguage, setTopLanguage] = useState('N/A');
    const popupRef = useRef(null);
    const popupPollRef = useRef(null);
    const connectResolvedRef = useRef(false);

    const clearPopupWatchers = () => {
        if (popupPollRef.current) {
            clearInterval(popupPollRef.current);
            popupPollRef.current = null;
        }
        popupRef.current = null;
    };

    useEffect(() => {
        const handleConnectResult = (event) => {
            if (event.origin !== window.location.origin) return;
            if (!event.data || event.data.type !== 'github-connect') return;

            connectResolvedRef.current = true;
            setLoading(false);
            clearPopupWatchers();

            if (event.data.status === 'success') {
                updateFormData('githubConnected', true);
                setError(null);
                fetchGitHubStats();
                return;
            }

            setError('Failed to connect GitHub account. Please try again.');
        };

        window.addEventListener('message', handleConnectResult);
        return () => {
            window.removeEventListener('message', handleConnectResult);
            clearPopupWatchers();
        };
    }, [updateFormData]);

    const fetchGitHubStats = async () => {
        setStatsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/user/github/repos`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch GitHub stats');
            }

            const repos = Array.isArray(data) ? data : [];
            setRepoCount(repos.length);

            const languageMap = repos.reduce((acc, repo) => {
                if (repo.language) {
                    acc[repo.language] = (acc[repo.language] || 0) + 1;
                }
                return acc;
            }, {});

            const computedTopLanguage =
                Object.entries(languageMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
            setTopLanguage(computedTopLanguage);
        } catch (statsError) {
            setError(statsError.message || 'Unable to load GitHub stats');
            setRepoCount(0);
            setTopLanguage('N/A');
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        if (formData.githubConnected) {
            fetchGitHubStats();
        } else {
            setRepoCount(0);
            setTopLanguage('N/A');
        }
    }, [formData.githubConnected]);

    const handleConnect = async () => {
        setLoading(true);
        setError(null);
        connectResolvedRef.current = false;

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Please login first');
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/github/connect-url`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok || !data.url) {
                throw new Error(data.error || 'Unable to start GitHub OAuth');
            }

            const popup = window.open(
                data.url,
                'github-connect',
                'width=600,height=700,menubar=no,toolbar=no,status=no'
            );

            if (!popup) {
                throw new Error('Popup blocked. Please allow popups and try again.');
            }

            popupRef.current = popup;
            popupPollRef.current = setInterval(() => {
                if (!popupRef.current || popupRef.current.closed) {
                    if (!connectResolvedRef.current) {
                        setLoading(false);
                        setError('GitHub connection was not completed.');
                    }
                    clearPopupWatchers();
                }
            }, 500);
        } catch (connectError) {
            setLoading(false);
            setError(connectError.message || 'Failed to connect GitHub');
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Please login first');
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/github/connection`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to disconnect GitHub');
            }

            const previousUser = (() => {
                try {
                    return JSON.parse(localStorage.getItem('authUser') || '{}');
                } catch (_error) {
                    return {};
                }
            })();

            localStorage.setItem('authToken', data.token || token);
            localStorage.setItem('authUser', JSON.stringify({ ...previousUser, ...(data.user || {}) }));
            updateFormData('githubConnected', false);
            setRepoCount(0);
            setTopLanguage('N/A');
        } catch (disconnectError) {
            setError(disconnectError.message || 'Failed to disconnect GitHub');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sync Your GitHub</h2>
            <p className="text-gray-600 mb-8">Connect your GitHub to automatically showcase your best repositories and contributions.</p>

            {/* GitHub Card */}
            <div className={`border rounded-2xl p-6 transition-all ${formData.githubConnected ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'
                }`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className={`p-3 rounded-full ${formData.githubConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-900'
                            }`}>
                            <Github className="w-8 h-8" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-bold text-gray-900">GitHub Profile</h3>
                            <p className={`text-sm ${formData.githubConnected ? 'text-green-600' : 'text-gray-500'}`}>
                                {formData.githubConnected ? 'Connected Successfully' : 'Not Connected'}
                            </p>
                        </div>
                    </div>
                    {formData.githubConnected && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                </div>

                {/* Connect/Disconnect Button */}
                <div>
                    {!formData.githubConnected ? (
                        <button
                            onClick={handleConnect}
                            disabled={loading}
                            className="btn-primary w-full px-4 py-3 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Connecting...
                                </>
                            ) : (
                                'Connect GitHub'
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleDisconnect}
                            disabled={loading}
                            className="btn-secondary w-full px-4 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                    )}
                </div>
            </div>
            {error ? (
                <p className="text-sm text-red-600 mt-4">{error}</p>
            ) : null}

            {/* Info/Preview */}
            <AnimatePresence>
                {formData.githubConnected && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 space-y-4"
                    >
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-500">Repositories Found</span>
                                <span className="text-sm font-bold text-gray-900">
                                    {statsLoading ? '...' : repoCount}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500">Top Language</span>
                                <span className="text-sm font-bold text-gray-900">
                                    {statsLoading ? '...' : topLanguage}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Step2GitHub;
