/**
 * Service pour la gestion des paramètres de notifications
 */

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

// Paramètres par défaut
const DEFAULT_SETTINGS = {
  // Catégories de notifications
  categories: {
    system: { enabled: true, label: 'Système' },
    user: { enabled: true, label: 'Utilisateurs' },
    role: { enabled: true, label: 'Rôles' },
    security: { enabled: true, label: 'Sécurité' },
    data: { enabled: true, label: 'Données' }
  },
  
  // Types de notifications
  types: {
    success: { enabled: true, label: 'Succès', duration: 5000 },
    error: { enabled: true, label: 'Erreurs', duration: 0 }, // 0 = permanent
    warning: { enabled: true, label: 'Avertissements', duration: 8000 },
    info: { enabled: true, label: 'Informations', duration: 6000 }
  },
  
  // Comportements
  behavior: {
    autoHide: true, // Cache automatiquement les notifications non urgentes
    maxVisible: 5, // Nombre max de notifications visibles
    position: 'top-right', // Position des notifications toast
    showPersistent: true, // Affiche les notifications persistantes
    soundEnabled: false, // Son pour les notifications
    desktopNotifications: false // Notifications bureau (si supporté)
  },
  
  // Durées par priorité
  priorities: {
    low: { duration: 4000 },
    normal: { duration: 6000 },
    high: { duration: 8000 },
    urgent: { duration: 0 } // Permanent jusqu'à fermeture manuelle
  }
};

class NotificationSettingsService {
  /**
   * Récupère les paramètres de notifications
   */
  getSettings() {
    try {
      const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        // Fusionner avec les valeurs par défaut pour les nouvelles propriétés
        return this.mergeWithDefaults(settings);
      }
      return { ...DEFAULT_SETTINGS };
    } catch (error) {
      console.warn('Erreur lors de la récupération des paramètres de notifications:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Sauvegarde les paramètres de notifications
   */
  saveSettings(settings) {
    try {
      const merged = this.mergeWithDefaults(settings);
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(merged));
      return merged;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres de notifications:', error);
      throw error;
    }
  }

  /**
   * Met à jour une catégorie spécifique
   */
  updateCategory(categoryKey, enabled) {
    const settings = this.getSettings();
    if (settings.categories[categoryKey]) {
      settings.categories[categoryKey].enabled = enabled;
      return this.saveSettings(settings);
    }
    return settings;
  }

  /**
   * Met à jour un type spécifique
   */
  updateType(typeKey, config) {
    const settings = this.getSettings();
    if (settings.types[typeKey]) {
      settings.types[typeKey] = { ...settings.types[typeKey], ...config };
      return this.saveSettings(settings);
    }
    return settings;
  }

  /**
   * Met à jour les comportements
   */
  updateBehavior(behaviorConfig) {
    const settings = this.getSettings();
    settings.behavior = { ...settings.behavior, ...behaviorConfig };
    return this.saveSettings(settings);
  }

  /**
   * Vérifie si une catégorie est activée
   */
  isCategoryEnabled(category) {
    const settings = this.getSettings();
    return settings.categories[category]?.enabled ?? true;
  }

  /**
   * Vérifie si un type est activé
   */
  isTypeEnabled(type) {
    const settings = this.getSettings();
    return settings.types[type]?.enabled ?? true;
  }

  /**
   * Récupère la durée pour un type
   */
  getDurationForType(type) {
    const settings = this.getSettings();
    return settings.types[type]?.duration ?? 5000;
  }

  /**
   * Récupère la durée pour une priorité
   */
  getDurationForPriority(priority) {
    const settings = this.getSettings();
    return settings.priorities[priority]?.duration ?? 6000;
  }

  /**
   * Fusionne les paramètres avec les valeurs par défaut
   */
  mergeWithDefaults(settings) {
    return {
      categories: { ...DEFAULT_SETTINGS.categories, ...settings.categories },
      types: { ...DEFAULT_SETTINGS.types, ...settings.types },
      behavior: { ...DEFAULT_SETTINGS.behavior, ...settings.behavior },
      priorities: { ...DEFAULT_SETTINGS.priorities, ...settings.priorities }
    };
  }

  /**
   * Réinitialise aux paramètres par défaut
   */
  resetToDefaults() {
    return this.saveSettings({ ...DEFAULT_SETTINGS });
  }

  /**
   * Exporte les paramètres
   */
  exportSettings() {
    const settings = this.getSettings();
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Importe les paramètres depuis un fichier
   */
  async importSettings(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target.result);
          const imported = this.saveSettings(settings);
          resolve(imported);
        } catch (error) {
          reject(new Error('Fichier de paramètres invalide'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  }
}

export default new NotificationSettingsService();
