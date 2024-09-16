import express from 'express';
import http, { get } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { log } from 'console';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 8e8, // 500 MB
});

const serverPort = process.env.YOUR_PORT || process.env.PORT || 4000;
server.listen(Number(serverPort), '0.0.0.0', () => {
  console.log('Listening on port ' + serverPort);
});

const users: { [key: string]: string } = {}; // { socketId: userIp }

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use('/attachments', express.static(path.resolve('server/chats'))); // Serve static files from the 'server/chats' directory

// Set up multer for file handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const message = JSON.parse(req.body.message);
    const fromIp = message.from;
    const toIp = message.to;
    const chatFolderPath = getChatFolderPath(fromIp, toIp);
    cb(null, path.resolve(chatFolderPath, 'attachments'));
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + path.extname(file.originalname);
    (req as any).filename = filename; // Store filename in req object
    cb(null, filename);
  }
});


const upload = multer({ storage: storage });

interface Message {
  text: string;
  sent: Date | string;
  from: string;
  to: string;
  attachments: { name: string }[] | null;
}

// Helper functions

function loadRegisteredUsers(): any[] {
  const filePath = path.resolve('server/registered_users.json');
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath);
    return JSON.parse(fileContent.toString());
  }
  return [];
}

function saveRegisteredUsers(users: any[]): void {
  const filePath = path.resolve('server/registered_users.json');
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
}

function getHostIpAddress(): string {
  const networkInterfaces = os.networkInterfaces();
  for (const iface of Object.values(networkInterfaces)) {
    for (const alias of iface as any[]) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback if no IPv4 address is found
}

const hostIp = getHostIpAddress(); // Get host IPv4 address once

function getChatFolderPath(fromIp: string, toIp: string): string {
  if (!fromIp || !toIp) {
    throw new Error('Invalid IP addresses provided.');
  }
  const sortedIps = [fromIp, toIp].sort(); // Sort IPs to ensure consistent directory naming
  const folderName = `${sortedIps[0]}_to_${sortedIps[1]}`;
  const folderPath = path.resolve('server/chats', folderName); // Use path.resolve instead of __dirname

  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created chat folder: ${folderPath}`);
    }

    const attachmentsFolderPath = path.resolve(folderPath, 'attachments'); // Use path.resolve instead of __dirname
    if (!fs.existsSync(attachmentsFolderPath)) {
      fs.mkdirSync(attachmentsFolderPath, { recursive: true });
      console.log(`Created attachments folder: ${attachmentsFolderPath}`);
    }

    return folderPath;
  } catch (error) {
    console.error(`Error creating chat folder: ${(error as Error).message}`);
    throw error;
  }
}


function saveMessage(message: Message): void {
  const chatFolderPath = getChatFolderPath(message.from, message.to);
  const messagesFilePath = path.resolve(chatFolderPath, 'messages.json');

  let messages: Message[] = [];
  if (fs.existsSync(messagesFilePath)) {
    const fileContent = fs.readFileSync(messagesFilePath);
    messages = JSON.parse(fileContent.toString());
  }

  messages.push(message);
  fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2));
}



function updateRegisteredUsers(userIp: string): void {
  const registeredUsers = loadRegisteredUsers();
  let user = registeredUsers.find(u => u.ip === userIp);
  if (!user) {
    user = { ip: userIp, name: 'Unknown User' };
    registeredUsers.push(user);
    saveRegisteredUsers(registeredUsers);
  }
}

function removeDuplicateIps(ips: string[]): string[] {
  return [...new Set(ips)];
}

function getSocketIdByUserIp(userIp: string): string | null {
  for (const [socketId, ip] of Object.entries(users)) {
    if (ip === userIp) {
      return socketId;
    }
  }
  return null;
}

io.on('connection', (socket) => {
  let userIp = socket.request.headers['x-forwarded-for'] as string || socket.request.connection.remoteAddress || '';

  if (userIp.includes('::1') || userIp.includes('127.0.0.1')) {
    userIp = hostIp;
  } else if (userIp.includes(',')) {
    userIp = userIp.split(',').find(ip => !ip.includes(':'))?.trim() || '';
  }
  const user = loadRegisteredUsers().find(u => u.ip === userIp);
  const userName = user ? user.name : 'Unknown User';
  const userInfo = { name: userName, ip: userIp, socketId: socket.id };

  console.log('New user connected:');
  console.log(userInfo);
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

  socket.on('requestChatLog', (chatWithIp: string) => {
    const userIp = users[socket.id];
    if (userIp) {
      const chatFolderPath = getChatFolderPath(userIp, chatWithIp);
      const messagesFilePath = path.resolve(chatFolderPath, 'messages.json'); // Use path.resolve instead of __dirname
      if (fs.existsSync(messagesFilePath)) {
        const fileContent = fs.readFileSync(messagesFilePath);
        const chatLog = JSON.parse(fileContent.toString());

        // Process attachments
        socket.emit('receiveChatLog', chatLog);
      } else {
        socket.emit('receiveChatLog', []);
      }
    }
  });

  // Handle message with attachments
  socket.on('sendMessage', (message: Message) => {
    const userIp = users[socket.id];
    if (userIp) {
      // Save the message only if there are no attachments
      if (!message.attachments || message.attachments.length === 0) {
        saveMessage(message);
      }
  
      // Emit the message to the intended recipient
      const socketId = getSocketIdByUserIp(message.to);
      if (socketId) {
        io.to(socketId).emit('receiveMessage', message);
      }
    }
  });
  
  

  socket.on('disconnect', () => {
    const user = loadRegisteredUsers().find(u => u.ip === userIp);
    const userName = user ? user.name : 'Unknown User';
    const userInfo = { name: userName, ip: userIp, socketId: socket.id };
    console.log('User disconnected: ');
    console.log(userInfo);
    delete users[socket.id];

    const onlineUsers = removeDuplicateIps(Object.values(users));
    const registeredUsers = loadRegisteredUsers();
    const offlineUsers = registeredUsers.filter(user => !onlineUsers.includes(user.ip));

    io.emit('updateClients', { online: onlineUsers.map(ip => registeredUsers.find(u => u.ip === ip)), offline: offlineUsers });
  });
});

// Route for uploading files and sending messages
app.post('/upload', upload.array('files'), (req, res) => {
  const message = JSON.parse(req.body.message);

  // Process file attachments
  const attachments = (req.files as Express.Multer.File[] ?? []).map((file: Express.Multer.File) => ({
    name: file.originalname,
    path: `attachments/${file.filename}` // Use the filename saved by multer
  }));

  // Update message with attachment paths
  const updatedMessage: Message = {
    ...message,
    attachments
  };

  // Save the message with updated attachments
  saveMessage(updatedMessage);

  // Emit the message to the intended recipient
  const recipientSocketId = getSocketIdByUserIp(message.to);
  if (recipientSocketId) {
    io.to(recipientSocketId).emit('receiveMessage', updatedMessage);
  }

  // Respond with the updated message
  res.status(200).json({ message: updatedMessage });
});




