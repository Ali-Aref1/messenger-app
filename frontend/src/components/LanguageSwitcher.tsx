import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  console.log(currentLanguage);

  const changeLanguage = (lng: string | undefined) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'; // Set direction based on language
  };

  useEffect(() => {
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  }, [currentLanguage]);

  return (
    <div className='rounded-full bg-slate-800 text-white px-4 py-2 h-10 my-auto mx-2 cursor-pointer'>
      {currentLanguage == 'ar' && (
        <button onClick={() => changeLanguage('en-US')}>English</button>
      )}
      {(currentLanguage == 'en-US'||currentLanguage=='en') && (
        <button onClick={() => changeLanguage('ar')}>العربية</button>
      )}
    </div>
  );
}

export { LanguageSwitcher };
