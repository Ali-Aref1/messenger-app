const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os'); // Required to get network interfaces
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

// Get the host's actual IPv4 address
function getHostIpAddress() {
  const networkInterfaces = os.networkInterfaces();
  for (const iface of Object.values(networkInterfaces)) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback if no IPv4 address is found
}

const hostIp = getHostIpAddress(); // Get host IPv4 address once

io.on('connection', (socket) => {
  let userIp = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress || '';

  // Check for IPv6 addresses and convert `::1` to the host's actual IPv4 address
  if (userIp.includes('::1') || userIp.includes('127.0.0.1')) {
    userIp = hostIp;
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
