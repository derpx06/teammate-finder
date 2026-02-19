import React, { useEffect, useState } from 'react';
import { X, User, Code, Calendar, Heart, Github } from 'lucide-react';
import Step1Skills from '../Onboarding/Step1Skills';
import Step2GitHub from '../Onboarding/Step2GitHub';
import Step3Availability from '../Onboarding/Step3Availability';
import Step4Interests from '../Onboarding/Step4Interests';



const EditProfileModal = ({ user, onClose, onSave, initialTab = 'general' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        age: '',
        qualifications: '',
        role: '',
        bio: '',
        location: '',
        website: '',
        socialLinks: {
            linkedin: '',
            twitter: '',
            portfolio: '',
            other: '',
        },
        skills: [],
        interests: [],
        availability: {},
        githubConnected: false,
        ...user
    });

    const updateFormData = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        setActiveTab(initialTab || 'general');
    }, [initialTab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await onSave(formData);
            onClose();
        } catch (saveError) {
            setError(saveError.message || 'Failed to save profile changes');
        } finally {
            setSaving(false);
        }
    };


    const tabs = [
        { id: 'general', label: 'General', icon: <User size={18} /> },
        { id: 'skills', label: 'Skills', icon: <Code size={18} /> },
        { id: 'interests', label: 'Interests', icon: <Heart size={18} /> },
        { id: 'availability', label: 'Availability', icon: <Calendar size={18} /> },
        { id: 'github', label: 'GitHub', icon: <Github size={18} /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => updateFormData('name', e.target.value)}
                                className="field-input"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">Age</label>
                                <input
                                    type="number"
                                    value={formData.age || ''}
                                    onChange={e => updateFormData('age', e.target.value)}
                                    className="field-input"
                                />
                            </div>
                            <div>
                                <label className="form-label">Qualifications</label>
                                <input
                                    type="text"
                                    value={formData.qualifications || ''}
                                    onChange={e => updateFormData('qualifications', e.target.value)}
                                    className="field-input"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Role/Title</label>
                            <input
                                type="text"
                                value={formData.role || ''}
                                onChange={e => updateFormData('role', e.target.value)}
                                className="field-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Profile Description</label>
                            <textarea
                                rows={4}
                                value={formData.bio || ''}
                                onChange={e => updateFormData('bio', e.target.value)}
                                placeholder="Write a short description about your profile, skills, and what you are looking for."
                                className="field-textarea"
                            />
                        </div>
                        <div>
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                value={formData.location || ''}
                                onChange={e => updateFormData('location', e.target.value)}
                                className="field-input"
                            />
                        </div>
                        <div>
                            <label className="form-label">Website</label>
                            <input
                                type="url"
                                value={formData.website || ''}
                                onChange={e => updateFormData('website', e.target.value)}
                                className="field-input"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">LinkedIn</label>
                                <input
                                    type="url"
                                    value={formData.socialLinks?.linkedin || ''}
                                    onChange={e => updateFormData('socialLinks', { ...(formData.socialLinks || {}), linkedin: e.target.value })}
                                    placeholder="https://linkedin.com/in/username"
                                    className="field-input"
                                />
                            </div>
                            <div>
                                <label className="form-label">Twitter / X</label>
                                <input
                                    type="url"
                                    value={formData.socialLinks?.twitter || ''}
                                    onChange={e => updateFormData('socialLinks', { ...(formData.socialLinks || {}), twitter: e.target.value })}
                                    placeholder="https://x.com/username"
                                    className="field-input"
                                />
                            </div>
                            <div>
                                <label className="form-label">Portfolio</label>
                                <input
                                    type="url"
                                    value={formData.socialLinks?.portfolio || ''}
                                    onChange={e => updateFormData('socialLinks', { ...(formData.socialLinks || {}), portfolio: e.target.value })}
                                    placeholder="https://yourportfolio.com"
                                    className="field-input"
                                />
                            </div>
                            <div>
                                <label className="form-label">Other Link</label>
                                <input
                                    type="url"
                                    value={formData.socialLinks?.other || ''}
                                    onChange={e => updateFormData('socialLinks', { ...(formData.socialLinks || {}), other: e.target.value })}
                                    placeholder="https://any-link.com"
                                    className="field-input"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'skills':
                return <Step1Skills formData={formData} updateFormData={updateFormData} />;
            case 'interests':
                return <Step4Interests formData={formData} updateFormData={updateFormData} />;
            case 'availability':
                return <Step3Availability formData={formData} updateFormData={updateFormData} />;
            case 'github':
                return <Step2GitHub formData={formData} updateFormData={updateFormData} />;
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="auth-panel rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {renderContent()}
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    {error ? <div className="text-sm text-red-600 mr-auto">{error}</div> : null}
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="btn-secondary px-6 py-2.5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn-primary px-6 py-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
