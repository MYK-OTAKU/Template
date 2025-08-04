import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';
import notificationSettingsService from '../services/notificationSettingsService';

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  // Ajouter les méthodes de paramètres
  const notificationSettings = {
    getSettings: () => notificationSettingsService.getSettings(),
    saveSettings: (settings) => notificationSettingsService.saveSettings(settings),
    updateCategory: (category, enabled) => notificationSettingsService.updateCategory(category, enabled),
    updateType: (type, config) => notificationSettingsService.updateType(type, config),
    updateBehavior: (config) => notificationSettingsService.updateBehavior(config),
    isCategoryEnabled: (category) => notificationSettingsService.isCategoryEnabled(category),
    isTypeEnabled: (type) => notificationSettingsService.isTypeEnabled(type),
    getDurationForType: (type) => notificationSettingsService.getDurationForType(type),
    getDurationForPriority: (priority) => notificationSettingsService.getDurationForPriority(priority),
    resetToDefaults: () => notificationSettingsService.resetToDefaults(),
    exportSettings: () => notificationSettingsService.exportSettings(),
    importSettings: (file) => notificationSettingsService.importSettings(file)
  };
  
  return {
    ...context,
    settings: notificationSettings
  };
};
