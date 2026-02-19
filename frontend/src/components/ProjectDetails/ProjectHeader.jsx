import React from 'react';
import { BadgeCheck, Calendar, Globe, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectHeader = ({ project }) => {
    const navigate = useNavigate();
    const projectStatus = project.status || 'In Progress';

    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${projectStatus === 'Recruiting' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {projectStatus}
                        </span>
                    </div>
                    <p className="text-lg text-gray-600 max-w-2xl">{project.shortDescription || project.fullDescription}</p>
                </div>
                <button
                    onClick={() => navigate(`/chat?projectId=${encodeURIComponent(project.id)}`)}
                    className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium">
                    <MessageCircle size={18} className="mr-2" />
                    Discuss Project
                </button>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-gray-500 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2">
                    <Globe size={16} />
                    <span>{project.category || 'General'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Started {project.startDate || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <BadgeCheck size={16} className="text-blue-500" />
                    <span>Verified Project</span>
                </div>
            </div>
        </div>
    );
};

export default ProjectHeader;
