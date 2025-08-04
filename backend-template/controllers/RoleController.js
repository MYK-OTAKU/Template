const { Role, Permission, User } = require('../models');
const { createError, ErrorTypes } = require('../utils/errorHandler');
const AuditService = require('../services/AuditService');

/**
 * Contrôleur des Rôles selon le cahier des charges Gaming Center
 * Principe Single Responsibility : Gestion exclusive des rôles
 */
class RoleController {
  constructor() {
    // Bind des méthodes pour éviter les problèmes de contexte
    this.getAllRoles = this.getAllRoles.bind(this);
    this.getRoleById = this.getRoleById.bind(this);
    this.createRole = this.createRole.bind(this);
    this.updateRole = this.updateRole.bind(this);
    this.deleteRole = this.deleteRole.bind(this);
    this.getRolePermissions = this.getRolePermissions.bind(this);
    this.assignPermissionsToRole = this.assignPermissionsToRole.bind(this);
  }

  /**
   * Récupérer tous les rôles avec permissions
   * Accessible selon les permissions définies dans le cahier des charges
   */
  async getAllRoles(req, res, next) {
    try {
      console.log(`📋 [ROLES] Récupération de tous les rôles par ${req.user.username} (${req.userRole})`);
      
      const roles = await Role.findAll({
        include: [
          {
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          },
          {
            model: User,
            as: 'users',
            attributes: ['id'], // On ne récupère que l'ID pour compter
            required: false
          }
        ],
        order: [['name', 'ASC']]
      });

      // Ajouter le comptage des utilisateurs à chaque rôle
      const rolesWithUserCount = roles.map(role => {
        const roleData = role.toJSON();
        roleData.userCount = roleData.users ? roleData.users.length : 0;
        delete roleData.users; // Supprimer la liste complète des utilisateurs
        return roleData;
      });

      console.log(`✅ [ROLES] ${roles.length} rôles récupérés`);
      console.log('📊 [ROLES] Données complètes:', JSON.stringify(rolesWithUserCount, null, 2));

      return res.status(200).json({
        success: true,
        message: 'Rôles récupérés avec succès',
        data: rolesWithUserCount,
        count: roles.length
      });
    } catch (error) {
      console.error('❌ [ROLES] Erreur récupération rôles:', error);
      next(error);
    }
  }

