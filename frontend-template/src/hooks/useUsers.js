import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { useNotification } from './useNotification';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  ErrorTypes, 
  isErrorOfType, 
  getValidationErrors, 
  getErrorMessage,
  logError 
} from '../utils/errorHandler';

// Hook pour récupérer la liste des utilisateurs - CORRECTION ICI
export function useUsers() {
  const { showError } = useNotification();
  const { translations } = useLanguage();

  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        // CORRECTION: Utiliser getAllUsers au lieu de getUsers
        const response = await userService.getAllUsers();
        
        // Traitement amélioré de la réponse
        if (!response) {
          throw new Error("Réponse invalide du serveur");
        }
        
        // S'assurer qu'on extrait correctement les données
        let usersData;
        if (response.data?.data) {
          usersData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          usersData = response.data;
        } else if (Array.isArray(response)) {
          usersData = response;
        } else {
          console.warn('Format de réponse inattendu:', response);
          usersData = [];
        }
        
        // Vérification finale du type
        if (!Array.isArray(usersData)) {
          console.error('Format de données utilisateurs invalide:', usersData);
          throw new Error("Format de données utilisateurs invalide");
        }
        
        return usersData;
      } catch (error) {
        logError(error, 'useUsers');
        
        // Utiliser la fonction getErrorMessage pour obtenir un message adapté
        const errorMessage = getErrorMessage(error, translations);
        showError(errorMessage);
        
        // Retourner un tableau vide pour éviter les erreurs de rendu
        return [];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes
    // Ajout d'une gestion d'erreur globale
    onError: (error) => {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error);
    }
  });
}

// Hook pour récupérer un utilisateur par ID
export function useUser(userId) {
  const { showError } = useNotification();
  const { translations } = useLanguage();

  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const response = await userService.getUserById(userId);
        return response.data || response;
      } catch (error) {
        logError(error, `useUser(${userId})`);
        
        const errorMessage = getErrorMessage(error, translations);
        showError(errorMessage);
        
        return null;
      }
    },
    enabled: !!userId,
  });
}

// Hook pour créer un utilisateur
export function useCreateUser() {
  const queryClient = useQueryClient();
  const { showError, notifyAction } = useNotification();
  const { translations } = useLanguage();

  return useMutation({
    mutationFn: async (userData) => {
      try {
        const response = await userService.createUser(userData);
        return response.data || response;
      } catch (error) {
        logError(error, 'useCreateUser');
        
        // Gérer les erreurs spécifiques
        if (isErrorOfType(error, ErrorTypes.USER.ALREADY_EXISTS)) {
          throw error;
        } 
        else if (isErrorOfType(error, ErrorTypes.AUTHORIZATION.FORBIDDEN)) {
          throw error;
        }
        else if (isErrorOfType(error, ErrorTypes.ROLE.ADMIN_REQUIRED)) {
          throw error;
        }
        else if (isErrorOfType(error, ErrorTypes.VALIDATION.MISSING_FIELDS)) {
          const validationErrors = getValidationErrors(error);
          error.validationErrors = validationErrors;
          throw error;
        }
        else {
          throw error;
        }
      }
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Notification persistante automatique d'action
      notifyAction('create', {
        entityType: 'Utilisateur',
        entityName: newUser?.nom ? `${newUser.nom} ${newUser.prenom || ''}`.trim() : 'Nouvel utilisateur',
        actionType: 'créé',
        saveToStorage: true
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error, translations);
      showError(errorMessage);
    }
  });
}

// Hook pour mettre à jour un utilisateur
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { showError, notifyAction } = useNotification();
  const { translations } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, userData }) => {
      try {
        const response = await userService.updateUser(id, userData);
        return response.data || response;
      } catch (error) {
        logError(error, `useUpdateUser(${id})`);
        
        if (isErrorOfType(error, ErrorTypes.USER.ALREADY_EXISTS) ||
            isErrorOfType(error, ErrorTypes.AUTHORIZATION.FORBIDDEN) ||
            isErrorOfType(error, ErrorTypes.ROLE.ADMIN_REQUIRED) ||
            isErrorOfType(error, ErrorTypes.VALIDATION.MISSING_FIELDS)) {
          throw error;
        }
        else {
          throw error;
        }
      }
    },
    onSuccess: (updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
      
      // Notification persistante automatique d'action
      notifyAction('update', {
        entityType: 'Utilisateur',
        entityName: updatedUser?.nom ? `${updatedUser.nom} ${updatedUser.prenom || ''}`.trim() : `ID: ${variables.id}`,
        actionType: 'modifié',
        saveToStorage: true
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error, translations);
      showError(errorMessage);
    }
  });
}

