import React from 'react';

const SkillBreakdown = ({ skills = [], missingSkills = [] }) => {
    const normalizedSkills = Array.isArray(skills) ? skills : [];
    const normalizedMissing = Array.isArray(missingSkills) ? missingSkills : [];
    const visibleSkills = normalizedSkills.slice(0, 8);

    return (
        <div className="surface-card rounded-2xl p-4 sm:p-6 h-full">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Skill Match Breakdown</h3>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
                    {visibleSkills.length} tracked skills
                </span>
            </div>

            {visibleSkills.length > 0 ? (
                <div className="space-y-4 max-h-[370px] overflow-y-auto pr-1">
                    {visibleSkills.map((skill) => (
                        <div key={skill.name}>
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-xs sm:text-sm font-medium text-gray-700">{skill.name}</span>
                                <span className="text-[11px] sm:text-xs font-bold text-gray-900">
                                    {Number(skill.match) || 0}%
                                </span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${
                                        skill.match >= 80
                                            ? 'bg-emerald-500'
                                            : skill.match >= 50
                                              ? 'bg-blue-500'
                                              : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${Math.max(0, Math.min(100, Number(skill.match) || 0))}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100 p-4">
                    No project skill requirements found yet.
                </div>
            )}

            <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-100">
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-3">Identified Gaps</h4>
                {normalizedMissing.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {normalizedMissing.slice(0, 8).map((skill) => (
                            <span
                                key={skill}
                                className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[11px] sm:text-xs font-medium border border-red-100"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="text-[11px] sm:text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
                        No critical skill gaps detected.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillBreakdown;
