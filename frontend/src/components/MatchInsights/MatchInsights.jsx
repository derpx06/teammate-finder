import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles,
    ArrowRight,
    Gauge,
    FolderKanban,
    Users,
    CalendarDays,
} from 'lucide-react';
import CompatibilityScore from './CompatibilityScore';
import SkillBreakdown from './SkillBreakdown';
import AvailabilityChart from './AvailabilityChart';
import { API_BASE_URL } from '../../config/api';

const MatchInsights = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [overallScore, setOverallScore] = useState(0);
    const [skills, setSkills] = useState([]);
    const [missingSkills, setMissingSkills] = useState([]);
    const [availability, setAvailability] = useState({});
    const [recommendation, setRecommendation] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [insightMeta, setInsightMeta] = useState({
        profileCompletion: 0,
        activeProjects: 0,
        suggestedMatches: 0,
        availabilityDays: 0,
    });

    useEffect(() => {
        const fetchInsights = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('authToken');
                const headers = { Authorization: `Bearer ${token}` };

                const [profileResponse, projectsResponse, dashboardResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/user/profile`, { headers }),
                    fetch(`${API_BASE_URL}/api/project/my`, { headers }),
                    fetch(`${API_BASE_URL}/api/user/dashboard`, { headers }),
                ]);

                const [profileData, projectsData, dashboardData] = await Promise.all([
                    profileResponse.json().catch(() => ({})),
                    projectsResponse.json().catch(() => ({})),
                    dashboardResponse.json().catch(() => ({})),
                ]);

                if (!profileResponse.ok) {
                    throw new Error(profileData.error || 'Failed to fetch profile insights');
                }
                if (!projectsResponse.ok) {
                    throw new Error(projectsData.error || 'Failed to fetch project insights');
                }
                if (!dashboardResponse.ok) {
                    throw new Error(dashboardData.error || 'Failed to fetch dashboard insights');
                }

                const userSkills = new Set(
                    (Array.isArray(profileData.skills) ? profileData.skills : [])
                        .map((skill) => String(skill || '').trim().toLowerCase())
                        .filter(Boolean)
                );
                const projectList = Array.isArray(projectsData.projects) ? projectsData.projects : [];
                const activeProjects = projectList.filter((project) => project.type === 'active');

                const requiredSkillCounts = activeProjects.reduce((acc, project) => {
                    const roleSkills = (Array.isArray(project.roles) ? project.roles : [])
                        .flatMap((role) => (Array.isArray(role.skills) ? role.skills : []))
                        .map((skill) => String(skill || '').trim())
                        .filter(Boolean);

                    roleSkills.forEach((skill) => {
                        acc[skill] = (acc[skill] || 0) + 1;
                    });
                    return acc;
                }, {});

                const sortedRequiredSkills = Object.entries(requiredSkillCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8);

                const computedSkills =
                    sortedRequiredSkills.length > 0
                        ? sortedRequiredSkills.map(([name]) => ({
                              name,
                              match: userSkills.has(name.toLowerCase()) ? 95 : 35,
                          }))
                        : (Array.isArray(profileData.skills) ? profileData.skills : []).slice(0, 6).map((name) => ({
                              name,
                              match: 90,
                          }));

                const avgSkillScore =
                    computedSkills.length > 0
                        ? Math.round(
                              computedSkills.reduce((sum, item) => sum + (Number(item.match) || 0), 0) /
                                  computedSkills.length
                          )
                        : 50;
                const profileCompletion = Number(dashboardData?.stats?.profileCompletion) || 0;
                const computedOverall = Math.round(avgSkillScore * 0.7 + profileCompletion * 0.3);

                const topMatch = Array.isArray(dashboardData?.suggestedMatches)
                    ? dashboardData.suggestedMatches[0]
                    : null;
                const topProject = activeProjects[0] || null;
                const normalizedAvailability =
                    profileData.availability && typeof profileData.availability === 'object'
                        ? profileData.availability
                        : {};
                const availabilityDays = Object.values(normalizedAvailability).filter(
                    (value) => Array.isArray(value) && value.length > 0
                ).length;

                setSkills(computedSkills);
                setMissingSkills(
                    Array.isArray(dashboardData?.skillGaps?.missingSkills)
                        ? dashboardData.skillGaps.missingSkills
                        : []
                );
                setAvailability(normalizedAvailability);
                setOverallScore(Math.max(0, Math.min(99, computedOverall)));
                setRecommendation({
                    teammate: topMatch || null,
                    project: topProject || null,
                });
                setLastUpdated(new Date());
                setInsightMeta({
                    profileCompletion,
                    activeProjects: activeProjects.length,
                    suggestedMatches: Array.isArray(dashboardData?.suggestedMatches)
                        ? dashboardData.suggestedMatches.length
                        : 0,
                    availabilityDays,
                });
            } catch (fetchError) {
                setError(fetchError.message || 'Failed to load insights');
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, []);

    const recommendationText = useMemo(() => {
        const teammate = recommendation?.teammate;
        const project = recommendation?.project;

        if (teammate && project) {
            return `You are a strong fit for "${project.title}" and likely to collaborate well with ${teammate.name} (${teammate.matchLabel || `${teammate.matchScore || 0}%`} match).`;
        }

        if (teammate) {
            return `Your best current teammate match is ${teammate.name} with a ${teammate.matchLabel || `${teammate.matchScore || 0}%`} alignment score.`;
        }

        if (project) {
            return `Your active project "${project.title}" aligns with your current verified skills.`;
        }

        return 'Add more profile skills and active projects to unlock stronger recommendation quality.';
    }, [recommendation]);

    const insightCards = useMemo(
        () => [
            {
                label: 'Profile Completion',
                value: `${insightMeta.profileCompletion}%`,
                helper:
                    insightMeta.profileCompletion >= 80
                        ? 'Healthy profile signal'
                        : 'Update profile to improve match quality',
                Icon: Gauge,
                iconClass: 'text-blue-700',
                iconBg: 'bg-blue-100',
                topBar: 'from-blue-600 to-cyan-500',
            },
            {
                label: 'Active Projects',
                value: insightMeta.activeProjects,
                helper:
                    insightMeta.activeProjects > 0
                        ? 'Projects contributing to recommendations'
                        : 'No active projects detected',
                Icon: FolderKanban,
                iconClass: 'text-indigo-700',
                iconBg: 'bg-indigo-100',
                topBar: 'from-indigo-600 to-blue-500',
            },
            {
                label: 'Suggested Matches',
                value: insightMeta.suggestedMatches,
                helper:
                    insightMeta.suggestedMatches > 0
                        ? 'Potential collaborators identified'
                        : 'Expand skills to unlock stronger matches',
                Icon: Users,
                iconClass: 'text-emerald-700',
                iconBg: 'bg-emerald-100',
                topBar: 'from-emerald-600 to-cyan-500',
            },
            {
                label: 'Available Days',
                value: insightMeta.availabilityDays,
                helper:
                    insightMeta.availabilityDays >= 4
                        ? 'Reliable scheduling flexibility'
                        : 'Add more availability for better planning',
                Icon: CalendarDays,
                iconClass: 'text-cyan-700',
                iconBg: 'bg-cyan-100',
                topBar: 'from-cyan-600 to-sky-500',
            },
        ],
        [insightMeta]
    );

    const updatedLabel = lastUpdated
        ? `${lastUpdated.toLocaleDateString()} • ${lastUpdated.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
          })}`
        : 'Now';

    if (loading) {
        return (
            <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto min-h-[40vh] flex items-center justify-center text-gray-600">
                <Sparkles className="w-5 h-5 mr-2 animate-pulse text-blue-600" />
                Loading insights...
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto space-y-6 page-shell">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(120deg,#0f172a_0%,#1d4ed8_58%,#0e7490_140%)] p-6 sm:p-8 text-white shadow-[0_24px_55px_-38px_rgba(15,23,42,0.9)]">
                <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
                <div className="absolute -bottom-24 left-16 h-52 w-52 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="relative z-10 page-header mb-0">
                    <div>
                        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100">
                            <Sparkles size={13} />
                            Match intelligence
                        </p>
                        <h1 className="page-title text-white mt-4">Match Insights</h1>
                        <p className="page-subtitle text-slate-200">
                            AI-driven compatibility analysis across your profile, current projects, and availability.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium flex items-center gap-2 self-start md:self-auto backdrop-blur-sm">
                        <Sparkles size={16} className="text-cyan-200" />
                        Updated {updatedLabel}
                    </div>
                </div>
                <div className="relative z-10 mt-5 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                        {overallScore}% current fit score
                    </span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                        {skills.length} skills tracked
                    </span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                        {missingSkills.length} skill gap signal(s)
                    </span>
                </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {insightCards.map((card) => (
                    <article
                        key={card.label}
                        className="surface-card rounded-2xl p-4 sm:p-5 relative overflow-hidden border border-slate-200/80"
                    >
                        <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.topBar}`} />
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                                <card.Icon className={`h-5 w-5 ${card.iconClass}`} />
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Snapshot
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-none">{card.value}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">{card.label}</div>
                        <p className="mt-2 text-xs text-slate-500 leading-relaxed">{card.helper}</p>
                    </article>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
                <div>
                    <CompatibilityScore score={overallScore} />
                </div>

                <div className="rounded-3xl border border-blue-200/70 bg-[linear-gradient(125deg,#1e3a8a_0%,#1d4ed8_55%,#0e7490_130%)] p-6 sm:p-7 lg:p-8 text-white relative overflow-hidden flex flex-col justify-center shadow-[0_24px_56px_-38px_rgba(15,23,42,0.95)]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-300 opacity-20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white/[0.06] to-transparent" />

                    <div className="relative z-10 max-w-3xl">
                        <div className="flex items-center gap-3 mb-3 sm:mb-4">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Sparkles className="text-cyan-100" size={20} />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold">AI Recommendation</h2>
                        </div>
                        <p className="text-blue-100 text-sm sm:text-base lg:text-lg mb-5 sm:mb-6 leading-relaxed">
                            {recommendationText}
                        </p>
                        <div className="mb-5 sm:mb-6 flex flex-wrap gap-2 text-xs sm:text-sm">
                            {recommendation?.project?.title ? (
                                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5">
                                    Project: {recommendation.project.title}
                                </span>
                            ) : null}
                            {recommendation?.teammate?.name ? (
                                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5">
                                    Teammate: {recommendation.teammate.name}
                                </span>
                            ) : null}
                        </div>
                        <button
                            onClick={() =>
                                navigate(
                                    recommendation?.project?.id
                                        ? `/project/${recommendation.project.id}`
                                        : '/projects'
                                )
                            }
                            className="w-full sm:w-auto px-5 py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
                        >
                            {recommendation?.project?.id ? 'View Project Details' : 'Explore Projects'}
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
                <div className="2xl:col-span-2">
                    <SkillBreakdown skills={skills} missingSkills={missingSkills} />
                </div>
                <div className="2xl:col-span-1">
                    <AvailabilityChart availability={availability} />
                </div>
            </div>
        </div>
    );
};

export default MatchInsights;
