import React from 'react';
import { useNotification } from '../hooks/useNotification';
import { formatRelativeDate } from '../utils/dateUtils';

const NotificationTestComponent = () => {
  const {
    notifications,
    unreadCount,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showSystemNotification,
    createPersistentNotification,
    markAsRead,
    dismissNotification,
    clearAllNotifications,
    notifyAction
  } = useNotification();

  const testToastNotifications = () => {
    showSuccess('Opération réussie !', { saveToStorage: false });
    setTimeout(() => {
      showError('Une erreur est survenue', { saveToStorage: false });
    }, 1000);
    setTimeout(() => {
      showWarning('Attention à cette action', { saveToStorage: false });
    }, 2000);
    setTimeout(() => {
      showInfo('Information importante', { saveToStorage: false });
    }, 3000);
  };

  const testPersistentNotifications = () => {
    createPersistentNotification(
      'Nouvelle notification persistante',
      'Cette notification sera sauvegardée dans localStorage',
      {
        type: 'info',
        priority: 'normal',
        metadata: { source: 'test', category: 'demo' }
      }
    );
  };

  const testSystemNotification = () => {
    showSystemNotification('Mise à jour système effectuée', {
      title: 'Système mis à jour'
    });
  };

  const testActionNotification = () => {
    notifyAction('create', {
      entityType: 'Utilisateur',
      entityName: 'John Doe',
      actionType: 'créé',
      saveToStorage: true
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Test du système de notifications</h2>
      
      {/* Statistiques */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Statistiques</h3>
        <p>Notifications totales : {notifications.length}</p>
        <p>Non lues : {unreadCount}</p>
      </div>

      {/* Boutons de test */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={testToastNotifications}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Toasts (temporaires)
        </button>
        
        <button
          onClick={testPersistentNotifications}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Notification Persistante
        </button>
        
        <button
          onClick={testSystemNotification}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Test Notification Système
        </button>
        
        <button
          onClick={testActionNotification}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Test Notification Action
        </button>
        
        <button
          onClick={clearAllNotifications}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Effacer toutes les notifications
        </button>
      </div>

      {/* Liste des notifications persistantes */}
      <div className="border rounded-lg">
        <h3 className="text-lg font-semibold p-4 border-b bg-gray-50">
          Notifications persistantes (localStorage)
        </h3>
        
        {notifications.length === 0 ? (
          <p className="p-4 text-gray-500">Aucune notification</p>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        notification.type === 'success' ? 'bg-green-500' :
                        notification.type === 'error' ? 'bg-red-500' :
                        notification.type === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></span>
                      <h4 className="font-medium">{notification.title}</h4>
                      {!notification.isRead && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Non lu
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {formatRelativeDate(notification.timestamp)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Marquer comme lu
                      </button>
                    )}
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="px-2 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationTestComponent;
