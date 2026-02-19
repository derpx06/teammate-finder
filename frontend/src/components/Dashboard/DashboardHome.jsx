import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Folder,
    Users,
    Star,
    ArrowRight,
    AlertCircle,
    TrendingUp,
    Loader2,
    Sparkles,
    Plus,
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import TeammateDetailsModal from '../FindTeammates/TeammateDetailsModal';

const getInitials = (value) => {
    const text = String(value || '').trim();
    if (!text) return 'U';
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const STATUS_CLASSES = {
    'In Progress': 'border-blue-200 bg-blue-50 text-blue-700',
    Review: 'border-amber-200 bg-amber-50 text-amber-700',
    Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const PROJECT_SWATCHES = [
    'from-blue-500 to-cyan-500',
    'from-cyan-500 to-teal-500',
    'from-indigo-500 to-blue-500',
    'from-emerald-500 to-cyan-500',
];

const DashboardHome = () => {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTeammate, setSelectedTeammate] = useState(null);

    const fetchDashboard = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/user/dashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load dashboard');
            }
            setDashboard(data);
        } catch (fetchError) {
            setError(fetchError.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const stats = useMemo(() => {
        const values = dashboard?.stats || {};
        return [
            {
                label: 'Active Projects',
                value: values.activeProjects ?? 0,
                trend: `${values.pendingProjects ?? 0} pending`,
                Icon: Folder,
                iconClass: 'text-blue-700',
                iconBg: 'bg-blue-100',
                chipClass: 'bg-blue-100 text-blue-700',
                topBar: 'from-blue-600 to-cyan-500',
            },
            {
                label: 'Project Invites',
                value: values.pendingInvites ?? 0,
                trend: `${values.suggestedMatches ?? 0} suggested matches`,
                Icon: Users,
                iconClass: 'text-cyan-700',
                iconBg: 'bg-cyan-100',
                chipClass: 'bg-cyan-100 text-cyan-700',
                topBar: 'from-cyan-600 to-teal-500',
            },
            {
                label: 'Profile Completion',
                value: `${values.profileCompletion ?? 0}%`,
                trend: `${values.completedProjects ?? 0} completed`,
                Icon: TrendingUp,
                iconClass: 'text-emerald-700',
                iconBg: 'bg-emerald-100',
                chipClass: 'bg-emerald-100 text-emerald-700',
                topBar: 'from-emerald-600 to-cyan-500',
            },
        ];
    }, [dashboard]);

    const activeProjects = Array.isArray(dashboard?.activeProjects) ? dashboard.activeProjects : [];
    const suggestedMatches = Array.isArray(dashboard?.suggestedMatches) ? dashboard.suggestedMatches : [];
    const skillGaps = dashboard?.skillGaps || { missingSkills: [], impactedProjects: 0 };
    const userName = dashboard?.user?.name || 'Developer';
    const firstName = String(userName).trim().split(' ')[0] || 'Developer';
    const statsValues = dashboard?.stats || {};

    if (loading) {
        return (
            <div className="flex min-h-[52vh] items-center justify-center">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    Loading dashboard...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
                <div className="font-semibold">Unable to load dashboard</div>
                <div className="mt-1 text-sm">{error}</div>
                <button
                    onClick={fetchDashboard}
                    className="mt-4 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-7">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(120deg,#0f172a_0%,#1e293b_58%,#0f766e_130%)] p-6 text-white shadow-[0_24px_55px_-38px_rgba(15,23,42,0.9)] sm:p-8">
                <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
                <div className="absolute -bottom-24 left-16 h-52 w-52 rounded-full bg-blue-400/20 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100">
                            <Sparkles size={13} />
                            Team command center
                        </p>
                        <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
                            Welcome back, {firstName}.
                        </h2>
                        <p className="mt-3 text-sm text-slate-200 sm:text-base">
                            You have {statsValues.pendingInvites ?? 0} open invite(s), {activeProjects.length} active project(s), and {suggestedMatches.length} fresh teammate recommendation(s).
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2.5 text-xs sm:text-sm">
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                                {statsValues.completedProjects ?? 0} projects delivered
                            </span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                                {statsValues.profileCompletion ?? 0}% profile complete
                            </span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                                {skillGaps.impactedProjects ?? 0} project(s) impacted by skill gaps
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={() => navigate('/create-project')}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                        >
                            <Plus size={16} />
                            Create New Project
                        </button>
                        <button
                            onClick={() => navigate('/find-teammates')}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            <Users size={16} />
                            Explore Matches
                        </button>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {stats.map((stat, index) => (
                    <motion.article
                        key={stat.label}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm"
                    >
                        <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${stat.topBar}`} />
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg}`}>
                                <stat.Icon className={`h-5 w-5 ${stat.iconClass}`} />
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stat.chipClass}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                        <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                    </motion.article>
                ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
                <div className="space-y-6">
                    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                            <h3 className="text-lg font-bold text-slate-900">Active Projects</h3>
                            <button
                                type="button"
                                onClick={() => navigate('/projects')}
                                className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                            >
                                View all
                            </button>
                        </div>

                        {activeProjects.length === 0 ? (
                            <div className="p-6 text-sm text-slate-500">
                                No active projects yet. Start one from
                                {' '}
                                <button
                                    onClick={() => navigate('/create-project')}
                                    className="font-semibold text-blue-700 hover:text-blue-800"
                                >
                                    Create New Project
                                </button>
                                .
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {activeProjects.map((project, projectIndex) => {
                                    const projectId = project.id || project._id;
                                    const progress = Math.max(0, Math.min(100, Math.round(Number(project.progress) || 0)));
                                    const projectTitle = String(project.title || 'Untitled Project');
                                    const projectRole = String(project.role || 'Contributor');
                                    const projectStatus = String(project.status || 'Planned');
                                    const statusClass = STATUS_CLASSES[projectStatus] || 'border-slate-200 bg-slate-100 text-slate-600';
                                    const swatch = PROJECT_SWATCHES[projectIndex % PROJECT_SWATCHES.length];

                                    return (
                                        <div
                                            key={projectId || `${projectTitle}-${projectIndex}`}
                                            onClick={() => projectId && navigate(`/project/${projectId}`)}
                                            className={`group flex flex-col gap-4 px-5 py-4 transition sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
                                                projectId ? 'cursor-pointer hover:bg-slate-50/90' : ''
                                            }`}
                                        >
                                            <div className="min-w-0 flex items-center gap-3">
                                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${swatch} text-sm font-bold text-white`}>
                                                    {projectTitle.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">{projectTitle}</p>
                                                    <p className="truncate text-xs text-slate-500 sm:text-sm">{projectRole}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 sm:gap-5">
                                                <div className="w-36">
                                                    <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                                                        <span>Progress</span>
                                                        <span className="font-semibold text-slate-700">{progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
                                                    {projectStatus}
                                                </span>

                                                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-blue-600" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </article>

                    <article className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm sm:p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Skill Gap Alerts</h3>
                        </div>

                        {skillGaps.missingSkills.length > 0 ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <p className="font-semibold text-amber-900">
                                    Missing skills:
                                    {' '}
                                    {skillGaps.missingSkills.slice(0, 4).join(', ')}
                                </p>
                                <p className="mt-1.5 text-sm text-amber-800">
                                    {skillGaps.impactedProjects} active project(s) include requirements not listed on your profile.
                                </p>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="mt-3 text-sm font-semibold text-amber-800 underline hover:text-amber-900"
                                >
                                    Update profile skills
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                No skill gaps detected across your active projects.
                            </div>
                        )}
                    </article>
                </div>

                <aside>
                    <article className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Suggested Matches</h3>
                                <p className="text-xs text-slate-500">People likely to fit your projects</p>
                            </div>
                            <button
                                onClick={() => navigate('/find-teammates')}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                            >
                                <ArrowRight size={16} />
                            </button>
                        </div>

                        {suggestedMatches.length === 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                No teammate suggestions yet. Add more skills to improve matches.
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {suggestedMatches.map((match, index) => {
                                    const matchId = match.id || match._id || `${match.name}-${index}`;
                                    const skillList = Array.isArray(match.skills) ? match.skills : [];
                                    const label = match.matchLabel || `${match.matchScore || 0}% match`;

                                    return (
                                        <motion.div
                                            key={matchId}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.12 + index * 0.07 }}
                                            onClick={() =>
                                                setSelectedTeammate({
                                                    _id: match.id || match._id,
                                                    id: match.id || match._id,
                                                    name: match.name,
                                                    role: match.role,
                                                    skills: skillList,
                                                })
                                            }
                                            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition hover:border-cyan-300 hover:shadow-sm"
                                        >
                                            <div className="mb-2 flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex items-center gap-2.5">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 text-xs font-bold text-blue-700">
                                                        {getInitials(match.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-slate-900">{match.name}</p>
                                                        <p className="truncate text-xs text-slate-500">{match.role || 'Contributor'}</p>
                                                    </div>
                                                </div>
                                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                    {label}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5">
                                                {skillList.slice(0, 4).map((skill) => (
                                                    <span
                                                        key={`${matchId}-${skill}`}
                                                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </article>

                    <article className="mt-6 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-5">
                        <div className="flex items-center gap-2 text-cyan-800">
                            <Star className="h-4 w-4" />
                            <p className="text-sm font-semibold">Quick tip</p>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">
                            Keep your profile skills updated weekly to improve teammate match quality and get better project recommendations.
                        </p>
                    </article>
                </aside>
            </section>

            <TeammateDetailsModal user={selectedTeammate} onClose={() => setSelectedTeammate(null)} />
        </div>
    );
};

export default DashboardHome;
