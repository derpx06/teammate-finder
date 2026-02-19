import React from 'react';
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
    X
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const navigate = useNavigate();

    const links = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <Folder size={20} />, label: 'My Projects', path: '/projects' },
        { icon: <BriefcaseBusiness size={20} />, label: 'Project Bazaar', path: '/project-bazaar' },
        { icon: <Users size={20} />, label: 'Find Teammates', path: '/find-teammates' },
        { icon: <User size={20} />, label: 'Profile', path: '/profile' },
        { icon: <BarChart2 size={20} />, label: 'Match Insights', path: '/insights' },
        { icon: <MessageSquare size={20} />, label: 'Chat', path: '/chat' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        navigate('/');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Panel */}
            <aside className={`fixed top-0 left-0 h-full w-64 bg-[linear-gradient(180deg,rgba(248,251,255,0.98)_0%,rgba(238,245,255,0.97)_100%)] border-r border-slate-200/90 shadow-[0_24px_46px_-30px_rgba(15,23,42,0.45)] text-slate-800 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/80">
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                            CollabSphere
                        </span>
                        <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-700">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
                        {links.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${isActive
                                        ? 'bg-blue-600/10 text-blue-700 border-blue-200/80 font-semibold shadow-[0_12px_22px_-18px_rgba(37,99,235,0.7)]'
                                        : 'text-slate-600 border-transparent hover:bg-white/90 hover:border-slate-200 hover:text-slate-900'
                                    }`}
                            >
                                {link.icon}
                                <span>{link.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-slate-200/80">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all"
                        >
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
