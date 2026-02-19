import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Hash, Loader2, MessageSquareText, Search, Users } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const ChatSidebar = ({
    conversations,
    activeId,
    onSelect,
    searchQuery,
    setSearchQuery,
    user,
    accessChat,
    isBusy = false,
}) => {
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (!query) {
            setSearchResults([]);
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${API_BASE_URL}/api/user?search=${query}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setSearchResults(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load the search results", error);
            setLoading(false);
        }
    };

    const formatPreviewTime = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return format(date, 'hh:mm a');
    };

    const getSender = (loggedUser, participants) => {
        if (!Array.isArray(participants) || participants.length === 0) return null;
        if (participants.length === 1) return participants[0];
        const loggedUserId = loggedUser?._id || loggedUser?.id;
        return participants[0]?._id === loggedUserId ? participants[1] : participants[0];
    };

    const normalizedConversations = useMemo(
        () => (Array.isArray(conversations) ? conversations : []),
        [conversations]
    );

    return (
        <aside className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-700/50 w-full md:w-96 text-slate-100">
            <div className="px-4 pt-4 pb-3 border-b border-slate-700/60">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-base font-semibold tracking-tight">Conversations</h2>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            {normalizedConversations.length} active chat{normalizedConversations.length === 1 ? '' : 's'}
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-full border border-cyan-300/30 bg-cyan-400/10 text-cyan-200">
                        <MessageSquareText size={12} />
                        Team Chat
                    </span>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-800/70 border border-slate-600/70 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:border-cyan-400/60 transition-all"
                    />
                    {loading ? (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={14} />
                    ) : null}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {searchQuery ? (
                    <div className="p-2">
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 px-2 py-2">Search Results</p>
                        {Array.isArray(searchResults) && searchResults.length > 0 ? (
                            searchResults.map((candidate) => (
                                <button
                                    key={candidate._id}
                                    type="button"
                                    onClick={() => accessChat(candidate._id)}
                                    className="w-full text-left p-3 flex items-center gap-3 rounded-xl transition-colors hover:bg-slate-800/70"
                                >
                                    <img
                                        src={candidate.avatar || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"}
                                        alt={candidate.name}
                                        className="w-10 h-10 rounded-full object-cover border border-slate-600"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-slate-100 truncate">{candidate.name}</h3>
                                        <p className="text-xs text-slate-400 truncate">{candidate.email}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-6 text-center text-sm text-slate-400">
                                No users found for "{searchQuery}".
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-2">
                        {normalizedConversations.length === 0 ? (
                            <div className="mx-2 mt-8 p-5 rounded-2xl border border-slate-700 bg-slate-800/40 text-center">
                                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-slate-700/60 text-slate-300 flex items-center justify-center">
                                    <MessageSquareText size={18} />
                                </div>
                                <p className="text-sm text-slate-200 font-medium">No conversations yet</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Search teammates above to start chatting.
                                </p>
                            </div>
                        ) : null}

                        {normalizedConversations.map((chat) => {
                        const currentUserId = user?._id || user?.id;
                        const isGroupChat = Boolean(chat?.isGroupChat || chat?.project);
                        const sender = getSender(user, chat.participants);
                        const chatTitle = isGroupChat
                            ? (chat?.chatName || chat?.project?.title || 'Project Group')
                            : (sender?.name || 'Direct Chat');
                        const lastMessageSenderId = chat?.lastMessage?.sender?._id || chat?.lastMessage?.sender?.id;
                        const lastMessageSenderName = chat?.lastMessage?.sender?.name || '';
                        const previewPrefix = lastMessageSenderName
                            ? (String(lastMessageSenderId) === String(currentUserId)
                                ? 'You: '
                                : `${lastMessageSenderName}: `)
                            : '';
                        const previewText = chat?.lastMessage?.content || (isGroupChat ? 'Project group created' : 'No messages yet');

                        return (
                            <button
                                type="button"
                                key={chat._id}
                                onClick={() => onSelect(chat)}
                                className={`w-full text-left p-3 flex items-center gap-3 rounded-xl transition-all mb-1 border ${activeId === chat._id
                                        ? 'bg-cyan-400/10 border-cyan-300/40 shadow-[0_0_0_1px_rgba(103,232,249,0.15)]'
                                        : 'border-transparent hover:bg-slate-800/70'
                                    }`}
                            >
                                <div className="relative">
                                    {isGroupChat ? (
                                        <div className="w-11 h-11 rounded-full border border-cyan-300/25 bg-cyan-400/10 text-cyan-200 flex items-center justify-center">
                                            <Users size={17} />
                                        </div>
                                    ) : (
                                        <img
                                            src={sender?.avatar || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"}
                                            alt={sender?.name || 'User'}
                                            className="w-11 h-11 rounded-full object-cover border border-slate-600"
                                        />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-sm font-semibold truncate ${activeId === chat._id ? 'text-cyan-100' : 'text-slate-100'}`}>
                                            {chatTitle}
                                        </h3>
                                        <span className="text-[10px] text-slate-400 ml-2 shrink-0">
                                            {formatPreviewTime(chat?.lastMessage?.createdAt || chat?.updatedAt)}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-400 truncate">
                                        <span className="font-semibold text-slate-300">{previewPrefix}</span>
                                        {previewText}
                                    </p>

                                    <div className="mt-1.5">
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${isGroupChat
                                                ? 'border-cyan-300/30 text-cyan-200 bg-cyan-500/10'
                                                : 'border-slate-500/40 text-slate-300 bg-slate-700/50'
                                            }`}>
                                            {isGroupChat ? <Users size={10} /> : <Hash size={10} />}
                                            {isGroupChat ? 'Group' : 'Direct'}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    </div>
                )}

                {isBusy ? (
                    <div className="px-4 pb-4">
                        <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-300 flex items-center gap-2">
                            <Loader2 size={13} className="animate-spin text-cyan-300" />
                            Opening chat...
                        </div>
                    </div>
                ) : null}
            </div>
        </aside>
    );
};

export default ChatSidebar;
