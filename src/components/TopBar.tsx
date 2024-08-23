import React from 'react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useAuthState } from 'react-firebase-hooks/auth';

export const TopBar = () => {
  return (
    <div className='flex justify-between bg-slate-600 h-12'>
        <LanguageSwitcher/>
    </div>
  )
}
