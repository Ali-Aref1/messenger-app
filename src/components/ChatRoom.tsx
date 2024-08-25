import React, { ChangeEvent, useEffect, useRef } from 'react';
import { useSocket } from '../SocketContext';

interface Message {
  text: string;
  sent: Date | string; // Accept both Date and string
  from: string; // This will contain the sender's IP
  to: string;
  attachments: string[] | null;
}

interface ChatRoomProps {
  selectedChat: string | null;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ selectedChat }) => {
  const [msg, setMsg] = React.useState<string>('');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isContactsOpen, setIsContactsOpen] = React.useState<boolean>(false);
  const contactsRef = useRef<HTMLDivElement>(null);
  const socket = useSocket();
  const userIp = useRef<string | null>(null);

  useEffect(() => {
    // Fetch user IP when socket connects
    socket?.on('connect', () => {
      userIp.current = socket?.id ?? 'Unknown IP'; // Use socket id or modify server to emit actual IP
    });

    return () => {
      socket?.off('connect');
    };
  }, [socket]);

  const sendMessage = () => {
    if (msg.trim() === '' || !selectedChat) return;

    const newMessage: Message = {
      text: msg,
      sent: new Date(),
      from: "You",
      to: selectedChat,
      attachments: null,
    };

    // Emit the message to the server
    socket?.emit('sendMessage', newMessage);
    // Display the sent message in the chat
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setMsg('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleContacts = () => {
    setIsContactsOpen(!isContactsOpen);
  };

  // Close contacts menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contactsRef.current && !contactsRef.current.contains(event.target as Node)) {
        setIsContactsOpen(false);
      }
    };

    if (isContactsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isContactsOpen]);

  useEffect(() => {
    // Listen for incoming messages
    socket?.on('receiveMessage', (message: Message) => {
      // Convert `sent` to a Date object if it's a string
      if (typeof message.sent === 'string') {
        message.sent = new Date(message.sent);
      }
      // Only display the message if it is for the selected chat or if it is from the current user
      if (message.from === selectedChat) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      socket?.off('receiveMessage');
    };
  }, [socket, selectedChat]);

  return (
    <div className='relative rounded-2xl border-2 border-black w-full h-[90vh] flex flex-col mx-4'>
      <div className='w-full h-full overflow-y-auto flex flex-col'>
        {messages.map((message, index) => {
          // Ensure `sent` is a Date object before calling `toLocaleTimeString()`
          const sentDate = typeof message.sent === 'string' ? new Date(message.sent) : message.sent;
          console.log(message.from, userIp.current);
          return (
            <div key={index} className={`p-2 bg-gray-600 w-fit rounded-2xl mx-2 my-2 text-wrap max-w-full ${message.from === userIp.current ? 'self-end' : 'self-start'}`}>
              <div><strong>{message.from}</strong>: {message.text}</div>
              <div className='text-xs text-gray-500'>{sentDate.toLocaleTimeString()}</div>
            </div>
          );
        })}
      </div>

      <div className='w-full self-end flex gap-4 bg-slate-600 h-28 items-center rounded-b-xl'>
        <input
          type='text'
          className='w-[calc(100%-5rem)] h-10 border-b-2 mx-4 rounded-full px-4'
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMsg(e.target.value)}
          value={msg}
          onKeyDown={handleKeyPress}
        />
        <button className='w-20 bg-white rounded-full h-10 mx-4' onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};
