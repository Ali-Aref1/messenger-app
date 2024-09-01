import React, { useEffect, useState } from 'react';
import { useSocket } from '../SocketContext';
import { Spinner, Box, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';

interface ContactsProps {
  selectedContact: string | null;
  setSelectedContact: (contactId: string | null) => void;
}

export const Contacts: React.FC<ContactsProps> = ({ selectedContact, setSelectedContact }) => {
  const [isContactsOpen, setIsContactsOpen] = useState<boolean>(false);
  const [onlineClients, setOnlineClients] = useState<string[]>([]);
  const [offlineClients, setOfflineClients] = useState<string[]>([]);
  const { socket, userIp } = useSocket();

  useEffect(() => {
    if (socket && userIp) {
      socket.emit('requestClients');

      socket.on('updateClients', (data: { online: string[], offline: string[] }) => {
        if (data && Array.isArray(data.online) && Array.isArray(data.offline)) {
          const filteredOnline = data.online.filter(ip => ip !== userIp);
          const filteredOffline = data.offline.filter(ip => ip !== userIp);
          setOnlineClients(filteredOnline);
          setOfflineClients(filteredOffline);
        } else {
          console.error('Received data is not in the expected format:', data);
        }
      });

      return () => {
        socket.off('updateClients');
      };
    }
  }, [socket, userIp]);


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
        style={{ height: 'calc(100% - 1rem)' }}
      >
        {userIp === null ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Spinner size="xl" />
          </Box>
        ) : isContactsOpen ? (
          <Tabs variant="enclosed">
            <TabList>
              <Tab>Online</Tab>
              <Tab>Offline</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <ul>
                  {onlineClients.length === 0 ? (
                    <li>No online users</li>
                  ) : (
                    onlineClients.map((clientId, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setSelectedContact(clientId);
                        }}
                        className={`transition-colors p-2 cursor-pointer ${clientId === selectedContact ? 'bg-blue-400 text-white' : ''}`}
                      >
                        {clientId}
                      </li>
                    ))
                  )}
                </ul>
              </TabPanel>
              <TabPanel>
                <ul>
                  {offlineClients.length === 0 ? (
                    <li>No offline users</li>
                  ) : (
                    offlineClients.map((clientId, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setSelectedContact(clientId);
                        }}
                        className={`transition-colors p-2 cursor-pointer ${clientId === selectedContact ? 'bg-blue-400 text-white' : ''}`}
                      >
                        {clientId}
                      </li>
                    ))
                  )}
                </ul>
              </TabPanel>
            </TabPanels>
          </Tabs>
        ) : null}
      </div>
    </div>
  );
};
