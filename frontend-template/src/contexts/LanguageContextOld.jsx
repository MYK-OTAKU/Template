import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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

// Traductions par défaut
const defaultTranslations = {
  // Application
  appTitle: "Dashboard Template",
  appSubtitle: "Modern Web Application",
  
  // Navigation
  dashboard: "Tableau de bord",
  users: "Utilisateurs",
  roles: "Rôles",
  permissions: "Permissions",
  settings: "Paramètres",
  
  // Actions générales
  save: "Sauvegarder",
  cancel: "Annuler",
  create: "Créer",
  update: "Mettre à jour",
  delete: "Supprimer",
  edit: "Modifier",
  confirm: "Confirmer",
  close: "Fermer",
  
  // Messages
  loading: "Chargement...",
  processing: "Traitement en cours...",
  unknownError: "Une erreur est survenue",
  
  // Rôles
  roleManagement: "Gestion des Rôles",
  addRole: "Nouveau Rôle",
  editRole: "Modifier le rôle",
  deleteRole: "Supprimer le rôle",
  deleteRoleConfirmation: "Êtes-vous sûr de vouloir supprimer le rôle",
  thisActionCannot: "Cette action est irréversible.",
  noRolesFound: "Aucun rôle trouvé",
  startByCreatingRole: "Commencez par créer un rôle",
  errorLoadingRoles: "Erreur lors du chargement des rôles",
  roleName: "Nom du rôle",
  roleNamePlaceholder: "Nom du rôle",
  description: "Description",
  descriptionPlaceholder: "Description du rôle",
  permissionsSelected: "permission(s) sélectionnée(s)",
  noPermissionsAvailable: "Aucune permission disponible",
  mainPermissions: "Principales permissions:",
  others: "autres",
  
  // Validation
  nameRequired: "Le nom est requis",
  nameTooShort: "Le nom doit contenir au moins 3 caractères",
  descriptionRequired: "La description est requise",
  
  // Utilisateurs
  userManagement: "Gestion des Utilisateurs",
  addUser: "Ajouter un utilisateur",
  editUser: "Modifier l'utilisateur",
  deleteUser: "Supprimer l'utilisateur",
  activateUser: "Activer l'utilisateur",
  deactivateUser: "Désactiver l'utilisateur",
  confirmDeleteUser: "Confirmer la suppression",
  deleteUserConfirmation: "Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur",
  confirmToggleStatus: "Êtes-vous sûr de vouloir",
  activate: "activer",
  deactivate: "désactiver",
  theUser: "l'utilisateur",
  errorLoadingUsers: "Erreur lors du chargement des utilisateurs",
  searchUsers: "Rechercher un utilisateur...",
  allRoles: "Tous les rôles",
  showInactive: "Utilisateurs inactifs",
  total: "Total",
  active: "Actifs",
  noUsersFound: "Aucun utilisateur trouvé",
  tryModifyFilters: "Essayez de modifier vos filtres",
  startByCreatingUser: "Commencez par créer un utilisateur",
  user: "Utilisateur",
  role: "Rôle",
  status: "Statut",
  lastLogin: "Dernière connexion",
  actions: "Actions",
  neverConnected: "Jamais connecté",
  inactive: "Inactif",

  // Permissions
  permissionManagement: "Gestion des Permissions",
  addPermission: "Nouvelle Permission",
  editPermission: "Modifier la permission",
  deletePermission: "Supprimer la permission",
  deletePermissionConfirmation: "Êtes-vous sûr de vouloir supprimer la permission",
  errorLoadingPermissions: "Erreur lors du chargement des permissions",
  searchPermissions: "Rechercher des permissions...",
  noPermissions: "Aucune permission disponible",
  tryModifySearch: "Essayez de modifier votre recherche",
  permissionName: "Nom de la permission",
  permissionNameFormat: "Format recommandé: RESOURCE_ACTION (ex: USERS_VIEW, POSTES_MANAGE)",
  permissionDescriptionPlaceholder: "Description de la permission...",
  permissionSystemProtected: "Permission système protégée",
  permissionSystemNotModifiable: "Cette permission système ne peut pas être modifiée pour des raisons de sécurité.",
  permissionSystemNotDeletable: "Cette permission système ne peut pas être supprimée pour des raisons de sécurité.",
  modifiable: "Modifiable",
  characters: "caractères",
  examplesOfPermissions: "Exemples de permissions",
  modification: "Modification...",
  creation: "Création...",
  system: "Système",

  // Catégories de permissions (pour Roles et Permissions)
  permissionCategories: {
    system: "Système",
    users: "Utilisateurs",
    roles: "Rôles", 
    permissions: "Permissions",
    postes: "Postes",
    customers: "Clients",
    sales: "Ventes",
    inventory: "Inventaire",
    finance: "Finances",
    events: "Événements",
    monitoring: "Monitoring",
    sessions: "Sessions",
    typesPostes: "Types de Postes",
    other: "Autres"
  },

  // Settings
  settingsTitle: "Paramètres",
  generalTab: "Général",
  appearanceTab: "Apparence",
  languageTab: "Langue",
  notificationsTab: "Notifications",
  accountTab: "Compte",
  systemTab: "Système",
  saveButton: "Sauvegarder",
  generalSettingsTitle: "Paramètres généraux",
  autoSaveLabel: "Sauvegarde automatique",
  autoSaveDescription: "Sauvegarder automatiquement les modifications",
  sessionTimeoutLabel: "Délai d'expiration de session",
  minutes: "minutes",
  hour: "heure",
  hours: "heures",
  appearanceTitle: "Apparence",
  themeLabel: "Thème",
  languageInterfaceLabel: "Langue de l'interface",
  notificationsTitle: "Notifications",
  notificationsEnabledLabel: "Notifications activées",
  notificationsEnabledDescription: "Recevoir des notifications dans l'application",
  accountInfoTitle: "Informations du compte",
  databaseLabel: "Base de données",
  databaseDescription: "SQLite - Stockage local",
  appVersionLabel: "Version de l'application",
  appVersionValue: "v1.0.0 - Dashboard Template",
  exportDataButton: "Exporter les données"
};

