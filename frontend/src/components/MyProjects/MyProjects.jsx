import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Loader2, Plus, Sparkles, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProjectCard from './ProjectCard';
import ConfirmModal from '../common/ConfirmModal';
import { API_BASE_URL } from '../../config/api';

const MyProjects = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('active');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();

    const tabs = [
        { id: 'active', label: 'Active Projects' },
        { id: 'pending', label: 'Pending' },
        { id: 'completed', label: 'Completed' },
    ];

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/api/project/my`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch projects');
                }

                setProjects(Array.isArray(data.projects) ? data.projects : []);
            } catch (fetchError) {
                setError(fetchError.message || 'Failed to fetch projects');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const tabCounts = useMemo(
        () =>
            projects.reduce(
                (accumulator, project) => {
                    const type = String(project.type || '').toLowerCase();
                    if (type in accumulator) {
                        accumulator[type] += 1;
                    }
                    return accumulator;
                },
                { active: 0, pending: 0, completed: 0 }
            ),
        [projects]
    );

    const filteredProjects = projects.filter((project) => {
        const matchesTab = project.type === activeTab;
        if (!matchesTab) return false;
        if (!searchQuery) return true;

        const searchableContent = [
            project.title,
            project.description,
            project.category,
            project.status,
            ...(Array.isArray(project.skillsRequired) ? project.skillsRequired : []),
            ...(Array.isArray(project.techStack) ? project.techStack : []),
        ]
            .map((item) => String(item || '').toLowerCase())
            .join(' ');

        return searchableContent.includes(searchQuery);
    });

    const handleDeleteProject = (projectId) => {
        setProjectToDelete(projectId);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!projectToDelete) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/${projectToDelete}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete project');
            }

            setProjects((prev) => prev.filter((project) => project.id !== projectToDelete));
            setDeleteModalOpen(false);
            setProjectToDelete(null);
        } catch (deleteError) {
            console.error('Delete error:', deleteError);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl 2xl:max-w-screen-2xl space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(120deg,#0f172a_0%,#1e293b_56%,#075985_130%)] px-5 py-6 text-white shadow-[0_24px_56px_-38px_rgba(15,23,42,0.9)] sm:px-7 sm:py-8">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
                <div className="absolute -bottom-24 left-16 h-56 w-56 rounded-full bg-blue-400/25 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100">
                            <Sparkles size={13} />
                            Project Workspace
                        </p>
                        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">My Projects</h1>
                        <p className="mt-2 text-sm text-slate-200 sm:text-base">
                            Manage timelines, monitor progress, and keep your collaboration pipeline moving.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                                {tabCounts.active} active
                            </span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                                {tabCounts.pending} pending
                            </span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                                {tabCounts.completed} completed
                            </span>
                            {searchQuery ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200/40 bg-cyan-300/15 px-3 py-1.5 text-cyan-100">
                                    <Search size={12} />
                                    Filtered by &quot;{searchQuery}&quot;
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/create-project')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                        <Plus size={18} />
                        New Project
                    </button>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                activeTab === tab.id
                                    ? 'text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeProjectTab"
                                    className="absolute inset-0 rounded-xl border border-slate-200 bg-white shadow-sm"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.55 }}
                                />
                            )}
                            <span className="relative z-10">{tab.label}</span>
                            <span
                                className={`relative z-10 rounded-full px-2 py-0.5 text-xs ${
                                    activeTab === tab.id
                                        ? 'bg-slate-100 text-slate-700'
                                        : 'bg-slate-100/80 text-slate-500'
                                }`}
                            >
                                {tabCounts[tab.id]}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
            ) : null}

            {loading ? (
                <div className="flex min-h-[32vh] items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
                    Loading your projects...
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    <AnimatePresence mode="popLayout">
                        {filteredProjects.map((project) => (
                            <motion.div
                                key={project.id || project._id}
                                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                                transition={{ duration: 0.2 }}
                                layout
                            >
                                <ProjectCard project={project} onDelete={handleDeleteProject} />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredProjects.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/90 px-6 py-14 text-center"
                        >
                            <Folder size={46} className="mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-600">
                                {searchQuery
                                    ? 'No projects match your search query.'
                                    : 'No projects found in this category.'}
                            </p>
                        </motion.div>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Project?"
                message="Are you sure you want to delete this project? This action cannot be undone and all team data will be lost."
                confirmText="Delete Project"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default MyProjects;
