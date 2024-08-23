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
server.listen(serverPort, () => {
  console.log('Listening on port ' + serverPort);
});

const users = {}; // { socketId: userIp }

io.on('connection', (socket) => {
  // Retrieve the user's IP address and trim the `::ffff:` prefix
  const userIp = (socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || '')
    .replace(/^::ffff:/, '');

  console.log('New user connected: ' + socket.id + ' with IP: ' + userIp);
  users[socket.id] = userIp;

  // Notify other clients of the new user
  io.emit('updateClients', getClientList());

  socket.on('sendMessage', (message) => {
    // Add the IP address to the message
    message.from = users[socket.id]; // Use the IP from the connected socket
    const recipientSocketId = getSocketIdByUserIp(message.to);
    console.log(message);

    if (recipientSocketId) {
      // Emit the message only to the intended recipient
      io.to(recipientSocketId).emit('receiveMessage', message);
      // Optionally, send a confirmation to the sender
      socket.emit('receiveMessage', message);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    delete users[socket.id];
    io.emit('updateClients', getClientList());
  });
});

function getClientList() {
  // This function should return a list of connected users
  return Object.values(users);
}

function getSocketIdByUserIp(userIp) {
  // This function returns the socket ID associated with the given IP address
  for (const [socketId, ip] of Object.entries(users)) {
    if (ip === userIp) {
      return socketId;
    }
  }
  return null;
}
