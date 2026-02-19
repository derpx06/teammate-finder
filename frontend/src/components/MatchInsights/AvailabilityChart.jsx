import React, { useMemo } from 'react';

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOT_IDS = Array.from({ length: 8 }, (_, index) => index);
const SLOT_BUCKETS = {
    morning: [0, 1, 2],
    afternoon: [3, 4, 5],
    evening: [6, 7],
};
const SLOT_STYLE = {
    morning: 'bg-amber-400',
    afternoon: 'bg-sky-500',
    evening: 'bg-indigo-500',
};

const AvailabilityChart = ({ availability = {} }) => {
    const dayLookup = useMemo(() => {
        const normalizedAvailability =
            availability && typeof availability === 'object' ? availability : {};
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
    }, [availability]);

    const resolveDaySlots = (day) => {
        const dayKey = String(day || '').slice(0, 3).toLowerCase();
        return dayLookup[dayKey] || new Set();
    };

    const resolveSlotBucket = (slotIndex) => {
        if (SLOT_BUCKETS.morning.includes(slotIndex)) return 'morning';
        if (SLOT_BUCKETS.afternoon.includes(slotIndex)) return 'afternoon';
        return 'evening';
    };

    const getSlotClass = (selectedBuckets, slotIndex) => {
        const bucket = resolveSlotBucket(slotIndex);
        const isAvailable = selectedBuckets.has(bucket);
        return isAvailable ? SLOT_STYLE[bucket] : 'bg-slate-100';
    };

    const configuredDays = DAY_KEYS.filter((day) => resolveDaySlots(day).size > 0).length;
    const hasConfiguredAvailability = configuredDays > 0;
    const dayCoverage = DAY_KEYS.map((day) => {
        const selectedBuckets = resolveDaySlots(day);
        const filledBuckets = ['morning', 'afternoon', 'evening'].filter((bucket) =>
            selectedBuckets.has(bucket)
        ).length;
        return {
            day,
            percent: Math.round((filledBuckets / 3) * 100),
            filledBuckets,
        };
    });
    const bestDay = dayCoverage.reduce(
        (best, current) => (current.percent > best.percent ? current : best),
        { day: '', percent: 0, filledBuckets: 0 }
    );

    return (
        <div className="surface-card rounded-3xl p-4 sm:p-6 h-full border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Availability Overview</h3>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
                    {configuredDays}/{DAY_KEYS.length} days set
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-5">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-500">
                    <div className="w-3 h-3 bg-amber-400 rounded-sm"></div>
                    <span>Morning</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-500">
                    <div className="w-3 h-3 bg-sky-500 rounded-sm"></div>
                    <span>Afternoon</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-500">
                    <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
                    <span>Evening</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-500">
                    <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
                    <span>Not set</span>
                </div>
            </div>

            {!hasConfiguredAvailability ? (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100 p-4">
                    No weekly availability has been configured yet.
                </div>
            ) : (
                <div className="space-y-2.5 overflow-x-auto pb-1">
                    {dayCoverage.map((entry) => {
                        const selectedBuckets = resolveDaySlots(entry.day);
                        return (
                            <div
                                key={entry.day}
                                className="grid grid-cols-[36px_minmax(180px,1fr)_40px] sm:grid-cols-[42px_minmax(220px,1fr)_44px] items-center gap-2 sm:gap-3 min-w-[270px] rounded-xl border border-slate-200/70 bg-white/80 px-2 py-2"
                            >
                                <span className="text-[11px] sm:text-xs font-semibold text-gray-600">
                                    {entry.day}
                                </span>
                                <div className="flex gap-1 h-5 sm:h-6">
                                    {SLOT_IDS.map((slotIndex) => (
                                        <div
                                            key={slotIndex}
                                            className={`flex-1 rounded-sm ${getSlotClass(
                                                selectedBuckets,
                                                slotIndex
                                            )}`}
                                            title={`Slot ${slotIndex + 1}`}
                                        ></div>
                                    ))}
                                </div>
                                <div className="text-[10px] sm:text-[11px] text-right font-semibold text-slate-600">
                                    {entry.percent}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {hasConfiguredAvailability ? (
                <p className="text-[11px] sm:text-xs text-gray-500 mt-4 text-center">
                    Best configured day: {bestDay.day} ({bestDay.percent}% coverage)
                </p>
            ) : null}
        </div>
    );
};

export default AvailabilityChart;
