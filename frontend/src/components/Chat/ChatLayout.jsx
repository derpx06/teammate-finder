import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import io from 'socket.io-client';
import { API_BASE_URL } from '../../config/api';

const ENDPOINT = API_BASE_URL;
var socket;

const ChatLayout = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedChatRef = useRef(null);
    const [selectedChat, setSelectedChat] = useState();
    const [chats, setChats] = useState([]);
    const [user, setUser] = useState();
    const [messages, setMessages] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [socketConnected, setSocketConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const projectIdFromQuery = searchParams.get('projectId');

    useEffect(() => {
        const media = window.matchMedia('(max-width: 767px)');
        const syncViewport = () => setIsMobileViewport(media.matches);
        syncViewport();
        media.addEventListener('change', syncViewport);
        return () => media.removeEventListener('change', syncViewport);
    }, []);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("authUser"));
        setUser(userInfo);
    }, []);

    useEffect(() => {
        if (user) {
            socket = io(ENDPOINT);
            const normalizedUser = {
                ...user,
                _id: user._id || user.id,
            };

            socket.emit("setup", normalizedUser);
            socket.on("connected", () => setSocketConnected(true));

            const syncChatPreview = (newMessageRecieved) => {
                const chatId = newMessageRecieved?.chat?._id;
                if (!chatId) return;

                setChats((prev) => {
                    const updated = prev.map((chat) =>
                        chat._id === chatId ? { ...chat, lastMessage: newMessageRecieved } : chat
                    );

                    const target = updated.find((chat) => chat._id === chatId);
                    if (!target) return updated;

                    return [target, ...updated.filter((chat) => chat._id !== chatId)];
                });
            };

            const handleMessageReceived = (newMessageRecieved) => {
                syncChatPreview(newMessageRecieved);

                if (
                    !selectedChatRef.current ||
                    selectedChatRef.current._id !== newMessageRecieved?.chat?._id
                ) {
                    // give notification
                    return;
                }

                setMessages((prev) => [...prev, newMessageRecieved]);
            };

            socket.on("message received", handleMessageReceived);

            return () => {
                socket.off("connected");
                socket.off("message received", handleMessageReceived);
                socket.disconnect();
            };
        }
    }, [user]);

    const fetchChats = async () => {
        try {
            const token = localStorage.getItem("authToken");

            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setChats(data);
        } catch (error) {
            console.error("Failed to load the chats", error);
        }
    };

    useEffect(() => {
        if (user) fetchChats();
    }, [user]);

    const accessChat = async (userId) => {
        try {
            setLoading(true);
            const token = localStorage.getItem("authToken");

            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId }),
            });
            const data = await response.json();

            setChats((prev) => (
                prev.some((chat) => chat._id === data._id) ? prev : [data, ...prev]
            ));
            setSelectedChat(data);
            setLoading(false);
            setSearchQuery(""); // Clear search after selection
        } catch (error) {
            console.error("Error fetching the chat", error);
            setLoading(false);
        }
    };

    const accessProjectChat = useCallback(async (projectId) => {
        if (!projectId) return;
        try {
            setLoading(true);
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${API_BASE_URL}/api/chat/project/${projectId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to open project chat");
            }

            setChats((prev) => (
                prev.some((chat) => chat._id === data._id) ? prev : [data, ...prev]
            ));
            setSelectedChat(data);
            setSearchQuery("");
        } catch (error) {
            console.error("Error opening project chat", error);
        } finally {
            setLoading(false);
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('projectId');
            setSearchParams(nextParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        if (!user || !projectIdFromQuery) return;
        accessProjectChat(projectIdFromQuery);
    }, [user, projectIdFromQuery, accessProjectChat]);

    const fetchMessages = useCallback(async () => {
        if (!selectedChat) return;

        try {
            const token = localStorage.getItem("authToken");

            const response = await fetch(`${API_BASE_URL}/api/message/${selectedChat._id}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setMessages(data);
            if (socket) {
                socket.emit("join chat", selectedChat._id);
            }
        } catch (error) {
            console.error("Failed to load the messages", error);
        }
    }, [selectedChat]);

    useEffect(() => {
        fetchMessages();
        selectedChatRef.current = selectedChat;
    }, [fetchMessages, selectedChat]);

    const sendMessage = async (content) => {
        try {
            const token = localStorage.getItem("authToken");

            const response = await fetch(`${API_BASE_URL}/api/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    content: content,
                    chatId: selectedChat._id,
                }),
            });
            const data = await response.json();

            socket.emit("new message", data);
            setMessages((prev) => [...prev, data]);
            setChats((prev) => {
                const updated = prev.map((chat) =>
                    chat._id === data?.chat?._id ? { ...chat, lastMessage: data } : chat
                );
                const target = updated.find((chat) => chat._id === data?.chat?._id);
                if (!target) return updated;
                return [target, ...updated.filter((chat) => chat._id !== data?.chat?._id)];
            });
            return true;
        } catch (error) {
            console.error("Failed to send the message", error);
            return false;
        }
    };

    return (
        <div className="page-shell h-[calc(100dvh-8.25rem)] md:h-[calc(100vh-8rem)] rounded-3xl overflow-hidden border border-slate-200/80 shadow-[0_18px_60px_-25px_rgba(15,23,42,0.55)] bg-white/92 backdrop-blur-sm">
            <div className="h-full flex bg-gradient-to-br from-slate-900/5 via-white to-cyan-50/40">
                <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-1 md:flex-none`}>
                    <ChatSidebar
                        conversations={chats}
                        activeId={selectedChat?._id}
                        onSelect={(chat) => setSelectedChat(chat)}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        user={user}
                        accessChat={accessChat}
                        isBusy={loading}
                    />
                </div>

                <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 min-w-0`}>
                    <ChatWindow
                        activeConversation={selectedChat}
                        currentUser={user}
                        messages={messages}
                        onSend={sendMessage}
                        connectionStatus={socketConnected ? 'connected' : 'connecting'}
                        onBack={() => setSelectedChat(null)}
                        showMobileBack={isMobileViewport}
                    />
                </div>
            </div>
        </div>
    );
};


export default ChatLayout;
