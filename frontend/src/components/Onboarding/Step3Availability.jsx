import React from 'react';
import { motion } from 'framer-motion';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const times = [
    { id: 'morning', label: 'Morning' },
    { id: 'afternoon', label: 'Afternoon' },
    { id: 'evening', label: 'Evening' },
];

const Step3Availability = ({ formData, updateFormData }) => {
    const toggleAvailability = (day, timeId) => {
        const currentDayAvailability = formData.availability[day] || [];
        const isSelected = currentDayAvailability.includes(timeId);

        let newDayAvailability;
        if (isSelected) {
            newDayAvailability = currentDayAvailability.filter(t => t !== timeId);
        } else {
            newDayAvailability = [...currentDayAvailability, timeId];
        }

        updateFormData('availability', {
            ...formData.availability,
            [day]: newDayAvailability,
        });
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Your Availability</h2>
            <p className="text-gray-600 mb-8">Let your team know when you're available to collaborate.</p>

            {/* Availability Grid */}
            <div className="grid grid-cols-[auto_1fr] gap-4">
                {/* Times Header (Empty first cell) */}
                <div></div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    {times.map(time => (
                        <div key={time.id} className="text-sm font-medium text-gray-500">{time.label}</div>
                    ))}
                </div>

                {/* Days and Time Blocks */}
                {days.map(day => (
                    <React.Fragment key={day}>
                        <div className="flex items-center text-sm font-bold text-gray-700">{day}</div>
                        <div className="grid grid-cols-3 gap-2">
                            {times.map(time => {
                                const isSelected = formData.availability[day]?.includes(time.id);
                                return (
                                    <motion.button
                                        key={`${day}-${time.id}`}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleAvailability(day, time.id)}
                                        className={`h-10 rounded-lg border transition-colors ${isSelected
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'bg-white border-gray-200 hover:border-blue-300'
                                            }`}
                                    />
                                );
                            })}
                        </div>
                    </React.Fragment>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white border border-gray-200"></div>
                    <span>Unavailable</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-600 border border-blue-600"></div>
                    <span>Available</span>
                </div>
            </div>
        </div>
    );
};

export default Step3Availability;
