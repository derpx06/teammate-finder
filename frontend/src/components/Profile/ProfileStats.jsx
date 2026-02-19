import React from 'react';
import {
    BadgeCheck,
    CalendarClock,
    Code2,
    Heart,
    Star,
    Users,
    Sparkles,
} from 'lucide-react';

const ProfileStats = ({ user }) => {
    const totalAvailabilitySlots = Object.values(user.availability || {}).reduce(
        (total, slots) => total + (Array.isArray(slots) ? slots.length : 0),
        0
    );

    const cards = [
        {
            icon: Star,
            label: 'Stars',
            value: Number(user.starCount) || 0,
            iconClass: 'text-amber-600',
            iconBg: 'bg-amber-100',
        },
        {
            icon: Users,
            label: 'Connected',
            value: Number(user.connectedCount) || 0,
            iconClass: 'text-blue-700',
            iconBg: 'bg-blue-100',
        },
        {
            icon: Code2,
            label: 'Skills',
            value: user.skills?.length || 0,
            iconClass: 'text-indigo-700',
            iconBg: 'bg-indigo-100',
        },
        {
            icon: Heart,
            label: 'Interests',
            value: user.interests?.length || 0,
            iconClass: 'text-rose-700',
            iconBg: 'bg-rose-100',
        },
        {
            icon: CalendarClock,
            label: 'Avail. Slots',
            value: totalAvailabilitySlots,
            iconClass: 'text-cyan-700',
            iconBg: 'bg-cyan-100',
        },
        {
            icon: BadgeCheck,
            label: 'Onboarding',
            value: user.onboardingCompleted ? 'Done' : 'Pending',
            iconClass: user.onboardingCompleted ? 'text-emerald-700' : 'text-slate-600',
            iconBg: user.onboardingCompleted ? 'bg-emerald-100' : 'bg-slate-100',
        },
    ];

    return (
        <section className="surface-card rounded-2xl p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                    <h3 className="inline-flex items-center gap-2 text-base font-bold text-slate-900 sm:text-lg">
                        <Sparkles size={16} className="text-blue-600" />
                        Profile Summary
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">Fast snapshot of your profile health</p>
                </div>
                {user.createdAt ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm"
                        >
                            <div className="mb-2 inline-flex items-center gap-1.5">
                                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${card.iconBg}`}>
                                    <Icon size={13} className={card.iconClass} />
                                </span>
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    {card.label}
                                </span>
                            </div>
                            <div className="text-lg font-bold text-slate-900">{card.value}</div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default ProfileStats;
