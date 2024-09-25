import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from './locales/en/translation.json';
import translationAR from './locales/ar/translation.json'; // Add other languages as needed

i18n
  .use(LanguageDetector) // Detects language automatically
  .use(initReactI18next) // Passes i18n down to React components
  .init({
    resources: {
      en: { translation: translationEN },
      ar: { translation: translationAR },
    },
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
  });

export default i18n;
