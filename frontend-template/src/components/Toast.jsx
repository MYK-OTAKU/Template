import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const Toast = ({
  type = 'info',
  title,
  message,
  duration = 5000,
  isVisible = true,
  onClose,
  onAction,
  actionText,
  priority = 'normal',
  theme = 'light'
}) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => onClose && onClose(), 300); // Délai pour l'animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onClose && onClose(), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColorClasses = () => {
    const isDark = theme === 'dark';
    const baseClasses = isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    
    switch (type) {
      case 'success':
        return `${baseClasses} border-l-4 border-green-500`;
      case 'error':
        return `${baseClasses} border-l-4 border-red-500`;
      case 'warning':
        return `${baseClasses} border-l-4 border-yellow-500`;
      case 'info':
      default:
        return `${baseClasses} border-l-4 border-blue-500`;
    }
  };

  const getPriorityClasses = () => {
    switch (priority) {
      case 'urgent':
        return 'ring-2 ring-red-500 ring-opacity-50';
      case 'high':
        return 'ring-2 ring-yellow-500 ring-opacity-50';
      case 'normal':
      default:
        return '';
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        max-w-sm w-full shadow-lg rounded-lg pointer-events-auto
        ${getColorClasses()}
        ${getPriorityClasses()}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className="text-sm font-medium">
                {title}
              </p>
            )}
            <p className={`text-sm ${title ? 'mt-1' : ''} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {message}
            </p>
            
            {onAction && actionText && (
              <div className="mt-3">
                <button
                  onClick={onAction}
                  className={`
                    text-sm font-medium rounded-md px-3 py-1
                    ${type === 'success' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                      type === 'error' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                      type === 'warning' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                      'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }
                    ${theme === 'dark' ? 'bg-opacity-20 hover:bg-opacity-30' : ''}
                  `}
                >
                  {actionText}
                </button>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className={`
                inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${theme === 'dark' 
                  ? 'text-gray-400 hover:text-gray-200 focus:ring-gray-600' 
                  : 'text-gray-400 hover:text-gray-500 focus:ring-gray-500'
                }
              `}
            >
              <span className="sr-only">Fermer</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Barre de progression pour les toasts avec durée */}
      {duration > 0 && show && (
        <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div
            className={`h-full transition-all ease-linear ${
              type === 'success' ? 'bg-green-500' :
              type === 'error' ? 'bg-red-500' :
              type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
