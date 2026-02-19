import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Loader2, MoreVertical, Paperclip, Phone, Send, Users, Video } from 'lucide-react';
import MessageBubble from './MessageBubble';

const ChatWindow = ({
    activeConversation,
    currentUser,
    messages,
    onSend,
    connectionStatus,
    onBack,
    showMobileBack = false,
}) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeConversation?._id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const sent = onSend(newMessage);
        if (sent) {
            setNewMessage('');
        }
    };

    const handleComposerKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (newMessage.trim() && connectionStatus === 'connected') {
                const sent = onSend(newMessage);
                if (sent) setNewMessage('');
            }
        }
    };

    const getOtherUser = () => {
        if (!activeConversation || !activeConversation.participants || !currentUser) return null;
        // Check if participants is an array and has at least 2 elements
        if (!Array.isArray(activeConversation.participants) || activeConversation.participants.length < 2) return null;

        const currentUserId = currentUser.id || currentUser._id;

        return activeConversation.participants[0]._id === currentUserId
            ? activeConversation.participants[1]
            : activeConversation.participants[0];
    };

    const otherUser = getOtherUser();
    const isGroupChat = Boolean(activeConversation?.isGroupChat || activeConversation?.project);
    const groupTitle = activeConversation?.chatName || activeConversation?.project?.title || 'Project Group';
    const participantCount = Array.isArray(activeConversation?.participants)
        ? activeConversation.participants.length
        : 0;

    if (!activeConversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-cyan-50 text-slate-500 flex-col gap-4">
                <div className="w-20 h-20 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center">
                    <Send size={32} className="opacity-40" />
                </div>
                <p className="font-medium">Select a conversation to start messaging</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-slate-50 via-white to-slate-50">
            {/* Header */}
            <div className="bg-white/95 backdrop-blur p-3.5 sm:p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {showMobileBack ? (
                        <button
                            type="button"
                            onClick={onBack}
                            className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                            aria-label="Back to conversations"
                        >
                            <ChevronLeft size={16} />
                        </button>
                    ) : null}

                    <div className="relative">
                        {isGroupChat ? (
                            <div className="w-10 h-10 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center">
                                <Users size={18} />
                            </div>
                        ) : (
                            <img
                                src={otherUser?.avatar || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"}
                                alt={otherUser?.name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        )}
                        {/* Online status indicator can be added here if we have real-time online status */}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 leading-tight truncate">
                            {isGroupChat ? groupTitle : (otherUser?.name || 'Chat')}
                        </h3>
                        <span className={`text-xs font-medium inline-flex items-center gap-1.5 ${connectionStatus === 'connected'
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {connectionStatus === 'connected'
                                ? (isGroupChat ? `${participantCount} members` : 'Connected')
                                : 'Connecting...'}
                        </span>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-slate-400">
                    <button type="button" className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors"><Phone size={18} /></button>
                    <button type="button" className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors"><Video size={18} /></button>
                    <button type="button" className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors"><MoreVertical size={18} /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-[radial-gradient(circle_at_top_left,rgba(207,250,254,0.45),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(224,231,255,0.35),transparent_35%)]">
                {Array.isArray(messages) && messages.length > 0 ? messages.map((msg) => (
                    <MessageBubble
                        key={msg._id || msg.id}
                        {...msg}
                        isMe={msg?.sender?._id === (currentUser.id || currentUser._id)}
                        showSenderName={isGroupChat}
                        avatar={
                            (msg?.sender?._id === (currentUser.id || currentUser._id))
                                ? (currentUser.avatar || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg")
                                : (msg?.sender?.avatar || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg")
                        }
                    />
                )) : (
                    <div className="h-full min-h-[240px] flex items-center justify-center">
                        <div className="text-center rounded-2xl border border-slate-200 bg-white/80 px-6 py-5 shadow-sm">
                            <p className="text-sm font-semibold text-slate-700">No messages yet</p>
                            <p className="text-xs text-slate-500 mt-1">Start the conversation with your teammates.</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white/95 backdrop-blur p-2.5 sm:p-4 border-t border-slate-200">
                <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto">
                    <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100 hidden sm:inline-flex"
                        disabled={connectionStatus !== 'connected'}
                    >
                        <Paperclip size={20} />
                    </button>

                    <textarea
                        rows={1}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleComposerKeyDown}
                        placeholder={connectionStatus === 'connected' ? "Type a message..." : "Connecting to chat server..."}
                        disabled={connectionStatus !== 'connected'}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all font-medium text-slate-700 resize-none min-h-[46px] max-h-28"
                    />

                    <button
                        type="submit"
                        disabled={!newMessage.trim() || connectionStatus !== 'connected'}
                        className={`p-3 rounded-full transition-all ${newMessage.trim() && connectionStatus === 'connected'
                                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:brightness-105 shadow-md'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {connectionStatus !== 'connected' ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
