/**
 * Gestionnaire de réponses standardisées
 */

/**
 * Génère une réponse de succès standardisée
 * @param {Object} data - Données à renvoyer
 * @param {string} message - Message de succès
 * @param {number} statusCode - Code HTTP (par défaut 200)
 * @returns {Object} - Objet de réponse standardisé
 */
const successResponse = (data = null, message = 'Opération réussie', statusCode = 200) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return { response, statusCode };
};

/**
 * Middleware pour standardiser les réponses des contrôleurs
 */
const standardizeResponse = (req, res, next) => {
  // Méthode originale
  const originalJson = res.json;
  const originalStatus = res.status;
  
  // Remplacer res.json
  res.json = function(data) {
    // Si ce n'est pas une réponse déjà formatée par errorMiddleware
    if (data && data.success === undefined) {
      data = {
        success: true,
        ...data
      };
    }
    
    return originalJson.call(this, data);
  };
  
  // Ajouter des méthodes utilitaires
  res.success = function(data, message = 'Opération réussie', statusCode = 200) {
    const { response } = successResponse(data, message);
    return originalStatus.call(this, statusCode).json(response);
  };
  
  res.created = function(data, message = 'Ressource créée avec succès') {
    const { response } = successResponse(data, message);
    return originalStatus.call(this, 201).json(response);
  };
  
  res.noContent = function() {
    return originalStatus.call(this, 204).end();
  };
  
  next();
};

module.exports = {
  successResponse,
  standardizeResponse
};