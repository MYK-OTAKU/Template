const { Permission } = require('../models');
const { createError, ErrorTypes } = require('../utils/errorHandler');
const AuditService = require('../services/AuditService');

class PermissionController {
  async getAllPermissions(req, res, next) {
    try {
      const permissions = await Permission.findAll();
      
      return res.status(200).json({
        success: true,
        data: permissions
      });
    } catch (error) {
      next(error);
    }
  }

  async getPermissionById(req, res, next) {
    try {
      const { id } = req.params;
      const permission = await Permission.findByPk(id);
      
      if (!permission) {
        throw createError(ErrorTypes.NOT_FOUND_ERROR, 'Permission non trouvée');
      }
      
      return res.status(200).json({
        success: true,
        data: permission
      });
    } catch (error) {
      next(error);
    }
  }

  async createPermission(req, res, next) {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        throw createError(ErrorTypes.VALIDATION_ERROR, 'Le nom de la permission est requis');
      }
      
      // Vérifier si la permission existe déjà
      const existingPermission = await Permission.findOne({ where: { name } });
      if (existingPermission) {
        throw createError(ErrorTypes.VALIDATION_ERROR, 'Cette permission existe déjà');
      }
      
      const permission = await Permission.create({ name, description });
      
      // Journaliser la création
      await AuditService.logActivity({
        userId: req.user.id,
        action: 'CREATE_PERMISSION',
        description: `Création de la permission "${name}"`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'PERMISSION',
        resourceId: permission.id,
        newValues: permission.toJSON(),
        status: 'SUCCESS'
      });
      
      return res.status(201).json({
        success: true,
        message: 'Permission créée avec succès',
        data: permission
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePermission(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      const permission = await Permission.findByPk(id);
      
      if (!permission) {
        throw createError(ErrorTypes.NOT_FOUND_ERROR, 'Permission non trouvée');
      }
      
      // Protection des permissions critiques
      const criticalPermissions = ['ADMIN', 'ROLES_MANAGE', 'PERMISSIONS_MANAGE', 'USERS_ADMIN'];
      if (criticalPermissions.includes(permission.name) && req.user.role.name !== 'Administrateur') {
        throw createError(ErrorTypes.FORBIDDEN_ERROR, 'Seul un administrateur peut modifier cette permission critique');
      }
      
      // Sauvegarde des valeurs originales pour audit
      const originalData = permission.toJSON();
      
      if (name) permission.name = name;
      if (description !== undefined) permission.description = description;
      
      await permission.save();
      
      // Journaliser la modification
      await AuditService.logActivity({
        userId: req.user.id,
        action: 'UPDATE_PERMISSION',
        description: `Mise à jour de la permission "${permission.name}"`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'PERMISSION',
        resourceId: permission.id,
        oldValues: originalData,
        newValues: permission.toJSON(),
        status: 'SUCCESS'
      });
      
      return res.status(200).json({
        success: true,
        message: 'Permission mise à jour avec succès',
        data: permission
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePermission(req, res, next) {
    try {
      const { id } = req.params;
      
      const permission = await Permission.findByPk(id);
      
      if (!permission) {
        throw createError(ErrorTypes.NOT_FOUND_ERROR, 'Permission non trouvée');
      }
      
      // Protection des permissions critiques
      const criticalPermissions = ['ADMIN', 'ROLES_MANAGE', 'PERMISSIONS_MANAGE', 'USERS_ADMIN'];
      if (criticalPermissions.includes(permission.name)) {
        throw createError(ErrorTypes.FORBIDDEN_ERROR, 'Cette permission système ne peut pas être supprimée');
      }
      
      // Vérifier si la permission est utilisée par des rôles
      const roleCount = await permission.countRoles();
      if (roleCount > 0) {
        throw createError(ErrorTypes.VALIDATION_ERROR, 'Cette permission est utilisée par des rôles et ne peut pas être supprimée');
      }
      
      // Sauvegarde des données pour audit
      const permissionData = permission.toJSON();
      
      await permission.destroy();
      
      // Journaliser la suppression
      await AuditService.logActivity({
        userId: req.user.id,
        action: 'DELETE_PERMISSION',
        description: `Suppression de la permission "${permission.name}"`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'PERMISSION',
        resourceId: id,
        oldValues: permissionData,
        status: 'SUCCESS'
      });
      
      return res.status(200).json({
        success: true,
        message: 'Permission supprimée avec succès'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PermissionController();