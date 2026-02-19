const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');

const port = Number(process.env.PORT) || 5000;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('Connected to socket.io');

  socket.on('setup', (userData = {}) => {
    const userId = userData?._id || userData?.id;
    if (!userId) {
      socket.emit('socket error', { message: 'Missing user id in setup payload.' });
      return;
    }

    socket.data.userId = String(userId);
    socket.join(socket.data.userId);
    socket.emit('connected');
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    console.log(`User Joined Room: ${room}`);
  });

  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  socket.on('new message', (newMessageReceived = {}) => {
    const chat = newMessageReceived.chat;

    if (!chat || !Array.isArray(chat.participants)) {
      console.log('chat.participants not defined');
      return;
    }

    const senderId = String(newMessageReceived?.sender?._id || newMessageReceived?.sender?.id || '');

    chat.participants.forEach((participant) => {
      const participantId = String(participant?._id || participant?.id || participant || '');
      if (!participantId || participantId === senderId) return;
      socket.to(participantId).emit('message received', newMessageReceived);
    });
  });

  socket.on('disconnect', () => {
    console.log('USER DISCONNECTED');
  });
});

server.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
