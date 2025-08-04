const { User, Role, Permission } = require('../models');

/**
 * Middleware pour vérifier les permissions d'un utilisateur
 * @param {string} requiredPermission - Permission requise (ex: 'users.read')
 * @returns {Function} Middleware Express
 */
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      // Récupérer l'utilisateur avec son rôle et ses permissions
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          include: [Permission]
        }]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Compte utilisateur désactivé'
        });
      }

      // Vérifier si l'utilisateur a la permission requise
      const userPermissions = user.Role?.Permissions?.map(p => p.name) || [];
      
      // Ajouter les permissions à l'objet req.user pour utilisation ultérieure
      req.user.permissions = userPermissions;
      req.user.role = user.Role;

      if (!hasPermission(userPermissions, requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Permission requise: ${requiredPermission}`
        });
      }

      next();
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

/**
 * Middleware pour vérifier plusieurs permissions (OR)
 * @param {string[]} permissions - Liste des permissions (l'utilisateur doit en avoir au moins une)
 * @returns {Function} Middleware Express
 */
const checkAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          include: [Permission]
        }]
      });

      if (!user || !user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé'
        });
      }

      const userPermissions = user.Role?.Permissions?.map(p => p.name) || [];
      req.user.permissions = userPermissions;
      req.user.role = user.Role;

      // Vérifier si l'utilisateur a au moins une des permissions requises
      const hasAnyPermission = permissions.some(permission => 
        hasPermission(userPermissions, permission)
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          message: `Une des permissions suivantes est requise: ${permissions.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

/**
 * Middleware pour vérifier plusieurs permissions (AND)
 * @param {string[]} permissions - Liste des permissions (l'utilisateur doit toutes les avoir)
 * @returns {Function} Middleware Express
 */
const checkAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          include: [Permission]
        }]
      });

      if (!user || !user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé'
        });
      }

      const userPermissions = user.Role?.Permissions?.map(p => p.name) || [];
      req.user.permissions = userPermissions;
      req.user.role = user.Role;

      // Vérifier si l'utilisateur a toutes les permissions requises
      const hasAllPermissions = permissions.every(permission => 
        hasPermission(userPermissions, permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = permissions.filter(permission => 
          !hasPermission(userPermissions, permission)
        );
        
        return res.status(403).json({
          success: false,
          message: `Permissions manquantes: ${missingPermissions.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est propriétaire de la ressource
 * @param {string} resourceIdParam - Nom du paramètre contenant l'ID de la ressource
 * @param {string} resourceModel - Nom du modèle de la ressource
 * @param {string} userIdField - Nom du champ contenant l'ID utilisateur (défaut: 'userId')
 * @returns {Function} Middleware Express
 */
const checkResourceOwnership = (resourceIdParam, resourceModel, userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'ID de ressource manquant'
        });
      }

      const { [resourceModel]: Model } = require('../models');
      const resource = await Model.findByPk(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Ressource non trouvée'
        });
      }

      // Vérifier si l'utilisateur est propriétaire de la ressource
      if (resource[userIdField] !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: vous n\'êtes pas propriétaire de cette ressource'
        });
      }

      // Ajouter la ressource à la requête pour éviter une nouvelle requête
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Erreur lors de la vérification de propriété:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de propriété'
      });
    }
  };
};

/**
 * Vérifier si un utilisateur a une permission spécifique
 * @param {string[]} userPermissions - Liste des permissions de l'utilisateur
 * @param {string} requiredPermission - Permission à vérifier
 * @returns {boolean} True si l'utilisateur a la permission
 */
const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  // Vérification directe
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Vérification des permissions avec wildcards
  // Ex: 'users.*' donne accès à 'users.read', 'users.write', etc.
  const [resource, action] = requiredPermission.split('.');
  const wildcardPermission = `${resource}.*`;
  
  if (userPermissions.includes(wildcardPermission)) {
    return true;
  }

  // Permission super admin
  if (userPermissions.includes('*') || userPermissions.includes('admin.*')) {
    return true;
  }

  return false;
};

/**
 * Créer dynamiquement de nouvelles permissions
 * @param {string} name - Nom de la permission
 * @param {string} description - Description de la permission
 * @param {string} category - Catégorie de la permission
 * @returns {Promise<Permission>} Permission créée
 */
const createPermission = async (name, description, category = 'custom') => {
  try {
    // Valider le format de la permission
    if (!isValidPermissionFormat(name)) {
      throw new Error('Format de permission invalide. Utilisez le format: resource.action');
    }

    // Vérifier si la permission existe déjà
    const existingPermission = await Permission.findOne({ where: { name } });
    if (existingPermission) {
      return existingPermission;
    }

    // Créer la nouvelle permission
    const permission = await Permission.create({
      name,
      description,
      category
    });

    console.log(`Nouvelle permission créée: ${name}`);
    return permission;
  } catch (error) {
    console.error('Erreur lors de la création de la permission:', error);
    throw error;
  }
};

/**
 * Ajouter une permission à un rôle
 * @param {number} roleId - ID du rôle
 * @param {string} permissionName - Nom de la permission
 * @returns {Promise<boolean>} True si ajouté avec succès
 */
const addPermissionToRole = async (roleId, permissionName) => {
  try {
    const role = await Role.findByPk(roleId);
    const permission = await Permission.findOne({ where: { name: permissionName } });

    if (!role || !permission) {
      throw new Error('Rôle ou permission non trouvé');
    }

    // Vérifier si la permission est déjà assignée
    const hasPermission = await role.hasPermission(permission);
    if (hasPermission) {
      return true; // Déjà assignée
    }

    await role.addPermission(permission);
    console.log(`Permission ${permissionName} ajoutée au rôle ${role.name}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la permission au rôle:', error);
    throw error;
  }
};

/**
 * Valider le format d'une permission
 * @param {string} permissionName - Nom de la permission à valider
 * @returns {boolean} True si le format est valide
 */
const isValidPermissionFormat = (permissionName) => {
  // Format: resource.action ou resource.*
  const permissionRegex = /^[a-z][a-z0-9_]*\.(read|create|update|delete|manage|\*)$/;
  return permissionRegex.test(permissionName) || permissionName === '*';
};

/**
 * Obtenir toutes les permissions disponibles groupées par catégorie
 * @returns {Promise<Object>} Permissions groupées par catégorie
 */
const getAllPermissionsByCategory = async () => {
  try {
    const permissions = await Permission.findAll({
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    const groupedPermissions = {};
    permissions.forEach(permission => {
      if (!groupedPermissions[permission.category]) {
        groupedPermissions[permission.category] = [];
      }
      groupedPermissions[permission.category].push(permission);
    });

    return groupedPermissions;
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error);
    throw error;
  }
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkResourceOwnership,
  hasPermission,
  createPermission,
  addPermissionToRole,
  isValidPermissionFormat,
  getAllPermissionsByCategory
};

