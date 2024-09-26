import React, { useEffect } from 'react';
import { useColorMode, Button } from '@chakra-ui/react';
import DarkIcon from '../assets/night-mode.png';
import LightIcon from '../assets/light-mode.png';

export const ThemeSwitcher = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  // Use effect to change scrollbar style when color mode changes
  useEffect(() => {
    const root = document.documentElement;

    if (colorMode === 'dark') {
      // Set dark mode scrollbar styles
      root.style.setProperty('--scrollbar-track', '#2e2e2e');
      root.style.setProperty('--scrollbar-thumb', '#4a5568');
      root.style.setProperty('--scrollbar-thumb-hover', '#2d3748');
      root.style.setProperty('--scrollbar-thumb-shadow', '#2d3748');
    } else {
      // Set light mode scrollbar styles
      root.style.setProperty('--scrollbar-track', '#dadada');
      root.style.setProperty('--scrollbar-thumb', '#afb9c6');
      root.style.setProperty('--scrollbar-thumb-hover', '#96a0ad');
      root.style.setProperty('--scrollbar-thumb-shadow', '#96a0ad');
    }
  }, [colorMode]); // Trigger this effect whenever the color mode changes

  return (
    <button className='text-white bg-slate-800 rounded-full p-2 h-10 w-10' onClick={toggleColorMode}>
      <img className='invert' src={colorMode === 'light' ? DarkIcon : LightIcon }></img>
    </button>
  );
};
