import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Activity,
    AlertCircle,
    BarChart3,
    ExternalLink,
    Eye,
    GitFork,
    Github,
    Link2,
    Loader2,
    PencilLine,
    Plus,
    Save,
    SlidersHorizontal,
    Star,
    Trash2,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import ProjectHeader from './ProjectHeader';
import SkillGapHighlight from './SkillGapHighlight';
import OpenRolesList from './OpenRolesList';
import TeamGrid from './TeamGrid';
import ProjectAnalysisPanel from './ProjectAnalysisPanel';
import { API_BASE_URL } from '../../config/api';

const toPositiveIntegerOrNull = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return Math.round(numeric);
};

const toCommaSeparatedString = (values) => {
    if (!Array.isArray(values) || values.length === 0) return '';
    return values
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .join(', ');
};

const toDraftRoadmapPhase = (phase, index) => ({
    phase: String(phase?.phase || `phase_${index + 1}`),
    title: String(phase?.title || `Phase ${index + 1}`),
    objective: String(phase?.objective || ''),
    startWeek: phase?.startWeek ?? '',
    endWeek: phase?.endWeek ?? '',
    durationWeeks: phase?.durationWeeks ?? '',
    deliverables: toCommaSeparatedString(phase?.deliverables),
    owners: toCommaSeparatedString(phase?.owners),
    progress: Number.isFinite(Number(phase?.progress)) ? Math.max(0, Math.min(100, Math.round(Number(phase.progress)))) : 0,
});

const toCompactNumber = (value) => {
    const numeric = Number(value) || 0;
    if (numeric >= 1000000) return `${(numeric / 1000000).toFixed(1)}M`;
    if (numeric >= 1000) return `${(numeric / 1000).toFixed(1)}K`;
    return String(numeric);
};

