import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const ProjectOverview = ({
    formData,
    updateFormData,
    onAutoImproveDescription,
    improvingDescription,
    improveDescriptionError,
    onDescriptionInput,
}) => {
    return (
        <div className="surface-card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Project Overview</h2>

            <div className="space-y-4">
                <div>
                    <label className="form-label">Project Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateFormData('title', e.target.value)}
                        placeholder="e.g. EcoTrack SaaS Platform"
                        className="field-input"
                    />
                </div>

                <div>
                    <label className="form-label">Category</label>
                    <select
                        value={formData.category}
                        onChange={(e) => updateFormData('category', e.target.value)}
                        className="field-select"
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
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="form-label mb-0">Description</label>
                        <button
                            type="button"
                            onClick={onAutoImproveDescription}
                            disabled={improvingDescription}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {improvingDescription ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Improving...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Auto Improve
                                </>
                            )}
                        </button>
                    </div>
                    <textarea
                        rows={5}
                        value={formData.description}
                        onChange={(e) => {
                            updateFormData('description', e.target.value);
                            if (typeof onDescriptionInput === 'function') onDescriptionInput();
                        }}
                        placeholder="Describe your project, its goals, and what you're building..."
                        className="field-textarea resize-none"
                    />
                    {improveDescriptionError ? (
                        <p className="mt-2 text-xs text-red-600">{improveDescriptionError}</p>
                    ) : (
                        <p className="mt-2 text-xs text-gray-500">
                            Auto Improve rewrites your draft into a clearer, professional description.
                        </p>
                    )}
                </div>

                <div>
                    <label className="form-label">Source Code URL</label>
                    <input
                        type="url"
                        value={formData.sourceCodeUrl || ''}
                        onChange={(e) => updateFormData('sourceCodeUrl', e.target.value)}
                        placeholder="https://github.com/username/repository"
                        className="field-input"
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
