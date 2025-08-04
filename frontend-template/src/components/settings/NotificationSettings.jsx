import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  RotateCcw, 
  Save,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const NotificationSettings = () => {
  const { settings: notificationSettings, showSuccess, showError } = useNotification();
  const [currentSettings, setCurrentSettings] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les paramètres au montage
  useEffect(() => {
    const loadedSettings = notificationSettings.getSettings();
    setCurrentSettings(loadedSettings);
  }, [notificationSettings]);

  // Vérifier s'il y a des changements
  useEffect(() => {
    if (currentSettings) {
      const originalSettings = notificationSettings.getSettings();
      setHasChanges(JSON.stringify(currentSettings) !== JSON.stringify(originalSettings));
    }
  }, [currentSettings, notificationSettings]);

  const handleCategoryToggle = (categoryKey) => {
    setCurrentSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryKey]: {
          ...prev.categories[categoryKey],
          enabled: !prev.categories[categoryKey].enabled
        }
      }
    }));
  };

  const handleTypeToggle = (typeKey) => {
    setCurrentSettings(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [typeKey]: {
          ...prev.types[typeKey],
          enabled: !prev.types[typeKey].enabled
        }
      }
    }));
  };

  const handleTypeDurationChange = (typeKey, duration) => {
    setCurrentSettings(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [typeKey]: {
          ...prev.types[typeKey],
          duration: parseInt(duration)
        }
      }
    }));
  };

  const handleBehaviorChange = (key, value) => {
    setCurrentSettings(prev => ({
      ...prev,
      behavior: {
        ...prev.behavior,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      notificationSettings.saveSettings(currentSettings);
      setHasChanges(false);
      showSuccess('Notification settings saved');
    } catch (error) {
      showError('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = notificationSettings.resetToDefaults();
    setCurrentSettings(defaultSettings);
    showSuccess('Paramètres réinitialisés aux valeurs par défaut');
  };

  const handleExport = () => {
    try {
      notificationSettings.exportSettings();
      showSuccess('Paramètres exportés avec succès');
    } catch (error) {
      showError('Erreur lors de l\'export des paramètres');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const importedSettings = await notificationSettings.importSettings(file);
      setCurrentSettings(importedSettings);
      showSuccess('Paramètres importés avec succès');
    } catch (error) {
      showError('Erreur lors de l\'import des paramètres');
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  if (!currentSettings) {
    return (
      <Card>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Chargement des paramètres...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notification Settings
          </h3>
        </div>
        
        {hasChanges && (
          <Badge variant="warning" className="animate-pulse">
            Modifications non sauvegardées
          </Badge>
        )}
      </div>

      {/* Actions rapides */}
      <Card>
        <div className="p-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Actions rapides
          </h4>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Sauvegarder</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Réinitialiser</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exporter</span>
            </Button>

            <label className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
              />
              <Button
                variant="outline"
                className="flex items-center space-x-2 pointer-events-none"
                disabled={isLoading}
              >
                <Upload className="h-4 w-4" />
                <span>Importer</span>
              </Button>
            </label>
          </div>
        </div>
      </Card>

      {/* Catégories de notifications */}
      <Card>
        <div className="p-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Notification categories
          </h4>
          
          <div className="space-y-3">
            {Object.entries(currentSettings.categories).map(([key, category]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleCategoryToggle(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      category.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      category.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {category.label}
                  </span>
                </div>
                
                <Badge variant={category.enabled ? 'success' : 'secondary'}>
                  {category.enabled ? 'Activé' : 'Désactivé'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Types de notifications */}
      <Card>
        <div className="p-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Notification types
          </h4>
          
          <div className="space-y-4">
            {Object.entries(currentSettings.types).map(([key, type]) => (
              <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleTypeToggle(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        type.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        type.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {type.label}
                    </span>
                  </div>
                  
                  <Badge variant={type.enabled ? 'success' : 'secondary'}>
                    {type.enabled ? 'Activé' : 'Désactivé'}
                  </Badge>
                </div>
                
                {type.enabled && (
                  <div className="flex items-center space-x-4">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Durée:</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="30000"
                        step="1000"
                        value={type.duration}
                        onChange={(e) => handleTypeDurationChange(key, e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <span className="text-sm text-gray-500">ms</span>
                      {type.duration === 0 && (
                        <Badge variant="warning" size="sm">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Permanent
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Comportements */}
      <Card>
        <div className="p-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Comportements
          </h4>
          
          <div className="space-y-4">
            {/* Auto-hide */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Masquage automatique
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Automatically hide non-urgent notifications
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleBehaviorChange('autoHide', !currentSettings.behavior.autoHide)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentSettings.behavior.autoHide ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  currentSettings.behavior.autoHide ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Show persistent */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Persistent notifications
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Affiche les notifications dans le panel de notifications
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleBehaviorChange('showPersistent', !currentSettings.behavior.showPersistent)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentSettings.behavior.showPersistent ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  currentSettings.behavior.showPersistent ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                {currentSettings.behavior.soundEnabled ? 
                  <Volume2 className="h-5 w-5 text-gray-500" /> :
                  <VolumeX className="h-5 w-5 text-gray-500" />
                }
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Son des notifications
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Joue un son lors de l'affichage des notifications
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleBehaviorChange('soundEnabled', !currentSettings.behavior.soundEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentSettings.behavior.soundEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  currentSettings.behavior.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Max visible */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <SettingsIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Nombre maximum visible
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Nombre maximum de notifications affichées simultanément
                  </p>
                </div>
              </div>
              
              <input
                type="number"
                min="1"
                max="10"
                value={currentSettings.behavior.maxVisible}
                onChange={(e) => handleBehaviorChange('maxVisible', parseInt(e.target.value))}
                className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotificationSettings;
