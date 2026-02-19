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
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Bio</h2>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                    {profile.bio || 'No bio added yet.'}
                </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
        </div>
    );
};

export default TeammateProfile;