// Provider du contexte
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [translations, setTranslations] = useState(defaultTranslations);
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

  // Fonction pour aplatir les objets imbriqués en une structure plate
  const flattenTranslations = (obj) => {
    let flattened = {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          // Si c'est un objet, récursivement l'aplatir
          Object.assign(flattened, flattenTranslations(obj[key]));
        } else {
          // Si c'est une valeur simple, l'ajouter directement
          flattened[key] = obj[key];
        }
      }
    }
    
    return flattened;
  };

  // Fonction pour charger les traductions
  const loadTranslations = async (languageCode) => {
    setIsLoading(true);
    try {
      console.log(`🌐 Chargement des traductions pour: ${languageCode}`);
      
      // Charger le fichier de traduction
      const translationModule = await import(`../locales/${languageCode}.json`);
      const loadedTranslations = translationModule.default || translationModule;
      
      // Aplatir les traductions imbriquées
      const flattenedTranslations = flattenTranslations(loadedTranslations);
      
      // Fusionner avec les traductions par défaut
      const mergedTranslations = {
        ...defaultTranslations,
        ...flattenedTranslations
      };
      
      setTranslations(mergedTranslations);
      
      // Mettre à jour l'attribut lang du document
      document.documentElement.lang = languageCode;
      
      // Déclencher un événement personnalisé pour notifier les composants
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: languageCode, translations: mergedTranslations } 
      }));
      
      console.log(`✅ Traductions chargées pour ${languageCode}:`, Object.keys(mergedTranslations).length, 'clés');
      
    } catch (error) {
      console.warn(`⚠️ Impossible de charger les traductions pour ${languageCode}:`, error);
      // Utiliser les traductions par défaut en cas d'erreur
      setTranslations(defaultTranslations);
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

  // Fonction pour obtenir une traduction avec fallback
  const getTranslation = (key, fallback = key) => {
    return translations[key] || fallback;
  };

  // Fonction pour obtenir une traduction avec interpolation
  const getTranslationWithVars = (key, variables = {}, fallback = key) => {
    let translation = translations[key] || fallback;
    
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
    translations,
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
