import React, { ChangeEvent, useEffect, useState, useRef } from 'react';
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
  const [msg, setMsg] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { socket, userIp } = useSocket();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
        if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  };

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
        setTimeout(scrollToBottom,10);
      });

      // Listen for live messages
      socket.on('receiveMessage', (message: Message) => {
        if (message.from === selectedChat || message.to === selectedChat) {
          setMessages(prevMessages => [...prevMessages, message]);
          if(chatContainerRef.current && chatContainerRef.current.scrollTop+chatContainerRef.current.clientHeight >= chatContainerRef.current.scrollHeight) {
            console.log("scroll");
            setTimeout(scrollToBottom,10);
        }
      }});

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
      <div ref={chatContainerRef} className="w-full h-full overflow-y-auto flex flex-col">
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
                  {message.text}
                  <div className="text-xs text-gray-500 text-right">
                    {sentDate.toLocaleTimeString()}
                  </div>
                </div>
              );
            })
          : <div className="p-2">Select a chat to start messaging</div>
        }
      </div>
      <div className="w-full px-4 py-2 flex gap-2 items-center border-t-2 border-black">
        <input
          type="text"
          value={msg}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMsg(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-full px-4 py-2 border-2 border-black rounded-lg"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
};
