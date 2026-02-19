import React, { useMemo } from 'react';

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOT_IDS = Array.from({ length: 8 }, (_, index) => index);
const SLOT_BUCKETS = {
    morning: [0, 1, 2],
    afternoon: [3, 4, 5],
    evening: [6, 7],
};

const AvailabilityChart = ({ availability = {} }) => {
    const normalizedAvailability =
        availability && typeof availability === 'object' ? availability : {};

    const dayLookup = useMemo(() => {
        const lookup = {};
        Object.entries(normalizedAvailability).forEach(([rawDay, rawSlots]) => {
            const dayKey = String(rawDay || '').trim().slice(0, 3).toLowerCase();
            if (!dayKey || !Array.isArray(rawSlots)) return;
            if (!lookup[dayKey]) {
                lookup[dayKey] = new Set();
            }
            rawSlots.forEach((item) => {
                const normalizedSlot = String(item || '').trim().toLowerCase();
                if (normalizedSlot) {
                    lookup[dayKey].add(normalizedSlot);
                }
            });
        });
        return lookup;
    }, [normalizedAvailability]);

    const resolveDaySlots = (day) => {
        const dayKey = String(day || '').slice(0, 3).toLowerCase();
        return dayLookup[dayKey] || new Set();
    };

    const getSlotClass = (selectedBuckets, slotIndex) => {
        const isMorning = selectedBuckets.has('morning') && SLOT_BUCKETS.morning.includes(slotIndex);
        const isAfternoon = selectedBuckets.has('afternoon') && SLOT_BUCKETS.afternoon.includes(slotIndex);
        const isEvening = selectedBuckets.has('evening') && SLOT_BUCKETS.evening.includes(slotIndex);
        const isAvailable = isMorning || isAfternoon || isEvening;

        return isAvailable ? 'bg-blue-500' : 'bg-gray-100';
    };

    const configuredDays = DAY_KEYS.filter((day) => resolveDaySlots(day).size > 0).length;
    const hasConfiguredAvailability = configuredDays > 0;

    return (
        <div className="surface-card rounded-2xl p-4 sm:p-6 h-full">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Availability Overview</h3>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
                    {configuredDays}/{DAY_KEYS.length} days set
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-5">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-500">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-500">
                    <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                    <span>Not set</span>
                </div>
            </div>

            {!hasConfiguredAvailability ? (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100 p-4">
                    No weekly availability has been configured yet.
                </div>
            ) : (
                <div className="space-y-3 overflow-x-auto pb-1">
                    {DAY_KEYS.map((day) => {
                        const selectedBuckets = resolveDaySlots(day);
                        const filledBuckets = ['morning', 'afternoon', 'evening'].filter((bucket) =>
                            selectedBuckets.has(bucket)
                        ).length;
                        const dayCoverage = Math.round((filledBuckets / 3) * 100);
                        return (
                            <div key={day} className="grid grid-cols-[36px_minmax(180px,1fr)_40px] sm:grid-cols-[42px_minmax(220px,1fr)_44px] items-center gap-2 sm:gap-3 min-w-[270px]">
                                <span className="text-[11px] sm:text-xs font-semibold text-gray-500">{day}</span>
                                <div className="flex gap-1 h-5 sm:h-6">
                                    {SLOT_IDS.map((slotIndex) => (
                                        <div
                                            key={slotIndex}
                                            className={`flex-1 rounded-sm ${getSlotClass(selectedBuckets, slotIndex)}`}
                                            title={`Slot ${slotIndex + 1}`}
                                        ></div>
                                    ))}
                                </div>
                                <div className="text-[10px] sm:text-[11px] text-right font-semibold text-slate-500">
                                    {dayCoverage}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <p className="text-[11px] sm:text-xs text-gray-400 mt-4 text-center">
                Morning, afternoon, and evening buckets from your profile
            </p>
        </div>
    );
};

export default AvailabilityChart;
