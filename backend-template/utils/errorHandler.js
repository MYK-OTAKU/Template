/**
 * Classe d'erreur personnalisée avec code d'erreur standardisé
 */
class AppError extends Error {
  constructor(message, errorCode, statusCode = 400) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreurs standard avec codes et messages
 */
const ErrorTypes = {
  // Erreurs d'authentification
  AUTHENTICATION: {
    INVALID_CREDENTIALS: { code: 'AUTH_001', message: 'Identifiants invalides', statusCode: 401 },
    USER_NOT_FOUND: { code: 'AUTH_002', message: 'Utilisateur non trouvé', statusCode: 401 },
    ACCOUNT_DISABLED: { code: 'AUTH_003', message: 'Compte désactivé', statusCode: 401 },
    TOKEN_EXPIRED: { code: 'AUTH_004', message: 'Token expiré', statusCode: 401 },
    INVALID_TOKEN: { code: 'AUTH_005', message: 'Token invalide', statusCode: 401 },
    TWO_FACTOR_REQUIRED: { code: 'AUTH_006', message: 'Authentification à deux facteurs requise', statusCode: 200 },
    INVALID_2FA_CODE: { code: 'AUTH_007', message: 'Code d\'authentification à deux facteurs invalide', statusCode: 401 }
  },
  
  // Erreurs d'autorisation
  AUTHORIZATION: {
    FORBIDDEN: { code: 'AUTHZ_001', message: 'Accès refusé', statusCode: 403 },
    INSUFFICIENT_PERMISSIONS: { code: 'AUTHZ_002', message: 'Permissions insuffisantes', statusCode: 403 }
  },
  
  // Erreurs de validation
  VALIDATION: {
    MISSING_FIELDS: { code: 'VAL_001', message: 'Champs obligatoires manquants', statusCode: 400 },
    INVALID_FORMAT: { code: 'VAL_002', message: 'Format invalide', statusCode: 400 },
    PASSWORD_TOO_SHORT: { code: 'VAL_003', message: 'Mot de passe trop court', statusCode: 400 },
    EMAIL_INVALID: { code: 'VAL_004', message: 'Format d\'email invalide', statusCode: 400 }
  },
  
  // Erreurs utilisateur
  USER: {
    ALREADY_EXISTS: { code: 'USER_001', message: 'Utilisateur déjà existant', statusCode: 409 },
    NOT_FOUND: { code: 'USER_002', message: 'Utilisateur non trouvé', statusCode: 404 },
    SELF_DELETE: { code: 'USER_003', message: 'Auto-suppression interdite', statusCode: 400 }
  },
  
  // Erreurs de rôle
  ROLE: {
    NOT_FOUND: { code: 'ROLE_001', message: 'Rôle non trouvé', statusCode: 404 },
    ADMIN_REQUIRED: { code: 'ROLE_002', message: 'Droits administrateur requis', statusCode: 403 }
  },
  
  // Erreurs système
  SYSTEM: {
    DATABASE_ERROR: { code: 'SYS_001', message: 'Erreur de base de données', statusCode: 500 },
    INTERNAL_ERROR: { code: 'SYS_002', message: 'Erreur interne du serveur', statusCode: 500 },
    CONNECTION_TIMEOUT: { code: 'SYS_003', message: 'Timeout de connexion', statusCode: 503 }
  }
};

// Fonction pour créer une erreur typée
const createError = (errorType, customMessage = null) => {
  // Vérifier que errorType est défini et a les propriétés nécessaires
  if (!errorType || typeof errorType !== 'object') {
    console.error('ErrorType invalide:', errorType);
    // Retourner une erreur par défaut
    errorType = ErrorTypes.SYSTEM.INTERNAL_ERROR;
  }
  
  const error = new Error(customMessage || errorType.message);
  error.statusCode = errorType.statusCode || 500;
  error.errorCode = errorType.code || 'UNKNOWN_ERROR';
  error.type = 'CustomError';
  
  return error;
};

// Fonction pour vérifier le type d'erreur
const isErrorOfType = (error, errorType) => {
  if (!error || !errorType) return false;
  return error.errorCode === errorType.code;
};

// Middleware de gestion d'erreurs centralisé
const errorMiddleware = (err, req, res, next) => {
  console.error('Erreur capturée par le middleware:', {
    message: err.message,
    statusCode: err.statusCode,
    errorCode: err.errorCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Gestion des erreurs de base de données Sequelize
  if (err.name === 'SequelizeConnectionError' || err.name === 'ConnectionError') {
    return res.status(503).json({
      success: false,
      message: 'Service temporairement indisponible - Problème de base de données',
      errorCode: 'DATABASE_CONNECTION_ERROR'
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      errorCode: 'VALIDATION_ERROR',
      details: err.errors?.map(e => e.message) || []
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Cette valeur existe déjà dans le système',
      errorCode: 'DUPLICATE_ENTRY'
    });
  }

  // Gestion des erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide',
      errorCode: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré',
      errorCode: 'TOKEN_EXPIRED'
    });
  }

  // Gestion des erreurs personnalisées
  if (err.type === 'CustomError') {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode
    });
  }

  // Erreur par défaut
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';
  const errorCode = err.errorCode || 'INTERNAL_ERROR';

  return res.status(statusCode).json({
    success: false,
    message: message,
    errorCode: errorCode
  });
};

module.exports = {
  AppError,
  ErrorTypes,
  createError,
  isErrorOfType,
  errorMiddleware
};