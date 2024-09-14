const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { log } = require('console');
const bodyParser = require('body-parser');
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
// Add this line after initializing the app
app.use('/attachments', express.static(path.join(__dirname, 'chats')));


// Set up multer for file handling
const upload = multer({ dest: 'uploads/' });

// Initialize socket.io
const io = new Server(server, {
  cors: {
    methods: ['GET', 'POST'],
  },
}
);

const serverPort = process.env.YOUR_PORT || process.env.PORT || 4000;
server.listen(serverPort, '0.0.0.0', () => {
  console.log('Listening on port ' + serverPort);
});

const users = {}; // { socketId: userIp }

// Helper functions
function getRegisteredUsersFilePath() {
  return path.join(__dirname, 'registered_users.json');
}

function loadRegisteredUsers() {
  const filePath = getRegisteredUsersFilePath();
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath);
    return JSON.parse(fileContent);
  }
  return [];
}

function saveRegisteredUsers(users) {
  const filePath = getRegisteredUsersFilePath();
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
}

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

function getChatFolderPath(fromIp, toIp) {
  const sortedIps = [fromIp, toIp].sort(); // Sort IPs to ensure consistent directory naming
  const folderName = `${sortedIps[0]}_to_${sortedIps[1]}`;
  const folderPath = path.join(__dirname, 'chats', folderName);

  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created chat folder: ${folderPath}`);
    }

    const attachmentsFolderPath = path.join(folderPath, 'attachments');
    if (!fs.existsSync(attachmentsFolderPath)) {
      fs.mkdirSync(attachmentsFolderPath, { recursive: true });
      console.log(`Created attachments folder: ${attachmentsFolderPath}`);
    }

    return folderPath;
  } catch (error) {
    console.error(`Error creating chat folder: ${error.message}`);
    throw error;
  }
}



function saveMessage(fromIp, toIp, message) {
  const chatFolderPath = getChatFolderPath(fromIp, toIp);
  const messagesFilePath = path.join(chatFolderPath, 'messages.json');

  let messages = [];
  if (fs.existsSync(messagesFilePath)) {
    const fileContent = fs.readFileSync(messagesFilePath);
    messages = JSON.parse(fileContent);
  }

  if (message.attachments) {
    message.attachments = message.attachments.map(file => {
      const relativePath = `${getChatFolderPath(fromIp, toIp)}/attachments/${file.name}`;
      return {
        originalName: file.originalName,
        filePath: relativePath
      };
    });
  }

  messages.push(message);
  fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2));
}







function updateRegisteredUsers(userIp) {
  const registeredUsers = loadRegisteredUsers();
  let user = registeredUsers.find(u => u.ip === userIp);
  if (!user) {
    user = { ip: userIp, name: 'Unknown User' };
    registeredUsers.push(user);
    saveRegisteredUsers(registeredUsers);
  }
}

function removeDuplicateIps(ips) {
  return [...new Set(ips)];
}

function getSocketIdByUserIp(userIp) {
  for (const [socketId, ip] of Object.entries(users)) {
    if (ip === userIp) {
      return socketId;
    }
  }
  return null;
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

  const onlineUsers = removeDuplicateIps(Object.values(users));
  const registeredUsers = loadRegisteredUsers();
  const offlineUsers = registeredUsers.filter(user => !onlineUsers.includes(user.ip));

  io.emit('updateClients', { online: onlineUsers.map(ip => registeredUsers.find(u => u.ip === ip)), offline: offlineUsers });
  socket.emit('updateClients', { online: onlineUsers.map(ip => registeredUsers.find(u => u.ip === ip)), offline: offlineUsers });

  socket.on('requestClients', () => {
    const onlineUsers = removeDuplicateIps(Object.values(users));
    const registeredUsers = loadRegisteredUsers();
    const offlineUsers = registeredUsers.filter(user => !onlineUsers.includes(user.ip));
    socket.emit('updateClients', { online: onlineUsers.map(ip => registeredUsers.find(u => u.ip === ip)), offline: offlineUsers });
  });

  socket.on('requestChatLog', (chatWithIp) => {
    const userIp = users[socket.id];
    if (userIp) {
      const chatFolderPath = getChatFolderPath(userIp, chatWithIp);
      const messagesFilePath = path.join(chatFolderPath, 'messages.json');
      if (fs.existsSync(messagesFilePath)) {
        const fileContent = fs.readFileSync(messagesFilePath);
        const chatLog = JSON.parse(fileContent);
  
        // Process attachments
        chatLog.forEach(message => {
          if (message.attachments) {
            message.attachments = message.attachments.map(file => {
              return {
                originalName: file.originalName,
                filePath: file.filePath // Already includes uniqueFilename
              };
            });
          }
        });
  
        socket.emit('receiveChatLog', chatLog);
      } else {
        socket.emit('receiveChatLog', []);
      }
    }
  });
  
  
  

  // Handle message with attachments
  socket.on('sendMessageWithAttachments', (data) => {
    const { attachments, ...logData } = data;
    console.log('Attachments:', attachments.map(file => file.name));
  
    try {
      if (!data.from || !data.to || !data.attachments) {
        throw new Error('Invalid data: Missing "from", "to", or "attachments"');
      }
  
      const chatFolderPath = getChatFolderPath(data.from, data.to);
      const processedAttachments = data.attachments.map((file, index) => {
        if (!file.name || !file.base64Content) {
          throw new Error(`Invalid file data for ${file.name}`);
        }
  
        // Extract base64 content (after 'base64,' prefix)
        let base64Content;
        if (file.base64Content.includes('base64,')) {
          base64Content = file.base64Content.split('base64,')[1];
        } else {
          base64Content = file.base64Content;
        }
        if (!base64Content) {
          throw new Error(`Base64 content missing for ${file.name}`);
        }
  
        // Decode base64 content
        const fileContent = Buffer.from(base64Content, 'base64');
  
        // Generate unique filename and save file
        const fileExtension = path.extname(file.name);
        const uniqueFilename = `${Date.now()}_${index}${fileExtension}`;
        const filePath = path.join(chatFolderPath, 'attachments', uniqueFilename);
  
        // Write file to disk
        fs.writeFileSync(filePath, fileContent);
  
        // Return the details of the saved file including original name
        return {
          name: uniqueFilename, // Use uniqueFilename
          originalName: file.name,
          filePath: `attachments/${uniqueFilename}` // Relative path including uniqueFilename
        };
      });
  
      // Update the attachments in the data
      data.attachments = processedAttachments;
  
      // Emit the message to the recipient
      const recipientSocketId = getSocketIdByUserIp(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receiveMessage', data);
      }
  
      // Save the message
      saveMessage(data.from, data.to, data);
  
    } catch (error) {
      console.error('Error handling message with attachments:', error.message);
      socket.emit('error', { message: 'Failed to send message with attachments.' });
    }
  });
  
  

  
  

  // Handle simple message without attachments
  socket.on('sendMessage', (message) => {
    console.log('Message received:', message);
    message.from = users[socket.id];
    const recipientSocketId = getSocketIdByUserIp(message.to);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receiveMessage', message);
    }

    saveMessage(message.from, message.to, message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    const disconnectedIp = users[socket.id];
    if (disconnectedIp) {
      // User remains in the registered_users.json file
    }
    delete users[socket.id];

    const onlineUsers = removeDuplicateIps(Object.values(users));
    const registeredUsers = loadRegisteredUsers();
    const offlineUsers = registeredUsers.filter(user => !onlineUsers.includes(user.ip));

    io.emit('updateClients', { online: onlineUsers.map(ip => registeredUsers.find(u => u.ip === ip)), offline: offlineUsers });
  });
});

// Handle file uploads with multer
app.get('/download/:filePath', (req, res) => {
  const filePath = path.join(__dirname, 'chats', req.params.filePath);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.post('/upload', upload.array('files'), (req, res) => {
  if (!req.files) {
    return res.status(400).json({ error: 'No files were uploaded.' });
  }

  const files = req.files.map(file => ({
    originalname: file.originalname,
    filename: file.filename,
  }));

  res.json({ files });
});
