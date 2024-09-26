import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'
import {useColorMode} from '@chakra-ui/react'

export const TopBar = () => {
  return (
    <div className={`flex gap-4 h-12 items-center`}style={{backgroundColor:useColorMode().colorMode === 'light' ?"rgb(71 85 105)":"hsl(220, 26%, 12%)"}}>
        <LanguageSwitcher/>
        <ThemeSwitcher/>
    </div>
  )
}
