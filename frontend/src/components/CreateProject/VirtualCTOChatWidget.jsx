import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    BarChart3,
    Bot,
    CalendarDays,
    ChevronDown,
    Layers3,
    Loader2,
    MessageSquareText,
    Send,
    Sparkles,
    UserRound,
    Users2,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import TeammateDetailsModal from '../FindTeammates/TeammateDetailsModal';

const STARTER_PROMPTS = [
    'A mobile app to help people find gym buddies nearby',
    'A SaaS dashboard for small businesses to track sales',
    'A marketplace for students to find project teammates'
];

function formatRoleSkills(role) {
    const skills = Array.isArray(role?.skills)
        ? role.skills
        : String(role?.skills || '')
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean);
    return skills.join(', ');
}

function getInitials(value) {
    const text = String(value || '').trim();
    if (!text) return 'U';
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }
    return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
}

function toPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return `${(numeric * 100).toFixed(1)}%`;
}

function formatDateRange(startDate, endDate) {
    const start = String(startDate || '').trim();
    const end = String(endDate || '').trim();

    if (start && end) return `${start} to ${end}`;
    if (start) return `Starts ${start}`;
    if (end) return `Target ${end}`;
    return 'Timeline flexible';
}

function toProjectPayloadFromPlan(plan = {}) {
    const roles = (Array.isArray(plan?.roles) ? plan.roles : []).map((role) => ({
        title: String(role?.title || '').trim(),
        skills: Array.isArray(role?.skills)
            ? role.skills.map((skill) => String(skill || '').trim()).filter(Boolean)
            : String(role?.skills || '')
                .split(',')
                .map((skill) => skill.trim())
                .filter(Boolean),
        spots: Number(role?.spots) > 0 ? Number(role.spots) : 1,
        durationHours: Number(role?.durationHours) > 0 ? Number(role.durationHours) : null,
    })).filter((role) => role.title && role.skills.length > 0);

    const roadmap = (Array.isArray(plan?.roadmap) ? plan.roadmap : []).map((phase, index) => ({
        phase: String(phase?.phase || `phase_${index + 1}`),
        title: String(phase?.title || `Phase ${index + 1}`),
        objective: String(phase?.objective || ''),
        startWeek: Number(phase?.startWeek) > 0 ? Number(phase.startWeek) : null,
        endWeek: Number(phase?.endWeek) > 0 ? Number(phase.endWeek) : null,
        durationWeeks: Number(phase?.durationWeeks) > 0 ? Number(phase.durationWeeks) : null,
        deliverables: Array.isArray(phase?.deliverables) ? phase.deliverables : [],
        owners: Array.isArray(phase?.owners) ? phase.owners : [],
    }));

    return {
        title: String(plan?.title || '').trim(),
        description: String(plan?.description || '').trim(),
        category: String(plan?.category || '').trim(),
        commitment: String(plan?.commitment || '').trim(),
        startDate: String(plan?.startDate || '').trim() || null,
        endDate: String(plan?.endDate || '').trim() || null,
        roles,
        roadmap,
    };
}

