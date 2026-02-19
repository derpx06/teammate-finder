import React from 'react';

const ProjectTimeline = ({ formData, updateFormData }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Timeline</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => updateFormData('startDate', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-600"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated End Date</label>
                    <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => updateFormData('endDate', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-600"
                    />
                </div>
            </div>

            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Commitment</label>
                <select
                    value={formData.commitment}
                    onChange={(e) => updateFormData('commitment', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                >
                    <option value="">Select commitment level</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="flexible">Flexible</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Expected hours per week for team members.</p>
            </div>
        </div>
    );
};

export default ProjectTimeline;
