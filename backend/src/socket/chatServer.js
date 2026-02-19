const { randomUUID } = require('crypto');
const { WebSocketServer } = require('ws');

const INITIAL_CONVERSATIONS = [
  {
    id: 1,
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    online: true,
    messages: [
      {
        id: '1-1',
        text: 'Hi Alex, how is the project coming along?',
        senderId: 'user-sarah',
        sender: 'Sarah Chen',
        timestamp: '10:00 AM',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: '1-2',
        text: 'Making good progress! Just finishing up the dashboard.',
        senderId: 'me',
        sender: 'Alex Johnson',
        timestamp: '10:15 AM',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: '1-3',
        text: 'That sounds great! Can we review it tomorrow?',
        senderId: 'user-sarah',
        sender: 'Sarah Chen',
        timestamp: '10:25 AM',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
    ],
  },
  {
    id: 2,
    name: 'EcoTrack Team',
    avatar: 'https://ui-avatars.com/api/?name=Eco+Track&background=0D8ABC&color=fff',
    online: false,
    messages: [
      {
        id: '2-1',
        text: 'Welcome to the team everyone!',
        senderId: 'user-sarah',
        sender: 'Sarah Chen',
        timestamp: 'Yesterday',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: '2-2',
        text: 'I just pushed the latest changes to main.',
        senderId: 'user-mike',
        sender: 'Mike Ross',
        timestamp: 'Yesterday',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
      },
    ],
  },
  {
    id: 3,
    name: 'Jessica Lee',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956',
    online: true,
    messages: [
      {
        id: '3-1',
        text: 'Here are the design mockups needed for the landing page.',
        senderId: 'user-jessica',
        sender: 'Jessica Lee',
        timestamp: 'Mon',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
      {
        id: '3-2',
        text: 'Thanks for the feedback!',
        senderId: 'user-jessica',
        sender: 'Jessica Lee',
        timestamp: 'Mon',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
      },
    ],
  },
];

const cloneInitialConversations = () =>
  INITIAL_CONVERSATIONS.map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) => ({ ...message })),
  }));

const conversations = cloneInitialConversations();
const clients = new Set();

function toTimeLabel(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toConversationSummary(conversation) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  return {
    id: conversation.id,
    name: conversation.name,
    avatar: conversation.avatar,
    online: conversation.online,
    unread: 0,
    lastMessage: lastMessage?.text || 'No messages yet',
    lastMessageTime: lastMessage?.timestamp || '',
  };
}

function sendEvent(ws, event, data) {
  if (ws.readyState !== 1) return;
  ws.send(JSON.stringify({ event, data }));
}

function broadcastEvent(event, data) {
  for (const client of clients) {
    sendEvent(client.ws, event, data);
  }
}

function parsePayload(rawData) {
  try {
    return JSON.parse(rawData.toString());
  } catch (_error) {
    return null;
  }
}

function attachChatServer(server) {
  const wss = new WebSocketServer({ server, path: '/ws/chat' });

  wss.on('connection', (ws, req) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const userId = requestUrl.searchParams.get('userId') || randomUUID();
    const userName = requestUrl.searchParams.get('name') || 'Guest';

    const client = {
      ws,
      userId,
      userName,
    };

    clients.add(client);

    sendEvent(ws, 'init', {
      currentUser: {
        id: userId,
        name: userName,
      },
      conversations: conversations.map(toConversationSummary),
      messagesByConversation: Object.fromEntries(
        conversations.map((conversation) => [conversation.id, conversation.messages])
      ),
    });

    ws.on('message', (rawData) => {
      const payload = parsePayload(rawData);

      if (!payload || payload.event !== 'send_message') {
        sendEvent(ws, 'error', { message: 'Invalid websocket event payload.' });
        return;
      }

      const { conversationId, text } = payload.data || {};
      const messageText = typeof text === 'string' ? text.trim() : '';

      if (!messageText) {
        return;
      }

      const conversation = conversations.find(
        (item) => String(item.id) === String(conversationId)
      );

      if (!conversation) {
        sendEvent(ws, 'error', { message: 'Conversation not found.' });
        return;
      }

      const now = new Date();
      const message = {
        id: randomUUID(),
        text: messageText,
        senderId: client.userId,
        sender: client.userName,
        timestamp: toTimeLabel(now),
        createdAt: now.toISOString(),
      };

      conversation.messages.push(message);

      // Keep in-memory message history bounded.
      if (conversation.messages.length > 200) {
        conversation.messages = conversation.messages.slice(-200);
      }

      broadcastEvent('new_message', {
        conversationId: conversation.id,
        conversation: toConversationSummary(conversation),
        message,
      });
    });

    ws.on('close', () => {
      clients.delete(client);
    });
  });

  return wss;
}

module.exports = {
  attachChatServer,
};
