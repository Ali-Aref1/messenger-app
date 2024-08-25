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
  // Retrieve the user's IP address and prefer IPv4
  let userIp = (socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || '');

  // Check for IPv6 addresses and convert `::1` to `127.0.0.1`
  if (userIp.includes('::1')) {
    userIp = '127.0.0.1';
  } else if (userIp.includes(',')) {
    // If the IP is in a comma-separated list (e.g., '::1, 127.0.0.1'), pick the IPv4
    userIp = userIp.split(',').find(ip => !ip.includes(':')).trim();
  }

  console.log('New user connected: ' + socket.id + ' with IP: ' + userIp);
  users[socket.id] = userIp;

  // Notify all clients with a filtered list excluding their own IP
  for (const [socketId] of Object.entries(users)) {
    const clientSocket = io.sockets.sockets.get(socketId);
    if (clientSocket) {
      clientSocket.emit('updateClients', getClientList(users[socketId]));
    }
  }

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
    // Update all remaining clients with the filtered list
    for (const [socketId] of Object.entries(users)) {
      const clientSocket = io.sockets.sockets.get(socketId);
      if (clientSocket) {
        clientSocket.emit('updateClients', getClientList(users[socketId]));
      }
    }
  });
});

function getClientList(excludeUserIp) {
  // Return a list of users, excluding the IP of the receiving user
  return Object.values(users).filter(ip => ip !== excludeUserIp);
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
