import React, { useState } from 'react';
import { User, Calendar, Award } from 'lucide-react';

const Step0BasicInfo = ({ formData, updateFormData }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        updateFormData(name, value);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
            <p className="text-gray-600 mb-8">We need some basic details to set up your profile.</p>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                            placeholder="John Doe"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="number"
                            name="age"
                            value={formData.age || ''}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                            placeholder="25"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                    <div className="relative">
                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            name="qualifications"
                            value={formData.qualifications || ''}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                            placeholder="e.g. B.Tech in Computer Science"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step0BasicInfo;
