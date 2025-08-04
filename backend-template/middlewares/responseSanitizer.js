const { sanitizeData } = require('../utils/dataSanitizer');

/**
 * Middleware pour nettoyer automatiquement les données sensibles des réponses
 */
function sanitizeResponses(req, res, next) {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Nettoyer les données avant de les envoyer
    let sanitizedData;
    
    // Si data contient une clé 'data', c'est probablement une réponse structurée
    if (data && data.data) {
      // Créer une copie pour ne pas modifier l'original
      sanitizedData = { ...data };
      sanitizedData.data = sanitizeData(data.data);
    } else {
      // Nettoyer l'objet entier
      sanitizedData = sanitizeData(data);
    }
    
    // Appeler la méthode originale avec les données nettoyées
    return originalJson.call(this, sanitizedData);
  };
  
  next();
}

module.exports = sanitizeResponses;