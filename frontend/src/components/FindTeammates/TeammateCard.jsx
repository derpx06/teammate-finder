import React from 'react';
import { UserPlus, MapPin, Briefcase, Clock, Star, CheckCircle2, Sparkles } from 'lucide-react';

const TeammateCard = ({
    user,
    onViewDetails,
    onConnect,
    onToggleFollow,
    isConnecting = false,
    isConnected = false,
    isFollowLoading = false,
    isFollowed = false,
}) => {
    // Default avatar if none provided
    const avatarUrl = user.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onViewDetails?.(user)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onViewDetails?.(user);
                }
            }}
            className="group relative surface-card rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-100 flex flex-col h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 card-hover-lift"
        >
            {/* Semantic Match Badge - Floating */}
            {typeof user.semanticScore === 'number' && (
                <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-emerald-100 shadow-sm text-xs font-semibold text-emerald-700">
                        <Sparkles size={12} className="fill-emerald-100" />
                        {(user.semanticScore * 100).toFixed(0)}% Match
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                    <img
                        src={avatarUrl}
                        alt={user.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
                    />
                    {isConnected && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-0.5 rounded-full border-2 border-white" title="Connected">
                            <CheckCircle2 size={12} fill="currentColor" className="text-white" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight truncate pr-8 group-hover:text-blue-600 transition-colors">
                        {user.name}
                    </h3>
                    <p className="text-sm text-blue-600 font-medium truncate mb-1">
                        {user.role || 'Developer'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={10} strokeWidth={2.5} />
                        <span className="truncate">{user.location || 'Remote'}</span>
                    </div>
                </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-gray-600 mb-5 line-clamp-2 h-10 leading-relaxed">
                {user.bio || 'Ready to collaborate on interesting projects.'}
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-xs font-medium text-gray-500 mb-5 pb-5 border-b border-gray-50">
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                    <Briefcase size={12} className="text-gray-400" />
                    {user.experienceLevel || 'Junior'}
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                    <Clock size={12} className="text-gray-400" />
                    {user.availabilityStatus || 'Part-time'}
                </div>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-6 flex-1 content-start">
                {(user.skills || []).slice(0, 3).map((skill, index) => (
                    <span
                        key={index}
                        className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded-full font-medium"
                    >
                        {skill}
                    </span>
                ))}
                {(user.skills || []).length > 3 && (
                    <span className="px-2.5 py-1 bg-gray-50 text-gray-500 text-xs rounded-full font-medium border border-gray-100">
                        +{user.skills.length - 3}
                    </span>
                )}
                {(!user.skills || user.skills.length === 0) && (
                    <span className="text-xs text-gray-400 italic px-1">No skills listed</span>
                )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center gap-3 mt-auto pt-2">
                {isConnected ? (
                    <button
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 text-gray-500 text-sm font-medium cursor-default border border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <UserPlus size={16} />
                        Connected
                    </button>
                ) : (
                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            onConnect?.(user);
                        }}
                        disabled={isConnecting}
                        className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-sm active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {isConnecting ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <UserPlus size={16} />
                        )}
                        {isConnecting ? 'Sending...' : 'Connect'}
                    </button>
                )}

                <button
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggleFollow?.(user);
                    }}
                    disabled={isFollowLoading}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${isFollowed
                            ? 'bg-amber-50 border-amber-200 text-amber-500'
                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                        }`}
                    title={isFollowed ? 'Unfollow' : 'Follow'}
                >
                    {isFollowLoading ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
                    ) : (
                        <Star size={18} className={isFollowed ? 'fill-current' : ''} />
                    )}
                </button>
            </div>
        </div>
    );
};

export default TeammateCard;
