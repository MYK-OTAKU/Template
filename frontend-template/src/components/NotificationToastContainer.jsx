import React from 'react';
import { useNotification } from '../hooks/useNotification';
import EnhancedToast from './EnhancedToast';

const NotificationToastContainer = () => {
  const { toastNotifications, removeNotification, markAsRead, settings } = useNotification();
  
  // Récupérer les paramètres de comportement
  const behaviorSettings = settings.getSettings().behavior;
  const maxVisible = behaviorSettings.maxVisible || 5;
  const position = behaviorSettings.position || 'top-right';

  // Filtrer les notifications visibles selon les paramètres
  const visibleNotifications = toastNotifications
    .filter(notification => notification && notification.id) // ✅ PROTECTION: Vérifier que la notification est valide
    .slice(0, maxVisible) // Limiter le nombre visible
    .filter(notification => {
      const typeSettings = settings.getSettings().types[notification.type];
      return typeSettings?.enabled !== false; // Afficher si le type est activé
    });

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`
      fixed pointer-events-none z-50 space-y-3
      ${position === 'top-right' ? 'top-4 right-4' : ''}
      ${position === 'top-left' ? 'top-4 left-4' : ''}
      ${position === 'bottom-right' ? 'bottom-4 right-4' : ''}
      ${position === 'bottom-left' ? 'bottom-4 left-4' : ''}
      ${position === 'top-center' ? 'top-4 left-1/2 transform -translate-x-1/2' : ''}
      ${position === 'bottom-center' ? 'bottom-4 left-1/2 transform -translate-x-1/2' : ''}
    `}>
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            zIndex: 9999 - index // S'assurer que les nouvelles notifications apparaissent au-dessus
          }}
        >
          <EnhancedToast
            notification={notification}
            onClose={removeNotification}
            onMarkAsRead={markAsRead}
            position="relative" // Changer en relative pour éviter les conflits de positionnement
          />
        </div>
      ))}

      {/* Indicateur du nombre de notifications masquées */}
      {toastNotifications.length > maxVisible && (
        <div className="mt-2 px-3 py-2 bg-gray-800/90 backdrop-blur-sm text-white text-sm rounded-lg shadow-lg border border-gray-600">
          +{toastNotifications.length - maxVisible} notification{toastNotifications.length - maxVisible > 1 ? 's' : ''} de plus
        </div>
      )}
    </div>
  );
};

export default NotificationToastContainer;
