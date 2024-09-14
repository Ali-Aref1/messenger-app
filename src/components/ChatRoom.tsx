  import React, { ChangeEvent, useEffect, useState, useRef } from 'react';
  import attachIcon from '../assets/paper-clip.png';
  import remove from '../assets/remove.png'; // Assuming you have a remove icon
  import { useSocket } from '../SocketContext';
  import filepng from '../assets/file.png';
  import pdf from '../assets/pdf.png';
  import rar from '../assets/rar.png';
  import { Spinner } from '@chakra-ui/react'; // Import Chakra UI Spinner

  interface Message {
    text: string;
    sent: Date | string;
    from: string;
    to: string;
    attachments: {originalName?:string, name?: string; filePath: string; base64Content?: string }[] | null;
  }

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
    const [base64Files, setBase64Files] = useState<{ name: string; content: string; loading: boolean }[]>([]);
    const [worker, setWorker] = useState<Worker | null>(null);
    const getDirectoryPath = (userIp: string, chatIp: string): string => {
      const sortedIps = [userIp, chatIp].sort();
      return `${sortedIps[0]}_to_${sortedIps[1]}`;
    };
    const getServerIp = (): string => {
      if(window.location.hostname === 'localhost') {
        return userIp||'';
      }
      return window.location.hostname;
    }

    useEffect(() => {
      const newWorker = new Worker(new URL('../fileReaderWorker.js', import.meta.url));
      newWorker.onmessage = (e) => {
        console.log('Main thread received message from worker:', e.data);
        const fileResult = e.data;
        setBase64Files(prevBase64Files => {
          const existingFile = prevBase64Files.find(base64File => base64File.name === fileResult.name);
          if (existingFile) {
            return prevBase64Files.map(base64File =>
              base64File.name === fileResult.name ? fileResult : base64File
            );
          } else {
            return [...prevBase64Files, fileResult];
          }
        });
      };
      
      setWorker(newWorker);
    
      return () => {
        newWorker.terminate();
      };
    }, []);
    
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
    
        if (worker) { // Ensure worker is available
          files.forEach(file => {
            worker.postMessage(file);
            setBase64Files(prevBase64Files => [
              ...prevBase64Files,
              { name: file.name, content: '', loading: true }
            ]);
          });
        } else {
          console.error('Worker is not initialized.');
        }
    
        fileInputRef.current!.value = ''; // Clear file input after selection
      }
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
      if ((msg.trim() === '' && base64Files.length === 0) || !selectedChat || !userIp) return;

      const newMessage: Message = {
        text: msg,
        sent: new Date(),
        from: userIp,
        to: selectedChat,
        attachments: base64Files.length > 0 ? base64Files.map(file => ({
          name: file.name,
          filePath: `/chats/${selectedChat}/attachments/${file.name}`,
          base64Content: file.content
        })) : null,
      };

      // Send the message with attachments to the server.
      if (base64Files.length > 0) {
        socket?.emit('sendMessageWithAttachments', newMessage);
      } else {
        socket?.emit('sendMessage', newMessage);
      }

      setMessages(prevMessages => [...prevMessages, newMessage]);
      socket?.emit('requestChatLog', selectedChat);

      setMsg('');
      setBase64Files([]); // Clear base64 files after sending
      setFileObjects([]); // Clear file objects after sending
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    };
    const isImageFile = (filename:string|undefined): boolean => {
      const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp'];
      return imageExtensions.includes(getFileExtension(filename||''));
    };
    

    return (
      <div className="relative rounded-2xl border-2 border-black w-full h-[90vh] flex flex-col mx-4 overflow-hidden">
        <div className="w-full h-full overflow-y-auto flex flex-col">
          {selectedChat
            ? messages.map((message, index) => {
                const sentDate = typeof message.sent === 'string' ? new Date(message.sent) : message.sent;
                return (
                  <div
                    key={index}
                    className={`p-2 w-fit max-w-[30vw] rounded-2xl mx-2 my-2 text-wrap ${
                      message.from === userIp ? "self-end bg-sky-600 text-white" : "self-start bg-slate-300"
                    }`}
                  >
                    {message.text}
                    {message.attachments && message.attachments.length > 0 && (
                      <div>
                        {message.attachments.map((attachment, idx) => (
                          <div key={idx} className="my-2">
                            {isImageFile(attachment.originalName) ? (
                                <img
                                  src={`http://${getServerIp()}:4000/attachments/${getDirectoryPath(userIp||'',selectedChat)}/${attachment.filePath}`}
                                  alt={attachment.originalName}
                                  className="w-32 h-32 object-cover rounded-md"
                                />

                            ) : (
                              <div className="flex items-center flex-col">
                                <img
                                src={getFileIcon(getFileExtension(attachment.originalName||''))}
                                  className="w-8 h-8 object-cover"
                                />
                                <p>{attachment.originalName}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 text-right">
                      {sentDate.toLocaleTimeString()}
                    </div>
                  </div>
                );
              })
            : <div className="p-2">Select a chat to start messaging</div>
          }
        </div>

        <div className="w-full h-fit p-2 border-black border-t-2 flex gap-2">
          {fileObjects.length > 0 && fileObjects.map((file, index) => {
            const base64File = base64Files.find(bf => bf.name === file.name);
            return (
              <div key={index} className='relative flex flex-col h-fit gap-2 items-center bg-slate-600 rounded-lg p-2'>
                <img
                  src={remove}
                  className='absolute top-2 right-2 w-4 cursor-pointer'
                  onClick={() => {
                    setFileObjects(prev => prev.filter((_, idx) => idx !== index));
                    setBase64Files(prev => prev.filter(bf => bf.name !== file.name));
                  }}
                  alt="Remove"
                />
                {base64File?.loading ? (
                  <Spinner size="md" />
                ) : (
                  <div>
                    <img
                      src={getFileIcon(file.name.split('.').pop() || '')}
                      alt={file.name}
                      className="w-12 h-12 object-cover"
                    />
                    <p className='text-white text-xs'>{truncateFileName(file.name)}</p>
                  </div>
                )}
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
        </div>
      </div>
    );
  };
