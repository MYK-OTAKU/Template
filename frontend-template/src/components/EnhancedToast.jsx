import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Eye, ChevronRight } from 'lucide-react';
import { formatRelativeDate } from '../utils/dateUtils';

const Toast = ({ 
  notification, 
  onClose, 
  onMarkAsRead,
  position = 'top-right',
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(notification?.id);
    }, 300);
  }, [onClose, notification?.id]);

  useEffect(() => {
    // Auto-close pour les notifications non urgentes
    if (notification?.priority !== 'urgent' && (notification?.duration || 0) > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification?.duration, notification?.priority, handleClose]);

  // Protection contre les notifications undefined ou mal formatées
  if (!notification) {
    console.warn('Toast component received undefined notification');
    return null;
  }

  const handleMarkAsRead = () => {
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
      default:
        return 'border-l-blue-500';
    }
  };

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'ring-2 ring-red-500 ring-opacity-50 shadow-2xl';
      case 'high':
        return 'ring-1 ring-orange-400 ring-opacity-50 shadow-xl';
      default:
        return 'shadow-lg';
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <div
      className={`
        ${position === 'relative' ? 'relative' : `fixed z-50 ${positionClasses[position] || positionClasses['top-right']}`}
        transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : position === 'relative' ? 'opacity-100' : 'translate-x-full opacity-0'}
        ${className}
      `}
      style={{ 
        maxWidth: '480px', 
        minWidth: '400px',
        width: '480px'
      }}
    >
      <div className={`
        relative bg-white dark:bg-gray-800 rounded-xl border-l-4 ${getBorderColor()} 
        ${getPriorityStyles()} overflow-hidden backdrop-blur-sm
        shadow-xl border border-gray-200 dark:border-gray-700
      `}>
        {/* Barre de progression pour les notifications avec durée */}
        {notification.duration > 0 && notification.priority !== 'urgent' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
            <div 
              className={`h-full transition-all ease-linear ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'error' ? 'bg-red-500' :
                notification.type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{
                animation: `progress-bar ${notification.duration}ms linear forwards`
              }}
            />
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <div className="p-2 rounded-full bg-opacity-20" style={{
                backgroundColor: notification.type === 'success' ? '#10b981' :
                              notification.type === 'error' ? '#ef4444' :
                              notification.type === 'warning' ? '#f59e0b' :
                              '#3b82f6'
              }}>
                {getIcon()}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {/* En-tête avec titre et priorité */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                    {notification.title}
                  </h4>
                  {notification.priority === 'urgent' && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-800">
                      🚨 Urgent
                    </span>
                  )}
                  {notification.priority === 'high' && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border border-orange-200 dark:border-orange-800">
                      ⚠️ Important
                    </span>
                  )}
                </div>
              </div>

              {/* Message */}
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                {notification.message}
              </p>

              {/* Métadonnées et actions */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {notification.timestamp && formatRelativeDate(notification.timestamp)}
                </span>

                <div className="flex items-center space-x-2">
                  {/* Bouton Marquer comme lu */}
                  {!notification.isRead && onMarkAsRead && (
                    <button
                      onClick={handleMarkAsRead}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 border border-blue-200 dark:border-blue-800"
                      title="Marquer comme lu"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Marquer lu
                    </button>
                  )}

                  {/* Badge Non lu */}
                  {!notification.isRead && !onMarkAsRead && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-800">
                      • Non lu
                    </span>
                  )}
                </div>
              </div>

              {/* Action personnalisée */}
              {notification.actionText && notification.onAction && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={notification.onAction}
                    className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus:outline-none focus:underline transition-colors duration-200"
                  >
                    {notification.actionText}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              )}
            </div>

            {/* Bouton de fermeture */}
            <button
              onClick={handleClose}
              className="ml-2 flex-shrink-0 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
              title="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
