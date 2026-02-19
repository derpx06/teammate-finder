import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
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
            <div className="page-header mb-2">
                <div>
                    <h1 className="page-title">Match Insights</h1>
                    <p className="page-subtitle">AI-driven analysis of your compatibility with current projects.</p>
                </div>
                <div className="pill-soft px-4 py-2 text-sm font-medium flex items-center gap-2 self-start md:self-auto">
                    <Sparkles size={16} />
                    AI Analysis Updated {lastUpdated ? lastUpdated.toLocaleDateString() : 'Now'}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="surface-card rounded-xl p-3 sm:p-4">
                    <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Profile Completion
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {insightMeta.profileCompletion}%
                    </div>
                </div>
                <div className="surface-card rounded-xl p-3 sm:p-4">
                    <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Active Projects
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {insightMeta.activeProjects}
                    </div>
                </div>
                <div className="surface-card rounded-xl p-3 sm:p-4">
                    <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Suggested Matches
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {insightMeta.suggestedMatches}
                    </div>
                </div>
                <div className="surface-card rounded-xl p-3 sm:p-4">
                    <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Available Days
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {insightMeta.availabilityDays}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-4">
                    <CompatibilityScore score={overallScore} />
                </div>

                <div className="xl:col-span-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 sm:p-7 lg:p-8 text-white relative overflow-hidden flex flex-col justify-center shadow-lg">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500 opacity-20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3 sm:mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Sparkles className="text-yellow-300" size={20} />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold">AI Recommendation</h2>
                        </div>
                        <p className="text-blue-100 text-sm sm:text-base lg:text-lg mb-5 sm:mb-6 leading-relaxed max-w-3xl">
                            {recommendationText}
                        </p>
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
