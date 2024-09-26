import React, { useEffect, useState } from 'react';
import { useSocket } from '../SocketContext';
import { Spinner, Box, Tabs, TabList, TabPanels, Tab, TabPanel, useColorMode, TabIndicator } from '@chakra-ui/react';
import User from '../interfaces/User';
import { useClientContext } from '../ClientContext';
import { useTranslation } from 'react-i18next';

export const Contacts: React.FC = () => {
  const [isContactsOpen, setIsContactsOpen] = useState<boolean>(false);
  const { selectedContact, setSelectedContact, onlineClients, offlineClients, unreads, setUnreads } = useClientContext();
  const { socket, userIp } = useSocket();
  const { t } = useTranslation();
  const { colorMode } = useColorMode();

  const bgColor = colorMode === 'light' ? 'bg-slate-500' : 'bg-gray-800';
  const buttonBgColor = colorMode === 'light' ? 'bg-slate-400' : 'bg-gray-700';
  const panelBgColor = colorMode === 'light' ? 'bg-slate-200' : 'bg-gray-700';
  const textColor = colorMode === 'light' ? 'text-gray-600' : 'text-gray-300';
  const hoverBgColor = colorMode === 'light' ? 'hover:bg-gray-300' : 'hover:bg-gray-600';
  const selectedBgColor = colorMode === 'light' ? 'bg-gray-400' : 'bg-gray-600';

  return (
    <div className={`relative mx-4 h-full flex flex-col ${bgColor} items-center p-4 rounded-xl`}>
      <button
        className={`mx-4 rounded-full ${buttonBgColor} h-20 w-full transition-all duration-500`}
        onClick={() => { setIsContactsOpen(!isContactsOpen); }}
      >
        {t('contacts')}
      </button>
      <div
        className={`relative ${isContactsOpen ? 'w-60' : 'w-0'} transition-all ${panelBgColor} flex-grow rounded-2xl p-4 my-4 mx-4 ${textColor} overflow-hidden`}
        style={{ height: 'calc(100% - 1rem)' }}
      >
        {userIp === null ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Spinner />
          </Box>
        ) : isContactsOpen ? (
          <Tabs variant='unstyled' isFitted>
            <TabList>
                <Tab>{t("online")}</Tab>
                <div className="mx-2 border-l h-8 opacity-40" style={{borderColor:useColorMode().colorMode=='light'?"#64748B":"#1F2937"}}></div>
                <Tab>{t("offline")}</Tab>
            </TabList>
            <TabIndicator mt='-1.5px' height='2px' bg={useColorMode().colorMode=='light'?"#64748B":"#1F2937"} borderRadius='1px' />
            <TabPanels>
              <TabPanel>
                <ul>
                  {onlineClients.length > 0 ? (
                    onlineClients.map((client) => (
                      <li
                        key={client.ip}
                        onClick={() => { setSelectedContact(client) }}
                        className={`cursor-pointer ${hoverBgColor} p-2 rounded ${selectedContact === client ? selectedBgColor : ''}`}
                      >
                        <div className='flex justify-between'>
                          <p>{client.name}</p>
                          {unreads && unreads[client.ip] > 0 ?
                            <div className='text-white bg-green-500 rounded-full w-6 flex items-center justify-center text-[12px]' style={{ boxShadow: "0 0 6px rgb(34 197 94)" }}>
                              <p>{unreads[client.ip]}</p>
                            </div>
                            : null
                          }
                        </div>
                      </li>
                    ))
                  ) : (
                    <p>{t("no_online")}</p>
                  )}
                </ul>
              </TabPanel>
              <TabPanel>
                <ul>
                  {offlineClients.length > 0 ? (
                    offlineClients.map((client) => (
                      <li
                        key={client.ip}
                        onClick={() => {
                          setSelectedContact(client)
                          setUnreads({ ...unreads, [client.ip]: 0 });
                        }}
                        className={`cursor-pointer ${hoverBgColor} p-2 rounded ${selectedContact === client ? selectedBgColor : ''}`}
                      >
                        <div className='flex justify-between'>
                          <p>{client.name}</p>
                          {unreads && unreads[client.ip] > 0 ?
                            <div className='text-white bg-green-500 rounded-full w-6 flex items-center justify-center text-[12px]' style={{ boxShadow: "0 0 6px rgb(34 197 94)" }}>
                              <p>{unreads[client.ip]}</p>
                            </div>
                            : null
                          }
                        </div>
                      </li>
                    ))
                  ) : (
                    <p>{t("no_offline")}</p>
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
