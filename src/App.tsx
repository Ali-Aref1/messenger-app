import { ChatRoom } from './components/ChatRoom';
import { ChakraProvider, Center } from '@chakra-ui/react';
import { TopBar } from './components/TopBar';
import { Contacts } from './components/Contacts';
import { SocketProvider } from './SocketContext';
import { useState } from 'react';

function App() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const handleSelectContact = (contactId: string) => {
    setSelectedContact(contactId);
  };

  return (
    <ChakraProvider>
      <TopBar />
      <Center h="93vh">
        <SocketProvider>
          <Contacts selectedContact={selectedContact} onSelectContact={handleSelectContact} />
          <ChatRoom selectedChat={selectedContact} />
        </SocketProvider>
      </Center>
    </ChakraProvider>
  );
}

export default App;
