import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Loader2, Plus } from 'lucide-react';
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
        { id: 'completed', label: 'Completed' }
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

            setProjects(prev => prev.filter(p => p.id !== projectToDelete));
            setDeleteModalOpen(false);
            setProjectToDelete(null);
        } catch (err) {
            console.error('Delete error:', err);
            // Silently fail or use a toast notification if available in the future
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto page-shell">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Projects</h1>
                    <p className="page-subtitle">Manage and track all your collaborative work.</p>
                </div>
                <button
                    onClick={() => navigate('/create-project')}
                    className="btn-primary flex items-center justify-center px-4 py-2.5"
                >
                    <Plus size={20} className="mr-2" />
                    New Project
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/80 border border-slate-200 p-1 rounded-xl w-fit mb-8 shadow-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-white shadow-sm rounded-lg border border-slate-200"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            {error ? (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="py-20 flex items-center justify-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading your projects...
                </div>
            ) : (
                /* Grid */
                <div className="grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredProjects.map(project => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
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
                            className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200"
                        >
                            <Folder size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>
                                {searchQuery ? 'No projects match your search query.' : 'No projects found in this category.'}
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