const getTimelineTokenStorageKey = (projectId) => `project_github_token_${projectId}`;

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Contributor');
    const [inviting, setInviting] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [newRole, setNewRole] = useState({
        title: '',
        skills: '',
        spots: 1,
        durationHours: '',
    });
    const [postingRole, setPostingRole] = useState(false);
    const [postRoleError, setPostRoleError] = useState('');
    const [postRoleSuccess, setPostRoleSuccess] = useState('');
    const [applyingRoleTitle, setApplyingRoleTitle] = useState('');
    const [applyError, setApplyError] = useState('');
    const [applySuccess, setApplySuccess] = useState('');
    const [roadmapDraft, setRoadmapDraft] = useState([]);
    const [roadmapEditing, setRoadmapEditing] = useState(false);
    const [roadmapSaving, setRoadmapSaving] = useState(false);
    const [roadmapError, setRoadmapError] = useState('');
    const [roadmapSuccess, setRoadmapSuccess] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [analyzingProject, setAnalyzingProject] = useState(false);
    const [openingPositions, setOpeningPositions] = useState(false);
    const [analysisError, setAnalysisError] = useState('');
    const [analysisNotice, setAnalysisNotice] = useState('');
    const [invitingUserMap, setInvitingUserMap] = useState({});
    const [pendingApplications, setPendingApplications] = useState([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [applicationsError, setApplicationsError] = useState('');
    const [applicationActionId, setApplicationActionId] = useState('');
    const [sourceCodeDraft, setSourceCodeDraft] = useState('');
    const [sourceCodeSaving, setSourceCodeSaving] = useState(false);
    const [sourceCodeError, setSourceCodeError] = useState('');
    const [sourceCodeSuccess, setSourceCodeSuccess] = useState('');
    const [starterKitToken, setStarterKitToken] = useState(() => '');
    const [starterKitRepoName, setStarterKitRepoName] = useState('');
    const [starterKitVisibility, setStarterKitVisibility] = useState('private');
    const [starterKitLoading, setStarterKitLoading] = useState(false);
    const [starterKitError, setStarterKitError] = useState('');
    const [starterKitSuccess, setStarterKitSuccess] = useState('');
    const [githubInsights, setGithubInsights] = useState(null);
    const [githubInsightsLoading, setGithubInsightsLoading] = useState(false);
    const [githubInsightsError, setGithubInsightsError] = useState('');
    const roadmap = Array.isArray(project?.roadmap) ? project.roadmap : [];
    const canEditRoadmap = Boolean(project?.isOwner);
    const canEditSourceCode = Boolean(project?.isOwner || project?.isMember);
    const canViewProjectAnalysis = Boolean(project?.isOwner);

    useEffect(() => {
        if (!id) return;
        try {
            const stored = sessionStorage.getItem(getTimelineTokenStorageKey(id)) || '';
            if (stored) {
                setStarterKitToken(stored);
            }
        } catch (_error) {
            // Ignore storage errors and continue.
        }
    }, [id]);

    useEffect(() => {
        if (!id) return;
        try {
            const key = getTimelineTokenStorageKey(id);
            if (starterKitToken) {
                sessionStorage.setItem(key, starterKitToken);
            } else {
                sessionStorage.removeItem(key);
            }
        } catch (_error) {
            // Ignore storage errors and continue.
        }
    }, [id, starterKitToken]);

    useEffect(() => {
        const fetchProject = async () => {
            setLoading(true);
            setError('');

            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/api/project/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch project');
                }

                const fetchedProject = data.project || null;
                setProject(fetchedProject);
                setAnalysis(
                    fetchedProject?.isOwner && fetchedProject?.latestAnalysis
                        ? fetchedProject.latestAnalysis
                        : null
                );
            } catch (fetchError) {
                setError(fetchError.message || 'Failed to fetch project');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProject();
        }
    }, [id]);

    useEffect(() => {
        const incomingRoadmap = Array.isArray(project?.roadmap) ? project.roadmap : [];
        setRoadmapDraft(incomingRoadmap.map((phase, index) => toDraftRoadmapPhase(phase, index)));
    }, [project]);

    useEffect(() => {
        setSourceCodeDraft(String(project?.sourceCodeUrl || ''));
    }, [project]);

    useEffect(() => {
        const fetchGitHubInsights = async () => {
            if (!id || !project?.sourceCodeUrl) {
                setGithubInsights(null);
                setGithubInsightsError('');
                return;
            }

            setGithubInsightsLoading(true);
            setGithubInsightsError('');
            try {
                const token = localStorage.getItem('authToken');
                const githubToken = String(starterKitToken || '').trim();
                const query = githubToken
                    ? `?githubToken=${encodeURIComponent(githubToken)}`
                    : '';
                const response = await fetch(`${API_BASE_URL}/api/project/${id}/github/insights${query}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch GitHub insights');
                }
                setGithubInsights(data);
            } catch (fetchError) {
                setGithubInsights(null);
                setGithubInsightsError(fetchError.message || 'Failed to fetch GitHub insights');
            } finally {
                setGithubInsightsLoading(false);
            }
        };

        fetchGitHubInsights();
    }, [id, project?.sourceCodeUrl, starterKitToken]);

    useEffect(() => {
        const fetchPendingApplications = async () => {
            if (!project?.isOwner || !id) {
                setPendingApplications([]);
                return;
            }

            setApplicationsError('');
            setApplicationsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/api/notification`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch applications');
                }

                const filtered = (Array.isArray(data.notifications) ? data.notifications : []).filter(
                    (notification) =>
                        notification?.rawType === 'project_application' &&
                        notification?.status === 'pending' &&
                        String(notification?.project?.id || '') === String(id)
                );
                setPendingApplications(filtered);
            } catch (fetchError) {
                setApplicationsError(fetchError.message || 'Failed to fetch applications');
            } finally {
                setApplicationsLoading(false);
            }
        };

        fetchPendingApplications();
    }, [id, project?.isOwner]);

    const handleInvite = async (event) => {
        event.preventDefault();
        setInviteError('');
        setInviteSuccess('');

        const normalizedEmail = inviteEmail.trim().toLowerCase();
        if (!normalizedEmail) {
            setInviteError('Enter an email address to invite.');
            return;
        }

        setInviting(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/${id}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email: normalizedEmail,
                    role: inviteRole,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invite');
            }

            setInviteSuccess('Invitation sent successfully.');
            setInviteEmail('');
        } catch (actionError) {
            setInviteError(actionError.message || 'Failed to send invitation');
        } finally {
            setInviting(false);
        }
    };

    const handlePostRole = async (event) => {
        event.preventDefault();
        setPostRoleError('');
        setPostRoleSuccess('');

        if (!newRole.title.trim()) {
            setPostRoleError('Role title is required.');
            return;
        }

        setPostingRole(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/${id}/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: newRole.title.trim(),
                    skills: String(newRole.skills || '')
                        .split(',')
                        .map((skill) => skill.trim())
                        .filter(Boolean),
                    spots: Number(newRole.spots) || 1,
                    durationHours: Number(newRole.durationHours) > 0 ? Number(newRole.durationHours) : null,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to post open role');
            }

            setProject(data.project || project);
            setPostRoleSuccess('Open role posted to Project Bazaar.');
            setNewRole({
                title: '',
                skills: '',
                spots: 1,
                durationHours: '',
            });
        } catch (actionError) {
            setPostRoleError(actionError.message || 'Failed to post open role');
        } finally {
            setPostingRole(false);
        }
    };

    const handleApplyToRole = async (role) => {
        const roleTitle = String(role?.title || '').trim();
        if (!roleTitle) {
            return;
        }

        setApplyError('');
        setApplySuccess('');
        setApplyingRoleTitle(roleTitle);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/${id}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ roleTitle }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit application');
            }

            setApplySuccess('Application submitted. Project owner has been notified.');
        } catch (actionError) {
            setApplyError(actionError.message || 'Failed to submit application');
        } finally {
            setApplyingRoleTitle('');
        }
    };

    const handleRoadmapFieldChange = (phaseIndex, field, value) => {
        setRoadmapDraft((prev) =>
            prev.map((phase, index) =>
                index === phaseIndex ? { ...phase, [field]: value } : phase
            )
        );
    };

    const handleAddRoadmapPhase = () => {
        const nextPhaseNumber = roadmapDraft.length + 1;
        const lastPhase = roadmapDraft[roadmapDraft.length - 1];
        const lastEndWeek = toPositiveIntegerOrNull(lastPhase?.endWeek);
        const defaultStartWeek = lastEndWeek ? lastEndWeek + 1 : '';

        setRoadmapDraft((prev) => [
            ...prev,
            {
                phase: `phase_${nextPhaseNumber}`,
                title: `Phase ${nextPhaseNumber}`,
                objective: '',
                startWeek: defaultStartWeek,
                endWeek: '',
                durationWeeks: '',
                deliverables: '',
                owners: '',
                progress: 0,
            },
        ]);
    };

    const handleCreateFirstRoadmapPhase = () => {
        setRoadmapError('');
        setRoadmapSuccess('');
        setRoadmapEditing(true);
        setRoadmapDraft([
            {
                phase: 'phase_1',
                title: 'Phase 1',
                objective: '',
                startWeek: '',
                endWeek: '',
                durationWeeks: '',
                deliverables: '',
                owners: '',
                progress: 0,
            },
        ]);
    };

    const handleRemoveRoadmapPhase = (phaseIndex) => {
        setRoadmapDraft((prev) => prev.filter((_, index) => index !== phaseIndex));
    };

    const handleStartRoadmapEditing = () => {
        setRoadmapError('');
        setRoadmapSuccess('');
        setRoadmapDraft(roadmap.map((phase, index) => toDraftRoadmapPhase(phase, index)));
        setRoadmapEditing(true);
    };

    const handleCancelRoadmapEditing = () => {
        setRoadmapError('');
        setRoadmapSuccess('');
        setRoadmapDraft(roadmap.map((phase, index) => toDraftRoadmapPhase(phase, index)));
        setRoadmapEditing(false);
    };

    const handleSaveRoadmap = async () => {
        setRoadmapError('');
        setRoadmapSuccess('');
        setRoadmapSaving(true);

        const payloadRoadmap = roadmapDraft
            .map((phase, index) => ({
                phase: String(phase?.phase || `phase_${index + 1}`),
                title: String(phase?.title || '').trim(),
                objective: String(phase?.objective || '').trim(),
                startWeek: toPositiveIntegerOrNull(phase?.startWeek),
                endWeek: toPositiveIntegerOrNull(phase?.endWeek),
                durationWeeks: toPositiveIntegerOrNull(phase?.durationWeeks),
                deliverables: String(phase?.deliverables || '')
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                owners: String(phase?.owners || '')
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                progress: Math.max(0, Math.min(100, Math.round(Number(phase?.progress) || 0))),
            }))
            .filter((phase) => phase.title || phase.objective);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/${id}/roadmap`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ roadmap: payloadRoadmap }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update roadmap');
            }

            setProject(data.project || project);
            setRoadmapEditing(false);
            setRoadmapSuccess('Roadmap updated successfully.');
        } catch (actionError) {
            setRoadmapError(actionError.message || 'Failed to update roadmap');
        } finally {
            setRoadmapSaving(false);
        }
    };

    const handleSaveSourceCode = async () => {
        setSourceCodeError('');
        setSourceCodeSuccess('');
        setSourceCodeSaving(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/${id}/source-code`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    sourceCodeUrl: String(sourceCodeDraft || '').trim(),
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update source code URL');
            }

            setProject(data.project || project);
            setSourceCodeSuccess(data.message || 'Source code URL updated.');
        } catch (actionError) {
            setSourceCodeError(actionError.message || 'Failed to update source code URL');
        } finally {
            setSourceCodeSaving(false);
        }
    };

    const handleCreateStarterKit = async () => {
        setStarterKitError('');
        setStarterKitSuccess('');

        const normalizedToken = String(starterKitToken || '').trim();
        if (!normalizedToken) {
            setStarterKitError('GitHub token is required to create a repository automatically.');
            return;
        }

        setStarterKitLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/${id}/github/starter-kit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    githubToken: normalizedToken,
                    repoName: starterKitRepoName,
                    visibility: starterKitVisibility,
                    createIssues: true,
                    createBoilerplate: true,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create GitHub starter kit');
            }

            if (data?.project) {
                setProject(data.project);
            }
            setStarterKitSuccess(
                `Starter kit ready: ${data?.repo?.fullName || 'GitHub repo'} with ${Array.isArray(data?.issuesCreated) ? data.issuesCreated.length : 0} starter issues.`
            );
            if (Array.isArray(data?.warnings) && data.warnings.length > 0) {
                const preview = data.warnings.slice(0, 2).join(' | ');
                setStarterKitSuccess(
                    `Starter kit created with warnings: ${preview}${data.warnings.length > 2 ? ' ...' : ''}`
                );
            }
            setSourceCodeSuccess('Source code URL updated from generated GitHub repository.');
        } catch (actionError) {
            setStarterKitError(actionError.message || 'Failed to create GitHub starter kit');
        } finally {
            setStarterKitLoading(false);
        }
    };

    const handleJumpToRoadmap = () => {
        const roadmapSection = document.getElementById('project-roadmap');
        if (!roadmapSection) return;
        roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleApplicationDecision = async (notificationId, action) => {
        const normalizedId = String(notificationId || '').trim();
        if (!normalizedId) return;
        if (!['accept', 'reject'].includes(action)) return;

        setApplicationsError('');
        setApplicationActionId(normalizedId);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/notification/${normalizedId}/${action}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || `Failed to ${action} application`);
            }

            setPendingApplications((prev) =>
                prev.filter((notification) => notification.id !== normalizedId)
            );

            if (action === 'accept') {
                const projectResponse = await fetch(`${API_BASE_URL}/api/project/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const projectData = await projectResponse.json().catch(() => ({}));
                if (projectResponse.ok && projectData?.project) {
                    setProject(projectData.project);
                }
            }
        } catch (actionError) {
            setApplicationsError(actionError.message || 'Failed to update application');
        } finally {
            setApplicationActionId('');
        }
    };

    const handleJumpToAnalysis = () => {
        const analysisSection = document.getElementById('project-analysis');
        if (!analysisSection) return;
        analysisSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleAnalyzeProject = async () => {
        if (!project?.isOwner) {
            setAnalysisError('Only the project owner can analyze this project.');
            return;
        }

        setAnalysisError('');
        setAnalysisNotice('');
        setAnalyzingProject(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/${id}/analyze`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze project');
            }

            if (data?.project) {
                setProject(data.project);
            }
            setAnalysis(data?.analysis || null);
            setAnalysisNotice(data?.message || 'Project analysis completed.');
            handleJumpToAnalysis();
        } catch (actionError) {
            setAnalysisError(actionError.message || 'Failed to analyze project');
        } finally {
            setAnalyzingProject(false);
        }
    };

    const handleInviteUserById = async (userId, roleTitle = 'Contributor') => {
        const normalizedUserId = String(userId || '').trim();
        if (!normalizedUserId) return;

        setInvitingUserMap((prev) => ({
            ...prev,
            [normalizedUserId]: {
                loading: true,
                error: '',
                success: '',
            },
        }));

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/${id}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: normalizedUserId,
                    role: String(roleTitle || 'Contributor').trim() || 'Contributor',
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invite');
            }

            setInvitingUserMap((prev) => ({
                ...prev,
                [normalizedUserId]: {
                    loading: false,
                    error: '',
                    success: 'Invite sent',
                },
            }));
            setAnalysisNotice('Invitation sent successfully.');
        } catch (actionError) {
            setInvitingUserMap((prev) => ({
                ...prev,
                [normalizedUserId]: {
                    loading: false,
                    error: actionError.message || 'Failed to invite',
                    success: '',
                },
            }));
        }
    };

    const handleOpenPositionsFromAnalysis = async () => {
        if (!project?.isOwner) {
            setAnalysisError('Only the project owner can open suggested positions.');
            return;
        }

        setAnalysisError('');
        setAnalysisNotice('');
        setOpeningPositions(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/${id}/open-positions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Failed to open suggested positions');
            }

            if (data?.project) {
                setProject(data.project);
                if (data.project?.isOwner && data.project?.latestAnalysis) {
                    setAnalysis(data.project.latestAnalysis);
                }
            }
            setAnalysisNotice(data.message || 'Suggested positions opened successfully.');
        } catch (actionError) {
            setAnalysisError(actionError.message || 'Failed to open suggested positions');
        } finally {
            setOpeningPositions(false);
        }
    };



    if (loading) {
        return (
            <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-screen-2xl mx-auto min-h-[40vh] flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading project...
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-screen-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                    {error || 'Project not found'}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-screen-2xl mx-auto space-y-6 page-shell">
            <ProjectHeader project={project} />


            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2">
                    {analysisError ? (
                        <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-3">
                            {analysisError}
                        </div>
                    ) : null}

                    <SkillGapHighlight
                        missingSkills={
                            Array.isArray(analysis?.projectSkillGap) && analysis.projectSkillGap.length > 0
                                ? analysis.projectSkillGap
                                : project.missingSkills
                        }
                        onReviewGaps={handleAnalyzeProject}
                        reviewing={analyzingProject}
                        showReviewAction={canViewProjectAnalysis}
                    />

                    {canViewProjectAnalysis ? (
                        <div id="project-analysis">
                            <ProjectAnalysisPanel
                                analysis={analysis}
                                analyzing={analyzingProject}
                                onAnalyze={handleAnalyzeProject}
                                onOpenPositions={handleOpenPositionsFromAnalysis}
                                openingPositions={openingPositions}
                                isOwner={Boolean(project?.isOwner)}
                                invitingByUserId={invitingUserMap}
                                onInviteUser={handleInviteUserById}
                                notifyMessage={analysisNotice}
                            />
                        </div>
                    ) : null}

                    <div className="surface-card rounded-2xl p-8 mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">About the Project</h3>
                        <div className="prose prose-blue max-w-none text-gray-600 space-y-4 whitespace-pre-line">
                            {project.fullDescription || project.shortDescription}
                        </div>
                    </div>

                    <div
                        id="project-roadmap"
                        className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 rounded-2xl p-8 shadow-sm border border-blue-100 mb-6"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Project Roadmap</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Owner-managed execution plan. Overall project progress is auto-calculated from phase progress.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-semibold">
                                    {roadmapEditing ? roadmapDraft.length : roadmap.length} phase{(roadmapEditing ? roadmapDraft.length : roadmap.length) === 1 ? '' : 's'}
                                </span>

                                {canEditRoadmap ? (
                                    roadmapEditing ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleCancelRoadmapEditing}
                                                disabled={roadmapSaving}
                                                className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveRoadmap}
                                                disabled={roadmapSaving}
                                                className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {roadmapSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                {roadmapSaving ? 'Saving...' : 'Save Roadmap'}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleStartRoadmapEditing}
                                            className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                                        >
                                            <PencilLine className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                    )
                                ) : null}
                            </div>
                        </div>

                        {roadmapError ? (
                            <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                                {roadmapError}
                            </div>
                        ) : null}
                        {roadmapSuccess ? (
                            <div className="mb-3 text-xs text-green-700 bg-green-50 border border-green-100 rounded-md p-2">
                                {roadmapSuccess}
                            </div>
                        ) : null}

                        {roadmapEditing ? (
                            <div className="space-y-4">
                                {roadmapDraft.map((phase, index) => (
                                    <div
                                        key={`${phase.phase || 'phase'}-${index}`}
                                        className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <p className="text-sm font-semibold text-gray-900">Phase {index + 1}</p>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRoadmapPhase(index)}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Remove
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={phase.title}
                                                onChange={(event) => handleRoadmapFieldChange(index, 'title', event.target.value)}
                                                placeholder="Phase title"
                                                className="mini-input"
                                            />

                                            <textarea
                                                value={phase.objective}
                                                onChange={(event) => handleRoadmapFieldChange(index, 'objective', event.target.value)}
                                                placeholder="Objective"
                                                rows={3}
                                                className="mini-input resize-y"
                                            />

                                            <div className="grid sm:grid-cols-3 gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={phase.startWeek}
                                                    onChange={(event) => handleRoadmapFieldChange(index, 'startWeek', event.target.value)}
                                                    placeholder="Start week"
                                                    className="mini-input"
                                                />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={phase.endWeek}
                                                    onChange={(event) => handleRoadmapFieldChange(index, 'endWeek', event.target.value)}
                                                    placeholder="End week"
                                                    className="mini-input"
                                                />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={phase.durationWeeks}
                                                    onChange={(event) => handleRoadmapFieldChange(index, 'durationWeeks', event.target.value)}
                                                    placeholder="Duration weeks"
                                                    className="mini-input"
                                                />
                                            </div>

                                            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                                                <div className="flex items-center justify-between text-xs mb-2">
                                                    <span className="font-semibold text-blue-800">Phase Progress</span>
                                                    <span className="font-semibold text-blue-900">
                                                        {Math.max(0, Math.min(100, Math.round(Number(phase.progress) || 0)))}%
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    step="1"
                                                    value={Math.max(0, Math.min(100, Math.round(Number(phase.progress) || 0)))}
                                                    onChange={(event) => handleRoadmapFieldChange(index, 'progress', Number(event.target.value))}
                                                    className="w-full accent-blue-600"
                                                />
                                            </div>

                                            <input
                                                type="text"
                                                value={phase.deliverables}
                                                onChange={(event) => handleRoadmapFieldChange(index, 'deliverables', event.target.value)}
                                                placeholder="Deliverables (comma separated)"
                                                className="mini-input"
                                            />

                                            <input
                                                type="text"
                                                value={phase.owners}
                                                onChange={(event) => handleRoadmapFieldChange(index, 'owners', event.target.value)}
                                                placeholder="Owners (comma separated)"
                                                className="mini-input"
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAddRoadmapPhase}
                                        className="btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Phase
                                    </button>
                                    <span className="text-xs text-gray-500">
                                        Only the project owner can edit roadmap and phase progress.
                                    </span>
                                </div>
                            </div>
                        ) : roadmap.length > 0 ? (
                            <div className="relative">
                                {roadmap.map((phase, index) => (
                                    <div
                                        key={phase.id || `${phase.phase || 'phase'}-${index}`}
                                        className="relative pl-8 pb-6 last:pb-0"
                                    >
                                        {index < roadmap.length - 1 ? (
                                            <span className="absolute left-[7px] top-6 bottom-0 w-px bg-blue-200" />
                                        ) : null}
                                        <span className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-blue-400 bg-white" />

                                        <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <h4 className="text-sm font-semibold text-gray-900">
                                                    {phase.title || `Phase ${index + 1}`}
                                                </h4>
                                                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md">
                                                    {Number.isFinite(Number(phase.startWeek)) && Number.isFinite(Number(phase.endWeek))
                                                        ? `Week ${Number(phase.startWeek)} - ${Number(phase.endWeek)}`
                                                        : Number.isFinite(Number(phase.durationWeeks))
                                                            ? `${Number(phase.durationWeeks)} week${Number(phase.durationWeeks) > 1 ? 's' : ''}`
                                                            : 'Planned'}
                                                </span>
                                            </div>

                                            {phase.objective ? (
                                                <p className="text-sm text-gray-600 mb-3">{phase.objective}</p>
                                            ) : null}

                                            <div className="mb-3">
                                                <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                                                    <span>Phase Progress</span>
                                                    <span className="font-semibold text-gray-800">
                                                        {Math.max(0, Math.min(100, Math.round(Number(phase.progress) || 0)))}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${Math.max(0, Math.min(100, Math.round(Number(phase.progress) || 0)))}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {Array.isArray(phase.deliverables) && phase.deliverables.length > 0 ? (
                                                <div className="mb-2">
                                                    <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1">
                                                        Deliverables
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {phase.deliverables.map((item) => (
                                                            <span
                                                                key={item}
                                                                className="text-[11px] px-2 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200"
                                                            >
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {Array.isArray(phase.owners) && phase.owners.length > 0 ? (
                                                <p className="text-xs text-gray-500">Owners: {phase.owners.join(', ')}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-blue-200 bg-white/80 p-5 text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <span>No roadmap has been defined yet.</span>
                                {canEditRoadmap ? (
                                    <button
                                        type="button"
                                        onClick={handleCreateFirstRoadmapPhase}
                                        className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs w-fit"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add First Phase
                                    </button>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {applyError ? (
                        <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-3">
                            {applyError}
                        </div>
                    ) : null}
                    {applySuccess ? (
                        <div className="mb-4 text-xs text-green-700 bg-green-50 border border-green-100 rounded-md p-3">
                            {applySuccess}
                        </div>
                    ) : null}

                    <OpenRolesList
                        roles={project.roles}
                        canApply={!project.isOwner && !project.isMember}
                        onApplyRole={handleApplyToRole}
                        applyingRoleTitle={applyingRoleTitle}
                    />
                </div>

                {/* Right Column - Team & Info */}
                <div className="space-y-6">
                    <div className="surface-card rounded-2xl p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-blue-600" />
                            Source Code
                        </h3>

                        {project.sourceCodeUrl ? (
                            <a
                                href={project.sourceCodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline break-all"
                            >
                                {project.sourceCodeUrl}
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        ) : (
                            <p className="text-sm text-gray-500">
                                No repository link added yet.
                            </p>
                        )}

                        {canEditSourceCode ? (
                            <div className="mt-4 space-y-3">
                                <input
                                    type="url"
                                    value={sourceCodeDraft}
                                    onChange={(event) => setSourceCodeDraft(event.target.value)}
                                    placeholder="https://github.com/username/repo"
                                    className="mini-input"
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSaveSourceCode}
                                        disabled={sourceCodeSaving}
                                        className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {sourceCodeSaving ? 'Saving...' : 'Save Link'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSourceCodeDraft('')}
                                        disabled={sourceCodeSaving}
                                        className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        Clear
                                    </button>
                                </div>
                                {sourceCodeError ? (
                                    <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                                        {sourceCodeError}
                                    </div>
                                ) : null}
                                {sourceCodeSuccess ? (
                                    <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-md p-2">
                                        {sourceCodeSuccess}
                                    </div>
                                ) : null}

                                {project.isOwner ? (
                                    <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 space-y-2">
                                        <div className="flex items-center gap-2 text-indigo-900">
                                            <Github className="w-4 h-4" />
                                            <p className="text-xs font-semibold uppercase tracking-wide">
                                                One-Click Starter Kit
                                            </p>
                                        </div>
                                        <p className="text-xs text-indigo-800">
                                            Auto-creates a GitHub repo with README, boilerplate files, labels, and starter issues/tasks.
                                        </p>
                                        <input
                                            type="password"
                                            value={starterKitToken}
                                            onChange={(event) => setStarterKitToken(event.target.value)}
                                            placeholder="GitHub token (repo scope)"
                                            className="mini-input"
                                        />
                                        <p className="text-[11px] text-indigo-700">
                                            Token is also used to load private repository insights.
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                value={starterKitRepoName}
                                                onChange={(event) => setStarterKitRepoName(event.target.value)}
                                                placeholder="Repo name (optional)"
                                                className="mini-input"
                                            />
                                            <select
                                                value={starterKitVisibility}
                                                onChange={(event) => setStarterKitVisibility(event.target.value)}
                                                className="mini-input"
                                            >
                                                <option value="private">Private Repo</option>
                                                <option value="public">Public Repo</option>
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCreateStarterKit}
                                            disabled={starterKitLoading}
                                            className="btn-primary w-full text-xs py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {starterKitLoading ? 'Creating Starter Kit...' : 'Generate GitHub Starter Kit'}
                                        </button>
                                        {starterKitError ? (
                                            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                                                {starterKitError}
                                            </div>
                                        ) : null}
                                        {starterKitSuccess ? (
                                            <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-md p-2">
                                                {starterKitSuccess}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    <div className="surface-card rounded-2xl p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-600" />
                            GitHub Insights
                        </h3>

                        {githubInsightsLoading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading repository insights...
                            </div>
                        ) : null}

                        {!githubInsightsLoading && githubInsightsError ? (
                            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md p-2 inline-flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {githubInsightsError}
                            </div>
                        ) : null}

                        {!githubInsightsLoading && !githubInsightsError && githubInsights ? (
                            <div className="space-y-4">
                                <a
                                    href={githubInsights?.repo?.htmlUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                                >
                                    {githubInsights?.repo?.fullName || 'GitHub Repository'}
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-2">
                                        <div className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                                            <Star className="w-3.5 h-3.5" />
                                            Stars
                                        </div>
                                        <div className="text-lg font-bold text-amber-900">{toCompactNumber(githubInsights?.stats?.stars)}</div>
                                    </div>
                                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-2">
                                        <div className="inline-flex items-center gap-1 text-blue-700 font-semibold">
                                            <GitFork className="w-3.5 h-3.5" />
                                            Forks
                                        </div>
                                        <div className="text-lg font-bold text-blue-900">{toCompactNumber(githubInsights?.stats?.forks)}</div>
                                    </div>
                                    <div className="rounded-lg border border-violet-100 bg-violet-50 p-2">
                                        <div className="inline-flex items-center gap-1 text-violet-700 font-semibold">
                                            <Eye className="w-3.5 h-3.5" />
                                            Watchers
                                        </div>
                                        <div className="text-lg font-bold text-violet-900">{toCompactNumber(githubInsights?.stats?.watchers)}</div>
                                    </div>
                                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2">
                                        <div className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                            <Users className="w-3.5 h-3.5" />
                                            Contributors
                                        </div>
                                        <div className="text-lg font-bold text-emerald-900">{toCompactNumber(githubInsights?.stats?.contributors)}</div>
                                    </div>
                                    <div className="rounded-lg border border-rose-100 bg-rose-50 p-2">
                                        <div className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Open Issues
                                        </div>
                                        <div className="text-lg font-bold text-rose-900">{toCompactNumber(githubInsights?.stats?.openIssues)}</div>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                        <div className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                                            <Activity className="w-3.5 h-3.5" />
                                            Repo Size
                                        </div>
                                        <div className="text-lg font-bold text-slate-900">
                                            {toCompactNumber(githubInsights?.stats?.sizeKb)} KB
                                        </div>
                                    </div>
                                </div>

                                {Array.isArray(githubInsights?.languages) && githubInsights.languages.length > 0 ? (
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                            Language Breakdown
                                        </p>
                                        <div className="space-y-2">
                                            {githubInsights.languages.slice(0, 5).map((entry) => (
                                                <div key={entry.language}>
                                                    <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                                                        <span>{entry.language}</span>
                                                        <span>{entry.percentage}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                                            style={{ width: `${Math.max(3, Number(entry.percentage) || 0)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {Array.isArray(githubInsights?.contributors) && githubInsights.contributors.length > 0 ? (
                                    <div className="rounded-xl border border-gray-100 bg-white p-3">
                                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                            Top Contributors
                                        </p>
                                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                            {githubInsights.contributors.slice(0, 8).map((contributor) => (
                                                <a
                                                    key={contributor.id || contributor.login}
                                                    href={contributor.profileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between rounded-lg border border-gray-100 px-2 py-1.5 hover:bg-gray-50"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <img
                                                            src={contributor.avatarUrl}
                                                            alt={contributor.login}
                                                            className="w-6 h-6 rounded-full border border-gray-200"
                                                        />
                                                        <span className="text-xs font-medium text-gray-800 truncate">
                                                            {contributor.login}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-blue-700">
                                                        {contributor.contributions} commits
                                                    </span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {Array.isArray(githubInsights?.recentActivity) && githubInsights.recentActivity.length > 0 ? (
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide inline-flex items-center gap-1">
                                            <Activity className="w-3.5 h-3.5" />
                                            Recent Activity
                                        </p>
                                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                            {githubInsights.recentActivity.slice(0, 8).map((commit) => (
                                                <a
                                                    key={`${commit.sha}-${commit.date}`}
                                                    href={commit.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block rounded-md border border-gray-100 bg-white px-2 py-1.5 hover:bg-blue-50 transition-colors"
                                                >
                                                    <p className="text-[11px] font-semibold text-gray-900 truncate">
                                                        {commit.sha} - {commit.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {commit.author} • {commit.date ? new Date(commit.date).toLocaleDateString() : 'Unknown date'}
                                                    </p>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        {!githubInsightsLoading && !githubInsightsError && !githubInsights ? (
                            <p className="text-sm text-gray-500">
                                Link a GitHub repository to unlock contributor and project analytics.
                            </p>
                        ) : null}
                    </div>

                    <div className="surface-card rounded-2xl p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                            Project Progress
                        </h3>

                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">Completion</span>
                            <span className="font-semibold text-gray-900">{Math.round(Number(project.progress) || 0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.round(Number(project.progress) || 0)}%` }}
                            />
                        </div>

                        <div className="text-xs text-gray-500">
                            Progress is automatically derived from roadmap phase progress.
                        </div>
                    </div>

                    {project.isOwner ? (
                        <div className="surface-card rounded-2xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Role Applications</h3>

                            {applicationsError ? (
                                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2 mb-3">
                                    {applicationsError}
                                </div>
                            ) : null}

                            {applicationsLoading ? (
                                <div className="text-sm text-gray-500">Loading applications...</div>
                            ) : pendingApplications.length === 0 ? (
                                <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-md p-3">
                                    No pending applications for this project.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingApplications.map((application) => (
                                        <div
                                            key={application.id}
                                            className="rounded-lg border border-gray-100 p-3 bg-gray-50"
                                        >
                                            <p className="text-sm font-semibold text-gray-900">
                                                {application.sender?.name || 'Applicant'}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Applied for: {application.roleTitle || 'Contributor'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {application.message || 'New application received'}
                                            </p>

                                            <div className="mt-3 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleApplicationDecision(application.id, 'accept')
                                                    }
                                                    disabled={applicationActionId === application.id}
                                                    className="btn-primary px-3 py-1.5 text-xs bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    {applicationActionId === application.id
                                                        ? 'Updating...'
                                                        : 'Accept'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleApplicationDecision(application.id, 'reject')
                                                    }
                                                    disabled={applicationActionId === application.id}
                                                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}

                    {project.isOwner ? (
                        <div className="surface-card rounded-2xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Post Open Role</h3>
                            <form className="space-y-3" onSubmit={handlePostRole}>
                                <input
                                    type="text"
                                    value={newRole.title}
                                    onChange={(event) => setNewRole((prev) => ({ ...prev, title: event.target.value }))}
                                    placeholder="Role title (e.g., UI/UX Designer)"
                                    className="mini-input"
                                />
                                <input
                                    type="text"
                                    value={newRole.skills}
                                    onChange={(event) => setNewRole((prev) => ({ ...prev, skills: event.target.value }))}
                                    placeholder="Skills (comma separated)"
                                    className="mini-input"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        value={newRole.spots}
                                        onChange={(event) => setNewRole((prev) => ({ ...prev, spots: Number(event.target.value) || 1 }))}
                                        placeholder="Spots"
                                        className="mini-input"
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        value={newRole.durationHours}
                                        onChange={(event) => setNewRole((prev) => ({ ...prev, durationHours: event.target.value }))}
                                        placeholder="Urgency hours (optional)"
                                        className="mini-input"
                                    />
                                </div>

                                {postRoleError ? (
                                    <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                                        {postRoleError}
                                    </div>
                                ) : null}
                                {postRoleSuccess ? (
                                    <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-md p-2">
                                        {postRoleSuccess}
                                    </div>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={postingRole}
                                    className="btn-primary w-full text-sm py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {postingRole ? 'Posting...' : 'Post Role'}
                                </button>
                            </form>
                        </div>
                    ) : null}

                    {project.isOwner ? (
                        <div className="surface-card rounded-2xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-blue-600" />
                                Invite Team Member
                            </h3>

                            <form onSubmit={handleInvite} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        User Email
                                    </label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(event) => setInviteEmail(event.target.value)}
                                        placeholder="teammate@example.com"
                                        className="mini-input"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Role In Project
                                    </label>
                                    <input
                                        type="text"
                                        value={inviteRole}
                                        onChange={(event) => setInviteRole(event.target.value)}
                                        placeholder="Contributor"
                                        className="mini-input"
                                    />
                                </div>

                                {inviteError ? (
                                    <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                                        {inviteError}
                                    </div>
                                ) : null}

                                {inviteSuccess ? (
                                    <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-md p-2">
                                        {inviteSuccess}
                                    </div>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="btn-primary w-full text-sm py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {inviting ? 'Sending Invite...' : 'Send Invite'}
                                </button>
                            </form>
                        </div>
                    ) : null}

                    <TeamGrid members={project.team} />

                    {/* Quick Links / Resources Placeholder */}
                    <div className="surface-card rounded-2xl p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Resources</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <button
                                    type="button"
                                    onClick={handleJumpToRoadmap}
                                    className="text-blue-600 hover:underline"
                                >
                                    Project Roadmap
                                </button>
                            </li>
                            {project.sourceCodeUrl ? (
                                <li>
                                    <a
                                        href={project.sourceCodeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline inline-flex items-center gap-1.5"
                                    >
                                        Source Code Repository
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </li>
                            ) : null}
                            <li className="text-gray-500">Design System (coming soon)</li>
                            <li className="text-gray-500">API Documentation (coming soon)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
