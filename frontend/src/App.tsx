import { ChatRoom } from './components/ChatRoom';
import { ChakraProvider, Center } from '@chakra-ui/react';
import { TopBar } from './components/TopBar';
import { Contacts } from './components/Contacts';
import { SocketProvider } from './SocketContext';
import { ClientProvider } from './ClientContext';

function App() {

  return (
    <ChakraProvider>
      <TopBar />
      <Center h="93vh">
        <SocketProvider>
        <ClientProvider>
            <div className='flex justify-between w-full h-[88vh] pb-4'>
            <Contacts/>
            <ChatRoom/>
            </div>
          </ClientProvider>
        </SocketProvider>
      </Center>
    </ChakraProvider>
  );
}

export default App;
