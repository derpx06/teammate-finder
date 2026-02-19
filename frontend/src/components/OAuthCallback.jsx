import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const parseUserPayload = (userStr) => {
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (_error) {
            try {
                return JSON.parse(decodeURIComponent(userStr));
            } catch (__error) {
                return null;
            }
        }
    };

    useEffect(() => {
        const mode = searchParams.get('mode');
        const status = searchParams.get('status');
        const token = searchParams.get('token');
        const userStr = searchParams.get('user');
        const error = searchParams.get('error');

        // Popup callback for GitHub account linking
        if (mode === 'github_connect') {
            const parsedUser = parseUserPayload(userStr);
            const isSuccess = status === 'success' && token && parsedUser;

            if (isSuccess) {
                const previousUser = (() => {
                    try {
                        return JSON.parse(localStorage.getItem('authUser') || '{}');
                    } catch (_error) {
                        return {};
                    }
                })();

                localStorage.setItem('authToken', token);
                localStorage.setItem('authUser', JSON.stringify({ ...previousUser, ...parsedUser }));
            }

            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(
                    {
                        type: 'github-connect',
                        status: isSuccess ? 'success' : 'error',
                        error: error || 'github_connect_failed',
                        user: parsedUser,
                    },
                    window.location.origin
                );
                window.close();
                return;
            }

            navigate(isSuccess ? '/onboarding' : '/onboarding?error=github_connect_failed');
            return;
        }

        const user = parseUserPayload(userStr);

        if (token && user) {
            try {
                localStorage.setItem('authToken', token);
                localStorage.setItem('authUser', JSON.stringify(user));

                // Redirect to dashboard
                navigate('/dashboard');
            } catch (error) {
                console.error('Failed to parse user data:', error);
                navigate('/auth?error=oauth_failed');
            }
        } else {
            navigate('/auth?error=oauth_failed');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Completing Authentication...</h2>
                <p className="text-gray-500 mt-2">Please wait while we finalize your GitHub access.</p>
            </div>
        </div>
    );
};

export default OAuthCallback;
