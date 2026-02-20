import React from 'react';
import { useNavigate } from 'react-router-dom';

const TeamGrid = ({ members = [] }) => {
    const navigate = useNavigate();
    const normalizedMembers = Array.isArray(members) ? members : [];

    return (
        <div className="surface-card rounded-2xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Team Members</h3>

            {normalizedMembers.length === 0 ? (
                <div className="text-gray-500 text-sm bg-gray-50 border border-gray-100 rounded-xl p-4">
                    Team members have not been added yet.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {normalizedMembers.map((member) => (
                        <div
                            key={member.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                                const targetId = String(member?.id || '').trim();
                                if (!targetId) return;
                                navigate(`/user/${targetId}`);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    const targetId = String(member?.id || '').trim();
                                    if (!targetId) return;
                                    navigate(`/user/${targetId}`);
                                }
                            }}
                            className="text-center cursor-pointer rounded-xl hover:bg-gray-50 p-2 transition-all card-hover-lift focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <div className="relative inline-block mb-3">
                                <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md mx-auto"
                                />
                                {member.isLead && (
                                    <div
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] border border-white shadow-sm"
                                        title="Team Lead"
                                    >
                                        TL
                                    </div>
                                )}
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm">{member.name}</h4>
                            <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeamGrid;
