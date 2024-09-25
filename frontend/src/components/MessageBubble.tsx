import React from 'react';
import { Spinner } from '@chakra-ui/react';
import Message from '../interfaces/Message';
import { getFileIcon, isImageFile, getDirectoryPath, formatTime } from '../utils';
import User from '../interfaces/User';
import { useTranslation } from 'react-i18next';

interface MessageBubbleProps {
  message: Message;
  userIp: string;
  selectedContact: User;
  handleImageClick: (imageUrl: string) => void;
}


const MessageBubble: React.FC<MessageBubbleProps> = ({ message, userIp, selectedContact, handleImageClick }) => {
  const { t,i18n } = useTranslation();

  return (
    <div
      className={`p-2 w-fit max-w-[30vw] rounded-2xl mx-2 my-2 text-wrap ${message.from === userIp ? "bg-sky-600 text-white" : "bg-slate-300 text-gray-800"}`}
    >
      {message.attachments && message.attachments.length > 0 && (
        <div>
          {message.attachments.map((attachment, idx) => (
            <div key={idx} className="my-2">
              {isImageFile(attachment.name) ? (
                (attachment.path
                  ? <img
                      src={`http://${window.location.hostname}:4000/attachments/${getDirectoryPath(userIp || '', selectedContact.ip)}/${attachment.path}`}
                      className="w-full h-fit max-w-80 object-cover rounded-md cursor-pointer"
                      data-auto-scroll
                      onClick={() => handleImageClick(`http://${window.location.hostname}:4000/attachments/${getDirectoryPath(userIp || '', selectedContact.ip)}/${attachment.path}`)}
                      alt={attachment.name}
                    />
                  : <div className='w-80 h-80 max-w-80 object-cover rounded-md bg-gray-950'><Spinner /></div>
                )
              ) : (
                <div className="flex items-center">
                  <a
                    href={`http://${window.location.hostname}:4000/attachments/${getDirectoryPath(userIp || '', selectedContact.ip)}/${attachment.path}`}
                    download={attachment.name}
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
      <div className={`text-xs text-right opacity-50 ${message.from === userIp ? "text-white" : "text-gray-800"}`}>
        {formatTime(new Date(message.sent),i18n.language)}
      </div>
    </div>
  );
};

export default MessageBubble;
