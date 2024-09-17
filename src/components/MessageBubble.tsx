import React from 'react';
import { Spinner } from '@chakra-ui/react';
import Message from '../interfaces/Message';
import { getFileIcon, isImageFile, getDirectoryPath } from '../utils';

interface MessageBubbleProps {
  message: Message;
  userIp: string;
  selectedChat: string;
  handleImageClick: (imageUrl: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, userIp, selectedChat, handleImageClick }) => {
  const sentDate = typeof message.sent === 'string' ? new Date(message.sent) : message.sent;

  return (
    <div
      className={`p-2 w-fit max-w-[30vw] rounded-2xl mx-2 my-2 text-wrap ${message.from === userIp ? "self-end bg-sky-600 text-white" : "self-start bg-slate-300 text-gray-800"}`}
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
                  : <div className='w-80 h-80 max-w-80 object-cover rounded-md bg-gray-950'><Spinner /></div>
                )
              ) : (
                <div className="flex items-center">
                  <a
                    href={`http://${window.location.hostname}:4000/attachments/${getDirectoryPath(userIp || '', selectedChat)}/${attachment.path}`}
                    download
                    className="flex items-center space-x-2"
                  >
                    <img
                      src={getFileIcon(attachment.name.split('.').pop() || '')}
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
};

export default MessageBubble;
