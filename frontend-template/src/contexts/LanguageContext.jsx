import React, { createContext, useContext, useState, useEffect } from 'react';

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

// Provider du contexte
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [translations, setTranslations] = useState({}); // Gardé en interne, non exposé
  const [isLoading, setIsLoading] = useState(false);

  // Charger la langue depuis le localStorage au démarrage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && availableLanguages.find(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage);
      loadTranslations(savedLanguage);
    } else {
      // Définir 'fr' comme langue par défaut si rien n'est trouvé
      setCurrentLanguage('fr');
      localStorage.setItem('preferredLanguage', 'fr');
      loadTranslations('fr');
    }
  }, []);

  // Fonction pour charger les traductions
  const loadTranslations = async (languageCode) => {
    setIsLoading(true);
    try {
      console.log(`🌐 Chargement des traductions pour: ${languageCode}`);
      
      // Charger le fichier de traduction
      const translationModule = await import(`../locales/${languageCode}.json`);
      const loadedTranslations = translationModule.default || translationModule;
      
      setTranslations(loadedTranslations);

      // Mettre à jour l'attribut lang du document
      document.documentElement.lang = languageCode;

      // Déclencher un événement personnalisé pour notifier les composants
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: languageCode } // Plus besoin d'envoyer translations
      }));

      console.log(`✅ Traductions chargées pour ${languageCode}:`, Object.keys(loadedTranslations).length, 'clés');
      
    } catch (error) {
      console.warn(`⚠️ Impossible de charger les traductions pour ${languageCode}:`, error);
      // En cas d'erreur, charger un objet vide pour éviter les crashs
      setTranslations({});
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour changer de langue
  const setLanguage = async (languageCode) => {
    console.log(`🔄 Changement de langue vers: ${languageCode}`);
    
    if (availableLanguages.find(lang => lang.code === languageCode)) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('preferredLanguage', languageCode);
      await loadTranslations(languageCode);
    } else {
      console.error(`❌ Langue non supportée: ${languageCode}`);
    }
  };

  // Fonction pour obtenir une traduction avec fallback, gérant les clés imbriquées
  const getTranslation = (key, fallback) => {
    const keys = key.split('.');
    let result = translations;
    for (const k of keys) {
      result = result?.[k];
    }

    if (result === undefined || typeof result === 'object') {
      if (fallback !== undefined) {
        return fallback;
      }
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }

    return result;
  };

  // Fonction pour obtenir une traduction avec interpolation, gérant les clés imbriquées
  const getTranslationWithVars = (key, variables = {}, fallback) => {
    let translation = getTranslation(key, fallback || key);

    if (typeof translation !== 'string') {
      console.warn(`Invalid translation for key: ${key}`);
      return key;
    }

    // Remplacer les variables dans la traduction
    Object.keys(variables).forEach(varKey => {
      const placeholder = `{{${varKey}}}`;
      translation = translation.replace(new RegExp(placeholder, 'g'), variables[varKey]);
    });

    return translation;
  };

  const contextValue = {
    currentLanguage,
    setLanguage,
    availableLanguages,
    getTranslation,
    getTranslationWithVars,
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