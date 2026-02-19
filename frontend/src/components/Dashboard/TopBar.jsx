import React, { useEffect, useMemo, useState } from 'react';
import { Search, Menu } from 'lucide-react';
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
        <header className="relative z-30 h-16 bg-white/82 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-8 2xl:px-10 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.65)]">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-slate-500 hover:text-slate-800"
                >
                    <Menu size={24} />
                </button>

                {/* Search */}
                <form onSubmit={handleSubmit} className="hidden md:flex relative items-center">
                    <Search className="absolute left-3 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search teammates, projects, skills..."
                        className="pl-10 pr-4 py-2.5 w-72 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-200 transition-all"
                    />
                </form>
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <NotificationDropdown />

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                        <div className="text-xs text-slate-500">{displayRole}</div>
                    </div>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-9 h-9 rounded-full border border-slate-200 object-cover shadow-sm"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold flex items-center justify-center">
                            {initials}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopBar;
