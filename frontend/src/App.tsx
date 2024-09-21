import { ChatRoom } from './components/ChatRoom';
import { ChakraProvider, Center } from '@chakra-ui/react';
import { TopBar } from './components/TopBar';
import { Contacts } from './components/Contacts';
import { SocketProvider } from './SocketContext';
import { useState } from 'react';
import User from './interfaces/User';

function App() {
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [onlineClients, setOnlineClients] = useState<User[]>([]);
  const [offlineClients, setOfflineClients] = useState<User[]>([]);

  return (
    <ChakraProvider>
      <TopBar />
      <Center h="93vh">
        <SocketProvider>
            <div className='flex justify-between w-full h-[88vh] pb-4'>
            <Contacts 
              selectedContact={selectedContact} 
              setSelectedContact={setSelectedContact} 
              onlineClients={onlineClients} 
              offlineClients={offlineClients} 
              setOnlineClients={setOnlineClients}
              setOfflineClients={setOfflineClients}
            />
            <ChatRoom selectedChat={selectedContact}
            onlineClients={onlineClients}
            offlineClients={offlineClients}
            setOnlineClients={setOnlineClients}
            setOfflineClients={setOfflineClients}
            />
            </div>
        </SocketProvider>
      </Center>
    </ChakraProvider>
  );
}

export default App;
