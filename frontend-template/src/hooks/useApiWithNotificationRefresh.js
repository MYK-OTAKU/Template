import { useCallback } from 'react';
import { useNotification } from './useNotification';
import api from '../api/apiService';

/**
 * Hook personnalisé pour les opérations avec rafraîchissement automatique des notifications
 */
export const useApiWithNotificationRefresh = () => {
  const { refreshNotifications, showSuccess, showError } = useNotification();

  /**
   * Exécute une opération API et rafraîchit automatiquement les notifications
   * @param {Function} apiCall - Fonction qui retourne une promesse de l'appel API
   * @param {Object} options - Options pour le rafraîchissement
   * @param {string} options.successMessage - Message de succès à afficher
   * @param {string} options.errorMessage - Message d'erreur par défaut
   * @param {boolean} options.refreshNotifications - Si true, rafraîchit les notifications après l'opération
   */
  const executeWithRefresh = useCallback(async (apiCall, options = {}) => {
    const {
      successMessage,
      errorMessage = 'Une erreur est survenue',
      refreshNotifications: shouldRefresh = true
    } = options;

    try {
      const result = await apiCall();
      
      // Afficher le message de succès si fourni
      if (successMessage) {
        showSuccess(successMessage);
      }
      
      // Rafraîchir les notifications si demandé
      if (shouldRefresh) {
        setTimeout(() => {
          refreshNotifications();
        }, 500); // Petit délai pour laisser le backend traiter la notification
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'opération:', error);
      
      // Afficher le message d'erreur
      const message = error.response?.data?.message || errorMessage;
      showError(message);
      
      throw error;
    }
  }, [refreshNotifications, showSuccess, showError]);

  /**
   * Wrapper pour les opérations de mise à jour avec rafraîchissement automatique
   */
  const updateWithRefresh = useCallback((endpoint, data, options = {}) => {
    return executeWithRefresh(
      () => api.put(endpoint, data),
      {
        successMessage: 'Mise à jour effectuée avec succès',
        ...options
      }
    );
  }, [executeWithRefresh]);

  /**
   * Wrapper pour les opérations de création avec rafraîchissement automatique
   */
  const createWithRefresh = useCallback((endpoint, data, options = {}) => {
    return executeWithRefresh(
      () => api.post(endpoint, data),
      {
        successMessage: 'Élément créé avec succès',
        ...options
      }
    );
  }, [executeWithRefresh]);

  /**
   * Wrapper pour les opérations de suppression avec rafraîchissement automatique
   */
  const deleteWithRefresh = useCallback((endpoint, options = {}) => {
    return executeWithRefresh(
      () => api.delete(endpoint),
      {
        successMessage: 'Élément supprimé avec succès',
        ...options
      }
    );
  }, [executeWithRefresh]);

  return {
    executeWithRefresh,
    updateWithRefresh,
    createWithRefresh,
    deleteWithRefresh
  };
};

export default useApiWithNotificationRefresh;
