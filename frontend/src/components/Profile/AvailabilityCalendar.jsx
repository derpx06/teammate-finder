import React from 'react';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const times = ['Morning', 'Afternoon', 'Evening'];

const AvailabilityCalendar = ({ availability }) => {
    return (
        <div className="surface-card rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-6">Weekly Availability</h3>

            <div className="space-y-4">
                {days.map(day => (
                    <div key={day} className="flex items-center gap-4">
                        <div className="w-12 text-sm font-medium text-gray-500">{day}</div>
                        <div className="flex-1 grid grid-cols-3 gap-2">
                            {times.map(time => {
                                const isAvailable = availability[day]?.includes(time.toLowerCase());
                                return (
                                    <div
                                        key={time}
                                        className={`h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${isAvailable
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-50 text-gray-400'
                                            }`}
                                    >
                                        {time}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AvailabilityCalendar;
