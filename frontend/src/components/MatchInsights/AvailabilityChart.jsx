import React from 'react';

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const SLOT_IDS = Array.from({ length: 8 }, (_, index) => index);
const SLOT_BUCKETS = {
    morning: [0, 1, 2],
    afternoon: [3, 4, 5],
    evening: [6, 7],
};

const AvailabilityChart = ({ availability = {} }) => {
    const normalizedAvailability =
        availability && typeof availability === 'object' ? availability : {};

    const resolveDaySlots = (day) => {
        const variants = [day, day.toLowerCase(), day.slice(0, 3), day.slice(0, 3).toLowerCase()];
        const selected = variants
            .map((key) => normalizedAvailability[key])
            .find((value) => Array.isArray(value));

        return new Set((Array.isArray(selected) ? selected : []).map((item) => String(item).toLowerCase()));
    };

    const getSlotClass = (selectedBuckets, slotIndex) => {
        const isMorning = selectedBuckets.has('morning') && SLOT_BUCKETS.morning.includes(slotIndex);
        const isAfternoon = selectedBuckets.has('afternoon') && SLOT_BUCKETS.afternoon.includes(slotIndex);
        const isEvening = selectedBuckets.has('evening') && SLOT_BUCKETS.evening.includes(slotIndex);
        const isAvailable = isMorning || isAfternoon || isEvening;

        return isAvailable ? 'bg-blue-500' : 'bg-gray-100';
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Availability Overview</h3>

            <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                    <span>Not set</span>
                </div>
            </div>

            <div className="space-y-3">
                {DAY_KEYS.map(day => {
                    const selectedBuckets = resolveDaySlots(day);
                    return (
                    <div key={day} className="flex items-center gap-4">
                        <span className="text-xs font-medium text-gray-500 w-8">{day}</span>
                        <div className="flex-1 flex gap-1 h-6">
                            {SLOT_IDS.map((slotIndex) => (
                                <div
                                    key={slotIndex}
                                    className={`flex-1 rounded-sm ${getSlotClass(selectedBuckets, slotIndex)}`}
                                    title={`Slot ${slotIndex + 1}`}
                                ></div>
                            ))}
                        </div>
                    </div>
                    );
                })}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">Morning, afternoon, evening slots from your profile</p>
        </div>
    );
};

export default AvailabilityChart;
