import React, { useMemo } from 'react';
import { Filter, Sparkles, X } from 'lucide-react';

const SKILLS = ['React', 'Node.js', 'Python', 'Design', 'Marketing', 'Data Science'];
const AVAILABILITY = ['Full-time', 'Part-time', 'Weekends'];
const EXPERIENCE = ['Junior', 'Mid-level', 'Senior', 'Expert'];

const FilterSidebar = ({ filters, setFilters }) => {
    const toggleFilter = (category, value) => {
        setFilters((prev) => {
            const current = prev[category] || [];
            const updated = current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value];
            return { ...prev, [category]: updated };
        });
    };

    const activeCount = useMemo(() => {
        const skillCount = Array.isArray(filters.skills) ? filters.skills.length : 0;
        const availabilityCount = Array.isArray(filters.availability) ? filters.availability.length : 0;
        const experienceCount = Array.isArray(filters.experience) ? filters.experience.length : 0;
        return skillCount + availabilityCount + experienceCount;
    }, [filters]);

    const clearFilters = () => {
        setFilters({
            skills: [],
            availability: [],
            experience: [],
        });
    };

    const renderFilterGroup = (title, category, options) => (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{title}</h4>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {(filters[category] || []).length}
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const active = (filters[category] || []).includes(option);
                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => toggleFilter(category, option)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                active
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                            }`}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <aside className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <Filter size={16} />
                    </span>
                    <div>
                        <p className="text-sm font-bold text-slate-900">Filters</p>
                        <p className="text-[11px] text-slate-500">Refine teammate matches</p>
                    </div>
                </div>

                {activeCount > 0 && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                        <X size={12} />
                        Clear
                    </button>
                )}
            </div>

            <div className="mb-5 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 px-3 py-2.5">
                <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-800">
                    <Sparkles size={11} />
                    Active filters
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{activeCount}</p>
            </div>

            <div className="space-y-5">
                {renderFilterGroup('Skills', 'skills', SKILLS)}
                <div className="h-px bg-slate-100" />
                {renderFilterGroup('Availability', 'availability', AVAILABILITY)}
                <div className="h-px bg-slate-100" />
                {renderFilterGroup('Experience', 'experience', EXPERIENCE)}
            </div>
        </aside>
    );
};

export default FilterSidebar;
