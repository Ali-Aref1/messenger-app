import React, { createContext, useContext, useState } from 'react';
import User from './interfaces/User';

interface ClientContextType {
  selectedContact: User | null;
  setSelectedContact: React.Dispatch<React.SetStateAction<User | null>>;
  onlineClients: User[];
  setOnlineClients: React.Dispatch<React.SetStateAction<User[]>>;
  offlineClients: User[];
  setOfflineClients: React.Dispatch<React.SetStateAction<User[]>>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [onlineClients, setOnlineClients] = useState<User[]>([]);
  const [offlineClients, setOfflineClients] = useState<User[]>([]);

  return (
    <ClientContext.Provider value={{ selectedContact, setSelectedContact, onlineClients, setOnlineClients, offlineClients, setOfflineClients }}>
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
