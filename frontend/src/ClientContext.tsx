import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import User from './interfaces/User';
import { useToast } from '@chakra-ui/react';
import onlineSound from './assets/audio/online.mp3';
import offlineSound from './assets/audio/offline.mp3';

interface ClientContextType {
  selectedContact: User | null;
  setSelectedContact: React.Dispatch<React.SetStateAction<User | null>>;
  onlineClients: User[];
  setOnlineClients: React.Dispatch<React.SetStateAction<User[]>>;
  offlineClients: User[];
  setOfflineClients: React.Dispatch<React.SetStateAction<User[]>>;
  unreads: any;
  setUnreads: React.Dispatch<React.SetStateAction<any>>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [onlineClients, setOnlineClients] = useState<User[]>([]);
  const [offlineClients, setOfflineClients] = useState<User[]>([]);
  const [unreads, setUnreads] = useState<any>(null);
  const { socket, userIp } = useSocket();

  // Create audio instances for online and offline sounds
  const onlineAudio = useRef<HTMLAudioElement | null>(null);
  const offlineAudio = useRef<HTMLAudioElement | null>(null);
  const toast = useToast();

  // To keep track of the last notification time for online/offline separately
  const lastOnlineActionRef = useRef<{ [key: string]: number }>({});
  const lastOfflineActionRef = useRef<{ [key: string]: number }>({});

  const throttleDuration = 3000; // 3 seconds

  const canShowOnlineNotification = (userId: string) => {
    const now = Date.now();
    if (!lastOnlineActionRef.current[userId] || now - lastOnlineActionRef.current[userId] > throttleDuration) {
      lastOnlineActionRef.current[userId] = now;
      return true;
    }
    return false;
  };

  const canShowOfflineNotification = (userId: string) => {
    const now = Date.now();
    if (!lastOfflineActionRef.current[userId] || now - lastOfflineActionRef.current[userId] > throttleDuration) {
      lastOfflineActionRef.current[userId] = now;
      return true;
    }
    return false;
  };

  useEffect(() => {

    onlineAudio.current = new Audio(onlineSound);
    offlineAudio.current = new Audio(offlineSound);
    
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

      socket.on('connected', (data: User) => {
        if (canShowOnlineNotification(data.ip)) { // Throttle online notifications
          onlineAudio.current?.play().catch((error) => console.error('Audio playback error:', error));
          toast({
            title: `${data.name} is online`,
            position: 'top-right',
            duration: 3000,
            isClosable: true,
          });
        }
      });

      socket.on('disconnected', (data: User) => {
        if (canShowOfflineNotification(data.ip)) { // Throttle offline notifications
          offlineAudio.current?.play().catch((error) => console.error('Audio playback error:', error));
          toast({
            title: `${data.name} is offline`,
            position: 'top-right',
            duration: 3000,
            isClosable: true,
          });
        }
      });

      socket.emit('requestUnreads');
      console.log('requesting unreads');
      socket.on('receiveUnreads', (data: any) => {
        console.log(data);
        setUnreads(data);
      });

      return () => {
        socket.off('updateClients');
        socket.off('receiveUnreads');
        socket.off('connected');
        socket.off('disconnected');
      };
    }
  }, [socket, userIp]);

  return (
    <ClientContext.Provider value={{ 
      selectedContact, 
      setSelectedContact, 
      onlineClients, 
      setOnlineClients, 
      offlineClients, 
      setOfflineClients, 
      unreads, 
      setUnreads 
    }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClientContext = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClientContext must be used within a ClientProvider');
  }
  return context;
};
