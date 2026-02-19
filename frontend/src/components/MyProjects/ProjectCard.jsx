import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Users,
    MoreVertical,
    ArrowRight,
    Eye,
    Trash2,
    Route,
    ExternalLink,
    Layers,
} from 'lucide-react';

const STATUS_STYLES = {
    'In Progress': 'border-blue-200 bg-blue-50 text-blue-700',
    Review: 'border-amber-200 bg-amber-50 text-amber-700',
    Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Pending: 'border-orange-200 bg-orange-50 text-orange-700',
};

const SWATCHES = [
    'from-blue-600 to-cyan-500',
    'from-cyan-600 to-teal-500',
    'from-indigo-600 to-blue-500',
    'from-emerald-600 to-cyan-500',
];

const ProjectCard = ({ project, onDelete }) => {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const projectId = project.id || project._id;
    const status = String(project.status || 'Unknown');
    const statusClass = STATUS_STYLES[status] || 'border-slate-200 bg-slate-100 text-slate-600';
    const title = String(project.title || 'Untitled Project');
    const description = String(project.description || 'No project description available yet.');
    const role = String(project.role || 'Contributor');
    const teamSize = Number(project.teamSize) || 1;
    const dueDate = project.dueDate || 'TBD';
    const progress = Math.max(0, Math.min(100, Math.round(Number(project.progress) || 0)));
    const roadmapPhases = Number(project.roadmapPhaseCount) || 0;
    const chips = Array.isArray(project.techStack)
        ? project.techStack.slice(0, 3)
        : Array.isArray(project.skillsRequired)
          ? project.skillsRequired.slice(0, 3)
          : [];
    const swatch = SWATCHES[title.length % SWATCHES.length];

    return (
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="pointer-events-none absolute -right-14 -top-14 h-28 w-28 rounded-full bg-cyan-100/70 blur-2xl" />

            <div className="relative z-10">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}>
                        {status}
                    </span>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu((previous) => !previous)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-full z-20 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        if (projectId) {
                                            navigate(`/project/${projectId}`);
                                        }
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                >
                                    <Eye size={16} className="text-slate-500" />
                                    View Details
                                </button>

                                {role === 'Owner' && (
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            if (projectId) {
                                                onDelete(projectId);
                                            }
                                        }}
                                        className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                                    >
                                        <Trash2 size={16} />
                                        Delete Project
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-4 flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${swatch} text-sm font-bold text-white`}>
                        {title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-slate-900 sm:text-lg">{title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{description}</p>
                    </div>
                </div>

                {chips.length > 0 ? (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                        {chips.map((chip) => (
                            <span
                                key={`${projectId || title}-${chip}`}
                                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
                            >
                                {chip}
                            </span>
                        ))}
                    </div>
                ) : null}

                <div className="mb-5 grid grid-cols-2 gap-3 text-xs text-slate-500 sm:grid-cols-3">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                        <Users size={13} />
                        <span>{teamSize} members</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                        <Calendar size={13} />
                        <span>Due {dueDate}</span>
                    </div>
                    {roadmapPhases > 0 ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                            <Route size={13} />
                            <span>{roadmapPhases} phases</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                            <Layers size={13} />
                            <span>Roadmap TBD</span>
                        </div>
                    )}
                </div>

                <div className="mb-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Progress</span>
                        <span className="text-slate-500">{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-medium text-slate-500">
                        My Role:
                        {' '}
                        <span className="text-blue-700">{role}</span>
                    </span>

                    <div className="flex items-center gap-3">
                        {project.sourceCodeUrl ? (
                            <a
                                href={project.sourceCodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 transition hover:text-blue-800 sm:text-sm"
                            >
                                Source
                                <ExternalLink size={13} />
                            </a>
                        ) : null}

                        <button
                            onClick={() => projectId && navigate(`/project/${projectId}`)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 transition hover:text-blue-700 sm:text-sm"
                        >
                            View
                            <ArrowRight size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default ProjectCard;
