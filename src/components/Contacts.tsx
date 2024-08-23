import React, { useEffect, useState } from 'react';
import { useSocket } from '../SocketContext';

interface ContactsProps {
  selectedContact: string | null;
  onSelectContact: (contactId: string) => void;
}

export const Contacts: React.FC<ContactsProps> = ({ selectedContact, onSelectContact }) => {
  const [isContactsOpen, setIsContactsOpen] = useState<boolean>(false);
  const [clients, setClients] = useState<string[]>([]);
  const socket = useSocket();

  useEffect(() => {
    // Listen for client list updates
    socket?.on('updateClients', (clientList: string[]) => {
      setClients(clientList);
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socket?.off('updateClients');
    };
  }, [socket]);

  return (
    <div className='relative mx-4 h-[90vh] mt-4 flex flex-col bg-slate-500 items-center p-4'>
      <button
        className='mx-4 rounded-full bg-slate-400 h-20 w-full'
        onClick={() => setIsContactsOpen(!isContactsOpen)}
      >
        Contacts
      </button>
      <div
        className={`relative ${isContactsOpen ? 'w-60' : 'w-0'} transition-all bg-slate-200 flex-grow rounded-2xl p-4 my-4 mx-4 overflow-hidden`}
        style={{ height: 'calc(100% - 1rem)' }} // Adjust height if necessary
      >
        {isContactsOpen && (
          <ul>
            {clients.length === 0 ? (
              <li>No clients connected</li>
            ) : (
              clients.map((clientId, index) => (
                <li
                  key={index}
                  onClick={() => onSelectContact(clientId)}
                  className={`transition-colors p-2 cursor-pointer ${clientId === selectedContact ? 'bg-blue-400 text-white' : ''}`}
                >
                  {clientId}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};
