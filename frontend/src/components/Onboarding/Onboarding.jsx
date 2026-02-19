import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Step0BasicInfo from './Step0BasicInfo';
import Step1Skills from './Step1Skills';
import Step2GitHub from './Step2GitHub';
import Step3Availability from './Step3Availability';
import Step4Interests from './Step4Interests';
import { API_BASE_URL } from '../../config/api';


const Onboarding = () => {
    const MotionDiv = motion.div;
    const storedUser = (() => {
        try {
            return JSON.parse(localStorage.getItem('authUser') || '{}');
        } catch {
            return {};
        }
    })();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: storedUser.name || '',
        age: '',
        qualifications: '',
        skills: [],
        githubConnected: Boolean(storedUser.githubConnected),
        availability: {},
        interests: [],
    });

    const totalSteps = 5;

    const handleNext = async () => {
        if (currentStep < totalSteps) {
            setCurrentStep(curr => curr + 1);
        } else if (currentStep === totalSteps) {
            await handleFinish();
        }
    };

    const handleFinish = async () => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    age: Number(formData.age),
                    qualifications: formData.qualifications,
                    skills: formData.skills,
                    interests: formData.interests,
                    availability: formData.availability,
                    onboardingCompleted: true
                })
            });


            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('authUser', JSON.stringify(data.user));
                setCurrentStep(curr => curr + 1); // Go to completion screen
            } else {
                const errorData = await response.json();
                console.error('Failed to update profile:', errorData);
                alert(`Failed to complete onboarding: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting onboarding:', error);
            alert(`Error submitting onboarding: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(curr => curr - 1);
        }
    };

    const updateFormData = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step0BasicInfo formData={formData} updateFormData={updateFormData} />;
            case 2:
                return <Step1Skills formData={formData} updateFormData={updateFormData} />;
            case 3:
                return <Step2GitHub formData={formData} updateFormData={updateFormData} />;
            case 4:
                return <Step3Availability formData={formData} updateFormData={updateFormData} />;
            case 5:
                return <Step4Interests formData={formData} updateFormData={updateFormData} />;
            default:
                return <div className="text-center py-20">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">All Set!</h2>
                    <p className="text-gray-600 mb-8">Your profile is ready. Let's find some projects.</p>
                    <Link to="/dashboard" className="btn-primary inline-flex px-8 py-3">
                        Go to Dashboard
                    </Link>
                </div>;
        }
    };

    return (
        <div className="onboarding-shell min-h-screen flex items-center justify-center p-4">
            <div className="onboarding-panel w-full max-w-2xl rounded-2xl overflow-hidden">
                {currentStep <= totalSteps && (
                    <div className="bg-slate-50/80 px-8 py-6 border-b border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Step {currentStep} of {totalSteps}</span>
                            <span className="text-sm font-medium text-blue-600">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <MotionDiv
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-blue-700 to-cyan-500 rounded-full"
                            />
                        </div>
                    </div>
                )}

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        <MotionDiv
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderStep()}
                        </MotionDiv>
                    </AnimatePresence>
                </div>

                {currentStep <= totalSteps && (
                    <div className="px-8 py-6 bg-slate-50/80 border-t border-slate-200 flex justify-between">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1 || isSubmitting}
                            className={`btn-secondary flex items-center px-6 py-2 ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5 mr-1" />
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="btn-primary flex items-center px-6 py-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    {currentStep === totalSteps ? 'Finish' : 'Next'}
                                    <ChevronRight className="w-5 h-5 ml-1" />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
