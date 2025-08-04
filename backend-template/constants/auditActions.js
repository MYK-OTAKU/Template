/**
 * Constantes pour les actions d'audit
 * Utiliser ces constantes dans les appels à AuditService.logActivity
 * pour standardiser les types d'actions dans les logs
 */

const AUDIT_ACTIONS = {
  // Actions d'authentification
  AUTH: {
    LOGIN: 'LOGIN',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    TOKEN_REFRESH: 'TOKEN_REFRESH',
    TWO_FACTOR: 'TWO_FACTOR',
    TWO_FACTOR_FAILED: 'TWO_FACTOR_FAILED',
    TWO_FACTOR_SETUP: 'TWO_FACTOR_SETUP',
    PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
    PASSWORD_RESET: 'PASSWORD_RESET'
  },
  
  // Actions sur les sessions
  SESSION: {
    START: 'SESSION_START',
    PAUSE: 'SESSION_PAUSE',
    RESUME: 'SESSION_RESUME',
    EXTEND: 'SESSION_EXTEND',
    END: 'SESSION_END',
    CANCEL: 'SESSION_CANCEL',
    ADMIN_TERMINATE: 'ADMIN_TERMINATE_SESSION'
  },
  
  // Actions CRUD génériques
  CRUD: {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
  },
  
  // Actions spécifiques aux utilisateurs
  USER: {
    CREATE: 'USER_CREATE',
    UPDATE: 'USER_UPDATE',
    DELETE: 'USER_DELETE',
    ACTIVATE: 'USER_ACTIVATE',
    DEACTIVATE: 'USER_DEACTIVATE',
    CHANGE_ROLE: 'USER_CHANGE_ROLE'
  },
  
  // Actions spécifiques aux rôles
  ROLE: {
    CREATE: 'ROLE_CREATE',
    UPDATE: 'ROLE_UPDATE',
    DELETE: 'ROLE_DELETE',
    ADD_PERMISSION: 'ROLE_ADD_PERMISSION',
    REMOVE_PERMISSION: 'ROLE_REMOVE_PERMISSION'
  },
  
  // Actions spécifiques aux permissions
  PERMISSION: {
    CREATE: 'PERMISSION_CREATE',
    UPDATE: 'PERMISSION_UPDATE',
    DELETE: 'PERMISSION_DELETE'
  },
  
  // Actions spécifiques aux postes
  POSTE: {
    CREATE: 'POSTE_CREATE',
    UPDATE: 'POSTE_UPDATE',
    DELETE: 'POSTE_DELETE',
    CHANGE_STATE: 'POSTE_CHANGE_STATE'
  },
  
  // Actions spécifiques aux types de postes
  TYPE_POSTE: {
    CREATE: 'TYPE_POSTE_CREATE',
    UPDATE: 'TYPE_POSTE_UPDATE',
    DELETE: 'TYPE_POSTE_DELETE'
  },
  
  // Erreurs et sécurité
  SECURITY: {
    ERROR: 'ERROR',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
  }
};

// Types de ressources pour l'audit
const RESOURCE_TYPES = {
  USER: 'USER',
  ROLE: 'ROLE',
  PERMISSION: 'PERMISSION',
  USER_SESSION: 'USER_SESSION',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  POSTE: 'POSTE',
  TYPE_POSTE: 'TYPE_POSTE',
  SESSION: 'SESSION'
};

// Statuts des actions
const ACTION_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  WARNING: 'WARNING',
  INFO: 'INFO'
};

module.exports = {
  AUDIT_ACTIONS,
  RESOURCE_TYPES,

  ACTION_STATUS
};