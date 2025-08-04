/**
 * Utilitaire pour nettoyer les données sensibles des objets avant de les envoyer
 */

// Liste des champs sensibles à supprimer par défaut
const SENSITIVE_FIELDS = [
  'password',
  'twoFactorSecret',
  'refreshToken',
  'qrScanned',
  'salt',
  'resetPasswordToken',
  'previousIp'
];

// Liste des champs sensibles spécifiques par modèle
const MODEL_SPECIFIC_FIELDS = {
  'user': [
    'password',
    'twoFactorSecret',
    'qrScanned',
    'salt',
    'resetPasswordToken',
    'salary' // Sensible pour certains contextes
  ],
  'refreshToken': [
    'token',
    'createdByIp'
  ],
  'userSession': [
    'previousIp'
  ]
};

/**
 * Supprime les champs sensibles d'un objet
 * @param {Object} data - L'objet à nettoyer
 * @param {String} modelType - Type du modèle (optionnel, pour des règles spécifiques)
 * @param {Array} additionalFields - Champs supplémentaires à supprimer
 * @returns {Object} - L'objet nettoyé
 */
function sanitizeData(data, modelType = null, additionalFields = []) {
  // Si null ou undefined, retourner tel quel
  if (!data) return data;
  
  // Si c'est un tableau, appliquer à chaque élément
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, modelType, additionalFields));
  }
  
  // Si ce n'est pas un objet, retourner tel quel
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // Gérer les instances Sequelize
  let cleanData = data;
  if (typeof data.toJSON === 'function') {
    cleanData = data.toJSON();
  } else {
    // Cloner l'objet pour éviter de modifier l'original
    cleanData = { ...data };
  }

  // Déterminer les champs à supprimer
  let fieldsToRemove = [...SENSITIVE_FIELDS, ...additionalFields];
  
  // Ajouter les champs spécifiques au modèle si applicable
  if (modelType && MODEL_SPECIFIC_FIELDS[modelType]) {
    fieldsToRemove = [...fieldsToRemove, ...MODEL_SPECIFIC_FIELDS[modelType]];
  }

  // Supprimer les champs sensibles
  fieldsToRemove.forEach(field => {
    if (cleanData.hasOwnProperty(field)) {
      delete cleanData[field];
    }
  });

  // Traiter récursivement les objets imbriqués
  Object.keys(cleanData).forEach(key => {
    if (typeof cleanData[key] === 'object' && cleanData[key] !== null) {
      cleanData[key] = sanitizeData(cleanData[key], null, additionalFields);
    }
  });

  return cleanData;
}

module.exports = { sanitizeData };