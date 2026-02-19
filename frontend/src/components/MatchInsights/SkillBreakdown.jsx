import React from 'react';

const SkillBreakdown = ({ skills = [], missingSkills = [] }) => {
    const normalizedSkills = Array.isArray(skills) ? skills : [];
    const normalizedMissing = Array.isArray(missingSkills) ? missingSkills : [];
    const visibleSkills = normalizedSkills.slice(0, 8);
    const toSafePercent = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

    const getSkillBand = (rawScore) => {
        const score = toSafePercent(rawScore);
        if (score >= 80) {
            return {
                label: 'Strong alignment',
                barClass: 'bg-gradient-to-r from-emerald-500 to-cyan-500',
                scoreClass: 'text-emerald-700',
            };
        }
        if (score >= 50) {
            return {
                label: 'Good potential',
                barClass: 'bg-gradient-to-r from-blue-500 to-cyan-500',
                scoreClass: 'text-blue-700',
            };
        }
        return {
            label: 'Needs reinforcement',
            barClass: 'bg-gradient-to-r from-amber-500 to-orange-500',
            scoreClass: 'text-amber-700',
        };
    };

    const strongCount = visibleSkills.filter((item) => toSafePercent(item.match) >= 80).length;
    const moderateCount = visibleSkills.filter((item) => {
        const score = toSafePercent(item.match);
        return score >= 50 && score < 80;
    }).length;
    const weakCount = visibleSkills.filter((item) => toSafePercent(item.match) < 50).length;

    return (
        <div className="surface-card rounded-3xl p-4 sm:p-6 h-full border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Skill Match Breakdown</h3>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
                    {visibleSkills.length} tracked skills
                </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div className="text-sm font-bold text-emerald-700">{strongCount}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        Strong
                    </div>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
                    <div className="text-sm font-bold text-blue-700">{moderateCount}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                        Moderate
                    </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <div className="text-sm font-bold text-amber-700">{weakCount}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Weak
                    </div>
                </div>
            </div>

            {visibleSkills.length > 0 ? (
                <div className="space-y-3 max-h-[370px] overflow-y-auto pr-1">
                    {visibleSkills.map((skill, index) => {
                        const score = toSafePercent(skill.match);
                        const band = getSkillBand(score);
                        return (
                            <div
                                key={`${skill.name}-${index}`}
                                className="rounded-xl border border-slate-200/80 bg-white/85 p-3"
                            >
                                <div className="flex justify-between items-end gap-3 mb-1.5">
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                                        {skill.name}
                                    </span>
                                    <span className={`text-[11px] sm:text-xs font-bold ${band.scoreClass}`}>
                                        {score}%
                                    </span>
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${band.barClass}`}
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                                <div className="mt-1.5 text-[11px] text-slate-500">{band.label}</div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100 p-4">
                    No project skill requirements found yet.
                </div>
            )}

            <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900">Identified Gaps</h4>
                    <span className="text-[11px] text-slate-500 font-semibold">
                        {normalizedMissing.length} flagged
                    </span>
                </div>
                {normalizedMissing.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {normalizedMissing.slice(0, 8).map((skill) => (
                            <span
                                key={skill}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-[11px] sm:text-xs font-medium border border-rose-200"
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
