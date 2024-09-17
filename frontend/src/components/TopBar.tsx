import { LanguageSwitcher } from './LanguageSwitcher'

export const TopBar = () => {
  return (
    <div className='flex justify-between bg-slate-600 h-12'>
        <LanguageSwitcher/>
    </div>
  )
}
