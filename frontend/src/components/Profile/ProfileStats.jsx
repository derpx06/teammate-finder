import React from 'react';
import { BadgeCheck, CalendarClock, Code2, Heart, Star, Users } from 'lucide-react';

const ProfileStats = ({ user }) => {
    const totalAvailabilitySlots = Object.values(user.availability || {}).reduce(
        (total, slots) => total + (Array.isArray(slots) ? slots.length : 0),
        0
    );

    const cards = [
        {
            icon: <Star size={16} />,
            label: 'Stars',
            value: Number(user.starCount) || 0,
        },
        {
            icon: <Users size={16} />,
            label: 'Connected',
            value: Number(user.connectedCount) || 0,
        },
        {
            icon: <Code2 size={16} />,
            label: 'Skills',
            value: user.skills?.length || 0,
        },
        {
            icon: <Heart size={16} />,
            label: 'Interests',
            value: user.interests?.length || 0,
        },
        {
            icon: <CalendarClock size={16} />,
            label: 'Avail. Slots',
            value: totalAvailabilitySlots,
        },
        {
            icon: <BadgeCheck size={16} />,
            label: 'Onboarding',
            value: user.onboardingCompleted ? 'Done' : 'Pending',
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    Profile Summary
                </h3>
                {user.createdAt ? (
                    <span className="text-xs font-medium text-gray-500">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {cards.map((card) => (
                    <div key={card.label} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-1 text-gray-500 mb-1 text-xs">
                            {card.icon}
                            <span>{card.label}</span>
                        </div>
                        <div className="font-bold text-gray-900">{card.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfileStats;
