import React, { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Folder,
    Users,
    User,
    BarChart2,
    MessageSquare,
    BriefcaseBusiness,
    LogOut,
    X,
    Sparkles,
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const navigate = useNavigate();

    const links = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Folder, label: 'My Projects', path: '/projects' },
        { icon: BriefcaseBusiness, label: 'Project Bazaar', path: '/project-bazaar' },
        { icon: Users, label: 'Find Teammates', path: '/find-teammates' },
        { icon: User, label: 'Profile', path: '/profile' },
        { icon: BarChart2, label: 'Match Insights', path: '/insights' },
        { icon: MessageSquare, label: 'Chat', path: '/chat' },
    ];

    const storedUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('authUser') || '{}');
        } catch (_error) {
            return {};
        }
    }, []);

    const displayName = String(storedUser?.name || storedUser?.email || 'Member');
    const role = String(storedUser?.role || 'Builder');
    const initials = useMemo(() => {
        const parts = displayName.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'U';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }, [displayName]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        navigate('/');
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 h-full w-64 transform border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-full flex-col">
                    <div className="h-20 border-b border-slate-800 px-5">
                        <div className="flex h-full items-center justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">Workspace</p>
                                <span className="mt-0.5 inline-flex items-center gap-2 text-lg font-semibold text-white">
                                    <Sparkles size={16} className="text-cyan-300" />
                                    CollabSphere
                                </span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-slate-600 hover:text-white lg:hidden"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-6">
                        {links.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    className={({ isActive }) =>
                                        `group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                                            isActive
                                                ? 'border-cyan-400/25 bg-gradient-to-r from-cyan-500/15 to-blue-500/20 text-white shadow-[0_12px_26px_-20px_rgba(56,189,248,0.9)]'
                                                : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900 hover:text-white'
                                        }`
                                    }
                                >
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/70 text-slate-300 transition group-hover:text-cyan-200">
                                        <Icon size={17} />
                                    </span>
                                    <span>{link.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className="border-t border-slate-800 p-4">
                        <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15 text-xs font-semibold text-cyan-200">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                                <p className="truncate text-xs text-slate-400">{role}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
