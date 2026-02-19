import React from 'react';

const CompatibilityScore = ({ score }) => {
    const radius = 60;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const getColor = (score) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-blue-500';
        if (score >= 40) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 mb-6 z-10">Compatibility Score</h3>

            <div className="relative flex items-center justify-center">
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="transform -rotate-90"
                >
                    <circle
                        stroke="currentColor"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className="text-gray-100"
                    />
                    <circle
                        stroke="currentColor"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className={getColor(score)}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">{score}%</span>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Match</span>
                </div>
            </div>

            <p className="text-sm text-center text-gray-500 mt-6 max-w-xs z-10">
                Based on skills, availability, and past project experience.
            </p>

            {/* Decorative background element */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full opacity-50 z-0"></div>
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-50 rounded-full opacity-50 z-0"></div>
        </div>
    );
};

export default CompatibilityScore;
