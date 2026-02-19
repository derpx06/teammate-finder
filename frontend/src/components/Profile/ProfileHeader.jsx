import React from 'react';
import {
    MapPin,
    Link as LinkIcon,
    Edit2,
    CheckCircle,
    Linkedin,
    Twitter,
    Globe,
    ExternalLink,
    Sparkles,
    Github,
    Star,
    Users,
} from 'lucide-react';

const ProfileHeader = ({ user, onEdit, onEditSkills, topLanguage, reposLoading, githubSummary }) => {
    const heading = user.role || user.qualifications || 'Member';
    const githubHandle = githubSummary?.profile?.login || user.githubUsername;
    const githubFollowers = githubSummary?.stats?.followers;
    const followerCount = Number(user.followerCount) || 0;
    const followingCount = Number(user.followingCount) || 0;
    const connectedCount = Number(user.connectedCount) || 0;
    const starCount = Number(user.starCount) || 0;
    const socialLinks = user?.socialLinks || {};

    const normalizeUrl = (value) => {
        const trimmed = String(value || '').trim();
        if (!trimmed) return '';
        return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    };

    const socials = [
        {
            key: 'linkedin',
            label: 'LinkedIn',
            icon: <Linkedin size={14} />,
            href: normalizeUrl(socialLinks.linkedin),
        },
        {
            key: 'twitter',
            label: 'X / Twitter',
            icon: <Twitter size={14} />,
            href: normalizeUrl(socialLinks.twitter),
        },
        {
            key: 'portfolio',
            label: 'Portfolio',
            icon: <Globe size={14} />,
            href: normalizeUrl(socialLinks.portfolio),
        },
        {
            key: 'other',
            label: 'Other',
            icon: <LinkIcon size={14} />,
            href: normalizeUrl(socialLinks.other),
        },
    ].filter((item) => item.href);

    const websiteHref = normalizeUrl(user.website);

    return (
        <section className="surface-card overflow-hidden rounded-3xl">
            <div className="relative h-52 overflow-hidden bg-[linear-gradient(120deg,#0f172a_0%,#1e293b_58%,#075985_130%)] sm:h-56">
                <div className="absolute -left-16 -top-14 h-48 w-48 rounded-full bg-cyan-300/25 blur-3xl" />
                <div className="absolute -right-16 top-4 h-52 w-52 rounded-full bg-blue-400/25 blur-3xl" />

                <button
                    onClick={onEdit}
                    className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                    <Edit2 size={14} />
                    Edit Profile
                </button>

                <div className="absolute bottom-4 left-6 sm:left-8">
                    <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100">
                        <Sparkles size={12} />
                        Personal Hub
                    </p>
                </div>
            </div>

            <div className="px-5 pb-7 sm:px-8 sm:pb-8">
                <div className="relative -mt-14 mb-4 sm:-mt-16">
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-xl sm:h-32 sm:w-32"
                    />
                </div>

                <div className="space-y-5">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                            {user.name}
                            {user.verified ? <CheckCircle className="h-5 w-5 text-blue-600" /> : null}
                        </h1>
                        <p className="mt-1 text-sm font-semibold text-blue-700 sm:text-base">{heading}</p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 sm:text-sm">
                            {user.age ? <span>Age: {user.age}</span> : null}
                            {user.qualifications ? <span>{user.qualifications}</span> : null}
                            {user.githubConnected && githubHandle ? <span>GitHub: @{githubHandle}</span> : null}
                            {user.githubConnected && typeof githubFollowers === 'number' ? (
                                <span>Followers: {githubFollowers}</span>
                            ) : null}
                            {user.githubConnected ? (
                                <span>Top Language: {reposLoading ? '...' : topLanguage}</span>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs sm:text-sm">
                            <p className="inline-flex items-center gap-1 text-amber-700">
                                <Star size={12} />
                                Stars
                            </p>
                            <p className="mt-1 font-bold text-slate-900">{starCount}</p>
                        </div>
                        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs sm:text-sm">
                            <p className="inline-flex items-center gap-1 text-blue-700">
                                <Users size={12} />
                                Followers
                            </p>
                            <p className="mt-1 font-bold text-slate-900">{followerCount}</p>
                        </div>
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs sm:text-sm">
                            <p className="text-indigo-700">Following</p>
                            <p className="mt-1 font-bold text-slate-900">{followingCount}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs sm:text-sm">
                            <p className="text-emerald-700">Connected</p>
                            <p className="mt-1 font-bold text-slate-900">{connectedCount}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        {user.location ? (
                            <div className="inline-flex items-center gap-1.5">
                                <MapPin size={15} />
                                {user.location}
                            </div>
                        ) : null}

                        {websiteHref ? (
                            <a
                                href={websiteHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 transition hover:text-blue-700"
                            >
                                <LinkIcon size={15} />
                                {websiteHref.replace(/^https?:\/\//, '')}
                                <ExternalLink size={12} />
                            </a>
                        ) : null}

                        {user.githubConnected && githubHandle ? (
                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                                <Github size={15} />@{githubHandle}
                            </span>
                        ) : null}
                    </div>

                    {socials.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {socials.map((item) => (
                                <a
                                    key={item.key}
                                    href={item.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                >
                                    {item.icon}
                                    {item.label}
                                    <ExternalLink size={12} />
                                </a>
                            ))}
                        </div>
                    ) : null}

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                                Profile Description
                            </h3>
                            <button
                                onClick={onEdit}
                                className="text-xs font-semibold text-blue-700 transition hover:text-blue-800"
                            >
                                Edit
                            </button>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                            {user.bio || 'No description added yet. Click Edit to add your profile description.'}
                        </p>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                                Verified Skills
                            </h3>
                            <button
                                onClick={onEditSkills || onEdit}
                                className="text-xs font-semibold text-blue-700 transition hover:text-blue-800"
                            >
                                Add Skill
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {user.skills.length ? (
                                user.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                                    >
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-slate-500">No skills added yet. Click Add Skill.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProfileHeader;
