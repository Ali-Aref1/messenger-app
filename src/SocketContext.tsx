import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  userIp: string | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

const socket = io(`http://${window.location.hostname}:4000`);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userIp, setUserIp] = useState<string | null>(null);

  useEffect(() => {
    const handleReceiveIp = (ip: string) => {
      console.log('Received IP from server:', ip);
      setUserIp(ip);
      socket.emit('requestClients');
    };

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('receiveIp', handleReceiveIp);

    // Listen for client list updates
    socket.on('updateClients', (clientList: string[]) => {
    });

    return () => {
      socket.off('connect');
      socket.off('receiveIp');
      socket.off('updateClients');
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, userIp }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === null) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
