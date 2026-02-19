import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Briefcase, Loader2, Mail, MapPin, Star, Users } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const TeammateProfile = () => {
    const { userId } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fallbackAvatar = useMemo(
        () => 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
        []
    );
    const normalizeUrl = (value) => {
        const trimmed = String(value || '').trim();
        if (!trimmed) return '';
        return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/api/user/${userId}/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch user profile');
                }
                setProfile(data);
            } catch (fetchError) {
                setError(fetchError.message || 'Failed to fetch user profile');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchProfile();
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto min-h-[40vh] flex items-center justify-center text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading profile...
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                    {error || 'Profile not found'}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 page-shell">
            <div className="surface-card rounded-2xl p-6">
                <div className="flex flex-col md:flex-row gap-5">
                    <img
                        src={profile.avatar || fallbackAvatar}
                        alt={profile.name || 'Teammate'}
                        className="w-24 h-24 rounded-full object-cover border border-gray-200"
                    />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{profile.name || 'Teammate'}</h1>
                        <p className="text-blue-700 font-medium">{profile.role || 'Contributor'}</p>
                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                            <p className="inline-flex items-center gap-2">
                                <Mail size={14} />
                                {profile.email || 'No email'}
                            </p>
                            <p className="inline-flex items-center gap-2">
                                <MapPin size={14} />
                                {profile.location || 'Remote'}
                            </p>
                            <p className="inline-flex items-center gap-2">
                                <Briefcase size={14} />
                                {profile.experienceLevel || 'Junior'} - {profile.availabilityStatus || 'Part-time'}
                            </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                                <Star size={12} className="fill-amber-500 text-amber-500" />
                                Stars: {Number(profile.starCount) || 0}
                            </span>
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                Followers: {Number(profile.followerCount) || 0}
                            </span>
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Following: {Number(profile.followingCount) || 0}
                            </span>
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 inline-flex items-center gap-1">
                                <Users size={12} />
                                Connected: {Number(profile.connectedCount) || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="surface-card rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Bio</h2>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                    {profile.bio || 'No bio added yet.'}
                </p>
            </div>

            <div className="surface-card rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                    {(profile.skills || []).length ? (
                        profile.skills.map((skill) => (
                            <span
                                key={skill}
                                className="px-3 py-1 text-xs font-medium rounded-full border border-gray-200 bg-gray-50 text-gray-700"
                            >
                                {skill}
                            </span>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">No skills listed.</p>
                    )}
                </div>
            </div>

            {(profile.website || profile?.socialLinks?.linkedin || profile?.socialLinks?.twitter || profile?.socialLinks?.portfolio || profile?.socialLinks?.other) ? (
                <div className="surface-card rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Links</h2>
                    <div className="flex flex-wrap gap-2">
                        {profile.website ? (
                            <a
                                href={normalizeUrl(profile.website)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Website
                            </a>
                        ) : null}
                        {profile?.socialLinks?.linkedin ? (
                            <a
                                href={normalizeUrl(profile.socialLinks.linkedin)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                                LinkedIn
                            </a>
                        ) : null}
                        {profile?.socialLinks?.twitter ? (
                            <a
                                href={normalizeUrl(profile.socialLinks.twitter)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
                            >
                                X / Twitter
                            </a>
                        ) : null}
                        {profile?.socialLinks?.portfolio ? (
                            <a
                                href={normalizeUrl(profile.socialLinks.portfolio)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                                Portfolio
                            </a>
                        ) : null}
                        {profile?.socialLinks?.other ? (
                            <a
                                href={normalizeUrl(profile.socialLinks.other)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                                Other
                            </a>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default TeammateProfile;
