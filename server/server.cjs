const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');
const fs = require('fs'); // Required for file system operations
const path = require('path'); // Required for working with file paths
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

// Helper function to get or create a file path for messages between two IPs
function getMessageFilePath(fromIp, toIp) {
  // Ensure IPs are in a consistent order to avoid duplicate file creation
  const sortedIps = [fromIp, toIp].sort();
  const fileName = `${sortedIps[0]}_to_${sortedIps[1]}.json`;
  const filePath = path.join(__dirname, 'messages', fileName);

  // Ensure the directory exists
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  return filePath;
}

// Helper function to save a message to a file
function saveMessage(fromIp, toIp, message) {
  const filePath = getMessageFilePath(fromIp, toIp);

  // Read existing messages from the file, if any
  let messages = [];
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath);
    messages = JSON.parse(fileContent);
  }

  // Add the new message to the list
  messages.push(message);

  // Save the updated messages back to the file
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
}

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

  // Notify all clients about the updated client list
  io.emit('updateClients', Object.values(users));

  // Send the client list to the newly connected user
  socket.emit('updateClients', Object.values(users));

  socket.on('requestClients', () => {
    socket.emit('updateClients', Object.values(users));
  });

  socket.on('requestChatLog', (chatWithIp) => {
    // Determine the current user's IP
    const userIp = users[socket.id];
    if (userIp) {
      // Get the message file path
      const filePath = getMessageFilePath(userIp, chatWithIp);

      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath);
        const chatLog = JSON.parse(fileContent);
        // Send the chat log to the requesting user
        socket.emit('receiveChatLog', chatLog);
      } else {
        // Send an empty array if no chat log exists
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
      
      // Save the message between sender and recipient IPs
      saveMessage(message.from, message.to, message);
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
