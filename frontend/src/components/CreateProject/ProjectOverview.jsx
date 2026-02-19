import React from 'react';

const ProjectOverview = ({ formData, updateFormData }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Project Overview</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateFormData('title', e.target.value)}
                        placeholder="e.g. EcoTrack SaaS Platform"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                        value={formData.category}
                        onChange={(e) => updateFormData('category', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                    >
                        <option value="">Select a category</option>
                        <option value="saas">SaaS</option>
                        <option value="hackathon">Hackathon</option>
                        <option value="mobile">Mobile App</option>
                        <option value="web3">Web3 / Blockchain</option>
                        <option value="ai">AI / ML</option>
                        <option value="ecommerce">E-commerce</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        rows={5}
                        value={formData.description}
                        onChange={(e) => updateFormData('description', e.target.value)}
                        placeholder="Describe your project, its goals, and what you're building..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source Code URL</label>
                    <input
                        type="url"
                        value={formData.sourceCodeUrl || ''}
                        onChange={(e) => updateFormData('sourceCodeUrl', e.target.value)}
                        placeholder="https://github.com/username/repository"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Optional. Add your GitHub/GitLab/Bitbucket repo link.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProjectOverview;
