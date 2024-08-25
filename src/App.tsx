import { ChatRoom } from './components/ChatRoom';
import { ChakraProvider, Center, Flex } from '@chakra-ui/react';
import { TopBar } from './components/TopBar';
import { Contacts } from './components/Contacts';
import { SocketProvider } from './SocketContext';
import { useState } from 'react';

function App() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  return (
    <ChakraProvider>
      <TopBar />
      <Center h="93vh">
        <SocketProvider>
          <div className='flex justify-between w-full'>
          <Contacts selectedContact={selectedContact} setSelectedContact={setSelectedContact} />
          <ChatRoom selectedChat={selectedContact} />
          </div>
        </SocketProvider>
      </Center>
    </ChakraProvider>
  );
}

export default App;
