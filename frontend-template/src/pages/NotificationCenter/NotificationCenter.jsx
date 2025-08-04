import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Settings, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  Filter, 
  Download, 
  AlertTriangle,
  Gamepad2,
  Users,
  DollarSign,
  Shield,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import { formatDate, formatRelativeDate } from '../../utils/dateUtils';
import { useNotification } from '../../hooks/useNotification';

const NotificationCenter = () => {
  const { showSuccess, showError } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    byType: {},
    byCategory: {}
  });

  // États pour les paramètres
  const [settings, setSettings] = useState({
    autoDeleteAfter: 30,
    maxNotifications: 100,
    enabledTypes: {
      success: true,
      error: true,
      warning: true,
      info: true,
      system: true
    },
    enabledCategories: {
      gaming: true,
      user: true,
      financial: true,
      security: true,
      system: true
    }
  });

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({
        limit: 100,
        unreadOnly: false
      });
      
      setNotifications(response.notifications || []);
      
      // Calculer les statistiques
      const allNotifications = response.notifications || [];
      const unreadCount = allNotifications.filter(n => !n.isRead).length;
      
      const byType = allNotifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {});
      
      // Simuler des catégories basées sur le contexte gaming
      const byCategory = allNotifications.reduce((acc, n) => {
        let category = 'system';
        if (n.title.toLowerCase().includes('session') || n.title.toLowerCase().includes('poste')) {
          category = 'gaming';
        } else if (n.title.toLowerCase().includes('utilisateur') || n.title.toLowerCase().includes('client')) {
          category = 'user';
        } else if (n.title.toLowerCase().includes('paiement') || n.title.toLowerCase().includes('vente')) {
          category = 'financial';
        } else if (n.title.toLowerCase().includes('sécurité') || n.title.toLowerCase().includes('connexion')) {
          category = 'security';
        }
        
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      setStats({
        total: allNotifications.length,
        unread: unreadCount,
        byType,
        byCategory
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      showError('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Charger les paramètres depuis localStorage
    const savedSettings = localStorage.getItem('gcm_notification_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'read':
        return notification.isRead;
      case 'gaming':
        return notification.title.toLowerCase().includes('session') || 
               notification.title.toLowerCase().includes('poste');
      case 'user':
        return notification.title.toLowerCase().includes('utilisateur') || 
               notification.title.toLowerCase().includes('client');
      case 'financial':
        return notification.title.toLowerCase().includes('paiement') || 
               notification.title.toLowerCase().includes('vente');
      case 'security':
        return notification.title.toLowerCase().includes('sécurité') || 
               notification.title.toLowerCase().includes('connexion');
      case 'success':
        return notification.type === 'success';
      case 'error':
        return notification.type === 'error';
      case 'warning':
        return notification.type === 'warning';
      case 'info':
        return notification.type === 'info';
      case 'system':
        return notification.type === 'system';
      default:
        return true;
    }
  });

  // Gestion des sélections
  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  // Actions en lot
  const handleBulkAction = async (action) => {
    try {
      for (const id of selectedNotifications) {
        switch (action) {
          case 'markRead':
            await notificationService.markAsRead(id);
            break;
          case 'delete':
            await notificationService.deleteNotification(id);
            break;
        }
      }
      setSelectedNotifications([]);
      await loadNotifications();
      showSuccess(`Action effectuée sur ${selectedNotifications.length} notification(s)`);
    } catch (error) {
      showError('Erreur lors de l\'action en lot');
    }
  };

  // Marquer comme lu/non lu
  const handleToggleRead = async (notification) => {
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);
      }
      await loadNotifications();
    } catch (error) {
      showError('Erreur lors du changement de statut');
    }
  };

  // Supprimer une notification
  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      await loadNotifications();
      showSuccess('Notification supprimée');
    } catch (error) {
      showError('Erreur lors de la suppression');
    }
  };

  // Marquer toutes comme lues
  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications();
      showSuccess('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      showError('Erreur lors du marquage');
    }
  };

  // Sauvegarder les paramètres
  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('gcm_notification_settings', JSON.stringify(newSettings));
    showSuccess('Paramètres sauvegardés');
  };

  // Export des notifications
  const handleExport = () => {
    const dataStr = JSON.stringify(notifications, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `notifications_gaming_center_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Icônes pour les types
  const getTypeIcon = (type) => {
    const icons = {
      success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      error: <XCircle className="h-5 w-5 text-red-500" />,
      warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      info: <Info className="h-5 w-5 text-blue-500" />,
      system: <Settings className="h-5 w-5 text-purple-500" />
    };
    return icons[type] || <Bell className="h-5 w-5 text-gray-500" />;
  };

  // Couleurs pour les priorités
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Couleurs pour les catégories
  const getCategoryColor = (category) => {
    const colors = {
      gaming: 'bg-purple-100 text-purple-800',
      user: 'bg-green-100 text-green-800',
      financial: 'bg-yellow-100 text-yellow-800',
      security: 'bg-red-100 text-red-800',
      system: 'bg-blue-100 text-blue-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryFromNotification = (notification) => {
    if (notification.title.toLowerCase().includes('session') || notification.title.toLowerCase().includes('poste')) {
      return 'gaming';
    } else if (notification.title.toLowerCase().includes('utilisateur') || notification.title.toLowerCase().includes('client')) {
      return 'user';
    } else if (notification.title.toLowerCase().includes('paiement') || notification.title.toLowerCase().includes('vente')) {
      return 'financial';
    } else if (notification.title.toLowerCase().includes('sécurité') || notification.title.toLowerCase().includes('connexion')) {
      return 'security';
    }
    return 'system';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Chargement des notifications...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bell className="h-8 w-8 mr-3 text-blue-600" />
            Centre de Notifications
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez toutes les notifications de votre centre de gaming
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadNotifications}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </button>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {stats.total} notifications
            </span>
            {stats.unread > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                {stats.unread} non lues
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Bell className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Non lues</p>
              <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gaming</p>
              <p className="text-2xl font-bold text-purple-600">{stats.byCategory.gaming || 0}</p>
            </div>
            <Gamepad2 className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Utilisateurs</p>
              <p className="text-2xl font-bold text-green-600">{stats.byCategory.user || 0}</p>
            </div>
            <Users className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sécurité</p>
              <p className="text-2xl font-bold text-red-600">{stats.byCategory.security || 0}</p>
            </div>
            <Shield className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filtres et Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">Toutes ({notifications.length})</option>
                <option value="unread">Non lues ({stats.unread})</option>
                <option value="read">Lues ({stats.total - stats.unread})</option>
                <optgroup label="Par catégorie">
                  <option value="gaming">Gaming ({stats.byCategory.gaming || 0})</option>
                  <option value="user">Utilisateurs ({stats.byCategory.user || 0})</option>
                  <option value="financial">Financier ({stats.byCategory.financial || 0})</option>
                  <option value="security">Sécurité ({stats.byCategory.security || 0})</option>
                </optgroup>
                <optgroup label="Par type">
                  <option value="success">Succès ({stats.byType.success || 0})</option>
                  <option value="error">Erreur ({stats.byType.error || 0})</option>
                  <option value="warning">Avertissement ({stats.byType.warning || 0})</option>
                  <option value="info">Information ({stats.byType.info || 0})</option>
                  <option value="system">Système ({stats.byType.system || 0})</option>
                </optgroup>
              </select>
            </div>

            {selectedNotifications.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedNotifications.length} sélectionnées
                </span>
                <button
                  onClick={() => handleBulkAction('markRead')}
                  className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Marquer lues
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              {selectedNotifications.length === filteredNotifications.length ? 'Désélectionner tout' : 'Sélectionner tout'}
            </button>
            
            <button
              onClick={handleMarkAllRead}
              disabled={stats.unread === 0}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Tout marquer lu
            </button>

            <button
              onClick={handleExport}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Aucune notification trouvée.'
                : `Aucune notification correspondant au filtre "${filter}".`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => {
              const category = getCategoryFromNotification(notification);
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium text-gray-900 ${
                            !notification.isRead ? 'font-bold' : ''
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                            {category}
                          </span>
                          
                          {notification.priority && notification.priority !== 'normal' && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                          )}
                          
                          <button
                            onClick={() => handleToggleRead(notification)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title={notification.isRead ? 'Marquer comme non lu' : 'Marquer comme lu'}
                          >
                            {notification.isRead ? 
                              <EyeOff className="h-4 w-4 text-gray-500" /> : 
                              <Eye className="h-4 w-4 text-blue-600" />
                            }
                          </button>
                          
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatRelativeDate(notification.timestamp)}
                          </span>
                          {notification.readAt && (
                            <span className="flex items-center text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Lu le {formatDate(notification.readAt)}
                            </span>
                          )}
                        </div>
                        
                        {notification.actionUrl && notification.actionLabel && (
                          <a
                            href={notification.actionUrl}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {notification.actionLabel}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paramètres de notifications */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Paramètres des notifications
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Types activés */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Types activés</h3>
            <div className="space-y-2">
              {Object.entries(settings.enabledTypes).map(([type, enabled]) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleUpdateSettings({
                      ...settings,
                      enabledTypes: {
                        ...settings.enabledTypes,
                        [type]: e.target.checked
                      }
                    })}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Catégories activées */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Catégories activées</h3>
            <div className="space-y-2">
              {Object.entries(settings.enabledCategories).map(([category, enabled]) => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleUpdateSettings({
                      ...settings,
                      enabledCategories: {
                        ...settings.enabledCategories,
                        [category]: e.target.checked
                      }
                    })}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 capitalize">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Paramètres de rétention */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Rétention</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Supprimer automatiquement après (jours)
                </label>
                <input
                  type="number"
                  value={settings.autoDeleteAfter}
                  onChange={(e) => handleUpdateSettings({
                    ...settings,
                    autoDeleteAfter: parseInt(e.target.value)
                  })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="365"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Nombre maximum de notifications
                </label>
                <input
                  type="number"
                  value={settings.maxNotifications}
                  onChange={(e) => handleUpdateSettings({
                    ...settings,
                    maxNotifications: parseInt(e.target.value)
                  })}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="10"
                  max="1000"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
