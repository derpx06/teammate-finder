import React from 'react';
import { Filter } from 'lucide-react';

const FilterSidebar = ({ filters, setFilters }) => {
    const skills = ['React', 'Node.js', 'Python', 'Design', 'Marketing', 'Data Science'];
    const availability = ['Full-time', 'Part-time', 'Weekends'];
    const experience = ['Junior', 'Mid-level', 'Senior', 'Expert'];

    const toggleFilter = (category, value) => {
        setFilters(prev => {
            const current = prev[category] || [];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [category]: updated };
        });
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit sticky top-24">
            <div className="flex items-center gap-2 mb-6 text-gray-900 font-bold text-lg">
                <Filter size={20} className="text-blue-600" />
                Filters
            </div>

            <div className="space-y-6">
                {/* Skills */}
                <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Skills</h4>
                    <div className="space-y-2">
                        {skills.map(skill => (
                            <label key={skill} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.skills?.includes(skill)}
                                    onChange={() => toggleFilter('skills', skill)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                                />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{skill}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Availability */}
                <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Availability</h4>
                    <div className="space-y-2">
                        {availability.map(type => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.availability?.includes(type)}
                                    onChange={() => toggleFilter('availability', type)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                                />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Experience */}
                <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Experience</h4>
                    <div className="space-y-2">
                        {experience.map(level => (
                            <label key={level} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.experience?.includes(level)}
                                    onChange={() => toggleFilter('experience', level)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                                />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{level}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;
