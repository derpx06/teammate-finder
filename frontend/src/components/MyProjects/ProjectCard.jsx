import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MoreVertical, ArrowRight, Eye, Trash2, Route, ExternalLink } from 'lucide-react';

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

    const getStatusColor = (status) => {
        switch (status) {
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'Review': return 'bg-yellow-100 text-yellow-700';
            case 'Completed': return 'bg-green-100 text-green-700';
            case 'Pending': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="surface-card rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all card-hover-lift group relative">
            <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${getStatusColor(project.status)}`}>
                    {project.status}
                </span>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
                        <MoreVertical size={16} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    navigate(`/project/${project.id}`);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Eye size={16} className="text-gray-500" />
                                View Details
                            </button>
                            {project.role === 'Owner' && (
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onDelete(project.id);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                >
                                    <Trash2 size={16} />
                                    Delete Project
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">{project.title}</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
                <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{project.teamSize} members</span>
                </div>
                <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>Due {project.dueDate}</span>
                </div>
                {Number(project.roadmapPhaseCount) > 0 ? (
                    <div className="flex items-center gap-1">
                        <Route size={14} />
                        <span>{Number(project.roadmapPhaseCount)} phases</span>
                    </div>
                ) : null}
            </div>

            <div className="mb-6">
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">Progress</span>
                    <span className="text-gray-500">{project.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${project.progress}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500">
                    My Role: <span className="text-blue-600">{project.role}</span>
                </span>
                <div className="flex items-center gap-3">
                    {project.sourceCodeUrl ? (
                        <a
                            href={project.sourceCodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
                        >
                            Source
                            <ExternalLink size={14} />
                        </a>
                    ) : null}
                    <button
                        onClick={() => navigate(`/project/${project.id}`)}
                        className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                        View Details
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
