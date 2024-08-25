import React, { ChangeEvent, useEffect, useRef } from 'react';
import { useSocket } from '../SocketContext';

interface Message {
  text: string;
  sent: Date | string;
  from: string;
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
  const { socket, userIp } = useSocket();

  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (message: Message) => {
        console.log('Received message:', message);

        if (typeof message.sent === 'string') {
          message.sent = new Date(message.sent);
        }

        // Log selectedChat and userIp for debugging
        console.log('Selected chat:', selectedChat);
        console.log('User IP:', userIp);

        if (message.to === userIp && message.from === selectedChat) {
          setMessages(prevMessages => {
            // Log previous messages
            console.log('Previous messages:', prevMessages);

            // Check for duplicates
            const messageExists = prevMessages.some(msg =>
              msg.text === message.text &&
              new Date(msg.sent).getTime() === new Date(message.sent).getTime() &&
              msg.from === message.from
            );

            if (messageExists) {
              console.log('Message already exists:', message);
              return prevMessages;
            }

            console.log('Adding new message:', message);
            return [...prevMessages, message];
          });
        }
      };

      socket.on('receiveMessage', handleReceiveMessage);

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
      };
    }
  }, [socket, selectedChat, userIp]);

  const sendMessage = () => {
    if (msg.trim() === '' || !selectedChat || !userIp) return;

    const newMessage: Message = {
      text: msg,
      sent: new Date(),
      from: userIp,
      to: selectedChat,
      attachments: null,
    };

    socket?.emit('sendMessage', newMessage);

    setMessages(prevMessages => {
      console.log('Previous messages before sending:', prevMessages);

      // Check for duplicates
      const messageExists = prevMessages.some(msg =>
        msg.text === newMessage.text &&
        new Date(msg.sent).getTime() === new Date(newMessage.sent).getTime() &&
        msg.from === newMessage.from
      );

      if (messageExists) {
        console.log('Message already exists:', newMessage);
        return prevMessages;
      }

      console.log('Sending new message:', newMessage);
      return [...prevMessages, newMessage];
    });

    setMsg('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };


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

  return (
  <div className="relative rounded-2xl border-2 border-black w-full h-[90vh] flex flex-col mx-4 overflow-hidden">
    <div className="w-full h-full overflow-y-auto flex flex-col">
      {selectedChat? messages.map((message, index) => {
        const sentDate = typeof message.sent === "string" ? new Date(message.sent) : message.sent;
        return (
          <div
            key={index}
            className={`p-2 w-fit max-w-[30vw] rounded-2xl mx-2 my-2 text-wrap ${
              message.from === userIp ? "self-end bg-sky-600 text-white" : "self-start bg-slate-300"
            }`}
          >
            <div>
              <strong>{message.from}</strong>: {message.text}
            </div>
            <div
              className={`italic text-xs ${
                message.from === userIp ? "text-gray-300" : "text-gray-500"
              }`}
            >
              {sentDate.toLocaleTimeString()}
            </div>
          </div>
        );
      }): <div className="flex justify-center items-center h-full">Select a chat to start messaging</div>}
    </div>

    {/* Input area with minimal z-index and overflow hidden in the container */}
    <div
      className={`w-full transition-all h-24 self-end flex gap-4 bg-slate-600 items-center rounded-b-xl z-0 ${!selectedChat && "translate-y-24"}`}
      style={{ zIndex: 1 }}
    >
      <input
        type="text"
        className="w-[calc(100%-5rem)] h-10 border-b-2 mx-4 rounded-full px-4"
        onChange={(e: ChangeEvent<HTMLInputElement>) => setMsg(e.target.value)}
        value={msg}
        onKeyDown={handleKeyPress}
      />
      <button className="w-20 bg-white rounded-full h-10 mx-4" onClick={sendMessage}>
        Send
      </button>
    </div>
  </div>
);

  
};
