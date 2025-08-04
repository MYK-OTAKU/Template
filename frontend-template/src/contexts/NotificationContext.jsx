import React, { createContext, useState, useCallback, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import notificationSettingsService from '../services/notificationSettingsService';
import EnhancedToast from '../components/EnhancedToast';

// Créer le contexte
const NotificationContext = createContext();

// Exporter le contexte pour le hook
export { NotificationContext };

// Clé pour le localStorage
const STORAGE_KEY = 'dashboard_template_notifications';
const STORAGE_SETTINGS_KEY = 'dashboard_template_notification_settings';

// Configuration par défaut
const DEFAULT_CONFIG = {
  maxNotifications: 50, // Limite maximale de notifications
  autoCleanupDays: 30, // Nettoyer automatiquement après 30 jours
  autoCleanupOnLimit: true // Nettoyer automatiquement quand la limite est atteinte
};

export const NotificationProvider = ({ children }) => {
  // Notifications toasts (temporaires)
  const [toastNotifications, setToastNotifications] = useState([]);
  // Notifications persistantes (localStorage)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading] = useState(false);
  
  const { translations } = useLanguage();

  // Fonction pour récupérer l'utilisateur actuel de manière sécurisée
  const getCurrentUser = useCallback(() => {
    try {
      // Essayer de récupérer l'utilisateur depuis AuthContext si disponible
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user || null;
      }
      return null;
    } catch (error) {
      console.log('Impossible de récupérer l\'utilisateur:', error);
      return null;
    }
  }, []);

  // Générer un ID unique pour les notifications
  const generateId = useCallback(() => 
    `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`, []);

  // Charger les notifications depuis localStorage
  const loadNotifications = useCallback(() => {
    try {
      console.log('🔄 Chargement des notifications depuis localStorage...');
      const stored = localStorage.getItem(STORAGE_KEY);
      let notificationsData = [];
      
      if (stored) {
        notificationsData = JSON.parse(stored);
        // Filtrer les notifications expirées
        const now = new Date();
        notificationsData = notificationsData.filter(notification => {
          if (notification.expiresAt) {
            return new Date(notification.expiresAt) > now;
          }
          return true;
        });
      }
      
      console.log('📋 Notifications chargées:', notificationsData.length);
      setNotifications(notificationsData);
      
      // Calculer le nombre de non lues
      const unread = notificationsData.filter(n => !n.isRead).length;
      setUnreadCount(unread);
      
      return notificationsData;
    } catch (error) {
      console.error('❌ Erreur lors du chargement des notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
      return [];
    }
  }, []);

  // Sauvegarder les notifications dans localStorage
  const saveNotifications = useCallback((notificationsToSave) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notificationsToSave));
      console.log('� Notifications sauvegardées:', notificationsToSave.length);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }, []);

  // Charger les données au démarrage
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Sauvegarder automatiquement quand les notifications changent
  useEffect(() => {
    if (notifications.length > 0) {
      saveNotifications(notifications);
    }
  }, [notifications, saveNotifications]);

  // Créer une notification persistante
  const createPersistentNotification = useCallback((title, message, options = {}) => {
    const {
      type = 'info',
      priority = 'normal',
      actionUrl = null,
      actionLabel = null,
      metadata = null,
      expiresAt = null,
      isGlobal = false,
      userId = getCurrentUser()?.id || null
    } = options;

    const id = generateId();
    const notification = {
      id,
      title,
      message,
      type,
      priority,
      actionUrl,
      actionLabel,
      metadata,
      expiresAt,
      isGlobal,
      userId,
      isRead: false,
      timestamp: new Date().toISOString(),
      readAt: null
    };

    console.log('📝 Création notification persistante:', notification);
    
    setNotifications(prev => {
      let newNotifications = [notification, ...prev];
      
      // Gestion automatique de la limite
      if (newNotifications.length > DEFAULT_CONFIG.maxNotifications) {
        console.log(`🧹 Limite de ${DEFAULT_CONFIG.maxNotifications} notifications atteinte, nettoyage automatique...`);
        
        // Trier par date de création (plus récentes en premier)
        newNotifications = newNotifications.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        // Garder seulement les plus récentes
        newNotifications = newNotifications.slice(0, DEFAULT_CONFIG.maxNotifications);
        
        console.log(`📊 Notifications après nettoyage: ${newNotifications.length}`);
      }
      
      return newNotifications;
    });
    
    // Mettre à jour le compteur
    setUnreadCount(prev => prev + 1);
    
    return notification;
  }, [generateId, getCurrentUser]);

  // Marquer une notification comme lue
  const markAsRead = useCallback((notificationId, readStatus = true) => {
    console.log('👁️ Marquage notification:', notificationId, readStatus);
    
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { 
              ...n, 
              isRead: readStatus, 
              readAt: readStatus ? new Date().toISOString() : null 
            }
          : n
      )
    );
    
    // Mettre à jour le compteur
    setUnreadCount(prev => readStatus ? Math.max(0, prev - 1) : prev + 1);
  }, []);

  // Supprimer une notification
  const dismissNotification = useCallback((notificationId) => {
    console.log('🗑️ Suppression notification:', notificationId);
    
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const newNotifications = prev.filter(n => n.id !== notificationId);
      
      // Mettre à jour le compteur si c'était non lu
      if (notification && !notification.isRead) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return newNotifications;
    });
  }, []);

  // Effacer toutes les notifications
  const clearAllNotifications = useCallback(() => {
    console.log('🧹 Suppression de toutes les notifications');
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(() => {
    console.log('👁️ Marquage toutes comme lues');
    
    setNotifications(prev => 
      prev.map(n => ({ 
        ...n, 
        isRead: true, 
        readAt: new Date().toISOString() 
      }))
    );
    
    setUnreadCount(0);
  }, []);

  // Obtenir les statistiques des notifications
  const getNotificationStats = useCallback(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const read = total - unread;
    
    // Stats par catégorie
    const byCategory = notifications.reduce((acc, notification) => {
      const category = notification.category || 'general';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Stats par type
    const byType = notifications.reduce((acc, notification) => {
      const type = notification.type || 'info';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total,
      unread,
      read,
      byCategory,
      byType
    };
  }, [notifications]);

  // Rafraîchir les notifications (recharger depuis localStorage)
  const refreshNotifications = useCallback(() => {
    console.log('🔄 Rafraîchissement des notifications...');
    loadNotifications();
  }, [loadNotifications]);

  // Ajouter une notification locale (toast) avec support complet
  const showNotification = useCallback((type, message, options = {}) => {
    const {
      title,
      duration = 5000,
      persistent = false,
      onAction = null,
      actionText = null,
      position = 'top-right',
      priority = 'normal',
      category = 'general',
      data = null,
      saveToStorage = false // Nouvelle option pour sauvegarder aussi en persistant
    } = options;

    const id = generateId();
    const notification = {
      id,
      type,
      message,
      title,
      timestamp: new Date().toISOString(),
      duration: persistent ? 0 : duration,
      isDismissed: false,
      onAction,
      actionText,
      position,
      priority,
      category,
      data
    };

    // Ajouter au toast (notification temporaire)
    setToastNotifications(prev => [...prev, notification]);

    // Optionnellement sauvegarder aussi comme notification persistante
    if (saveToStorage) {
      createPersistentNotification(title || `Notification ${type}`, message, {
        type,
        priority,
        metadata: { source: 'toast', category, data }
      });
    }

    // Retourner l'id pour pouvoir supprimer la notification manuellement
    return id;
  }, [generateId, createPersistentNotification]);

  // Supprimer une notification toast
  const removeNotification = useCallback((id) => {
    setToastNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Méthodes de convenance pour différents types de notifications
  const showSuccess = useCallback((message, options = {}) => {
    const settings = notificationSettingsService.getSettings();
    if (!settings.types.success.enabled) return null;
    
    return showNotification('success', message, {
      title: options.title || translations?.successTitle || 'Succès',
      duration: options.duration || settings.types.success.duration,
      saveToStorage: options.saveToStorage || false,
      ...options
    });
  }, [showNotification, translations?.successTitle]);

  const showError = useCallback((message, options = {}) => {
    const settings = notificationSettingsService.getSettings();
    if (!settings.types.error.enabled) return null;
    
    return showNotification('error', message, {
      title: options.title || translations?.errorTitle || 'Erreur',
      duration: options.duration || settings.types.error.duration,
      priority: options.priority || 'urgent',
      saveToStorage: options.saveToStorage || false,
      ...options
    });
  }, [showNotification, translations?.errorTitle]);

  const showWarning = useCallback((message, options = {}) => {
    const settings = notificationSettingsService.getSettings();
    if (!settings.types.warning.enabled) return null;
    
    return showNotification('warning', message, {
      title: options.title || translations?.warningTitle || 'Attention',
      duration: options.duration || settings.types.warning.duration,
      saveToStorage: options.saveToStorage || false,
      ...options
    });
  }, [showNotification, translations?.warningTitle]);

  const showInfo = useCallback((message, options = {}) => {
    const settings = notificationSettingsService.getSettings();
    if (!settings.types.info.enabled) return null;
    
    return showNotification('info', message, {
      title: options.title || translations?.infoTitle || 'Information',
      duration: options.duration || settings.types.info.duration,
      saveToStorage: options.saveToStorage || false,
      ...options
    });
  }, [showNotification, translations?.infoTitle]);

  // Notifications système spéciales (toujours sauvegardées)
  const showSystemNotification = useCallback((message, options = {}) => {
    return showNotification('info', message, {
      title: options.title || translations?.systemTitle || 'Système',
      category: 'system',
      priority: 'high',
      persistent: true,
      saveToStorage: true,
      ...options
    });
  }, [showNotification, translations?.systemTitle]);

  // Notification d'expiration de session
  const showSessionExpired = useCallback((message, options = {}) => {
    return showNotification('warning', message, {
      title: options.title || 'Session expirée',
      category: 'security',
      priority: 'urgent',
      persistent: true,
      saveToStorage: true,
      ...options
    });
  }, [showNotification]);

  // Fonction pour créer automatiquement des notifications lors d'actions
  const notifyAction = useCallback((action, details = {}) => {
    const {
      entityType = 'élément',
      entityName = '',
      actionType = 'modifié',
      userId = getCurrentUser()?.id,
      saveToStorage = true,
      showToast = true // ✅ REMIS: Afficher le toast par défaut
    } = details;

    const message = `${entityType} "${entityName}" ${actionType} avec succès`;
    const title = `${entityType} ${actionType}`;

    // ✅ REMIS: Afficher le toast de succès immédiat
    if (showToast) {
      showSuccess(message, { 
        title, 
        saveToStorage: false, // Éviter de sauvegarder deux fois
        category: 'user-action',
        metadata: { action, entityType, entityName, userId }
      });
    }

    // ✅ Sauvegarder aussi en persistant si demandé
    if (saveToStorage) {
      createPersistentNotification(title, message, {
        type: 'success',
        priority: 'normal',
        metadata: { action, entityType, entityName, userId }
      });
    }
  }, [getCurrentUser, showSuccess, createPersistentNotification]);

  // Valeurs du contexte
  const value = {
    // État
    notifications,
    unreadCount,
    loading,
    toastNotifications,
    
    // Gestion des notifications persistantes
    createPersistentNotification,
    markAsRead,
    dismissNotification,
    clearAllNotifications,
    markAllAsRead,
    refreshNotifications,
    
    // Gestion des toasts
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showSystemNotification,
    showSessionExpired,
    removeNotification,
    
    // Utilitaires
    getNotificationStats,
    notifyAction
  };

  // Grouper les notifications toast par position
  const groupedByPosition = toastNotifications.reduce((acc, notification) => {
    const { position } = notification;
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(notification);
    return acc;
  }, {});

  // Classes CSS pour les positions
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 space-y-2 z-50',
    'top-left': 'fixed top-4 left-4 space-y-2 z-50',
    'bottom-right': 'fixed bottom-4 right-4 space-y-2 z-50',
    'bottom-left': 'fixed bottom-4 left-4 space-y-2 z-50',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 space-y-2 z-50',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 space-y-2 z-50'
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Rendu des toasts par position */}
      {Object.entries(groupedByPosition).map(([position, positionNotifications]) => (
        <div key={position} className={positionClasses[position]}>
          {positionNotifications.map((notification) => (
            <EnhancedToast
              key={notification.id}
              notification={{
                ...notification,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                duration: notification.duration,
                priority: notification.priority,
                timestamp: notification.timestamp,
                actionText: notification.actionText,
                onAction: notification.onAction,
                isRead: false
              }}
              onClose={() => removeNotification(notification.id)}
              onMarkAsRead={() => {}} // Les toasts n'ont pas besoin de "marquer comme lu"
              position="relative" // Position relative car c'est déjà dans un conteneur positionné
            />
          ))}
        </div>
      ))}
    </NotificationContext.Provider>
  );
};
