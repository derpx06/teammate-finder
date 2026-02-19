import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Briefcase,
    Clock3,
    Filter,
    Layers,
    Loader2,
    Search,
    Sparkles,
    Users,
    X,
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const CATEGORY_LABELS = {
    hackathon: 'Hackathon Projects',
    saas: 'SaaS Projects',
    ai: 'AI / ML Projects',
    web3: 'Web3 / Blockchain',
};

const formatCategoryLabel = (category) => {
    const normalized = String(category || 'general').trim().toLowerCase();
    if (CATEGORY_LABELS[normalized]) return CATEGORY_LABELS[normalized];
    return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)} Projects`;
};

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
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch Project Bazaar');
            }

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
        } catch (actionError) {
            setApplyError(actionError.message || 'Failed to submit application');
        } finally {
            setApplyingItemId('');
        }
    };

    const availableCategories = useMemo(() => {
        const categories = new Set();
        items.forEach((item) => {
            const category = String(item.projectCategory || 'General').trim();
            if (category) categories.add(category);
        });

        return ['all', ...Array.from(categories).sort((a, b) => a.localeCompare(b))];
    }, [items]);

    const availableSkills = useMemo(() => {
        const skills = new Set();
        items.forEach((item) => {
            (item.skills || []).forEach((skill) => {
                const normalized = String(skill || '').trim();
                if (normalized) skills.add(normalized);
            });
        });

        return ['all', ...Array.from(skills).sort((a, b) => a.localeCompare(b)).slice(0, 14)];
    }, [items]);

    const filteredItems = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return items.filter((item) => {
            if (selectedCategory !== 'all') {
                const itemCategory = String(item.projectCategory || 'general').trim().toLowerCase();
                if (itemCategory !== selectedCategory.toLowerCase()) return false;
            }

            if (selectedSkill !== 'all') {
                const hasSkill = (item.skills || []).some(
                    (skill) => String(skill || '').trim().toLowerCase() === selectedSkill.toLowerCase()
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

    const groupedItems = useMemo(() => {
        const grouped = filteredItems.reduce((accumulator, item) => {
            const category = String(item.projectCategory || 'general').trim().toLowerCase() || 'general';
            if (!accumulator[category]) accumulator[category] = [];
            accumulator[category].push(item);
            return accumulator;
        }, {});

        return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredItems]);

    const totalOpenSpots = useMemo(
        () => filteredItems.reduce((sum, item) => sum + Math.max(0, Number(item.spots) || 0), 0),
        [filteredItems]
    );

    const clearFilters = () => {
        setSearch('');
        setSelectedSkill('all');
        setSelectedCategory('all');
    };

    return (
        <div className="mx-auto max-w-7xl 2xl:max-w-screen-2xl space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(120deg,#0f172a_0%,#1e293b_58%,#075985_130%)] px-5 py-6 text-white shadow-[0_24px_56px_-38px_rgba(15,23,42,0.9)] sm:px-7 sm:py-8">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
                <div className="absolute -bottom-24 left-16 h-56 w-56 rounded-full bg-blue-400/25 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100">
                            <Sparkles size={13} />
                            Opportunity Feed
                        </p>
                        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Project Bazaar</h1>
                        <p className="mt-2 text-sm text-slate-200 sm:text-base">
                            Discover open contributor roles posted by founders and project leads, then apply in one click.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                                {filteredItems.length} role{filteredItems.length !== 1 ? 's' : ''}
                            </span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                                {totalOpenSpots} open spot{totalOpenSpots !== 1 ? 's' : ''}
                            </span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                                {Math.max(0, availableCategories.length - 1)} categorie{availableCategories.length - 1 === 1 ? 'y' : 's'}
                            </span>
                        </div>
                    </div>

                    {(selectedCategory !== 'all' || selectedSkill !== 'all' || search.trim()) && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            <X size={15} />
                            Reset filters
                        </button>
                    )}
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm sm:p-5">
                <div className="relative mb-4">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        type="text"
                        placeholder="Search by project, role, skill, or owner"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                            <Briefcase size={12} />
                            Category
                        </span>
                        {availableCategories.map((category) => {
                            const normalized = String(category).trim().toLowerCase();
                            const active = selectedCategory === category;

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setSelectedCategory(category)}
                                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                        active
                                            ? 'border-slate-900 bg-slate-900 text-white'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
                                    }`}
                                >
                                    {normalized === 'all'
                                        ? 'All Categories'
                                        : normalized === 'ai'
                                          ? 'AI / ML'
                                          : normalized === 'saas'
                                            ? 'SaaS'
                                            : normalized.charAt(0).toUpperCase() + normalized.slice(1)}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                            <Filter size={12} />
                            Skill
                        </span>
                        {availableSkills.map((skill) => {
                            const active = selectedSkill === skill;

                            return (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => setSelectedSkill(skill)}
                                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                        active
                                            ? 'border-blue-600 bg-blue-600 text-white'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                                    }`}
                                >
                                    {skill === 'all' ? 'All Skills' : skill}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
            ) : null}
            {applyError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{applyError}</div>
            ) : null}
            {applySuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{applySuccess}</div>
            ) : null}

            {loading ? (
                <div className="flex min-h-[32vh] items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
                    Loading bazaar feed...
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/90 px-6 py-14 text-center text-slate-500">
                    <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="font-medium">No open roles found for this filter.</p>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-3 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {groupedItems.map(([category, categoryItems]) => (
                        <section key={category} className="space-y-4">
                            <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-2">
                                <h2 className="text-xl font-bold text-slate-900">{formatCategoryLabel(category)}</h2>
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {categoryItems.length} role{categoryItems.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="grid gap-5 lg:grid-cols-2">
                                {categoryItems.map((item) => {
                                    const itemId = String(item.id || '');
                                    const isApplying = applyingItemId === itemId;
                                    const isClosed = Number(item.spots) < 1;
                                    const durationHours = Number(item.durationHours) || 0;
                                    const skills = Array.isArray(item.skills) ? item.skills : [];

                                    return (
                                        <article
                                            key={item.id}
                                            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                                        >
                                            <div className="pointer-events-none absolute -right-14 -top-14 h-28 w-28 rounded-full bg-cyan-100/70 blur-2xl" />

                                            <div className="relative z-10">
                                                <div className="mb-3 flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                                                            {item.projectCategory || 'General'}
                                                        </p>
                                                        <h3 className="text-lg font-bold text-slate-900">{item.roleTitle}</h3>
                                                        <p className="mt-0.5 text-sm text-slate-600">in {item.projectTitle}</p>
                                                    </div>

                                                    {durationHours > 0 ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                                            <Clock3 size={12} />
                                                            {durationHours}h/week
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <p className="mb-4 line-clamp-3 text-sm text-slate-600">{item.projectDescription}</p>

                                                <div className="mb-4 flex flex-wrap gap-1.5">
                                                    {skills.length > 0 ? (
                                                        skills.map((skill, index) => (
                                                            <span
                                                                key={`${item.id}-${skill}-${index}`}
                                                                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                                                            <Layers size={12} />
                                                            Skills to be finalized
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
                                                    <div className="space-y-1 text-xs text-slate-500">
                                                        <p>Posted by {item.owner?.name || 'Project Owner'}</p>
                                                        <p className="inline-flex items-center gap-1">
                                                            <Users size={12} />
                                                            {item.spots} spot{Number(item.spots) > 1 ? 's' : ''} open
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApply(item)}
                                                            disabled={isClosed || isApplying}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {isApplying ? (
                                                                <>
                                                                    <Loader2 size={14} className="animate-spin" />
                                                                    Applying
                                                                </>
                                                            ) : isClosed ? (
                                                                'Closed'
                                                            ) : (
                                                                'Apply'
                                                            )}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/project/${item.projectId}`)}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                                                        >
                                                            View
                                                            <ArrowRight size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectBazaar;
