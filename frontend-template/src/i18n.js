import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import des traductions
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';
import arTranslations from './locales/ar.json';

// Configuration des ressources
const resources = {
  en: {
    translation: enTranslations
  },
  fr: {
    translation: frTranslations
  },
  ar: {
    translation: arTranslations
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // langue par défaut
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },

    // Configuration pour l'arabe (RTL)
    react: {
      useSuspense: false,
    }
  });

export default i18n;
