import React from 'react';
import { MapPin, Link as LinkIcon, Edit2, CheckCircle } from 'lucide-react';

const ProfileHeader = ({ user, onEdit, onEditSkills, topLanguage, reposLoading, githubSummary }) => {
    const heading = user.role || user.qualifications || 'Member';
    const githubHandle = githubSummary?.profile?.login || user.githubUsername;
    const githubFollowers = githubSummary?.stats?.followers;
    const followerCount = Number(user.followerCount) || 0;
    const followingCount = Number(user.followingCount) || 0;
    const connectedCount = Number(user.connectedCount) || 0;
    const starCount = Number(user.starCount) || 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            {/* Banner */}
            <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                <button
                    onClick={onEdit}
                    className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                    <Edit2 size={18} />
                </button>
            </div>

            {/* Profile Info */}
            <div className="px-8 pb-8">
                <div className="relative flex justify-between items-start">
                    <div className="-mt-16 mb-4">
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                        />
                    </div>
                    <div className="mt-4 flex gap-3">
                        {/* Social Links could go here */}
                    </div>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {user.name}
                        {user.verified && <CheckCircle className="w-5 h-5 text-blue-500" />}
                    </h1>
                    <p className="text-gray-500 font-medium">{heading}</p>

                    <div className="mt-2 text-sm text-gray-500 flex flex-wrap gap-4">
                        {user.age ? <span>Age: {user.age}</span> : null}
                        {user.qualifications ? <span>{user.qualifications}</span> : null}
                        {user.githubConnected && githubHandle ? <span>GitHub: @{githubHandle}</span> : null}
                        {user.githubConnected && typeof githubFollowers === 'number' ? <span>Followers: {githubFollowers}</span> : null}
                        {user.githubConnected ? (
                            <span>
                                Top Language: {reposLoading ? '...' : topLanguage}
                            </span>
                        ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Stars: {starCount}
                        </span>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Followers: {followerCount}
                        </span>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Following: {followingCount}
                        </span>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
                            Connected: {connectedCount}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                        {user.location && (
                            <div className="flex items-center gap-1">
                                <MapPin size={16} />
                                {user.location}
                            </div>
                        )}
                        {user.website && (
                            <a href={user.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                <LinkIcon size={16} />
                                {user.website.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                    </div>

                    <div className="mt-5 p-4 bg-gray-50 border border-gray-100 rounded-xl max-w-3xl">
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Profile Description</h3>
                            <button
                                onClick={onEdit}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Edit
                            </button>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                            {user.bio || 'No description added yet. Click Edit to add your profile description.'}
                        </p>
                    </div>

                    {/* Verified Skills */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Verified Skills</h3>
                            <button
                                onClick={onEditSkills || onEdit}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Add Skill
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {user.skills.length ? (
                                user.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100"
                                    >
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500">No skills added yet. Click Add Skill.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
