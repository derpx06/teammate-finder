import React from 'react';

const CompatibilityScore = ({ score }) => {
    const clampedScore = Math.max(0, Math.min(100, Number(score) || 0));
    const radius = 80;
    const stroke = 10;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

    const getLevelLabel = (currentScore) => {
        if (currentScore >= 80) return 'Excellent fit';
        if (currentScore >= 60) return 'Strong fit';
        if (currentScore >= 40) return 'Moderate fit';
        return 'Needs improvement';
    };

    const getColor = (currentScore) => {
        if (currentScore >= 80) return 'text-emerald-500';
        if (currentScore >= 60) return 'text-blue-500';
        if (currentScore >= 40) return 'text-amber-500';
        return 'text-red-500';
    };

    return (
        <div className="surface-card rounded-2xl p-5 sm:p-7 flex flex-col items-center justify-center relative overflow-hidden h-full">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-5 sm:mb-6 z-10 text-center">
                Compatibility Score
            </h3>

            <div className="relative flex items-center justify-center w-full">
                <svg
                    viewBox={`0 0 ${radius * 2} ${radius * 2}`}
                    className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 transform -rotate-90"
                    role="img"
                    aria-label={`Compatibility score ${clampedScore} percent`}
                >
                    <defs>
                        <linearGradient id="compatibilityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#2563eb" />
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
                        stroke="url(#compatibilityGradient)"
                        strokeWidth={stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 900ms ease-in-out' }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className={getColor(clampedScore)}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">{clampedScore}%</span>
                    <span className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wider">Match</span>
                </div>
            </div>

            <div className="mt-4 sm:mt-5 text-center z-10">
                <div className={`text-xs sm:text-sm font-semibold ${getColor(clampedScore)}`}>
                    {getLevelLabel(clampedScore)}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xs">
                    Based on skills, availability, and current project requirements.
                </p>
            </div>

            <div className="w-full mt-4 sm:mt-5">
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-[linear-gradient(120deg,#2563eb_0%,#06b6d4_100%)] transition-all duration-700"
                        style={{ width: `${clampedScore}%` }}
                    />
                </div>
            </div>

            <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-50 rounded-full opacity-60 z-0"></div>
            <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-cyan-50 rounded-full opacity-60 z-0"></div>
        </div>
    );
};

export default CompatibilityScore;
