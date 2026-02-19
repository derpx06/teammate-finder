import React from 'react';
import { motion } from 'framer-motion';

const interests = [
    'Hackathons',
    'Startup',
    'AI/ML',
    'Web3',
    'SaaS',
    'Mobile Apps',
    'E-commerce',
    'EdTech',
    'FinTech',
    'HealthTech',
    'Open Source',
];

const Step4Interests = ({ formData, updateFormData }) => {
    const toggleInterest = (interest) => {
        if (formData.interests.includes(interest)) {
            updateFormData('interests', formData.interests.filter(i => i !== interest));
        } else {
            updateFormData('interests', [...formData.interests, interest]);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Interests</h2>
            <p className="text-gray-600 mb-8">What kind of projects are you interested in building?</p>

            {/* Interests Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {interests.map(interest => {
                    const isSelected = formData.interests.includes(interest);
                    return (
                        <motion.button
                            key={interest}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleInterest(interest)}
                            className={`p-4 rounded-xl text-left border transition-all ${isSelected
                                ? 'bg-blue-50 border-blue-500 shadow-md transform scale-[1.02]'
                                : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm'
                                }`}
                        >
                            <div
                                className={`w-5 h-5 rounded-full border mb-3 flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                    }`}
                            >
                                {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                {interest}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default Step4Interests;
