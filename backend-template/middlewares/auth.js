const { verifyToken } = require('../config/jwt');
const { User, Role, Permission } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis',
        errorCode: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Retire "Bearer "

    try {
      const decoded = verifyToken(token);
      
      // Récupérer l'utilisateur avec son rôle et permissions
      const user = await User.findByPk(decoded.userId, {
        include: [{
          model: Role,
          as: 'role',
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }],
        attributes: { exclude: ['password', 'twoFactorSecret'] }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé ou inactif',
          errorCode: 'USER_INACTIVE'
        });
      }

      // Ajouter l'utilisateur, son rôle et ses permissions au request
      req.user = user;
      req.userRole = user.role?.name || null;
      req.userPermissions = user.role?.permissions?.map(p => p.name) || [];
      
      next();
    } catch (jwtError) {
      console.error('Erreur de vérification du token:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
        errorCode: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne',
      errorCode: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware pour vérifier si l'utilisateur a une permission spécifique
 * @param {string} requiredPermission - La permission requise
 */
const hasPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.userPermissions) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
        errorCode: 'NOT_AUTHENTICATED'
      });
    }

    // Vérifier si l'utilisateur a la permission requise ou est admin
    if (req.userPermissions.includes(requiredPermission) || req.userPermissions.includes('ADMIN')) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Permission "${requiredPermission}" requise`,
      errorCode: 'INSUFFICIENT_PERMISSIONS'
    });
  };
};

/**
 * Middleware pour vérifier si l'utilisateur a un rôle spécifique
 * @param {string|Array} requiredRole - Le rôle requis (string) ou les rôles autorisés (array)
 */
const hasRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
        errorCode: 'NOT_AUTHENTICATED'
      });
    }

    // Gérer le cas où requiredRole est un tableau (plusieurs rôles autorisés)
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Vérifier si l'utilisateur a l'un des rôles requis
    if (allowedRoles.includes(req.userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Rôle "${Array.isArray(requiredRole) ? requiredRole.join(' ou ') : requiredRole}" requis. Votre rôle actuel : "${req.userRole}"`,
      errorCode: 'INSUFFICIENT_ROLE'
    });
  };
};

/**
 * Middleware pour vérifier la hiérarchie des rôles
 * Utilise la même logique que dans UserController
 * @param {string} minimumRole - Le rôle minimum requis
 */
const hasMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
        errorCode: 'NOT_AUTHENTICATED'
      });
    }

    // Hiérarchie des rôles (même que dans UserController)
    const roleHierarchy = {
      'Administrateur': 3,
      'Manager': 2,
      'Employé': 1
    };

    const userLevel = roleHierarchy[req.userRole] || 0;
    const requiredLevel = roleHierarchy[minimumRole] || 0;

    if (userLevel >= requiredLevel) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Niveau de rôle "${minimumRole}" minimum requis. Votre rôle actuel : "${req.userRole}"`,
      errorCode: 'INSUFFICIENT_ROLE_LEVEL'
    });
  };
};

/**
 * Middleware combiné pour vérifier les permissions OU le rôle
 * Utile quand on veut permettre l'accès soit par permission soit par rôle
 * @param {string} permission - La permission à vérifier
 * @param {string|Array} role - Le ou les rôles autorisés
 */
const hasPermissionOrRole = (permission, role) => {
  return (req, res, next) => {
    if (!req.userPermissions || !req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
        errorCode: 'NOT_AUTHENTICATED'
      });
    }

    // Vérifier les permissions d'abord
    if (req.userPermissions.includes(permission) || req.userPermissions.includes('ADMIN')) {
      return next();
    }

    // Sinon vérifier les rôles
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (allowedRoles.includes(req.userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Permission "${permission}" ou rôle "${Array.isArray(role) ? role.join(' ou ') : role}" requis`,
      errorCode: 'INSUFFICIENT_PERMISSIONS_OR_ROLE'
    });
  };
};

/**
 * Middleware pour vérifier si l'utilisateur peut gérer un autre utilisateur
 * Basé sur la hiérarchie des rôles d'entreprise
 */
const canManageUser = () => {
  return async (req, res, next) => {
    try {
      if (!req.userRole) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
          errorCode: 'NOT_AUTHENTICATED'
        });
      }

      // Si c'est pour une création, le rôle cible sera dans le body
      // Si c'est pour une modification/suppression, on doit récupérer l'utilisateur cible
      let targetUserRole = null;

      if (req.method === 'POST' && req.body.roleId) {
        // Création d'utilisateur - récupérer le rôle depuis roleId
        const targetRole = await Role.findByPk(req.body.roleId);
        targetUserRole = targetRole?.name;
      } else if (req.params.id) {
        // Modification/suppression - récupérer l'utilisateur cible
        const targetUser = await User.findByPk(req.params.id, {
          include: [{ model: Role, as: 'role' }]
        });
        targetUserRole = targetUser?.role?.name;
      }

      if (!targetUserRole) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de déterminer le rôle de l\'utilisateur cible',
          errorCode: 'TARGET_ROLE_NOT_FOUND'
        });
      }

      // Logique de hiérarchie d'entreprise
      const currentUserRole = req.userRole;
      
      // Admin peut tout gérer
      if (currentUserRole === 'Administrateur') {
        return next();
      }
      
      // Manager peut gérer Manager et Employé (pas Admin)
      if (currentUserRole === 'Manager' && targetUserRole !== 'Administrateur') {
        return next();
      }
      
      // Employé ne peut rien gérer
      return res.status(403).json({
        success: false,
        message: `Votre rôle "${currentUserRole}" ne vous permet pas de gérer un utilisateur avec le rôle "${targetUserRole}"`,
        errorCode: 'INSUFFICIENT_HIERARCHY_LEVEL'
      });

    } catch (error) {
      console.error('Erreur dans canManageUser middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne',
        errorCode: 'INTERNAL_ERROR'
      });
    }
  };
};

module.exports = {
  authenticate,
  authenticateToken: authenticate, // Alias pour compatibilité
  hasPermission,
  hasRole,
  hasMinimumRole,
  hasPermissionOrRole,
  canManageUser
};
