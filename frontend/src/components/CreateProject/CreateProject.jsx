import React, { useState } from 'react';
import ProjectOverview from './ProjectOverview';
import OpenRoles from './OpenRoles';
import ProjectTimeline from './ProjectTimeline';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import VirtualCTOChatWidget from './VirtualCTOChatWidget';

const CreateProject = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        sourceCodeUrl: '',
        roles: [],
        roadmap: [],
        startDate: '',
        endDate: '',
        commitment: ''
    });

    const updateFormData = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const isFormDirty = (currentFormData) => {
        return Boolean(
            String(currentFormData?.title || '').trim() ||
            String(currentFormData?.description || '').trim() ||
            String(currentFormData?.category || '').trim() ||
            String(currentFormData?.sourceCodeUrl || '').trim() ||
            String(currentFormData?.startDate || '').trim() ||
            String(currentFormData?.endDate || '').trim() ||
            String(currentFormData?.commitment || '').trim() ||
            (Array.isArray(currentFormData?.roles) && currentFormData.roles.length > 0) ||
            (Array.isArray(currentFormData?.roadmap) && currentFormData.roadmap.length > 0)
        );
    };

    const mapBlueprintRolesToForm = (roles = []) => {
        return (Array.isArray(roles) ? roles : []).map((role, index) => {
            const normalizedSkills = Array.isArray(role?.skills)
                ? role.skills.map((skill) => String(skill || '').trim()).filter(Boolean).join(', ')
                : String(role?.skills || '');

            return {
                id: Date.now() + index,
                title: String(role?.title || '').trim(),
                skills: normalizedSkills,
                spots: Number(role?.spots) > 0 ? Number(role.spots) : 1,
                durationHours: Number(role?.durationHours) > 0 ? Number(role.durationHours) : '',
            };
        }).filter((role) => role.title && role.skills);
    };

    const applyBlueprintToForm = (plan) => {
        const hasExistingData = isFormDirty(formData);
        if (hasExistingData) {
            const shouldOverwrite = window.confirm(
                "Warning: This will overwrite what you've already typed. Are you sure?"
            );
            if (!shouldOverwrite) {
                return { applied: false, reason: 'overwrite_cancelled' };
            }
        }

        setFormData({
            title: String(plan?.title || ''),
            description: String(plan?.description || ''),
            category: String(plan?.category || ''),
            sourceCodeUrl: '',
            roles: mapBlueprintRolesToForm(plan?.roles || []),
            roadmap: Array.isArray(plan?.roadmap)
                ? plan.roadmap.map((phase, index) => ({
                    phase: String(phase?.phase || `phase_${index + 1}`),
                    title: String(phase?.title || `Phase ${index + 1}`),
                    objective: String(phase?.objective || ''),
                    startWeek: Number(phase?.startWeek) || null,
                    endWeek: Number(phase?.endWeek) || null,
                    durationWeeks: Number(phase?.durationWeeks) || null,
                    deliverables: Array.isArray(phase?.deliverables) ? phase.deliverables : [],
                    owners: Array.isArray(phase?.owners) ? phase.owners : [],
                }))
                : [],
            startDate: String(plan?.startDate || ''),
            endDate: String(plan?.endDate || ''),
            commitment: String(plan?.commitment || ''),
        });

        return { applied: true };
    };

    const architectProjectIdea = async (idea, onChunk) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('You need to be logged in to use Virtual CTO');
        }

        const streamResponse = await fetch(`${API_BASE_URL}/api/project/virtual-cto/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ idea }),
        });

        if (!streamResponse.ok || !streamResponse.body) {
            const planResponse = await fetch(`${API_BASE_URL}/api/project/virtual-cto/plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ idea }),
            });
            const planData = await planResponse.json().catch(() => ({}));
            if (!planResponse.ok) {
                throw new Error(planData.error || 'Failed to generate project blueprint');
            }
            const fallbackPlan = planData.plan || {};
            const applyResult = applyBlueprintToForm(fallbackPlan);
            return {
                plan: fallbackPlan,
                teammates: Array.isArray(planData.candidates) ? planData.candidates : [],
                teammateSuggestions: Array.isArray(planData.teammateSuggestions) ? planData.teammateSuggestions : [],
                ecosystemInsights: planData.ecosystemInsights || null,
                meta: planData.meta || null,
                ...applyResult,
            };
        }

        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalPayload = null;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                let chunk = null;
                try {
                    chunk = JSON.parse(trimmed);
                } catch {
                    continue;
                }

                if (typeof onChunk === 'function') {
                    onChunk(chunk);
                }

                if (chunk.type === 'error') {
                    throw new Error(chunk.message || 'Virtual CTO stream failed');
                }

                if (chunk.type === 'done') {
                    finalPayload = chunk.data || null;
                }
            }
        }

        const planData = finalPayload || {};
        const plan = planData.plan || {};
        const applyResult = applyBlueprintToForm(plan);
        const teammates = Array.isArray(planData.candidates) ? planData.candidates : [];
        const teammateSuggestions = Array.isArray(planData.teammateSuggestions)
            ? planData.teammateSuggestions
            : [];
        const ecosystemInsights = planData.ecosystemInsights || null;
        const meta = planData.meta || null;

        return {
            plan,
            teammates,
            teammateSuggestions,
            ecosystemInsights,
            meta,
            ...applyResult,
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    sourceCodeUrl: formData.sourceCodeUrl,
                    startDate: formData.startDate || null,
                    endDate: formData.endDate || null,
                    commitment: formData.commitment,
                    roles: formData.roles.map((role) => ({
                        title: role.title,
                        skills: String(role.skills || '')
                            .split(',')
                            .map((skill) => skill.trim())
                            .filter(Boolean),
                        spots: role.spots,
                        durationHours: Number(role.durationHours) > 0 ? Number(role.durationHours) : null,
                    })),
                    roadmap: (Array.isArray(formData.roadmap) ? formData.roadmap : []).map((phase, index) => ({
                        phase: String(phase?.phase || `phase_${index + 1}`),
                        title: String(phase?.title || `Phase ${index + 1}`),
                        objective: String(phase?.objective || ''),
                        startWeek: Number(phase?.startWeek) || null,
                        endWeek: Number(phase?.endWeek) || null,
                        durationWeeks: Number(phase?.durationWeeks) || null,
                        deliverables: Array.isArray(phase?.deliverables) ? phase.deliverables : [],
                        owners: Array.isArray(phase?.owners) ? phase.owners : [],
                    })),
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create project');
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/projects');
            }, 2000);
        } catch (submitError) {
            setError(submitError.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Project Created!</h2>
                <p className="text-gray-600">Your project is now live and ready for collaborators.</p>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
                    <p className="text-gray-500 mt-2">Share your idea and find the perfect team to build it.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <ProjectOverview formData={formData} updateFormData={updateFormData} />

                    <div className="grid md:grid-cols-2 gap-6">
                        <OpenRoles formData={formData} updateFormData={updateFormData} />
                        <ProjectTimeline formData={formData} updateFormData={updateFormData} />
                    </div>

                    <div className="flex justify-end pt-6">
                        {error ? <p className="text-sm text-red-600 mr-auto">{error}</p> : null}
                        <button
                            type="button"
                            onClick={() => navigate('/projects')}
                            className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium mr-4"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.title || formData.roles.length === 0}
                            className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                'Launch Project'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <VirtualCTOChatWidget onArchitectIdea={architectProjectIdea} />
        </>
    );
};

export default CreateProject;
