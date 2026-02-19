import React, { useId } from 'react';

const CompatibilityScore = ({ score }) => {
    const clampedScore = Math.max(0, Math.min(100, Number(score) || 0));
    const radius = 80;
    const stroke = 10;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (clampedScore / 100) * circumference;
    const gradientId = `compatibilityGradient-${useId().replace(/:/g, '')}`;
    const toSafePercent = (value) => Math.max(0, Math.min(100, Math.round(value)));

    const getLevel = (currentScore) => {
        if (currentScore >= 80) {
            return {
                label: 'Excellent fit',
                chipClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            };
        }
        if (currentScore >= 60) {
            return {
                label: 'Strong fit',
                chipClass: 'border-blue-200 bg-blue-50 text-blue-700',
            };
        }
        if (currentScore >= 40) {
            return {
                label: 'Moderate fit',
                chipClass: 'border-amber-200 bg-amber-50 text-amber-700',
            };
        }
        return {
            label: 'Needs improvement',
            chipClass: 'border-rose-200 bg-rose-50 text-rose-700',
        };
    };

    const level = getLevel(clampedScore);
    const metricCards = [
        { label: 'Skill Overlap', value: toSafePercent(clampedScore * 0.88 + 10) },
        { label: 'Project Fit', value: toSafePercent(clampedScore * 0.82 + 12) },
        { label: 'Availability', value: toSafePercent(clampedScore * 0.75 + 18) },
    ];

    return (
        <div className="surface-card rounded-3xl p-5 sm:p-7 relative overflow-hidden h-full border border-slate-200/80">
            <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Compatibility Score
                </h3>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${level.chipClass}`}>
                    {level.label}
                </span>
            </div>

            <div className="relative flex items-center justify-center w-full z-10">
                <svg
                    viewBox={`0 0 ${radius * 2} ${radius * 2}`}
                    className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 transform -rotate-90"
                    role="img"
                    aria-label={`Compatibility score ${clampedScore} percent`}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#2563eb" />
                            <stop offset="52%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>
                    <circle
                        stroke="currentColor"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className="text-slate-100"
                    />
                    <circle
                        stroke={`url(#${gradientId})`}
                        strokeWidth={stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 900ms ease-in-out' }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-4xl font-bold text-slate-900">{clampedScore}%</span>
                    <span className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Fit Score
                    </span>
                </div>
            </div>

            <div className="mt-5 sm:mt-6 text-center z-10">
                <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                    Based on skills, availability, and current project requirements.
                </p>
            </div>

            <div className="w-full mt-5 sm:mt-6 z-10">
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-[linear-gradient(120deg,#2563eb_0%,#06b6d4_100%)] transition-all duration-700"
                        style={{ width: `${clampedScore}%` }}
                    />
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 z-10">
                {metricCards.map((metric) => (
                    <div key={metric.label} className="rounded-xl border border-slate-200/80 bg-white/80 px-2.5 py-2 text-center">
                        <div className="text-sm font-bold text-slate-900">{metric.value}%</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mt-0.5">
                            {metric.label}
                        </div>
                    </div>
                ))}
            </div>

            <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-50 rounded-full opacity-60 z-0"></div>
            <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-cyan-50 rounded-full opacity-60 z-0"></div>
        </div>
    );
};

export default CompatibilityScore;
