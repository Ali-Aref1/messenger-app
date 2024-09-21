import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import { FormatDate, getTimeDifference } from '../utils';
import { useSocket } from '../SocketContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import FilePreview from './FilePreview';
import ImageModal from './ImageModal';
import Message from '../interfaces/Message';
import User from '../interfaces/User';

interface ChatRoomProps {
  selectedChat: User | null;
  onlineClients: User[];
  offlineClients: User[];
  setOnlineClients: React.Dispatch<React.SetStateAction<User[]>>;
  setOfflineClients: React.Dispatch<React.SetStateAction<User[]>>;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ selectedChat }) => {
  const [msg, setMsg] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { socket, userIp } = useSocket();
  const [fileObjects, setFileObjects] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const [scrollToBottom, setScrollToBottom] = useState<boolean>(false);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      setFileObjects(prevFileObjects => [...prevFileObjects, ...files]);
      fileInputRef.current!.value = ''; // Clear file input after selection
    }
  };
  const getChatLog = (): void => {
    if (socket && selectedChat) {
      setMessages([]);
      socket.emit('requestChatLog', selectedChat.ip);
    }
  };
  const scrollToBottomIfNeeded = () => {
    if (chatBoxRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatBoxRef.current;
      // Scroll if the user is within 300 pixels of the bottom
      if (scrollTop + clientHeight >= scrollHeight - 300 || scrollToBottom) {
        chatBoxRef.current.scrollTop = scrollHeight;
        setScrollToBottom(false); // Reset scrollToBottom flag after scrolling
      }
    }
  };
  useEffect(() => {
    if (scrollToBottom) {
      scrollToBottomIfNeeded();
      setScrollToBottom(false);
    }
  }, [scrollToBottom]);
  useEffect(() => {
    const handleImageLoad = (event: Event) => {
      const image = event.target as HTMLImageElement;
      if (image.complete) {
        scrollToBottomIfNeeded();
      }
    };
  
    const imageElements = document.querySelectorAll('img[data-auto-scroll]');
    imageElements.forEach(image => {
      image.addEventListener('load', handleImageLoad);
    });
  
    return () => {
      imageElements.forEach(image => {
        image.removeEventListener('load', handleImageLoad);
      });
    };
  }, [messages]);  // Run this effect when `messages` change

  const sendMessage = async () => {
    if ((msg.trim() === '' && fileObjects.length === 0) || !selectedChat || !userIp) return;
  
    const formData = new FormData();
    formData.append('message', JSON.stringify({
      text: msg,
      sent: new Date(),
      from: userIp,
      to: selectedChat.ip,
      attachments: fileObjects.map(file => ({ name: file.name })), // Only name is used for now
    }));
  
    fileObjects.forEach(file => {
      formData.append('files', file);
    });
  
    if (fileObjects.length > 0) {
      try {
        console.log('Uploading files...');
        const response = await fetch('/upload', {
          method: 'POST',
          body: formData,
        });
  
        // Log the response status and any response data
        console.log('Upload response status:', response.status);
        const responseData = await response.json();
        console.log('Upload response data:', responseData);
  
        if (!response.ok) {
          throw new Error('Upload failed');
        }
  
        console.log('Files uploaded successfully');
        const newMessage = responseData.message;
  
        console.log('Sending message:', newMessage);
        setMessages(prevMessages => [...prevMessages, newMessage]);
        socket?.emit('sendMessage', newMessage);
        setMsg('');
        setFileObjects([]); // Clear file objects after sending
        setScrollToBottom(true); // Trigger scroll to bottom
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else {
      const newMessage = {
        text: msg,
        sent: new Date(),
        from: userIp,
        to: selectedChat.ip,
        attachments: null,
      };
      console.log('Sending message:', newMessage);
      setMessages(prevMessages => [...prevMessages, newMessage]);
      socket?.emit('sendMessage', newMessage);
      setMsg('');
      setFileObjects([]); // Clear file objects after sending
      setScrollToBottom(true); // Trigger scroll to bottom
    }
  };

  useEffect(() => {
    if (socket && selectedChat) {
      // Clear current messages
      setMessages([]);
      setScrollToBottom(true);
  
      // Request chat log from the server
      getChatLog();
  
      socket.on('receiveChatLog', (chatLog: Message[]) => {
        setMessages(chatLog.map(msg => ({
          ...msg,
          sent: typeof msg.sent === 'string' ? new Date(msg.sent) : msg.sent,
        })));
        setScrollToBottom(true); // Ensure scroll to bottom when chat log is received
      });
  
      // Listen for live messages
      socket.on('receiveMessage', (message: Message) => {
        console.log('Received message:', message);
        if (message.from === selectedChat.ip || message.to === selectedChat.ip) {
          setMessages(prevMessages => [...prevMessages, message]);
          // Determine if we need to scroll based on who sent the message
          if (message.from === userIp) {
            setScrollToBottom(true);
          } else if (chatBoxRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatBoxRef.current;
            if (scrollHeight - scrollTop - clientHeight < 300) {
              setScrollToBottom(true);
            }
          }
        }
      });
  
      // Clean up socket listeners on unmount or when selectedChat changes
      return () => {
        socket.off('receiveChatLog');
        socket.off('receiveMessage');
      };
    }
  }, [socket, selectedChat]);

  return (
    <div className='flex flex-col w-full mx-4 bg-slate-500 rounded-2xl p-2'>
    <div className=' text-white text-2xl font-bold [text-shadow:_2px_2px_2px_rgb(82_98_122)]'>{selectedChat?.name}</div>
    <div className="relative rounded-2xl border-2w-full h-full flex flex-col overflow-hidden bg-white">
      <div ref={chatBoxRef} className="w-full h-full overflow-y-auto flex flex-col">
        {selectedChat ? messages.map((message, index) => (
          <div key={index} className={`${message.from==userIp?"self-end":""}`}>
            {
            (index == 0 || new Date(messages[index - 1].sent).toLocaleDateString() !== new Date(message.sent).toLocaleDateString()) &&
                <div className='w-full flex items-center justify-center bg-slate-300 mt-2 mb-4' style={{ boxShadow: '0 0 2px 10px #cbd5e1' }}><div className='bg-slate-500 rounded-full p-2 text-white'>
                  {
                    getTimeDifference(new Date(message.sent), new Date()) === 0
                      ? 'Today'
                      : getTimeDifference(new Date(message.sent), new Date()) === 1
                      ? 'Yesterday'
                      : FormatDate(new Date(message.sent))
                  }
                  </div></div>
            }
            <MessageBubble
              message={message}
              userIp={userIp || ''}
              selectedChat={selectedChat}
              handleImageClick={(imageUrl) => {
                setSelectedImage(imageUrl);
                setIsImageModalOpen(true);
              }}
            />
          </div>
        )) : <div className='h-full w-full flex items-center justify-center'><p className="text-center">Open the "Contacts" menu and select a contact to begin chatting.</p></div>}
      </div>
    
      {fileObjects.length > 0 && (
        <div className="w-full h-fit p-4 border-slate-500 border-t-2 flex flex-wrap gap-4">
          {fileObjects.map((file, index) => (
            <FilePreview
              key={index}
              file={file}
              index={index}
              removeFile={(index) => setFileObjects(fileObjects.filter((_, i) => i !== index))}
            />
          ))}
        </div>
      )}
      {selectedChat&&(
        <>
      <MessageInput
        msg={msg}
        setMsg={setMsg}
        sendMessage={sendMessage}
        handleFileChange={handleFileChange}
        fileObjects={fileObjects}
        fileInputRef={fileInputRef}
      />
    
      <ImageModal
        isImageModalOpen={isImageModalOpen}
        selectedImage={selectedImage}
        onClose={() => setIsImageModalOpen(false)}
      />
      </>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
      )
      }
    </div>
    </div>
    ); };

    export default ChatRoom;