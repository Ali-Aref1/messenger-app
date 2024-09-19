import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useSocket } from '../SocketContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import FilePreview from './FilePreview';
import ImageModal from './ImageModal';
import Message from '../interfaces/Message';

interface ChatRoomProps {
  selectedChat: string | null;
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
      socket.emit('requestChatLog', selectedChat);
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
      to: selectedChat,
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
        to: selectedChat,
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
        if (message.from === selectedChat || message.to === selectedChat) {
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
    <div className="relative rounded-2xl border-2 border-black w-full h-[90vh] flex flex-col mx-4 overflow-hidden">
      <div ref={chatBoxRef} className="w-full h-full overflow-y-auto flex flex-col">
        {selectedChat ? messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message}
            userIp={userIp || ''}
            selectedChat={selectedChat}
            handleImageClick={(imageUrl) => {
              setSelectedImage(imageUrl);
              setIsImageModalOpen(true);
            }}
          />
        )) : <p className="text-center">Please select a chat room.</p>}
      </div>
    
      {fileObjects.length > 0 && (
        <div className="w-full h-fit p-4 border-black border-t-2 flex flex-wrap gap-4">
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
    ); };

    export default ChatRoom;