// Hook pour activer/désactiver un utilisateur
export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  const { showError, notifyAction } = useNotification();
  const { translations } = useLanguage();

  return useMutation({
    mutationFn: async ({ userId, activate }) => {
      try {
        if (activate) {
          const response = await userService.activateUser(userId);
          return { response: response.data || response, activate };
        } else {
          const response = await userService.deactivateUser(userId);
          return { response: response.data || response, activate };
        }
      } catch (error) {
        logError(error, `useToggleUserStatus(${userId}, ${activate})`);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Notification persistante automatique d'action
      notifyAction(data.activate ? 'activate' : 'deactivate', {
        entityType: 'Utilisateur',
        entityName: `ID: ${variables.userId}`,
        actionType: data.activate ? 'activé' : 'désactivé',
        saveToStorage: true
      });
    },
    onError: (error) => {
      console.error("Erreur lors du changement de statut:", error);
      
      if (error.response?.data?.errorCode === 'SELF_DEACTIVATE_NOT_ALLOWED') {
        showError('Vous ne pouvez pas vous désactiver vous-même');
      } else if (error.response?.data?.errorCode === 'INSUFFICIENT_ROLE_PERMISSIONS') {
        showError(error.userMessage || `Vous n'avez pas les droits pour modifier le statut de cet utilisateur`);
      } else {
        const errorMessage = getErrorMessage(error, translations);
        showError(errorMessage);
      }
    }
  });
}

// Hook pour supprimer un utilisateur
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { showError, notifyAction } = useNotification();
  const { translations } = useLanguage();
  const { hasPermission } = useAuth();

  return useMutation({
    mutationFn: async (userId) => {
      // Vérifier si l'utilisateur a la permission requise
      if (!hasPermission('USERS_ADMIN')) {
        const error = new Error("Vous n'avez pas les droits pour supprimer un utilisateur");
        error.errorCode = ErrorTypes.AUTHORIZATION.INSUFFICIENT_PERMISSIONS;
        throw error;
      }
      
      try {
        const response = await userService.deleteUser(userId);
        return response.data || response;
      } catch (error) {
        logError(error, `useDeleteUser(${userId})`);
        
        if (isErrorOfType(error, ErrorTypes.USER.SELF_DELETE)) {
          throw new Error("Vous ne pouvez pas supprimer votre propre compte");
        }
        else if (isErrorOfType(error, ErrorTypes.USER.LAST_ADMIN)) {
          throw new Error("Impossible de supprimer le dernier administrateur");
        }
        
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Notification persistante automatique d'action
      notifyAction('delete', {
        entityType: 'Utilisateur',
        entityName: `ID: ${variables}`,
        actionType: 'supprimé',
        saveToStorage: true
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error, translations);
      showError(errorMessage);
    }
  });
}

// Hook pour changer le rôle d'un utilisateur - CORRIGÉ
export function useChangeUserRole() {
  const queryClient = useQueryClient();
  const { showError, notifyAction } = useNotification();
  const { translations } = useLanguage();

  return useMutation({
    mutationFn: async ({ userId, roleId }) => {
      try {
        const response = await userService.changeUserRole(userId, roleId);
        
        // DEBUG: Afficher la structure de la réponse
        console.log('📡 Réponse changeUserRole:', response);
        
        // Le backend renvoie directement l'objet, pas response.data
        return response || response.data;
      } catch (error) {
        logError(error, `useChangeUserRole(${userId}, ${roleId})`);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log('✅ Changement de rôle réussi:', data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Notification persistante automatique d'action
      notifyAction('update', {
        entityType: 'Utilisateur',
        entityName: `ID: ${variables.userId}`,
        actionType: 'rôle modifié',
        saveToStorage: true
      });
    },
    onError: (error) => {
      console.error("❌ Erreur lors du changement de rôle:", error);
      
      if (error.response?.data?.errorCode === 'INSUFFICIENT_ROLE_PERMISSIONS') {
        showError(error.userMessage || `Vous n'avez pas les droits pour effectuer ce changement de rôle`);
      } else if (error.response?.data?.errorCode === 'SELF_ROLE_CHANGE') {
        showError('Vous ne pouvez pas changer votre propre rôle');
      } else {
        const errorMessage = getErrorMessage(error, translations);
        showError(errorMessage);
      }
    }
  });
}