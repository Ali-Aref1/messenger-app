import React, { useEffect, useState } from 'react';
import { useSocket } from '../SocketContext';
import { Spinner, Box, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import User from '../interfaces/User';

interface ContactsProps {
  selectedContact: string | null;
  setSelectedContact: (contactId: string | null) => void;
}

export const Contacts: React.FC<ContactsProps> = ({ selectedContact, setSelectedContact }) => {
  const [isContactsOpen, setIsContactsOpen] = useState<boolean>(false);
  const [onlineClients, setOnlineClients] = useState<User[]>([]);
  const [offlineClients, setOfflineClients] = useState<User[]>([]);
  const { socket, userIp } = useSocket();
  {/*test*/}

  useEffect(() => {
    if (socket && userIp) {
      socket.emit('requestClients');

      socket.on('updateClients', (data: { online: User[], offline: User[] }) => {
        if (data && Array.isArray(data.online) && Array.isArray(data.offline)) {
          const filteredOnline = data.online.filter(user => user.ip !== userIp);
          const filteredOffline = data.offline.filter(user => user.ip !== userIp);
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
            <Spinner />
          </Box>
        ) : (
          <Tabs variant='enclosed'>
            <TabList>
              <Tab>Online</Tab>
              <Tab>Offline</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <ul>
                  {onlineClients.length > 0 ? (
                    onlineClients.map((client) => (
                      <li
                        key={client.ip}
                        onClick={() => setSelectedContact(client.ip)}
                        className={`cursor-pointer hover:bg-gray-300 p-2 rounded ${selectedContact === client.ip ? 'bg-gray-400' : ''}`}
                      >
                        {client.name}
                      </li>
                    ))
                  ) : (
                    <p>No online clients</p>
                  )}
                </ul>
              </TabPanel>
              <TabPanel>
                <ul>
                  {offlineClients.length > 0 ? (
                    offlineClients.map((client) => (
                      <li
                        key={client.ip}
                        onClick={() => setSelectedContact(client.ip)}
                        className={`cursor-pointer hover:bg-gray-300 p-2 rounded ${selectedContact === client.ip ? 'bg-gray-400' : ''}`}
                      >
                        {client.name}
                      </li>
                    ))
                  ) : (
                    <p>No offline clients</p>
                  )}
                </ul>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </div>
    </div>
  );
};