const VirtualCTOChatWidget = ({ onArchitectIdea }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [liveStatus, setLiveStatus] = useState('Architecting your project...');
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'assistant',
            text: 'I am your Virtual CTO. Describe what you want to build, and I will create a full project plan and auto-fill your form.',
        },
    ]);
    const [selectedTeammate, setSelectedTeammate] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking, isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

    const canSend = useMemo(() => {
        return !isThinking && String(input || '').trim().length > 0;
    }, [input, isThinking]);

    const appendMessage = (message) => {
        setMessages((prev) => [...prev, message]);
    };

    const updateMessageById = (messageId, updater) => {
        setMessages((prev) =>
            prev.map((message) =>
                message.id === messageId ? updater(message) : message
            )
        );
    };

    const handleCreateProjectFromPlan = async (messageId) => {
        const targetMessage = messages.find((message) => message.id === messageId);
        const plan = targetMessage?.plan || null;
        if (!plan) return;

        const token = localStorage.getItem('authToken');
        if (!token) {
            updateMessageById(messageId, (message) => ({
                ...message,
                action: {
                    ...(message.action || {}),
                    createError: 'Login required to create project.',
                },
            }));
            return;
        }

        const payload = toProjectPayloadFromPlan(plan);
        if (!payload.title || !payload.description || !Array.isArray(payload.roles) || payload.roles.length === 0) {
            updateMessageById(messageId, (message) => ({
                ...message,
                action: {
                    ...(message.action || {}),
                    createError: 'Plan is incomplete. Generate again with more details.',
                },
            }));
            return;
        }

        updateMessageById(messageId, (message) => ({
            ...message,
            action: {
                ...(message.action || {}),
                creatingProject: true,
                createError: '',
                createSuccess: '',
            },
        }));

        try {
            const response = await fetch(`${API_BASE_URL}/api/project`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create project from plan');
            }

            const projectId = String(data?.project?.id || '');
            updateMessageById(messageId, (message) => ({
                ...message,
                action: {
                    ...(message.action || {}),
                    creatingProject: false,
                    createdProjectId: projectId,
                    createSuccess: 'Project created. You can invite teammates now.',
                    createError: '',
                },
            }));
        } catch (error) {
            updateMessageById(messageId, (message) => ({
                ...message,
                action: {
                    ...(message.action || {}),
                    creatingProject: false,
                    createError: error?.message || 'Failed to create project',
                },
            }));
        }
    };

    const handleInviteTeammate = async (messageId, teammate) => {
        const teammateId = String(teammate?._id || teammate?.id || '').trim();
        if (!teammateId) return;

        const targetMessage = messages.find((message) => message.id === messageId);
        const projectId = String(targetMessage?.action?.createdProjectId || '').trim();
        if (!projectId) return;

        const token = localStorage.getItem('authToken');
        if (!token) return;

        const inviteRole = String(teammate?.role || 'Contributor').trim() || 'Contributor';
        updateMessageById(messageId, (message) => ({
            ...message,
            action: {
                ...(message.action || {}),
                invites: {
                    ...(message.action?.invites || {}),
                    [teammateId]: {
                        loading: true,
                        error: '',
                        success: '',
                    },
                },
            },
        }));

        try {
            const response = await fetch(`${API_BASE_URL}/api/project/${projectId}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: teammateId,
                    role: inviteRole,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invite');
            }

            updateMessageById(messageId, (message) => ({
                ...message,
                action: {
                    ...(message.action || {}),
                    invites: {
                        ...(message.action?.invites || {}),
                        [teammateId]: {
                            loading: false,
                            error: '',
                            success: 'Invite sent',
                        },
                    },
                },
            }));
        } catch (error) {
            updateMessageById(messageId, (message) => ({
                ...message,
                action: {
                    ...(message.action || {}),
                    invites: {
                        ...(message.action?.invites || {}),
                        [teammateId]: {
                            loading: false,
                            error: error?.message || 'Failed to invite',
                            success: '',
                        },
                    },
                },
            }));
        }
    };

    const handleSend = async (event) => {
        event.preventDefault();
        const idea = String(input || '').trim();
        if (!idea || isThinking) return;

        appendMessage({
            id: Date.now(),
            role: 'user',
            text: idea,
        });
        setInput('');
        setIsThinking(true);

        try {
            const result = await onArchitectIdea(idea, (chunk) => {
                if (chunk?.type === 'status' && chunk?.message) {
                    setLiveStatus(chunk.message);
                }
            });
            const plan = result?.plan || null;
            const teammates = Array.isArray(result?.teammates) ? result.teammates : [];
            const teammateSuggestions = Array.isArray(result?.teammateSuggestions)
                ? result.teammateSuggestions
                : [];
            const ecosystemInsights = result?.ecosystemInsights || null;
            const meta = result?.meta || null;
            const applied = Boolean(result?.applied);
            const overwriteCancelled = result?.reason === 'overwrite_cancelled';

            let replyText = 'Blueprint is ready.';
            if (applied) {
                replyText = 'Blueprint is ready and your form has been auto-filled. You can edit everything before launching.';
            } else if (overwriteCancelled) {
                replyText = 'Blueprint is ready, but I did not overwrite your existing draft.';
            }

            appendMessage({
                id: Date.now() + 1,
                role: 'assistant',
                text: replyText,
                plan,
                teammates,
                teammateSuggestions,
                ecosystemInsights,
                meta,
                action: {
                    creatingProject: false,
                    createdProjectId: '',
                    createSuccess: '',
                    createError: '',
                    invites: {},
                },
            });
        } catch (error) {
            appendMessage({
                id: Date.now() + 2,
                role: 'assistant',
                text: error?.message || 'I could not generate a plan right now. Please try again.',
                isError: true,
            });
        } finally {
            setIsThinking(false);
            setLiveStatus('Architecting your project...');
        }
    };

    const handleComposerKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (canSend) {
                event.currentTarget.form?.requestSubmit();
            }
        }
    };

    const handleStarterPrompt = (prompt) => {
        setIsOpen(true);
        setInput(prompt);
    };

    return (
        <>
            {isOpen ? (
                <button
                    type="button"
                    aria-label="Close Virtual CTO panel"
                    className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]"
                    onClick={() => setIsOpen(false)}
                />
            ) : null}

            <div className={`fixed z-50 ${isOpen
                ? 'inset-x-2 top-2 bottom-2 sm:inset-auto sm:bottom-5 sm:right-5'
                : 'bottom-4 right-4 sm:bottom-5 sm:right-5'
                }`}>
            {!isOpen ? (
                <div className="flex flex-col items-end gap-2">
                    <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm text-[11px] text-slate-600">
                        <Sparkles size={12} className="text-blue-600" />
                        AI project architect
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        aria-label="Open Virtual CTO"
                        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[linear-gradient(120deg,#1d4ed8_0%,#0f766e_100%)] text-white shadow-[0_16px_36px_-18px_rgba(8,47,73,0.55)] hover:brightness-105 transition-all"
                    >
                        <span className="absolute -top-1.5 -right-1.5 text-[10px] font-semibold bg-emerald-300 text-emerald-950 px-1.5 py-0.5 rounded-full border border-emerald-100">
                            LIVE
                        </span>
                        <span className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                            <MessageSquareText size={16} />
                        </span>
                        <div className="text-left">
                            <div className="text-sm font-semibold leading-tight">Virtual CTO</div>
                            <div className="text-[11px] text-blue-50 leading-tight">Architect my project</div>
                        </div>
                    </button>
                </div>
            ) : (
                <div className="h-full w-full bg-white/96 border border-slate-200/90 rounded-[1.25rem] sm:rounded-3xl shadow-[0_28px_58px_-24px_rgba(15,23,42,0.5)] flex flex-col overflow-hidden backdrop-blur-xl sm:w-[430px] sm:max-w-[calc(100vw-2rem)] sm:h-[min(84vh,700px)]">
                    <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-[linear-gradient(120deg,#0f172a_0%,#1e40af_56%,#0891b2_100%)] text-white flex items-center justify-between border-b border-white/15">
                        <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
                                <Bot size={17} />
                            </span>
                            <div>
                                <div className="text-sm font-semibold leading-tight">Virtual CTO</div>
                                <div className="text-[11px] text-blue-100/95 leading-tight">
                                    One sentence to complete project plan
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-400/18 text-emerald-100 text-[10px] border border-emerald-200/35">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
                                AI Online
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                aria-label="Collapse Virtual CTO panel"
                                className="w-8 h-8 rounded-lg border border-white/20 text-blue-100 hover:text-white hover:bg-white/15 transition-colors flex items-center justify-center"
                            >
                                <ChevronDown size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="px-4 sm:px-5 py-2.5 border-b border-slate-200 bg-gradient-to-r from-sky-50/70 to-indigo-50/50">
                        <div className="text-[11px] text-slate-600">
                            Describe your idea. I will generate title, pitch, stack, hiring roles, and teammate recommendations.
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 bg-[radial-gradient(circle_at_100%_0%,rgba(219,234,254,0.5),transparent_42%),radial-gradient(circle_at_0%_100%,rgba(207,250,254,0.36),transparent_46%),linear-gradient(180deg,#f8fbff_0%,#ffffff_45%)]">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-2 sm:gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {message.role !== 'user' ? (
                                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                                        <Bot size={14} />
                                    </span>
                                ) : null}

                                <div
                                    className={`max-w-[91%] sm:max-w-[84%] rounded-2xl px-3 sm:px-3.5 py-2.5 text-[13px] sm:text-sm ${message.role === 'user'
                                        ? 'bg-[linear-gradient(120deg,#2563eb_0%,#0ea5e9_100%)] text-white shadow-[0_14px_24px_-16px_rgba(37,99,235,0.95)]'
                                        : message.isError
                                            ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                                            : 'bg-white/96 text-slate-800 border border-slate-200 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.45)]'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{message.text}</p>

                                    {message.plan ? (
                                        <div className="mt-3 rounded-xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-2.5 sm:p-3 space-y-2.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="text-xs font-semibold text-slate-900">
                                                    {message.plan.title}
                                                </div>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap">
                                                    {message.plan.categoryLabel || message.plan.category}
                                                </span>
                                            </div>

                                            {message.plan.summary ? (
                                                <p className="text-[11px] text-slate-600">{message.plan.summary}</p>
                                            ) : null}

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-700">
                                                    <div className="inline-flex items-center gap-1">
                                                        <Layers3 size={11} className="text-blue-600" />
                                                        Roles
                                                    </div>
                                                    <div className="font-semibold text-slate-900 text-[11px] sm:text-[12px]">
                                                        {(message.plan.roles || []).length}
                                                    </div>
                                                </div>
                                                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-700">
                                                    <div className="inline-flex items-center gap-1">
                                                        <BarChart3 size={11} className="text-blue-600" />
                                                        Skills
                                                    </div>
                                                    <div className="font-semibold text-slate-900 text-[11px] sm:text-[12px]">
                                                        {(message.plan.requiredSkills || []).length}
                                                    </div>
                                                </div>
                                                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-700">
                                                    <div className="inline-flex items-center gap-1">
                                                        <Users2 size={11} className="text-blue-600" />
                                                        Candidates
                                                    </div>
                                                    <div className="font-semibold text-slate-900 text-[11px] sm:text-[12px]">
                                                        {(message.teammates || []).length}
                                                    </div>
                                                </div>
                                                <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-700">
                                                    <div className="inline-flex items-center gap-1">
                                                        <Zap size={11} className="text-blue-600" />
                                                        Speed
                                                    </div>
                                                    <div className="font-semibold text-slate-900 text-[11px] sm:text-[12px]">
                                                        {message.meta?.generatedInMs ? `${message.meta.generatedInMs}ms` : 'n/a'}
                                                    </div>
                                                </div>
                                            </div>

                                            {message.meta ? (
                                                <div className="text-[10px] text-slate-500">
                                                    Mode: {message.meta.generationMode || 'heuristic'}
                                                    {message.meta.cached ? ' | cached result' : ''}
                                                </div>
                                            ) : null}

                                            <div className="flex flex-wrap items-center gap-2">
                                                {message.action?.createdProjectId ? (
                                                    <Link
                                                        to={`/project/${message.action.createdProjectId}`}
                                                        className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                                    >
                                                        View Created Project
                                                    </Link>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCreateProjectFromPlan(message.id)}
                                                        disabled={Boolean(message.action?.creatingProject)}
                                                        className="text-[11px] px-2.5 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        {message.action?.creatingProject ? 'Creating Project...' : 'Create Project'}
                                                    </button>
                                                )}
                                                <span className="text-[10px] text-slate-500">
                                                    Create project first to enable teammate invites.
                                                </span>
                                            </div>
                                            {message.action?.createError ? (
                                                <div className="text-[10px] text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1">
                                                    {message.action.createError}
                                                </div>
                                            ) : null}
                                            {message.action?.createSuccess ? (
                                                <div className="text-[10px] text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1">
                                                    {message.action.createSuccess}
                                                </div>
                                            ) : null}

                                            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1">
                                                <CalendarDays size={12} className="text-blue-600" />
                                                {formatDateRange(message.plan.startDate, message.plan.endDate)}
                                            </div>

                                            <details className="group">
                                                <summary className="cursor-pointer text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide list-none">
                                                    <span className="group-open:hidden">Show Recommended Stack</span>
                                                    <span className="hidden group-open:inline">Hide Recommended Stack</span>
                                                </summary>
                                                <div className="text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                                                    Recommended Stack
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {(message.plan.techStack || []).map((item) => (
                                                        <span
                                                            key={item}
                                                            className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200"
                                                        >
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </details>

                                            <details className="group" open>
                                                <summary className="cursor-pointer text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide list-none">
                                                    <span className="group-open:hidden">Show Hiring Plan</span>
                                                    <span className="hidden group-open:inline">Hide Hiring Plan</span>
                                                </summary>
                                                <div className="text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                                                    Hiring Plan
                                                </div>
                                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                                    {(message.plan.roles || []).map((role, index) => (
                                                        <div
                                                            key={`${role.title}-${index}`}
                                                            className="text-[11px] rounded-lg border border-slate-200 bg-white px-2 py-1.5"
                                                        >
                                                            <div className="font-semibold text-slate-800">{role.title}</div>
                                                            <div className="text-slate-600">{formatRoleSkills(role)}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>

                                            {Array.isArray(message.plan.skillCards) && message.plan.skillCards.length > 0 ? (
                                                <details className="group">
                                                    <summary className="cursor-pointer text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide list-none">
                                                        <span className="group-open:hidden">Show Skill Cards</span>
                                                        <span className="hidden group-open:inline">Hide Skill Cards</span>
                                                    </summary>
                                                    <div className="text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                                                        Skill Cards
                                                    </div>
                                                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                                        {message.plan.skillCards.slice(0, 8).map((card, index) => (
                                                            <div
                                                                key={`${card.skill}-${index}`}
                                                                className="text-[11px] rounded-lg border border-slate-200 bg-white px-2 py-1.5"
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="font-semibold text-slate-800">{card.skill}</span>
                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md border ${card.priority === 'high'
                                                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        }`}>
                                                                        {card.priority}
                                                                    </span>
                                                                </div>
                                                                <div className="text-slate-600">{card.whyItMatters}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            ) : null}

                                            {Array.isArray(message.plan.roadmap) && message.plan.roadmap.length > 0 ? (
                                                <details className="group">
                                                    <summary className="cursor-pointer text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide list-none">
                                                        <span className="group-open:hidden">Show Roadmap</span>
                                                        <span className="hidden group-open:inline">Hide Roadmap</span>
                                                    </summary>
                                                    <div className="text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                                                        Roadmap
                                                    </div>
                                                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                                        {message.plan.roadmap.map((phase) => (
                                                            <div
                                                                key={phase.phase}
                                                                className="text-[11px] rounded-lg border border-slate-200 bg-white px-2 py-1.5"
                                                            >
                                                                <div className="font-semibold text-slate-800">
                                                                    W{phase.startWeek}-W{phase.endWeek}: {phase.title}
                                                                </div>
                                                                <div className="text-slate-600">{phase.objective}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            ) : null}

                                            {message.ecosystemInsights ? (
                                                <div>
                                                    <div className="text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                                                        Ecosystem Signals
                                                    </div>
                                                    <div className="text-[11px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700">
                                                        Community size: {message.ecosystemInsights.activeCommunitySize || 0}
                                                        {Array.isArray(message.ecosystemInsights.topProjectCategories) &&
                                                        message.ecosystemInsights.topProjectCategories.length > 0 ? (
                                                            <div className="text-slate-600">
                                                                Top categories: {message.ecosystemInsights.topProjectCategories
                                                                    .slice(0, 3)
                                                                    .map((item) => item.category)
                                                                    .join(', ')}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}

                                    {Array.isArray(message.teammates) && message.teammates.length > 0 ? (
                                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-2">
                                            <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                                                Recommended Teammates
                                            </div>
                                            {message.teammates.slice(0, 4).map((teammate, index) => {
                                                const teammateId = teammate._id || teammate.id || '';
                                                const teammateName = teammate.name || teammate.email || 'Teammate';
                                                const inviteState = message.action?.invites?.[String(teammateId || '')] || {};
                                                const canInvite = Boolean(message.action?.createdProjectId && teammateId);
                                                const content = (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-semibold flex items-center justify-center shrink-0">
                                                            {getInitials(teammateName)}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="text-[11px] font-semibold text-slate-900 truncate">
                                                                {teammateName}
                                                            </div>
                                                            <div className="text-[10px] text-slate-600 truncate">
                                                                {teammate.role || 'Member'}
                                                            </div>
                                                            {Array.isArray(teammate.matchedSkills) && teammate.matchedSkills.length > 0 ? (
                                                                <div className="text-[10px] text-slate-500 truncate">
                                                                    Skills: {teammate.matchedSkills.slice(0, 3).join(', ')}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        {(typeof teammate.matchScore === 'number' || typeof teammate.semanticScore === 'number') ? (
                                                            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                                                {toPercent(typeof teammate.matchScore === 'number' ? teammate.matchScore : teammate.semanticScore)}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                );

                                                return (
                                                    <div
                                                        key={teammateId || `${teammate.email || teammate.name || 'teammate'}-${index}`}
                                                        className={`rounded-lg border border-slate-200 bg-white px-2 py-1.5 ${
                                                            teammateId ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''
                                                        }`}
                                                        role={teammateId ? 'button' : undefined}
                                                        tabIndex={teammateId ? 0 : undefined}
                                                        onClick={() => {
                                                            if (!teammateId) return;
                                                            setSelectedTeammate({
                                                                ...teammate,
                                                                _id: teammate._id || teammate.id,
                                                                id: teammate.id || teammate._id,
                                                            });
                                                        }}
                                                        onKeyDown={(event) => {
                                                            if (!teammateId) return;
                                                            if (event.key === 'Enter' || event.key === ' ') {
                                                                event.preventDefault();
                                                                setSelectedTeammate({
                                                                    ...teammate,
                                                                    _id: teammate._id || teammate.id,
                                                                    id: teammate.id || teammate._id,
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        {content}
                                                        <div className="mt-1.5 flex items-center justify-between gap-2">
                                                            {teammateId ? (
                                                                <Link
                                                                    to={`/user/${teammateId}`}
                                                                    onClick={(event) => event.stopPropagation()}
                                                                    className="text-[10px] text-blue-700 hover:underline"
                                                                >
                                                                    View Profile
                                                                </Link>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-500">Profile unavailable</span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    handleInviteTeammate(message.id, teammate);
                                                                }}
                                                                disabled={!canInvite || Boolean(inviteState?.loading)}
                                                                className="text-[10px] px-2 py-1 rounded-md bg-slate-900 text-white hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {inviteState?.loading ? 'Inviting...' : 'Invite'}
                                                            </button>
                                                        </div>
                                                        {inviteState?.error ? (
                                                            <div className="mt-1 text-[10px] text-red-700">{inviteState.error}</div>
                                                        ) : null}
                                                        {inviteState?.success ? (
                                                            <div className="mt-1 text-[10px] text-green-700">{inviteState.success}</div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : null}

                                    {Array.isArray(message.teammateSuggestions) && message.teammateSuggestions.length > 0 ? (
                                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-2">
                                            <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                                                Suggested Candidate Pairs
                                            </div>
                                            {message.teammateSuggestions.slice(0, 3).map((suggestion, index) => (
                                                <div
                                                    key={`pair-${index}`}
                                                    className="text-[11px] rounded-lg border border-slate-200 bg-white px-2 py-1.5"
                                                >
                                                    <div className="font-semibold text-slate-800">
                                                        {(suggestion.pair || []).map((member) => member?.name).filter(Boolean).join(' + ')}
                                                    </div>
                                                    <div className="text-slate-600">{suggestion.recommendation}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                {message.role === 'user' ? (
                                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                                        <UserRound size={14} />
                                    </span>
                                ) : null}
                            </div>
                        ))}

                        {isThinking ? (
                            <div className="flex justify-start gap-2 sm:gap-2.5">
                                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                                    <Bot size={14} />
                                </span>
                                <div className="max-w-[91%] sm:max-w-[84%] rounded-2xl px-3 sm:px-3.5 py-2.5 text-[13px] sm:text-sm bg-white/96 text-slate-700 border border-slate-200 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.45)]">
                                    <div className="inline-flex items-center gap-1.5">
                                        <Loader2 size={13} className="animate-spin text-blue-600" />
                                        <span>{liveStatus}</span>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        <div ref={scrollRef} />
                    </div>

                    <div className="p-3 sm:p-4 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50/70">
                        <form onSubmit={handleSend}>
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                                    What do you want to build?
                                </label>
                                <span className="text-[10px] text-slate-500">
                                    {String(input || '').trim().length} chars
                                </span>
                            </div>
                            <div className="mt-1.5 flex items-end gap-2">
                                <textarea
                                    rows={2}
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    onKeyDown={handleComposerKeyDown}
                                    placeholder="Example: An app that matches people with weekend hackathon teammates"
                                    className="flex-1 min-h-[44px] max-h-36 px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                                    disabled={isThinking}
                                />
                                <button
                                    type="submit"
                                    disabled={!canSend}
                                    className="h-[44px] min-w-[44px] px-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                                >
                                    {isThinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    <span className="hidden sm:inline text-xs font-semibold">Send</span>
                                </button>
                            </div>
                        </form>

                        <div className="mt-2.5">
                            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                Try a starter idea
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto pb-1 pr-1">
                                {STARTER_PROMPTS.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => handleStarterPrompt(prompt)}
                                        disabled={isThinking}
                                        className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-colors disabled:opacity-60"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
            <TeammateDetailsModal
                user={selectedTeammate}
                onClose={() => setSelectedTeammate(null)}
            />
        </>
    );
};

export default VirtualCTOChatWidget;
