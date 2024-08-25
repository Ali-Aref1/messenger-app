import React, { useEffect, useState } from 'react';
import { useSocket } from '../SocketContext';
import { Spinner, Box } from '@chakra-ui/react';

interface ContactsProps {
  selectedContact: string | null;
  setSelectedContact: (contactId: string | null) => void;
}

export const Contacts: React.FC<ContactsProps> = ({ selectedContact, setSelectedContact }) => {
  const [isContactsOpen, setIsContactsOpen] = useState<boolean>(false);
  const [clients, setClients] = useState<string[]>([]);
  const { socket, userIp } = useSocket(); // Destructure userIp from useSocket

  useEffect(() => {
    if (selectedContact && !clients.includes(selectedContact)) {
      console.log('clearing selectedContact')
      setSelectedContact(null);
    }
  },[clients]);
    
  useEffect(() => {
    if (socket) {
      socket.on('updateClients', (clientList: string[]) => {
        if (userIp) {
          const filteredClients = clientList.filter(ip => ip !== userIp);
          console.log('Received and filtered client list:', filteredClients);
          setClients(filteredClients);
          console.log(selectedContact);

        }
      });

      return () => {
        socket.off('updateClients');
      };
    }
  }, [socket, userIp]);

  useEffect(() => {
    // Log the updated selectedContact whenever it changes
    console.log('Updated selectedContact:', selectedContact);
  }, [selectedContact]);

  return (
    <div className='relative mx-4 h-[88vh] mt-4 flex flex-col bg-slate-500 items-center p-4'>
      <button
        className='mx-4 rounded-full bg-slate-400 h-20 w-full'
        onClick={() => setIsContactsOpen(!isContactsOpen)}
      >
        Contacts
      </button>
      <div
        className={`relative ${isContactsOpen ? 'w-60' : 'w-0'} transition-all bg-slate-200 flex-grow rounded-2xl p-4 my-4 mx-4 text-gray-600 overflow-hidden`}
        style={{ height: 'calc(100% - 1rem)' }} // Adjust height if necessary
      >
        {userIp === null ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Spinner size="xl" />
          </Box>
        ) : isContactsOpen ? (
          <ul>
            {clients.length === 0 ? (
              <li>No online users</li>
            ) : (
              clients.map((clientId, index) => (
                <li
                  key={index}
                  onClick={() => {
                    setSelectedContact(clientId);
                    console.log('Clicked on clientId:', clientId); // Log the clicked client ID
                  }}
                  className={`transition-colors p-2 cursor-pointer ${clientId === selectedContact ? 'bg-blue-400 text-white' : ''}`}
                >
                  {clientId}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
};
