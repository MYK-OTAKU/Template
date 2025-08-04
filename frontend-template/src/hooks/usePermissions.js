import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import permissionService from '../services/permissionService';
import { useNotification } from './useNotification';
import { useLanguage } from '../contexts/LanguageContext';
import { getErrorMessage, logError } from '../utils/errorHandler';

// Hook pour récupérer la liste des permissions
export function usePermissions() {
  const { showError } = useNotification();
  const { translations } = useLanguage();

  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      try {
        console.log('🔍 [PERMISSIONS] Récupération des permissions...');
        const response = await permissionService.getAllPermissions();
        
        let permissionsData;
        if (response.data?.data) {
          permissionsData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          permissionsData = response.data;
        } else if (Array.isArray(response)) {
          permissionsData = response;
        } else {
          console.warn('Format de réponse inattendu pour les permissions:', response);
          permissionsData = [];
        }
        
        if (!Array.isArray(permissionsData)) {
          console.error('Format de données permissions invalide:', permissionsData);
          throw new Error("Format de données permissions invalide");
        }
        
        console.log('✅ [PERMISSIONS] Permissions reçues:', permissionsData);
        return permissionsData;
      } catch (error) {
        logError(error, 'usePermissions');
        const errorMessage = getErrorMessage(error, translations);
        showError(errorMessage);
        return [];
      }
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true
  });
}

// Hook pour récupérer une permission par ID
export function usePermission(permissionId) {
  const { showError } = useNotification();
  const { translations } = useLanguage();

  return useQuery({
    queryKey: ['permission', permissionId],
    queryFn: async () => {
      if (!permissionId) return null;
      try {
        const response = await permissionService.getPermissionById(permissionId);
        return response.data || response;
      } catch (error) {
        logError(error, `usePermission(${permissionId})`);
        const errorMessage = getErrorMessage(error, translations);
        showError(errorMessage);
        return null;
      }
    },
    enabled: !!permissionId,
  });
}

// Hook pour créer une permission
export function useCreatePermission() {
  const queryClient = useQueryClient();
  const { showError, notifyAction } = useNotification();
  const { translations } = useLanguage();

  return useMutation({
    mutationFn: async (permissionData) => {
      try {
        console.log('➕ [CREATE_PERMISSION] Début création:', permissionData);
        const response = await permissionService.createPermission(permissionData);
        console.log('✅ [CREATE_PERMISSION] Succès:', response);
        return response.data || response;
      } catch (error) {
        logError(error, 'useCreatePermission');
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🔄 [CREATE_PERMISSION] Invalidation cache...');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.refetchQueries({ queryKey: ['permissions'] });
      
      // Notification persistante automatique d'action
      notifyAction('create', {
        entityType: 'Permission',
        entityName: data?.name || 'Nouvelle permission',
        actionType: 'créée',
        saveToStorage: true
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error, translations);
      showError(errorMessage);
    }
  });
}

// Hook pour mettre à jour une permission
export function useUpdatePermission() {
  const queryClient = useQueryClient();
  const { showError, notifyAction } = useNotification();
  const { translations } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, permissionData }) => {
      try {
        console.log('🔧 [UPDATE_PERMISSION] Début modification:', { id, permissionData });
        const response = await permissionService.updatePermission(id, permissionData);
        console.log('✅ [UPDATE_PERMISSION] Succès:', response);
        return response.data || response;
      } catch (error) {
        logError(error, `useUpdatePermission(${id})`);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log('🔄 [UPDATE_PERMISSION] Invalidation cache...');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.refetchQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['permission', variables.id] });
      
      // Notification persistante automatique d'action
      notifyAction('update', {
        entityType: 'Permission',
        entityName: data?.name || `ID: ${variables.id}`,
        actionType: 'modifiée',
        saveToStorage: true
      });
    },
    onError: (error) => {
      logError(error, `useUpdatePermission`);
      const errorMessage = getErrorMessage(error, translations);
      showError(errorMessage);
    }
  });
}

// Hook pour supprimer une permission
export function useDeletePermission() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();
  const { translations } = useLanguage();

  return useMutation({
    mutationFn: async (permissionId) => {
      try {
        const response = await permissionService.deletePermission(permissionId);
        return response.data || response;
      } catch (error) {
        logError(error, `useDeletePermission(${permissionId})`);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      showSuccess(data?.message || "Permission supprimée avec succès");
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error, translations);
      showError(errorMessage);
    }
  });
}