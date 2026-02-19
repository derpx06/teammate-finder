import React from 'react';
import {
    UserPlus,
    MapPin,
    Briefcase,
    Clock,
    Star,
    CheckCircle2,
    Sparkles,
    ArrowUpRight,
} from 'lucide-react';

const fallbackAvatar = 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';

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
    const avatarUrl = user.avatar || fallbackAvatar;
    const skills = Array.isArray(user.skills) ? user.skills : [];
    const visibleSkills = skills.slice(0, 4);
    const extraSkills = Math.max(0, skills.length - visibleSkills.length);
    const semanticMatch =
        typeof user.semanticScore === 'number'
            ? `${Math.round(user.semanticScore * 100)}% Match`
            : null;
    const followerCount = Number(user.followerCount || user.starCount || 0);

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
            className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-cyan-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            <div className="pointer-events-none absolute -right-14 -top-14 h-28 w-28 rounded-full bg-cyan-100/80 blur-2xl" />

            {semanticMatch ? (
                <div className="absolute right-4 top-4 z-10">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <Sparkles size={11} className="fill-emerald-200" />
                        {semanticMatch}
                    </div>
                </div>
            ) : null}

            <div className="relative z-10">
                <div className="mb-4 flex items-start gap-3">
                    <div className="relative">
                        <img
                            src={avatarUrl}
                            alt={user.name}
                            className="h-16 w-16 rounded-2xl border-2 border-white object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
                        />
                        {isConnected ? (
                            <div
                                className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-emerald-500 p-0.5 text-white"
                                title="Connected"
                            >
                                <CheckCircle2 size={12} fill="currentColor" />
                            </div>
                        ) : null}
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5 pr-6">
                        <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-blue-700 sm:text-lg">
                            {user.name}
                        </h3>
                        <p className="truncate text-sm font-semibold text-blue-700">{user.role || 'Developer'}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={11} />
                            <span className="truncate">{user.location || 'Remote'}</span>
                        </div>
                    </div>
                </div>

                <p className="mb-4 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-slate-600">
                    {user.bio || 'Ready to collaborate on meaningful projects.'}
                </p>

                <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                        <Briefcase size={12} className="text-slate-400" />
                        {user.experienceLevel || 'Junior'}
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                        <Clock size={12} className="text-slate-400" />
                        {user.availabilityStatus || 'Part-time'}
                    </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-1.5">
                    {visibleSkills.map((skill, index) => (
                        <span
                            key={`${skill}-${index}`}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                            {skill}
                        </span>
                    ))}
                    {extraSkills > 0 ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            +{extraSkills}
                        </span>
                    ) : null}
                    {skills.length === 0 ? (
                        <span className="px-1 text-xs italic text-slate-400">No skills listed</span>
                    ) : null}
                </div>

                <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                    <span className="inline-flex items-center gap-1">
                        <Star size={12} className="fill-amber-200" />
                        Community stars
                    </span>
                    <span className="font-semibold">{followerCount}</span>
                </div>

                <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-4">
                    {isConnected ? (
                        <button
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-500"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <UserPlus size={15} />
                            Connected
                        </button>
                    ) : (
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                onConnect?.(user);
                            }}
                            disabled={isConnecting}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isConnecting ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            ) : (
                                <UserPlus size={15} />
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
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                            isFollowed
                                ? 'border-amber-200 bg-amber-50 text-amber-500'
                                : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
                        }`}
                        title={isFollowed ? 'Unfollow' : 'Follow'}
                    >
                        {isFollowLoading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
                        ) : (
                            <Star size={17} className={isFollowed ? 'fill-current' : ''} />
                        )}
                    </button>

                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            onViewDetails?.(user);
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-700"
                        title="View profile"
                    >
                        <ArrowUpRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeammateCard;
