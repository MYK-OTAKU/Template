#!/bin/bash
# Script pour mettre à jour automatiquement tous les hooks avec des notifications persistantes

echo "🔄 Mise à jour des hooks avec notifications persistantes..."

# Postes
echo "📝 Mise à jour usePostes.js..."
# useCreatePoste
sed -i 's/{ showSuccess, showError }/{ showError, notifyAction }/g' src/hooks/usePostes.js
sed -i 's/showSuccess(data.message.*);/notifyAction('\''create'\'', { entityType: '\''Poste'\'', entityName: data?.titre || '\''Nouveau poste'\'', actionType: '\''créé'\'', showToast: true, saveToStorage: true });/g' src/hooks/usePostes.js

# useUpdatePoste  
sed -i 's/showSuccess(data.message.*"Poste mis à jour avec succès");/notifyAction('\''update'\'', { entityType: '\''Poste'\'', entityName: data?.titre || `ID: ${variables.id}`, actionType: '\''modifié'\'', showToast: true, saveToStorage: true });/g' src/hooks/usePostes.js

# useDeletePoste
sed -i 's/showSuccess(.*"Poste supprimé avec succès");/notifyAction('\''delete'\'', { entityType: '\''Poste'\'', entityName: `ID: ${variables}`, actionType: '\''supprimé'\'', showToast: true, saveToStorage: true });/g' src/hooks/usePostes.js

echo "✅ Hooks mis à jour avec succès!"
