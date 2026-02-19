import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Folder, Users, Star, ArrowRight, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import TeammateDetailsModal from '../FindTeammates/TeammateDetailsModal';

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
                icon: <Folder className="text-blue-600" />,
                trend: `${values.pendingProjects ?? 0} pending`,
            },
            {
                label: 'Project Invites',
                value: values.pendingInvites ?? 0,
                icon: <Users className="text-cyan-600" />,
                trend: `${values.suggestedMatches ?? 0} suggested teammates`,
            },
            {
                label: 'Profile Completion',
                value: `${values.profileCompletion ?? 0}%`,
                icon: <TrendingUp className="text-green-600" />,
                trend: `${values.completedProjects ?? 0} completed projects`,
            },
        ];
    }, [dashboard]);

    const activeProjects = Array.isArray(dashboard?.activeProjects) ? dashboard.activeProjects : [];
    const suggestedMatches = Array.isArray(dashboard?.suggestedMatches) ? dashboard.suggestedMatches : [];
    const skillGaps = dashboard?.skillGaps || { missingSkills: [], impactedProjects: 0 };
    const userName = dashboard?.user?.name || 'Developer';
    const firstName = String(userName).trim().split(' ')[0] || 'Developer';

    if (loading) {
        return (
            <div className="min-h-[45vh] flex items-center justify-center text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                <div className="font-semibold">Unable to load dashboard</div>
                <div className="text-sm mt-1">{error}</div>
                <button
                    onClick={fetchDashboard}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-shell">
            {/* Welcome Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title text-2xl sm:text-3xl">Welcome back, {firstName}!</h1>
                    <p className="page-subtitle">Here&apos;s what&apos;s happening with your projects today.</p>
                </div>
                <button
                    onClick={() => navigate('/create-project')}
                    className="btn-primary hidden md:inline-flex"
                >
                    <Star className="w-4 h-4 mr-2" />
                    Create New Project
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 card-hover-lift"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gray-50 rounded-lg">{stat.icon}</div>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                {stat.trend}
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Projects (2/3 width) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Active Projects */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Active Projects</h2>
                            <button
                                type="button"
                                onClick={() => navigate('/projects')}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                View All
                            </button>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {activeProjects.length === 0 ? (
                                <div className="p-6 text-sm text-gray-500">
                                    No active projects yet. Start one from &quot;Create New Project&quot;.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {activeProjects.map((project) => (
                                        <div
                                            key={project.id}
                                            onClick={() => navigate(`/project/${project.id}`)}
                                            className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                                    {String(project.title || 'P').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{project.title}</div>
                                                    <div className="text-sm text-gray-500">{project.role}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="hidden sm:block w-32">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-gray-500">Progress</span>
                                                        <span className="text-gray-700 font-medium">{Math.round(Number(project.progress) || 0)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${Math.round(Number(project.progress) || 0)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                        project.status === 'In Progress'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : project.status === 'Review'
                                                              ? 'bg-yellow-100 text-yellow-700'
                                                              : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {project.status}
                                                </span>
                                                <button className="text-gray-400 hover:text-blue-600">
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Skill Gap Alerts */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Skill Gap Alerts</h2>
                        {skillGaps.missingSkills.length > 0 ? (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-orange-900">
                                        Missing Skills: {skillGaps.missingSkills.slice(0, 3).join(', ')}
                                    </h3>
                                    <p className="text-sm text-orange-700 mt-1">
                                        {skillGaps.impactedProjects} active project(s) include skill requirements
                                        you haven&apos;t listed yet.
                                    </p>
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="mt-3 text-sm font-medium text-orange-700 hover:text-orange-800 underline"
                                    >
                                        Update Profile Skills
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
                                No skill gaps detected across your active projects.
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column - Suggestions (1/3 width) */}
                <div className="space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Suggested Matches</h2>
                            <button
                                onClick={() => navigate('/find-teammates')}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <ArrowRight size={18} />
                            </button>
                        </div>
                        {suggestedMatches.length === 0 ? (
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-sm text-gray-500">
                                No teammate suggestions yet. Add more skills to improve matches.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {suggestedMatches.map((match, index) => (
                                    <motion.div
                                        key={match.id || `${match.name}-${index}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + index * 0.1 }}
                                        onClick={() =>
                                            setSelectedTeammate({
                                                _id: match.id,
                                                id: match.id,
                                                name: match.name,
                                                role: match.role,
                                                skills: Array.isArray(match.skills) ? match.skills : [],
                                            })
                                        }
                                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all card-hover-lift cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-900">{match.name}</h3>
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                {match.matchLabel || `${match.matchScore || 0}%`}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-3">{match.role}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(Array.isArray(match.skills) ? match.skills : []).slice(0, 4).map((skill) => (
                                                <span key={`${match.id}-${skill}`} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
            <TeammateDetailsModal
                user={selectedTeammate}
                onClose={() => setSelectedTeammate(null)}
            />
        </div>
    );
};

export default DashboardHome;
