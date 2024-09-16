import React, { ChangeEvent, useEffect, useState, useRef } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, Spinner } from '@chakra-ui/react';
import attachIcon from '../assets/paper-clip.png';
import remove from '../assets/remove.png';
import filepng from '../assets/file.png';
import pdf from '../assets/pdf.png';
import rar from '../assets/rar.png';
import Message from '../interfaces/Message';
import { useSocket } from '../SocketContext';

interface ChatRoomProps {
  selectedChat: string | null;
}

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const ChatRoom: React.FC<ChatRoomProps> = ({ selectedChat }) => {
  const [msg, setMsg] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { socket, userIp } = useSocket();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileObjects, setFileObjects] = useState<File[]>([]);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const [scrollToBottom, setScrollToBottom] = useState<boolean>(false);
  const imageRefs = useRef<{ [key: number]: HTMLImageElement | null }>({});

  const getDirectoryPath = (userIp: string, chatIp: string): string => {
    const sortedIps = [userIp, chatIp].sort();
    return `${sortedIps[0]}_to_${sortedIps[1]}`;
  };

  const getFileIcon = (fileExtension: string): string => {
    switch (fileExtension) {
      case 'pdf':
        return pdf;
      case 'rar':
      case 'zip':
        return rar;
      default:
        return filepng; // default file icon
    }
  };

  const truncateFileName = (fileName: string): string => {
    const fileExtension = fileName?.split('.').pop()?.toLowerCase();
    return fileName?.length > 10 ? `${fileName?.slice(0, 10)}...${fileExtension}` : fileName;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      setFileObjects(prevFileObjects => [...prevFileObjects, ...files]);

      fileInputRef.current!.value = ''; // Clear file input after selection
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
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
  
  
  const getChatLog = (): void => {
    if (socket && selectedChat) {
      setMessages([]);
      socket.emit('requestChatLog', selectedChat);
    }
  };

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
  
  
  

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const isImageFile = (filename: string | undefined): boolean => {
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp'];
    return imageExtensions.includes(getFileExtension(filename || ''));
  };

  return (
    <div className="relative rounded-2xl border-2 border-black w-full h-[90vh] flex flex-col mx-4 overflow-hidden">
      <div ref={chatBoxRef} className="w-full h-full overflow-y-auto flex flex-col">
        {selectedChat
          ? messages.map((message, index) => {
            const sentDate = typeof message.sent === 'string' ? new Date(message.sent) : message.sent;
            return (
              <div
                key={index}
                className={`p-2 w-fit max-w-[30vw] rounded-2xl mx-2 my-2 text-wrap ${
                  message.from === userIp ? "self-end bg-sky-600 text-white" : "self-start bg-slate-300 text-gray-800"
                }`}
              >
                
                {message.attachments && message.attachments.length > 0 && (
                    <div>
                    {message.attachments.map((attachment, idx) => (
                      <div key={idx} className="my-2">
                        {isImageFile(attachment.name) ? (
                          (attachment.path
                            ? <img
                                src={`http://${window.location.hostname}:4000/attachments/${getDirectoryPath(userIp || '', selectedChat)}/${attachment.path}`}
                                className="w-full h-fit max-w-80 object-cover rounded-md cursor-pointer"
                                data-auto-scroll
                                onClick={() => handleImageClick(`http://${window.location.hostname}:4000/attachments/${getDirectoryPath(userIp || '', selectedChat)}/${attachment.path}`)}
                                alt={attachment.name}
                              />
                            : <div className='w-80 h-80 max-w-80 object-cover rounded-md bg-gray-950'><Spinner></Spinner></div>
                          )
                        ) : (
                          <div className="flex items-center">
                            <a
                              href={`http://${window.location.hostname}:4000/attachments/${getDirectoryPath(userIp || '', selectedChat)}/${attachment.path}`}
                              download
                              className="flex items-center space-x-2"
                            >
                              <img
                                src={getFileIcon(getFileExtension(attachment.name))}
                                alt={attachment.name}
                                className="w-8 h-8 object-cover"
                              />
                              <p>{attachment.name}</p>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}



                {message.text}
                <div className="text-xs text-gray-500 text-right">
                  {sentDate.toLocaleTimeString()}
                </div>
              </div>
            );
          })
          : <div className="p-2">Select a chat to start messaging</div>
        }

        {/* Modal for image preview */}
        <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent bg="transparent" boxShadow="none">
            <ModalCloseButton display="none" />
            <ModalBody p={0}>
              {selectedImage && (
                <img src={selectedImage} alt="Large preview" className="w-full h-full object-contain" />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

      </div>
      {
      selectedChat && <div className="w-full h-fit p-2 border-black border-t-2 flex gap-2">
        {fileObjects.length > 0 && fileObjects.map((file, index) => {
          return (
            <div key={index} className='relative flex flex-col h-fit gap-2 items-center bg-slate-600 rounded-lg p-2'>
              <img
                src={remove}
                className='absolute top-2 right-2 w-4 cursor-pointer'
                onClick={() => {
                  setFileObjects(prev => prev.filter((_, idx) => idx !== index));
                }}
                alt="Remove"
              />
              <div>
                <img
                  src={file.type.includes('image') ? URL.createObjectURL(file) : getFileIcon(file.name.split('.').pop() || '')}
                  alt={file.name}
                  className="w-12 h-12 object-cover"
                />
                <p className='text-white text-xs'>{truncateFileName(file.name)}</p>
              </div>
            </div>
          );
        })}
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded"
        />
        <button onClick={() => fileInputRef.current?.click()} className="bg-blue-500 text-white rounded px-4 py-2">
          <img src={attachIcon} alt="Attach" className="w-6 h-6" />
        </button>
        <button
          onClick={sendMessage}
          className="bg-green-500 text-white rounded px-4 py-2"
        >
          Send
        </button>
      </div>}
    </div>
    
  );
};
