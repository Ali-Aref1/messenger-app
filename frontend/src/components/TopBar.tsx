import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'
import {useColorMode} from '@chakra-ui/react'
import HIPHLOGO from '../assets/776083e6-81e5-4eb5-8aaf-7d9da670466b.jpg'

export const TopBar = () => {
  return (
    <div className={`flex h-16 items-center w-full`}style={{backgroundColor:useColorMode().colorMode === 'light' ?"rgb(71 85 105)":"hsl(220, 26%, 12%)"}}>
        <div className='z-10 flex items-center'>
        <LanguageSwitcher/>
        <ThemeSwitcher/>
        </div>
        <div className='absolute w-full h-16 flex justify-center items-center z-0'>
        <img src={HIPHLOGO} alt="HIPHLOGO" className="absolute h-16 w-16 border-solid border-4 border-slate-800 rounded-md"/>
        </div>
    </div>
  )
}
