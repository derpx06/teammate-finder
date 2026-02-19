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
                    // Check if onboarding is NOT completed
                    if (user && !user.onboardingCompleted) {
                        navigate('/onboarding');
                    }
                }
            } catch (error) {
                console.error("Error parsing user data", error);
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
            return {
                plan: planData.plan || null,
                teammates: Array.isArray(planData.candidates) ? planData.candidates : [],
                teammateSuggestions: Array.isArray(planData.teammateSuggestions) ? planData.teammateSuggestions : [],
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
        const ecosystemInsights = planData.ecosystemInsights || null;
        const meta = planData.meta || null;

        return {
            plan: planData.plan || null,
            teammates,
            teammateSuggestions,
            ecosystemInsights,
            meta,
            applied: false,
        };
    };

    return (
        <div className="dashboard-shell min-h-screen flex text-slate-900">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="dashboard-main flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
                <TopBar onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-1 p-4 lg:p-8 2xl:p-10 overflow-y-auto page-shell">
                    {children}
                </main>
            </div>

            {location.pathname !== '/create-project' ? (
                <VirtualCTOChatWidget onArchitectIdea={architectProjectIdeaFromAnywhere} />
            ) : null}
        </div>
    );
};

export default DashboardLayout;
