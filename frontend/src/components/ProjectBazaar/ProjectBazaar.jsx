import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Clock3, Filter, Loader2, Search, Users } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const ProjectBazaar = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [applyError, setApplyError] = useState('');
    const [applySuccess, setApplySuccess] = useState('');
    const [applyingItemId, setApplyingItemId] = useState('');
    const [search, setSearch] = useState('');
    const [selectedSkill, setSelectedSkill] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const fetchBazaar = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/bazaar`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setItems(Array.isArray(data.items) ? data.items : []);
        } catch (fetchError) {
            setError(fetchError.message || 'Failed to fetch Project Bazaar');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBazaar();
    }, []);

    const handleApply = async (item) => {
        const projectId = String(item?.projectId || '').trim();
        const roleTitle = String(item?.roleTitle || '').trim();
        const itemId = String(item?.id || '').trim();
        if (!projectId || !roleTitle || !itemId) return;
        if (item?.applied || item?.canApply === false) return;

        setApplyError('');
        setApplySuccess('');
        setApplyingItemId(itemId);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/project/${projectId}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ roleTitle }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit application');
            }

            setApplySuccess(`Applied for ${roleTitle}. Project lead has been notified.`);
            setItems((prevItems) =>
                prevItems.map((prevItem) =>
                    String(prevItem?.projectId || '').trim() === projectId
                        ? { ...prevItem, applied: true, canApply: false }
                        : prevItem
                )
            );
        } catch (actionError) {
            setApplyError(actionError.message || 'Failed to submit application');
        } finally {
            setApplyingItemId('');
        }
    };

    const availableCategories = useMemo(() => {
        const categories = new Set();
        items.forEach((item) => {
            const cat = String(item.projectCategory || 'General').trim();
            if (cat) categories.add(cat);
        });
        return ['all', ...Array.from(categories).sort()];
    }, [items]);

    const availableSkills = useMemo(() => {
        const skills = new Set();
        items.forEach((item) => {
            (item.skills || []).forEach((skill) => {
                const normalized = String(skill || '').trim();
                if (normalized) skills.add(normalized);
            });
        });
        return ['all', ...Array.from(skills).sort((a, b) => a.localeCompare(b)).slice(0, 12)];
    }, [items]);

    const filteredItems = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        return items.filter((item) => {
            // Category Filter
            if (selectedCategory !== 'all') {
                const itemCat = String(item.projectCategory || 'General').toLowerCase();
                if (itemCat !== selectedCategory.toLowerCase()) return false;
            }

            // Skill Filter
            if (selectedSkill !== 'all') {
                const hasSkill = (item.skills || []).some(
                    (skill) => String(skill).trim().toLowerCase() === selectedSkill.toLowerCase()
                );
                if (!hasSkill) return false;
            }

            if (!normalizedSearch) return true;

            const corpus = [
                item.projectTitle,
                item.projectDescription,
                item.projectCategory,
                item.roleTitle,
                item.owner?.name,
                ...(item.skills || []),
            ]
                .join(' ')
                .toLowerCase();

            return corpus.includes(normalizedSearch);
        });
    }, [items, search, selectedSkill, selectedCategory]);

    return (
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto space-y-6 page-shell">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Project Bazaar</h1>
                    <p className="page-subtitle">
                        Structured feed of open project roles posted by founders and team leads.
                    </p>
                </div>
                <div className="pill-soft text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-2">
                    {filteredItems.length} role{filteredItems.length !== 1 ? 's' : ''} available
                </div>
            </div>

            <div className="surface-card p-4 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        type="text"
                        placeholder="Search by project, role, skill, or owner"
                        className="field-input w-full pl-10 pr-4 py-2.5 text-sm"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-50 mb-2">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                        <Briefcase size={12} />
                        Category
                    </span>
                    {availableCategories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-colors ${selectedCategory === cat
                                ? 'bg-gray-900 border-gray-900 text-white'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                                }`}
                        >
                            {cat === 'all' ? 'All Categories' : cat === 'saas' ? 'SaaS' : cat === 'ai' ? 'AI / ML' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                        <Filter size={12} />
                        Skill
                    </span>
                    {availableSkills.map((skill) => (
                        <button
                            key={skill}
                            type="button"
                            onClick={() => setSelectedSkill(skill)}
                            className={`px-3 py-1.5 text-xs rounded-full border whitespace-nowrap ${selectedSkill === skill
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700'
                                }`}
                        >
                            {skill === 'all' ? 'All Skills' : skill}
                        </button>
                    ))}
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                    {error}
                </div>
            ) : null}
            {applyError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                    {applyError}
                </div>
            ) : null}
            {applySuccess ? (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm">
                    {applySuccess}
                </div>
            ) : null}

            {loading ? (
                <div className="min-h-[30vh] flex items-center justify-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading bazaar feed...
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 text-gray-500 rounded-2xl p-12 text-center">
                    <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    No open roles found for this filter.
                </div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(
                        filteredItems.reduce((acc, item) => {
                            const category = item.projectCategory || 'General';
                            if (!acc[category]) acc[category] = [];
                            acc[category].push(item);
                            return acc;
                        }, {})
                    ).map(([category, categoryItems]) => (
                        <div key={category} className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-2 capitalize">
                                {category === 'hackathon' ? 'Hackathon Projects' :
                                    category === 'saas' ? 'SaaS Projects' :
                                        category === 'ai' ? 'AI / ML Projects' :
                                            category === 'web3' ? 'Web3 / Blockchain' :
                                                `${category} Projects`}
                            </h2>
                            <div className="grid lg:grid-cols-2 gap-5">
                                {categoryItems.map((item) => {
                                    const itemId = String(item.id);
                                    const isApplying = applyingItemId === itemId;
                                    const isApplied = Boolean(item.applied);
                                    const canApply = typeof item.canApply === 'boolean'
                                        ? item.canApply
                                        : !isApplied;
                                    const isClosed = Number(item.spots) < 1;

                                    return (
                                        <article key={item.id} className="surface-card rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all card-hover-lift">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div>
                                                    <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide mb-1">
                                                        {item.projectCategory || 'General'}
                                                    </p>
                                                    <h3 className="text-lg font-bold text-gray-900">{item.roleTitle}</h3>
                                                    <p className="text-sm text-gray-600 mt-0.5">in {item.projectTitle}</p>
                                                </div>
                                                {Number(item.durationHours) > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                                                        <Clock3 size={12} />
                                                        {item.durationHours}h
                                                    </span>
                                                ) : null}
                                            </div>

                                            <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                                                {item.projectDescription}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {(item.skills || []).map((skill, idx) => (
                                                    <span
                                                        key={`${item.id}-${skill}-${idx}`}
                                                        className="px-2 py-1 text-xs font-medium rounded-md bg-gray-50 border border-gray-200 text-gray-700"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                                <div className="text-xs text-gray-500 space-y-1">
                                                    <p>Posted by {item.owner?.name || 'Project Owner'}</p>
                                                    <p className="inline-flex items-center gap-1">
                                                        <Users size={12} />
                                                        {item.spots} spot{item.spots > 1 ? 's' : ''} open
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isApplied ? (
                                                        <span className="px-3 py-2 text-sm font-semibold rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                                                            Applied
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApply(item)}
                                                            disabled={!canApply || isClosed || isApplying}
                                                            className="btn-primary px-3 py-2 text-sm bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                                        >
                                                            {isClosed
                                                                ? 'Closed'
                                                                : isApplying
                                                                    ? 'Applying...'
                                                                    : !canApply
                                                                        ? 'Unavailable'
                                                                        : 'Apply'}
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/project/${item.projectId}`)}
                                                        className="btn-secondary px-3 py-2 text-sm"
                                                    >
                                                        View Project
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectBazaar;
