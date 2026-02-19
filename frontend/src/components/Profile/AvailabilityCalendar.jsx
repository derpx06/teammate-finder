import React from 'react';
import { CalendarDays, CheckCircle2 } from 'lucide-react';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const times = ['Morning', 'Afternoon', 'Evening'];

const AvailabilityCalendar = ({ availability }) => {
    const normalizedAvailability = availability && typeof availability === 'object' ? availability : {};

    return (
        <section className="surface-card rounded-2xl p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="inline-flex items-center gap-2 text-base font-bold text-slate-900 sm:text-lg">
                    <CalendarDays size={16} className="text-blue-600" />
                    Weekly Availability
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {Object.values(normalizedAvailability).reduce(
                        (count, slots) => count + (Array.isArray(slots) ? slots.length : 0),
                        0
                    )} slots
                </span>
            </div>

            <div className="space-y-3">
                {days.map((day) => (
                    <div key={day} className="grid grid-cols-[44px_1fr] items-center gap-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{day}</div>
                        <div className="grid grid-cols-3 gap-2">
                            {times.map((time) => {
                                const isAvailable = normalizedAvailability[day]?.includes(time.toLowerCase());
                                return (
                                    <div
                                        key={time}
                                        className={`flex h-8 items-center justify-center rounded-lg border text-[11px] font-semibold transition ${
                                            isAvailable
                                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                : 'border-slate-100 bg-slate-50 text-slate-400'
                                        }`}
                                    >
                                        {isAvailable ? (
                                            <span className="inline-flex items-center gap-1">
                                                <CheckCircle2 size={11} />
                                                {time}
                                            </span>
                                        ) : (
                                            time
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AvailabilityCalendar;
