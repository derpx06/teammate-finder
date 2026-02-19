import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';

const SkillGapHighlight = ({
    missingSkills,
    onReviewGaps,
    reviewing = false,
    showReviewAction = true,
}) => {
    if (!missingSkills || missingSkills.length === 0) return null;

    return (
        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle size={120} className="text-orange-500" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Skill Gap Detected</h3>
                    </div>
                    <p className="text-gray-600 max-w-xl">
                        Current project coverage is missing <strong>{missingSkills.join(', ')}</strong>.
                        Add teammates or open roles in these areas to reduce delivery risk.
                    </p>
                </div>

                {showReviewAction ? (
                    <button
                        type="button"
                        onClick={onReviewGaps}
                        disabled={reviewing}
                        className="flex items-center px-4 py-2 bg-white text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors font-medium shadow-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {reviewing ? 'Analyzing...' : 'Review Gaps'}
                        <ChevronRight size={16} className="ml-2" />
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default SkillGapHighlight;
