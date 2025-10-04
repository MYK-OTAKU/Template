import React, { useState } from 'react';
import { Bell, X, Eye, EyeOff, Check, Trash2, Filter, Settings, ChevronRight } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { useLanguage } from '../../contexts/LanguageContext'; // Utilisation de useLanguage
import { useNavigate } from 'react-router-dom';
import { formatDate, formatRelativeDate } from '../../utils/dateUtils';

const NotificationPanel = ({ onClose }) => {
  const [filter, setFilter] = useState('all');
  const {
    notifications,
    getNotificationStats,
    dismissNotification,
    markAsRead,
    clearAllNotifications
  } = useNotification();
  
  // Récupération de la fonction de traduction
  const { getTranslation } = useLanguage();
  const navigate = useNavigate();
  const stats = getNotificationStats();

  // --- Fonctions d'aide pour la traduction et le pluriel ---
  
  // Gère le pluriel des notifications totales (ex: 5 notifications au total)
  const getTotalNotificationsText = (count) => {
    const countText = `${count} `;
    // Utilise 'totalNotificationPlural' ou 'totalNotificationSingular'
    return countText + getTranslation(
      count > 1 ? 'notifications.totalNotificationPlural' : 'notifications.totalNotificationSingular',
      `notification${count > 1 ? 's' : ''} au total` // Fallback
    );
  };
  
  // Gère le pluriel des nouvelles notifications (ex: 3 nouveaux)
  const getNewNotificationsText = (count) => {
    const countText = `${count} `;
    // Utilise 'newNotificationPlural' ou 'newNotificationSingular'
    return countText + getTranslation(
      count > 1 ? 'notifications.newNotificationPlural' : 'notifications.newNotificationSingular',
      `nouveau${count > 1 ? 'x' : ''}` // Fallback
    );
  };

  // Construit le message d'état vide pour un filtre sélectionné
  const getNoFilteredNotificationsText = (currentFilter) => {
    // Clé pour la base du message ("Aucune notification")
    const baseText = getTranslation('notifications.noNotificationsBase', 'Aucune notification');
    
    let filterTextKey = '';
    // Utilise des adjectifs spécifiques pour "lues" et "non lues" pour la grammaire française
    if (currentFilter === 'unread') {
      filterTextKey = 'notifications.filter.unreadAdjective';
    } else if (currentFilter === 'read') {
      filterTextKey = 'notifications.filter.readAdjective';
    } else {
      // Pour les autres catégories (system, user, etc.), on utilise directement le nom du filtre
      filterTextKey = `notifications.filter.${currentFilter}`;
    }

    const filterText = getTranslation(
        filterTextKey, 
        currentFilter // Fallback: utilise le nom du filtre en dur si la traduction n'est pas trouvée
    );
    
    // Format: "Aucune notification non lue" / "Aucune notification Système"
    return `${baseText} ${filterText}`;
  };

  // Filtrer les notifications (Logique inchangée)
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      case 'system':
        return notification.category === 'system';
      case 'user':
        return notification.category === 'user';
      case 'data':
        return notification.category === 'data';
      case 'security':
        return notification.category === 'security';
      default:
        return true;
    }
  });

  const handleMarkAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.isRead) {
        markAsRead(notification.id);
      }
    });
  };

  const handleToggleRead = (notification) => {
    markAsRead(notification.id, !notification.isRead);
  };

  const handleGoToSettings = () => {
    navigate('/dashboard/settings?tab=notifications');
    onClose();
  };

  // Styles cohérents avec le header (Inchangement)
  const panelBg = 'rgba(30, 41, 59, 0.95)';
  const borderColor = 'border-purple-400/20';
  const textPrimary = 'text-gray-300';
  const textSecondary = 'text-gray-400';
  const hoverBg = 'hover:bg-purple-600/20';

  return (
    <div 
      className={`w-[420px] max-h-[600px] rounded-xl shadow-2xl border ${borderColor} overflow-hidden`}
      style={{
        background: panelBg,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Header */}
      <div className={`p-5 border-b ${borderColor} bg-gradient-to-r from-purple-500/10 to-blue-500/10`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Bell className="text-purple-400" size={20} />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${textPrimary}`}>
                {/* Traduction: Titre du panneau */}
                {getTranslation('notifications.headerTitle', 'Notifications')}
              </h3>
              <p className={`text-xs ${textSecondary} mt-0.5`}>
                {/* Traduction: Nombre total de notifications */}
                {getTotalNotificationsText(stats.total)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {stats.unread > 0 && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full font-semibold shadow-lg">
                {/* Traduction: Nombre de nouvelles notifications */}
                {getNewNotificationsText(stats.unread)}
              </span>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${textSecondary} ${hoverBg} transition-all duration-200 hover:text-white`}
              // Traduction: Description du bouton de fermeture (accessibilité)
              title={getTranslation('common.close', 'Fermer')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center space-x-3">
          <Filter className="text-purple-400" size={16} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`text-sm px-3 py-2 rounded-lg bg-gray-800/50 border ${borderColor} ${textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-200`}
            // Traduction: Aria-label pour l'accessibilité
            aria-label={getTranslation('common.filter', 'Filtrer')}
          >
            {/* Les options de filtre utilisent les clés sous notifications.filter.* */}
            <option value="all">
              📋 {getTranslation('notifications.filter.all', 'Toutes')} ({notifications.length})
            </option>
            <option value="unread">
              🔔 {getTranslation('notifications.filter.unread', 'Non lues')} ({stats.unread})
            </option>
            <option value="read">
              ✅ {getTranslation('notifications.filter.read', 'Lues')} ({stats.read})
            </option>
            <option value="system">
              ⚙️ {getTranslation('notifications.filter.system', 'Système')} ({stats.byCategory.system || 0})
            </option>
            <option value="user">
              👤 {getTranslation('notifications.filter.user', 'Utilisateur')} ({stats.byCategory.user || 0})
            </option>
            <option value="data">
              💾 {getTranslation('notifications.filter.data', 'Données')} ({stats.byCategory.data || 0})
            </option>
            <option value="security">
              🔒 {getTranslation('notifications.filter.security', 'Sécurité')} ({stats.byCategory.security || 0})
            </option>
          </select>
        </div>

        {/* Actions globales */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              {stats.unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className={`text-sm px-3 py-2 rounded-lg flex items-center space-x-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-all duration-200 font-medium`}
                  // Traduction: Tooltip et texte du bouton
                  title={getTranslation('notifications.markAllRead', 'Tout marquer lu')}
                >
                  <Check size={14} />
                  <span>{getTranslation('notifications.markAllRead', 'Tout marquer lu')}</span>
                </button>
              )}
              <button
                onClick={() => clearAllNotifications()}
                className={`text-sm px-3 py-2 rounded-lg flex items-center space-x-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all duration-200 font-medium`}
                // Traduction: Tooltip et texte du bouton
                title={getTranslation('notifications.clearAll', 'Tout effacer')}
              >
                <Trash2 size={14} />
                <span>{getTranslation('notifications.clearAll', 'Tout effacer')}</span>
              </button>
            </div>
            
            <button
              onClick={handleGoToSettings}
              className={`text-sm px-3 py-2 rounded-lg flex items-center space-x-2 ${textSecondary} hover:bg-purple-500/20 hover:text-purple-400 border border-purple-500/30 transition-all duration-200 font-medium`}
              // Traduction: Tooltip et texte du bouton
              title={getTranslation('notifications.manageButton', 'Gérer')}
            >
              <Settings size={14} />
              <span>{getTranslation('notifications.manageButton', 'Gérer')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Liste des notifications */}
      <div className="max-h-80 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-3">🔔</div>
            <p className={`${textPrimary} font-medium mb-2`}>
              {/* Traduction: Message principal si aucun résultat */}
              {filter === 'all' 
                ? getTranslation('notifications.noNotifications', 'Aucune notification')
                : getNoFilteredNotificationsText(filter) // Traduction: Message pour filtre spécifique
              }
            </p>
            <p className={`text-sm ${textSecondary}`}>
              {/* Traduction: Message secondaire (conseil) */}
              {filter === 'all' 
                ? getTranslation('notifications.allCaughtUp', 'Vous êtes à jour !')
                : getTranslation('notifications.tryAnotherFilter', 'Essayez un autre filtre.')
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-700/30 transition-all duration-200 ${hoverBg} ${
                !notification.isRead 
                  ? 'border-l-4 border-l-blue-400 bg-blue-500/10 shadow-md' 
                  : 'border-l-4 border-l-transparent bg-gray-800/20'
              } hover:border-l-purple-400 group cursor-pointer`}
              // onClick action here...
            >
              <div className="flex items-start gap-3">
                {/* ... contenu non textuel ... */}
                <div className={`flex-shrink-0 w-3 h-3 mt-1.5 rounded-full transition-all duration-200 ${
                  !notification.isRead 
                    ? 'bg-blue-400 shadow-lg shadow-blue-400/50 ring-2 ring-blue-400/30' 
                    : 'bg-gray-600 shadow-sm'
                }`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={`text-sm leading-tight transition-all duration-200 ${
                      !notification.isRead 
                        ? 'font-bold text-white' 
                        : 'font-medium text-gray-400'
                    } group-hover:text-white`}>
                      {notification.title}
                    </h4>
                    
                    <div className="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Bouton œil pour marquer comme lu/non lu */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRead(notification);
                        }}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                          notification.isRead
                            ? `${textSecondary} hover:text-blue-400 hover:bg-blue-400/20`
                            : 'text-blue-400 hover:text-blue-300 hover:bg-blue-400/20'
                        }`}
                        // Traduction: Tooltip pour marquer lu/non lu (accessibilité)
                        title={notification.isRead 
                          ? getTranslation('notifications.markUnreadTooltip', 'Marquer comme non lu') 
                          : getTranslation('notifications.markReadTooltip', 'Marquer comme lu')
                        }
                      >
                        {notification.isRead ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      
                      {/* Bouton supprimer */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${textSecondary} hover:text-red-400 hover:bg-red-400/20`}
                        // Traduction: Tooltip pour supprimer (accessibilité)
                        title={getTranslation('notifications.deleteTooltip', 'Supprimer')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <p className={`text-sm mt-1 leading-relaxed line-clamp-2 transition-all duration-200 ${
                    !notification.isRead 
                      ? 'text-gray-200 group-hover:text-white' 
                      : `${textSecondary} group-hover:text-gray-300`
                  }`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs ${textSecondary} font-medium`}>
                      {formatRelativeDate(notification.timestamp)}
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      {/* Badge NOUVEAU pour les non lues */}
                      {!notification.isRead && (
                        <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded-full font-bold animate-pulse">
                          {getTranslation('notifications.newBadge', 'NOUVEAU')}
                        </span>
                      )}
                      
                      {/* Badge de catégorie */}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        notification.category === 'system' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        notification.category === 'user' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        notification.category === 'security' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        notification.category === 'data' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {/* Traduction: Catégorie de la notification */}
                        {getTranslation(`notifications.category.${notification.category}`, notification.category)}
                      </span>

                      {/* Badge de type */}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        notification.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {/* Traduction: Type de la notification */}
                        {getTranslation(`notifications.type.${notification.type}`, notification.type)}
                      </span>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
          ))
        )}
      </div>

      {/* Footer avec bouton vers page complète */}
      {notifications.length > 0 && (
        <div className={`p-4 border-t ${borderColor} bg-gradient-to-r from-purple-500/5 to-blue-500/5`}>
          <button
            onClick={handleGoToSettings}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 ${textSecondary} hover:bg-purple-500/20 hover:text-purple-400 border border-purple-500/30 transition-all duration-200 font-medium`}
            // Traduction: Tooltip et texte du bouton
            title={getTranslation('notifications.manageLink', 'Gérer les notifications')}
          >
            <Settings size={16} />
            <span>{getTranslation('notifications.manageLink', 'Gérer les notifications')}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};


export default NotificationPanel;