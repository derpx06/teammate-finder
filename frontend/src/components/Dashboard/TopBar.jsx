import React, { useEffect, useMemo, useState } from 'react';
import { Search, Menu, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import { API_BASE_URL } from '../../config/api';

const TopBar = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState('');
    const [profile, setProfile] = useState(null);

    const readStoredUser = () => {
        try {
            return JSON.parse(localStorage.getItem('authUser') || '{}');
        } catch (_error) {
            return {};
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const search = params.get('search') || '';
        setQuery(search);
    }, [location.pathname, location.search]);

    useEffect(() => {
        const storedUser = readStoredUser();
        if (storedUser && Object.keys(storedUser).length > 0) {
            setProfile(storedUser);
        }

        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch profile');
                }

                const merged = { ...storedUser, ...data };
                setProfile(merged);
                localStorage.setItem('authUser', JSON.stringify(merged));
            } catch (_error) {
                // Non-blocking in top bar.
            }
        };

        fetchProfile();
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();
        const trimmedQuery = query.trim();

        const buildPathWithSearch = (path) => {
            if (!trimmedQuery) return path;
            return `${path}?search=${encodeURIComponent(trimmedQuery)}`;
        };

        if (location.pathname.startsWith('/projects')) {
            navigate(buildPathWithSearch('/projects'));
            return;
        }

        if (location.pathname.startsWith('/find-teammates')) {
            navigate(buildPathWithSearch('/find-teammates'));
            return;
        }

        navigate(buildPathWithSearch('/find-teammates'));
    };

    const pageMeta = useMemo(() => {
        const path = location.pathname;

        if (path.startsWith('/dashboard')) {
            return { title: 'Dashboard', subtitle: 'Project pulse and collaboration signals' };
        }
        if (path.startsWith('/projects')) {
            return { title: 'My Projects', subtitle: 'Track delivery and team progress' };
        }
        if (path.startsWith('/project-bazaar')) {
            return { title: 'Project Bazaar', subtitle: 'Explore open opportunities and roles' };
        }
        if (path.startsWith('/find-teammates')) {
            return { title: 'Find Teammates', subtitle: 'Discover builders that match your stack' };
        }
        if (path.startsWith('/profile')) {
            return { title: 'Profile', subtitle: 'Skills, identity, and availability' };
        }
        if (path.startsWith('/insights')) {
            return { title: 'Match Insights', subtitle: 'Compatibility and availability analytics' };
        }
        if (path.startsWith('/chat')) {
            return { title: 'Chat', subtitle: 'Conversations across projects and teams' };
        }
        if (path.startsWith('/create-project')) {
            return { title: 'Create Project', subtitle: 'Launch a new idea with structure' };
        }

        return { title: 'Workspace', subtitle: 'Collaboration hub' };
    }, [location.pathname]);

    const displayName = String(profile?.name || profile?.email || 'User');
    const displayRole = String(profile?.role || 'Member');
    const avatarUrl = profile?.avatar || '';
    const initials = useMemo(() => {
        const parts = displayName.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'U';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }, [displayName]);

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
            <div className="flex h-20 items-center justify-between gap-3 px-4 lg:px-8 2xl:px-10">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <button
                        onClick={onMenuClick}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:border-slate-400 hover:text-slate-800 lg:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="min-w-0">
                        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700">
                            <Sparkles size={12} />
                            {pageMeta.subtitle}
                        </p>
                        <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{pageMeta.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    <form onSubmit={handleSubmit} className="relative hidden md:flex">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search teammates, projects, skills..."
                            className="h-10 w-72 rounded-xl border border-slate-200 bg-white/90 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </form>

                    <NotificationDropdown />

                    <div className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:pl-4">
                        <div className="hidden text-right lg:block">
                            <div className="max-w-[180px] truncate text-sm font-semibold text-slate-900">{displayName}</div>
                            <div className="text-xs text-slate-500">{displayRole}</div>
                        </div>

                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={displayName}
                                className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                            />
                        ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/70 bg-gradient-to-br from-cyan-50 to-blue-100 text-xs font-bold text-blue-700">
                                {initials}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
