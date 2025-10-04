import React from 'react';
import { createRoot } from 'react-dom/client';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { useNotification } from './src/hooks/useNotification';

// Composant de test simple
const TestNotificationSystem = () => {
  const {
    notifications,
    unreadCount,
    showSuccess,
    showError,
    createPersistentNotification,
    markAsRead,
    dismissNotification,
    clearAllNotifications
  } = useNotification();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Test du Système de Notifications localStorage</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>📊 Statistiques</h3>
        <p>Total: {notifications.length} | Non lues: {unreadCount}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>🎛️ Actions de test</h3>
        <button 
          onClick={() => showSuccess('Test toast succès', { saveToStorage: false })}
          style={{ margin: '5px', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🟢 Toast Succès
        </button>
        
        <button 
          onClick={() => showError('Test toast erreur', { saveToStorage: false })}
          style={{ margin: '5px', padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🔴 Toast Erreur
        </button>
        
        <button 
          onClick={() => createPersistentNotification('Test localStorage', 'Cette notification est sauvegardée', { type: 'info' })}
          style={{ margin: '5px', padding: '10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          💾 Notification Persistante
        </button>
        
        <button 
          onClick={() => clearAllNotifications()}
          style={{ margin: '5px', padding: '10px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🧹 Tout effacer
        </button>
      </div>

      <div>
        <h3>📋 Notifications localStorage ({notifications.length})</h3>
        {notifications.length === 0 ? (
          <p style={{ color: '#666' }}>Aucune notification</p>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              style={{ 
                border: '1px solid #ddd', 
                margin: '10px 0', 
                padding: '10px', 
                borderRadius: '4px',
                backgroundColor: notification.isRead ? '#f9f9f9' : '#fff3cd'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <strong>{notification.title}</strong> 
                  {!notification.isRead && <span style={{ color: 'red' }}> ● Non lu</span>}
                  <p>{notification.message}</p>
                  <small style={{ color: '#666' }}>
                    {new Date(notification.timestamp).toLocaleString()} | Type: {notification.type}
                  </small>
                </div>
                <div>
                  {!notification.isRead && (
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      style={{ margin: '2px', padding: '5px', fontSize: '12px' }}
                    >
                      ✓ Marquer lu
                    </button>
                  )}
                  <button 
                    onClick={() => dismissNotification(notification.id)}
                    style={{ margin: '2px', padding: '5px', fontSize: '12px', backgroundColor: '#f44336', color: 'white', border: 'none' }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e8' }}>
        <h4>💡 Instructions</h4>
        <ul>
          <li>Les toasts apparaissent temporairement en haut à droite</li>
          <li>Les notifications persistantes sont sauvegardées dans localStorage</li>
          <li>Rechargez la page pour vérifier la persistance</li>
          <li>Ouvrez les DevTools → Application → Local Storage pour voir les données</li>
        </ul>
      </div>
    </div>
  );
};

// Composant principal avec provider
const App = () => {
  return (
    <NotificationProvider>
      <TestNotificationSystem />
    </NotificationProvider>
  );
};

// Point d'entrée si ce fichier est exécuté directement
if (typeof window !== 'undefined') {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
}

export default App;
