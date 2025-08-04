import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

// Créer le Contexte
const LanguageContext = createContext();

// Langues disponibles
const availableLanguages = [
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'ar',
    name: 'العربية',
    nativeName: 'العربية',
    flag: '🇸🇦'
  }
];

// Provider du Contexte
export const LanguageProvider = ({ children }) => {
  const { i18n: i18nInstance } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem('preferredLanguage') || i18nInstance.language || 'en'
  );
  const [isLoading, setIsLoading] = useState(false);

  // Effet pour synchroniser avec localStorage et i18next
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && savedLanguage !== currentLanguage) {
      setCurrentLanguage(savedLanguage);
      i18nInstance.changeLanguage(savedLanguage);
    }
  }, []);

  // Fonction pour changer de langue
  const setLanguage = async (languageCode) => {
    console.log(`🔄 Changement de langue vers: ${languageCode}`);
    
    if (availableLanguages.find(lang => lang.code === languageCode)) {
      setIsLoading(true);
      try {
        await i18nInstance.changeLanguage(languageCode);
        setCurrentLanguage(languageCode);
        localStorage.setItem('preferredLanguage', languageCode);
        
        // Définir la direction du texte pour l'arabe (RTL)
        if (languageCode === 'ar') {
          document.documentElement.dir = 'rtl';
          document.documentElement.lang = 'ar';
        } else {
          document.documentElement.dir = 'ltr';
          document.documentElement.lang = languageCode;
        }
        
        console.log(`✅ Langue changée avec succès vers: ${languageCode}`);
      } catch (error) {
        console.error(`❌ Erreur lors du changement de langue vers ${languageCode}:`, error);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.error(`❌ Langue non supportée: ${languageCode}`);
    }
  };

  const contextValue = {
    currentLanguage,
    setLanguage,
    availableLanguages,
    isLoading
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
