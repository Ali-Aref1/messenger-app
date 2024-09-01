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
  const { socket, userIp } = useSocket();

  useEffect(() => {
    if (socket && selectedChat) {
      // Clear current messages
      setMessages([]);

      // Request chat log from the server
      socket.emit('requestChatLog', selectedChat);

      socket.on('receiveChatLog', (chatLog: Message[]) => {
        setMessages(chatLog.map(msg => ({
          ...msg,
          sent: typeof msg.sent === 'string' ? new Date(msg.sent) : msg.sent,
        })));
      });

      // Listen for live messages
      socket.on('receiveMessage', (message: Message) => {
        if (message.from === selectedChat || message.to === selectedChat) {
          setMessages(prevMessages => [...prevMessages, message]);
        }
      });

      // Clean up socket listeners on unmount or when selectedChat changes
      return () => {
        socket.off('receiveChatLog');
        socket.off('receiveMessage');
      };
    }
  }, [socket, selectedChat]);

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

    setMessages(prevMessages => [...prevMessages, newMessage]);

    setMsg('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative rounded-2xl border-2 border-black w-full h-[90vh] flex flex-col mx-4 overflow-hidden">
      <div className="w-full h-full overflow-y-auto flex flex-col">
        {selectedChat
          ? messages.map((message, index) => {
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
            })
          : <div className="flex justify-center items-center h-full">Select a chat to start messaging</div>}
      </div>

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
