import React from 'react';
import { format } from 'date-fns';

const MessageBubble = ({
    content,
    sender,
    createdAt,
    isMe,
    avatar,
    text,
    timestamp,
    showSenderName = false,
}) => {
    const messageContent = String(content || text || '').trim();
    const senderName = sender?.name || sender?.email || 'Teammate';

    let messageTime;
    if (createdAt) {
        const date = new Date(createdAt);
        messageTime = Number.isNaN(date.getTime()) ? '' : format(date, 'hh:mm a');
    } else if (timestamp) {
        messageTime = timestamp;
    } else {
        messageTime = '';
    }

    return (
        <div className={`flex items-end gap-2.5 mb-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            {!isMe && (
                <img
                    src={avatar || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"}
                    alt={senderName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
                />
            )}

            <div className={`max-w-[80%] md:max-w-[68%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {showSenderName ? (
                    <span className="text-[11px] text-slate-500 mb-1 px-1">{senderName}</span>
                ) : null}
                <div
                    className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words ${isMe
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-md'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                        }`}
                >
                    {messageContent || ' '}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {messageTime}
                </span>
            </div>
        </div>
    );
};

export default MessageBubble;