  /**
   * Récupérer un rôle par ID avec ses permissions
   */
  async getRoleById(req, res, next) {
    try {
      const { id } = req.params;
      console.log(`🔍 [ROLES] Récupération rôle ID: ${id} par ${req.user.username}`);

      const role = await Role.findByPk(id, {
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      if (!role) {
        throw createError(ErrorTypes.ROLE.NOT_FOUND, `Rôle avec l'ID ${id} non trouvé`);
      }

      console.log(`✅ [ROLES] Rôle trouvé: ${role.name}`);

      return res.status(200).json({
        success: true,
        message: 'Rôle récupéré avec succès',
        data: role
      });
    } catch (error) {
      console.error('❌ [ROLES] Erreur récupération rôle:', error);
      next(error);
    }
  }

  /**
   * Créer un nouveau rôle (Administrateur uniquement selon cahier des charges)
   */
  async createRole(req, res, next) {
    try {
      const { name, description, permissions } = req.body;
      
      console.log(`➕ [ROLES] Création rôle "${name}" par ${req.user.username}`);

      // Validation selon le cahier des charges
      if (!name || !description) {
        throw createError(ErrorTypes.VALIDATION.MISSING_FIELDS, 'Nom et description du rôle requis');
      }

      // Vérifier l'unicité du nom de rôle
      const existingRole = await Role.findOne({ where: { name: name.trim() } });
      if (existingRole) {
        throw createError(ErrorTypes.VALIDATION.INVALID_FORMAT, `Un rôle avec le nom "${name}" existe déjà`);
      }

      // Créer le rôle
      const newRole = await Role.create({
        name: name.trim(),
        description: description.trim()
      });

      // Associer les permissions si fournies
      if (permissions && Array.isArray(permissions) && permissions.length > 0) {
        const validPermissions = await Permission.findAll({
          where: { id: permissions }
        });

        if (validPermissions.length > 0) {
          await newRole.setPermissions(validPermissions);
          console.log(`✅ [ROLES] ${validPermissions.length} permissions associées au rôle`);
        }
      }

      // Récupérer le rôle complet avec permissions
      const roleWithPermissions = await Role.findByPk(newRole.id, {
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      // Journaliser l'action selon le cahier des charges
      await AuditService.logActivity({
        userId: req.user.id,
        action: 'CREATE_ROLE',
        description: `Création du rôle "${name}" par ${req.user.username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'ROLE',
        resourceId: newRole.id,
        newValues: { name, description, permissions },
        status: 'SUCCESS'
      });

      console.log(`✅ [ROLES] Rôle "${name}" créé avec succès`);

      return res.status(201).json({
        success: true,
        message: 'Rôle créé avec succès',
        data: roleWithPermissions
      });
    } catch (error) {
      console.error('❌ [ROLES] Erreur création rôle:', error);
      next(error);
    }
  }

  /**
   * Mettre à jour un rôle (Administrateur uniquement)
   */
  async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;
      
      console.log(`✏️ [ROLES] Modification rôle ID: ${id} par ${req.user.username}`);

      const role = await Role.findByPk(id, {
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      if (!role) {
        throw createError(ErrorTypes.ROLE.NOT_FOUND, `Rôle avec l'ID ${id} non trouvé`);
      }

      // Sauvegarder les anciennes valeurs pour audit
      const oldValues = {
        name: role.name,
        description: role.description,
        permissions: role.permissions.map(p => p.id)
      };

      // Vérifier l'unicité du nom si modifié
      if (name && name.trim() !== role.name) {
        const existingRole = await Role.findOne({ where: { name: name.trim() } });
        if (existingRole) {
          throw createError(ErrorTypes.VALIDATION.INVALID_FORMAT, `Un rôle avec le nom "${name}" existe déjà`);
        }
        role.name = name.trim();
      }

      if (description !== undefined) {
        role.description = description.trim();
      }

      await role.save();

      // Mettre à jour les permissions si fournies
      if (permissions && Array.isArray(permissions)) {
        const validPermissions = await Permission.findAll({
          where: { id: permissions }
        });
        await role.setPermissions(validPermissions);
        console.log(`✅ [ROLES] Permissions mises à jour pour le rôle "${role.name}"`);
      }

      // Récupérer le rôle mis à jour
      const updatedRole = await Role.findByPk(id, {
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      // Journaliser l'action
      await AuditService.logActivity({
        userId: req.user.id,
        action: 'UPDATE_ROLE',
        description: `Modification du rôle "${role.name}" par ${req.user.username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'ROLE',
        resourceId: id,
        oldValues,
        newValues: { name, description, permissions },
        status: 'SUCCESS'
      });

      console.log(`✅ [ROLES] Rôle "${role.name}" mis à jour avec succès`);

      return res.status(200).json({
        success: true,
        message: 'Rôle mis à jour avec succès',
        data: updatedRole
      });
    } catch (error) {
      console.error('❌ [ROLES] Erreur modification rôle:', error);
      next(error);
    }
  }

  /**
   * Supprimer un rôle (Administrateur uniquement)
   */
  async deleteRole(req, res, next) {
    try {
      const { id } = req.params;
      
      console.log(`🗑️ [ROLES] Suppression rôle ID: ${id} par ${req.user.username}`);

      const role = await Role.findByPk(id);

      if (!role) {
        throw createError(ErrorTypes.ROLE.NOT_FOUND, `Rôle avec l'ID ${id} non trouvé`);
      }

      // Vérifier qu'aucun utilisateur n'utilise ce rôle
      const usersWithRole = await User.count({ where: { roleId: id } });
      if (usersWithRole > 0) {
        throw createError(
          ErrorTypes.VALIDATION.INVALID_FORMAT, 
          `Impossible de supprimer le rôle "${role.name}" car ${usersWithRole} utilisateur(s) l'utilisent encore`
        );
      }

      // Sauvegarder pour audit
      const roleData = {
        id: role.id,
        name: role.name,
        description: role.description
      };

      await role.destroy();

      // Journaliser l'action
      await AuditService.logActivity({
        userId: req.user.id,
        action: 'DELETE_ROLE',
        description: `Suppression du rôle "${role.name}" par ${req.user.username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'ROLE',
        resourceId: id,
        oldValues: roleData,
        status: 'SUCCESS'
      });

      console.log(`✅ [ROLES] Rôle "${role.name}" supprimé avec succès`);

      return res.status(200).json({
        success: true,
        message: 'Rôle supprimé avec succès'
      });
    } catch (error) {
      console.error('❌ [ROLES] Erreur suppression rôle:', error);
      next(error);
    }
  }

  /**
   * Récupérer les permissions d'un rôle
   */
  async getRolePermissions(req, res, next) {
    try {
      const { id } = req.params;
      
      console.log(`🔑 [ROLES] Récupération permissions rôle ID: ${id}`);

      const role = await Role.findByPk(id, {
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      if (!role) {
        throw createError(ErrorTypes.ROLE.NOT_FOUND, `Rôle avec l'ID ${id} non trouvé`);
      }

      return res.status(200).json({
        success: true,
        message: 'Permissions du rôle récupérées avec succès',
        data: {
          role: {
            id: role.id,
            name: role.name,
            description: role.description
          },
          permissions: role.permissions
        }
      });
    } catch (error) {
      console.error('❌ [ROLES] Erreur récupération permissions:', error);
      next(error);
    }
  }

  /**
   * Assigner des permissions à un rôle
   */
  async assignPermissionsToRole(req, res, next) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      
      console.log(`🔗 [ROLES] Attribution permissions au rôle ID: ${id}`);

      if (!permissions || !Array.isArray(permissions)) {
        throw createError(ErrorTypes.VALIDATION.MISSING_FIELDS, 'Liste des permissions requise');
      }

      const role = await Role.findByPk(id);
      if (!role) {
        throw createError(ErrorTypes.ROLE.NOT_FOUND, `Rôle avec l'ID ${id} non trouvé`);
      }

      // Vérifier que les permissions existent
      const validPermissions = await Permission.findAll({
        where: { id: permissions }
      });

      if (validPermissions.length !== permissions.length) {
        throw createError(ErrorTypes.VALIDATION.INVALID_FORMAT, 'Certaines permissions spécifiées n\'existent pas');
      }

      // Assigner les permissions
      await role.setPermissions(validPermissions);

      // Journaliser l'action
      await AuditService.logActivity({
        userId: req.user.id,
        action: 'ASSIGN_PERMISSIONS_TO_ROLE',
        description: `Attribution de ${validPermissions.length} permission(s) au rôle "${role.name}" par ${req.user.username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'ROLE',
        resourceId: id,
        newValues: { permissions: permissions },
        status: 'SUCCESS'
      });

      console.log(`✅ [ROLES] ${validPermissions.length} permission(s) attribuée(s) au rôle "${role.name}"`);

      return res.status(200).json({
        success: true,
        message: 'Permissions attribuées avec succès au rôle',
        data: {
          role: role.name,
          assignedPermissions: validPermissions.length
        }
      });
    } catch (error) {
      console.error('❌ [ROLES] Erreur attribution permissions:', error);
      next(error);
    }
  }
}

// Export d'une instance selon les bonnes pratiques
module.exports = new RoleController();