const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');
const fs = require('fs');
const path = require('path');
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

// Helper function to get or create a file path for registered users
function getRegisteredUsersFilePath() {
  return path.join(__dirname, 'registered_users.json');
}

// Helper function to load registered users from file
function loadRegisteredUsers() {
  const filePath = getRegisteredUsersFilePath();
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath);
    return JSON.parse(fileContent);
  }
  return [];
}

// Helper function to save registered users to file
function saveRegisteredUsers(users) {
  const filePath = getRegisteredUsersFilePath();
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
}

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

// Helper function to get or create a file path for messages between two IPs
function getMessageFilePath(fromIp, toIp) {
  const sortedIps = [fromIp, toIp].sort();
  const fileName = `${sortedIps[0]}_to_${sortedIps[1]}.json`;
  const filePath = path.join(__dirname, 'messages', fileName);

  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  return filePath;
}

// Helper function to save a message to a file
function saveMessage(fromIp, toIp, message) {
  const filePath = getMessageFilePath(fromIp, toIp);

  let messages = [];
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath);
    messages = JSON.parse(fileContent);
  }

  messages.push(message);
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
}

// Update the list of registered users based on connection status
function updateRegisteredUsers(userIp) {
  const registeredUsers = loadRegisteredUsers();
  if (!registeredUsers.includes(userIp)) {
    registeredUsers.push(userIp);
    saveRegisteredUsers(registeredUsers);
  }
}

io.on('connection', (socket) => {
  let userIp = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress || '';

  if (userIp.includes('::1') || userIp.includes('127.0.0.1')) {
    userIp = hostIp;
  } else if (userIp.includes(',')) {
    userIp = userIp.split(',').find(ip => !ip.includes(':')).trim();
  }

  console.log('New user connected: ' + socket.id + ' with IP: ' + userIp);
  socket.emit('receiveIp', userIp);
  users[socket.id] = userIp;

  updateRegisteredUsers(userIp);

  const onlineUsers = Object.values(users);
  const registeredUsers = loadRegisteredUsers();
  const offlineUsers = registeredUsers.filter(ip => !onlineUsers.includes(ip));

  io.emit('updateClients', { online: onlineUsers, offline: offlineUsers });
  socket.emit('updateClients', { online: onlineUsers, offline: offlineUsers });

  socket.on('requestClients', () => {
    const onlineUsers = Object.values(users);
    const registeredUsers = loadRegisteredUsers();
    const offlineUsers = registeredUsers.filter(ip => !onlineUsers.includes(ip));
    socket.emit('updateClients', { online: onlineUsers, offline: offlineUsers });
  });

  socket.on('requestChatLog', (chatWithIp) => {
    const userIp = users[socket.id];
    if (userIp) {
      const filePath = getMessageFilePath(userIp, chatWithIp);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath);
        const chatLog = JSON.parse(fileContent);
        socket.emit('receiveChatLog', chatLog);
      } else {
        socket.emit('receiveChatLog', []);
      }
    }
  });

  socket.on('sendMessage', (message) => {
    console.log('Message received:', message);
    message.from = users[socket.id];
    const recipientSocketId = getSocketIdByUserIp(message.to);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receiveMessage', message);
    }

    // Save the message regardless of recipient's online status
    saveMessage(message.from, message.to, message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    const disconnectedIp = users[socket.id];
    if (disconnectedIp) {
      // User remains in the registered_users.json file
    }
    delete users[socket.id];

    const onlineUsers = Object.values(users);
    const registeredUsers = loadRegisteredUsers();
    const offlineUsers = registeredUsers.filter(ip => !onlineUsers.includes(ip));

    io.emit('updateClients', { online: onlineUsers, offline: offlineUsers });
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
