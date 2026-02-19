import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Link2, Loader2, PencilLine, Plus, Save, SlidersHorizontal, Trash2, UserPlus, X } from 'lucide-react';
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
});

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
    const [progressDraft, setProgressDraft] = useState(0);
    const [progressSaving, setProgressSaving] = useState(false);
    const [progressError, setProgressError] = useState('');
    const [progressSuccess, setProgressSuccess] = useState('');
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
    const roadmap = Array.isArray(project?.roadmap) ? project.roadmap : [];
    const canEditRoadmap = Boolean(project?.isOwner || project?.isMember);
    const canEditSourceCode = Boolean(project?.isOwner || project?.isMember);

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
        if (project && Number.isFinite(Number(project.progress))) {
            setProgressDraft(Number(project.progress));
        }
    }, [project]);

    useEffect(() => {
        const incomingRoadmap = Array.isArray(project?.roadmap) ? project.roadmap : [];
        setRoadmapDraft(incomingRoadmap.map((phase, index) => toDraftRoadmapPhase(phase, index)));
    }, [project]);

    useEffect(() => {
        setSourceCodeDraft(String(project?.sourceCodeUrl || ''));
    }, [project]);

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

    const handleSaveProgress = async () => {
        setProgressError('');
        setProgressSuccess('');
        setProgressSaving(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/${id}/progress`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ progress: Number(progressDraft) }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update progress');
            }

            setProject(data.project || project);
            setProgressSuccess('Progress updated.');
        } catch (actionError) {
            setProgressError(actionError.message || 'Failed to update progress');
        } finally {
            setProgressSaving(false);
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
        <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-screen-2xl mx-auto space-y-6">
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
                    />

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

                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6">
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
                                    Shared execution plan. Team members can collaboratively update this timeline.
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
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveRoadmap}
                                                disabled={roadmapSaving}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {roadmapSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                {roadmapSaving ? 'Saving...' : 'Save Roadmap'}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleStartRoadmapEditing}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-blue-200 text-blue-700 bg-white hover:bg-blue-50"
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
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />

                                            <textarea
                                                value={phase.objective}
                                                onChange={(event) => handleRoadmapFieldChange(index, 'objective', event.target.value)}
                                                placeholder="Objective"
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                            />

                                            <div className="grid sm:grid-cols-3 gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={phase.startWeek}
                                                    onChange={(event) => handleRoadmapFieldChange(index, 'startWeek', event.target.value)}
                                                    placeholder="Start week"
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={phase.endWeek}
                                                    onChange={(event) => handleRoadmapFieldChange(index, 'endWeek', event.target.value)}
                                                    placeholder="End week"
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={phase.durationWeeks}
                                                    onChange={(event) => handleRoadmapFieldChange(index, 'durationWeeks', event.target.value)}
                                                    placeholder="Duration weeks"
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <input
                                                type="text"
                                                value={phase.deliverables}
                                                onChange={(event) => handleRoadmapFieldChange(index, 'deliverables', event.target.value)}
                                                placeholder="Deliverables (comma separated)"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />

                                            <input
                                                type="text"
                                                value={phase.owners}
                                                onChange={(event) => handleRoadmapFieldChange(index, 'owners', event.target.value)}
                                                placeholder="Owners (comma separated)"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAddRoadmapPhase}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-blue-200 text-blue-700 bg-white hover:bg-blue-50"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Phase
                                    </button>
                                    <span className="text-xs text-gray-500">
                                        Any owner or team member can edit this roadmap.
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
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 w-fit"
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
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSaveSourceCode}
                                        disabled={sourceCodeSaving}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {sourceCodeSaving ? 'Saving...' : 'Save Link'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSourceCodeDraft('')}
                                        disabled={sourceCodeSaving}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
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
                            </div>
                        ) : null}
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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

                        {project.isOwner ? (
                            <div className="space-y-3">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={progressDraft}
                                    onChange={(event) => setProgressDraft(Number(event.target.value))}
                                    className="w-full accent-blue-600"
                                />
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">Set to {Math.round(progressDraft)}%</div>
                                    <button
                                        type="button"
                                        onClick={handleSaveProgress}
                                        disabled={progressSaving}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {progressSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                                {progressError ? (
                                    <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                                        {progressError}
                                    </div>
                                ) : null}
                                {progressSuccess ? (
                                    <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-md p-2">
                                        {progressSuccess}
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="text-xs text-gray-500">
                                Only the project owner can edit progress.
                            </div>
                        )}
                    </div>

                    {project.isOwner ? (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
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
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
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
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">Post Open Role</h3>
                            <form className="space-y-3" onSubmit={handlePostRole}>
                                <input
                                    type="text"
                                    value={newRole.title}
                                    onChange={(event) => setNewRole((prev) => ({ ...prev, title: event.target.value }))}
                                    placeholder="Role title (e.g., UI/UX Designer)"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="text"
                                    value={newRole.skills}
                                    onChange={(event) => setNewRole((prev) => ({ ...prev, skills: event.target.value }))}
                                    placeholder="Skills (comma separated)"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        value={newRole.spots}
                                        onChange={(event) => setNewRole((prev) => ({ ...prev, spots: Number(event.target.value) || 1 }))}
                                        placeholder="Spots"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        value={newRole.durationHours}
                                        onChange={(event) => setNewRole((prev) => ({ ...prev, durationHours: event.target.value }))}
                                        placeholder="Urgency hours (optional)"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full bg-gray-900 text-white text-sm font-semibold py-2 rounded-lg hover:bg-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {postingRole ? 'Posting...' : 'Post Role'}
                                </button>
                            </form>
                        </div>
                    ) : null}

                    {project.isOwner ? (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {inviting ? 'Sending Invite...' : 'Send Invite'}
                                </button>
                            </form>
                        </div>
                    ) : null}

                    <TeamGrid members={project.team} />

                    {/* Quick Links / Resources Placeholder */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
