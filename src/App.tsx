import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { SignIn } from './components/SignIn';
import { ChatRoom } from './components/ChatRoom';
import { ChakraProvider, Spinner, Center } from '@chakra-ui/react';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { SignOut } from './components/SignOut';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_REACT_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_REACT_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_REACT_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_REACT_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_REACT_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_REACT_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_REACT_FIREBASE_APP_CHECK,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

function App() {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return (
      <ChakraProvider>
        <Center h="100vh">
          <Spinner size="xl" />
        </Center>
      </ChakraProvider>
    );
  }

  if (error) {
    return (
      <ChakraProvider>
        <Center h="100vh">
          <p>Error: {error.message}</p>
        </Center>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      <LanguageSwitcher/>
      <Center h="95vh">
      {user ? <ChatRoom /> : <SignIn />}
      </Center>
      {user && <SignOut/>}
    </ChakraProvider>
  );
}

export default App;
