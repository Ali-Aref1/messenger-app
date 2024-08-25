const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    methods: ['GET', 'POST'],
  },
});

const serverPort = process.env.YOUR_PORT || process.env.PORT || 4000;
server.listen(serverPort, '0.0.0.0', () => {
  console.log('Listening on port ' + serverPort);
});

const users = {}; // { socketId: userIp }

io.on('connection', (socket) => {
  let userIp = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress || '';

  if (userIp.includes('::1')) {
    userIp = '127.0.0.1';
  } else if (userIp.includes(',')) {
    userIp = userIp.split(',').find(ip => !ip.includes(':')).trim();
  }

  console.log('New user connected: ' + socket.id + ' with IP: ' + userIp);
  socket.emit('receiveIp', userIp);
  users[socket.id] = userIp;

  io.emit('updateClients', Object.values(users));

  socket.on('requestClients', () => {
    socket.emit('updateClients', Object.values(users));
  });

  socket.on('sendMessage', (message) => {
    console.log(message);
    message.from = users[socket.id];
    const recipientSocketId = getSocketIdByUserIp(message.to);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receiveMessage', message);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    delete users[socket.id];
    io.emit('updateClients', Object.values(users));
  });
});

function getSocketIdByUserIp(userIp) {
  for (const [socketId, ip] of Object.entries(users)) {
    if (ip === userIp) {
      return socketId;
    }
  }
  return null;
}
