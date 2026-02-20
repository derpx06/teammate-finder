import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import VirtualCTOChatWidget from '../CreateProject/VirtualCTOChatWidget';
import { API_BASE_URL } from '../../config/api';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkOnboarding = () => {
            try {
                const userStr = localStorage.getItem('authUser');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user && !user.onboardingCompleted) {
                        navigate('/onboarding');
                    }
                }
            } catch (error) {
                console.error('Error parsing user data', error);
            }
        };

        checkOnboarding();
    }, [navigate]);

    const architectProjectIdeaFromAnywhere = async (idea, onChunk) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('You need to be logged in to use Virtual CTO');
        }

        const streamResponse = await fetch(`${API_BASE_URL}/api/project/virtual-cto/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ idea }),
        });

        if (!streamResponse.ok || !streamResponse.body) {
            const planResponse = await fetch(`${API_BASE_URL}/api/project/virtual-cto/plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ idea }),
            });
            const planData = await planResponse.json().catch(() => ({}));
            if (!planResponse.ok) {
                throw new Error(planData.error || 'Failed to generate project blueprint');
            }
            const suggestedIdeas = Array.isArray(planData.suggestedIdeas) ? planData.suggestedIdeas : [];
            return {
                plan: suggestedIdeas.length > 0 ? null : (planData.plan || null),
                teammates: Array.isArray(planData.candidates) ? planData.candidates : [],
                teammateSuggestions: Array.isArray(planData.teammateSuggestions) ? planData.teammateSuggestions : [],
                suggestedIdeas,
                ecosystemInsights: planData.ecosystemInsights || null,
                meta: planData.meta || null,
                applied: false,
            };
        }

        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalPayload = null;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                let chunk = null;
                try {
                    chunk = JSON.parse(trimmed);
                } catch (_error) {
                    continue;
                }

                if (typeof onChunk === 'function') {
                    onChunk(chunk);
                }

                if (chunk.type === 'error') {
                    throw new Error(chunk.message || 'Virtual CTO stream failed');
                }

                if (chunk.type === 'done') {
                    finalPayload = chunk.data || null;
                }
            }
        }

        const planData = finalPayload || {};
        const teammates = Array.isArray(planData.candidates) ? planData.candidates : [];
        const teammateSuggestions = Array.isArray(planData.teammateSuggestions)
            ? planData.teammateSuggestions
            : [];
        const suggestedIdeas = Array.isArray(planData.suggestedIdeas) ? planData.suggestedIdeas : [];
        const ecosystemInsights = planData.ecosystemInsights || null;
        const meta = planData.meta || null;

        return {
            plan: suggestedIdeas.length > 0 ? null : (planData.plan || null),
            teammates,
            teammateSuggestions,
            suggestedIdeas,
            ecosystemInsights,
            meta,
            applied: false,
        };
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.4),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(165,243,252,0.35),transparent_34%),linear-gradient(180deg,#f4f8fc_0%,#f8fbff_35%,#fbfdff_100%)]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />

            <div className="relative z-10 flex min-h-screen">
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
                    <TopBar onMenuClick={() => setIsSidebarOpen(true)} />

                    <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4 lg:px-8 lg:pb-10 lg:pt-6 2xl:px-10">
                        {children}
                    </main>
                </div>
            </div>

            {location.pathname !== '/create-project' ? (
                <VirtualCTOChatWidget onArchitectIdea={architectProjectIdeaFromAnywhere} />
            ) : null}
        </div>
    );
};

export default DashboardLayout;
