const { User, Role, Permission } = require('../models');
const AuthService = require('../services/AuthService');
const AuditService = require('../services/AuditService');
const { createError, ErrorTypes } = require('../utils/errorHandler');

class UserController {
  constructor() {
    // Bind toutes les méthodes dans le constructeur
    this.createUser = this.createUser.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.getUserById = this.getUserById.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.activateUser = this.activateUser.bind(this);
    this.deactivateUser = this.deactivateUser.bind(this);
    this.changeUserRole = this.changeUserRole.bind(this);
    this.canManageRole = this.canManageRole.bind(this);
  }

  // Hiérarchie des rôles pour la gestion d'entreprise
  getRoleHierarchy() {
    return {
      'Administrateur': 3,
      'Manager': 2,
      'Employé': 1
    };
  }

  // Logique de hiérarchie d'entreprise
  canManageRole(currentUserRole, targetRole) {
    const hierarchy = this.getRoleHierarchy();
    
    if (currentUserRole === 'Administrateur') {
      return true; // Admin peut tout gérer
    }
    
    if (currentUserRole === 'Manager') {
      return targetRole !== 'Administrateur'; // Manager ne peut pas gérer les admins
    }
    
    return false; // Employé ne peut rien gérer
  }

  /**
   * Créer un nouvel utilisateur (logique de gestion d'entreprise)
   */
  async createUser(req, res, next) {
    try {
      const { username, password, firstName, lastName, email, phone, address, roleId, isActive, twoFactorEnabled } = req.body;
      
      console.log('🎯 Tentative de création d\'utilisateur par:', {
        createdBy: req.user?.username,
        createdByRole: req.user?.role?.name,
        targetRoleId: roleId
      });

      // Validation des champs obligatoires
      if (!username || !password || !firstName || !lastName || !email || !roleId) {
        throw createError(ErrorTypes.VALIDATION.MISSING_FIELDS, 'Les champs username, password, firstName, lastName, email et roleId sont obligatoires');
      }

      // Vérifier que l'utilisateur créateur a les permissions
      if (!req.userPermissions.includes('USERS_ADMIN') && !req.userPermissions.includes('ADMIN')) {
        throw createError(ErrorTypes.AUTHORIZATION.FORBIDDEN, 'Vous n\'avez pas les permissions pour créer des utilisateurs');
      }

      // Récupérer le rôle cible
      const targetRole = await Role.findByPk(roleId);
      if (!targetRole) {
        throw createError(ErrorTypes.ROLE.NOT_FOUND, 'Le rôle spécifié n\'existe pas');
      }

      // Vérifier la hiérarchie stricte
      const currentUserRole = req.user.role?.name;
      console.log('🔍 Vérification hiérarchique:', {
        currentUserRole,
        targetRole: targetRole.name,
        canManage: this.canManageRole(currentUserRole, targetRole.name)
      });

 if (!this.canManageRole(currentUserRole, targetRole.name)) {
        throw createError(
          ErrorTypes.AUTHORIZATION.FORBIDDEN, 
          `Votre rôle "${currentUserRole}" ne vous permet pas de créer un utilisateur avec le rôle "${targetRole.name}"`
        );
      }

      // Préparer les données utilisateur
      const userData = {
        username: username.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        roleId: parseInt(roleId),
        isActive: isActive !== undefined ? isActive : true,
        twoFactorEnabled: twoFactorEnabled || false
      };

      // Créer l'utilisateur via AuthService (pour la validation et le hachage)
      const newUserData = await AuthService.register(userData);

      // Journaliser la création
      await AuditService.logActivity({
        userId: req.user.id,
        action: 'CREATE_USER',
        description: `Création de l'utilisateur "${username}" avec le rôle "${targetRole.name}" par ${req.user.username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'USER',
        resourceId: newUserData.id,
        newValues: { ...userData, password: '[PROTECTED]' },
        status: 'SUCCESS'
      });

      // Récupérer l'utilisateur créé avec son rôle
      const userWithRole = await User.findByPk(newUserData.id, {
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }],
        attributes: { exclude: ['password', 'twoFactorSecret'] }
      });

      console.log('✅ Utilisateur créé avec succès:', {
        id: newUserData.id,
        username: userData.username,
        role: targetRole.name,
        createdBy: req.user.username
      });

      return res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: userWithRole
      });
    } catch (error) {
      console.error('❌ Erreur lors de la création d\'utilisateur:', {
        error: error.message,
        type: error.name,
        statusCode: error.statusCode
      });
      
      next(error);
    }
  }

  /**
   * Récupérer tous les utilisateurs
   */
  async getAllUsers(req, res, next) {
    try {
      const users = await User.findAll({
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }],
        attributes: { exclude: ['password', 'twoFactorSecret'] },
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      next(error);
    }
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id, {
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }],
        attributes: { exclude: ['password', 'twoFactorSecret'] }
      });

      if (!user) {
        throw createError(ErrorTypes.USER.NOT_FOUND, 'Utilisateur non trouvé');
      }

      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      next(error);
    }
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getUserProfile(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        throw createError(ErrorTypes.AUTHENTICATION.USER_NOT_FOUND, 'Utilisateur non authentifié');
      }
      
      const user = await User.findByPk(req.user.id, {
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

      if (!user) {
        throw createError(ErrorTypes.USER.NOT_FOUND, 'Profil utilisateur non trouvé');
      }

      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      next(error);
    }
  }

  /**
   * Mettre à jour un utilisateur avec contrôles hiérarchiques
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, phone, address, roleId, isActive, twoFactorEnabled } = req.body;

      const user = await User.findByPk(id, {
        include: [{
          model: Role,
          as: 'role'
        }]
      });

      if (!user) {
        throw createError(ErrorTypes.USER.NOT_FOUND, 'Utilisateur non trouvé');
      }

      // Empêcher l'auto-désactivation
      if (user.id === req.user.id && isActive === false) {
        throw createError(ErrorTypes.VALIDATION.INVALID_FORMAT, 'Vous ne pouvez pas vous désactiver vous-même');
      }

      // Vérifier les droits hiérarchiques pour la modification
        const currentUserRole = req.user.role?.name;
      if (req.user.id !== parseInt(id) && !this.canManageRole(currentUserRole, user.role.name)) {
        throw createError(
          ErrorTypes.AUTHORIZATION.FORBIDDEN,
          `Votre rôle "${currentUserRole}" ne vous permet pas de modifier un utilisateur avec le rôle "${user.role.name}"`
        );
      }

      // Si changement de rôle, vérifier les droits
      if (roleId !== undefined && roleId !== user.roleId) {
        const targetRole = await Role.findByPk(roleId);
        if (!targetRole) {
          throw createError(ErrorTypes.ROLE.NOT_FOUND, 'Le nouveau rôle spécifié n\'existe pas');
        }

       if (!this.canManageRole(currentUserRole, targetRole.name)) {
          throw createError(
            ErrorTypes.AUTHORIZATION.FORBIDDEN,
            `Votre rôle "${currentUserRole}" ne vous permet pas d'attribuer le rôle "${targetRole.name}"`
          );
        }
      }


      // Sauvegarder les données originales pour audit
      const originalData = user.toJSON();

      // Mise à jour des champs
      if (firstName !== undefined) user.firstName = firstName.trim();
      if (lastName !== undefined) user.lastName = lastName.trim();
      if (email !== undefined) user.email = email.trim().toLowerCase();
      if (phone !== undefined) user.phone = phone?.trim() || null;
      if (address !== undefined) user.address = address?.trim() || null;
      if (roleId !== undefined) user.roleId = parseInt(roleId);
      if (isActive !== undefined) user.isActive = isActive;
      if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;

      await user.save();

      // Journaliser la modification
      await AuditService.logActivity({
        userId: req.user.id,
        action: 'UPDATE_USER',
        description: `Modification de l'utilisateur "${user.username}" par ${req.user.username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'USER',
        resourceId: user.id,
        oldValues: originalData,
        newValues: user.toJSON(),
        status: 'SUCCESS'
      });

      // Récupérer l'utilisateur mis à jour avec son rôle
      const updatedUser = await User.findByPk(id, {
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }],
        attributes: { exclude: ['password', 'twoFactorSecret'] }
      });

      return res.status(200).json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        data: updatedUser
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      next(error);
    }
  }

  /**
   * Supprimer un utilisateur avec contrôles hiérarchiques
   */
  // ...existing code...

/**
 * Suppression d'utilisateur avec audit complet selon le cahier des charges
 */
async deleteUser(req, res) {
    try {
    const userId = parseInt(req.params.id);
    const currentUser = req.user;
    
    console.log(`🗑️ [USER_CTRL] Suppression utilisateur ID: ${userId} par ${currentUser.username}`);

    // Vérification que l'utilisateur existe
    const userToDelete = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'role'
        }]
      });

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
        errorCode: 'USER_NOT_FOUND'
      });
      }

    // Vérifications de sécurité selon le cahier des charges Gaming Center
    if (userToDelete.id === currentUser.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte',
        errorCode: 'CANNOT_DELETE_SELF'
      });
    }

    // Vérification hiérarchique des rôles
    if (!this.canManageRole(currentUser.role?.name, userToDelete.role?.name)) {
      return res.status(403).json({
        success: false,
        message: `Vous n'avez pas les droits pour supprimer un utilisateur avec le rôle "${userToDelete.role?.name}"`,
        errorCode: 'INSUFFICIENT_ROLE_PERMISSIONS'
      });
    }

    // CRITIQUE : Terminer toutes les sessions actives AVANT la suppression
    try {
      const sessionsTerminated = await AuditService.endAllUserSessions(
        userToDelete.id, 
        req.ip || 'SYSTEM', 
        'USER_DELETED'  // Utiliser la nouvelle valeur ajoutée au modèle
      );
      console.log(`✅ [USER_CTRL] ${sessionsTerminated} session(s) terminée(s) pour l'utilisateur à supprimer`);
    } catch (sessionError) {
      console.error('❌ [USER_CTRL] Erreur lors de la terminaison des sessions:', sessionError);
      
      return res.status(400).json({
        success: false,
        message: 'Erreur lors de la terminaison des sessions utilisateur',
        errorCode: 'SESSION_TERMINATION_ERROR',
        details: sessionError.message
      });
    }

    // Journaliser la suppression AVANT la suppression effective
      await AuditService.logActivity({
      userId: currentUser.id,
      action: 'USER_DELETED',
      description: `Suppression de l'utilisateur: ${userToDelete.username} (${userToDelete.role?.name})`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'USER',
      resourceId: userToDelete.id,
        status: 'SUCCESS'
    }).catch(err => console.error('❌ [USER_CTRL] Erreur journalisation suppression:', err));

    // Supprimer l'utilisateur
    await userToDelete.destroy();

    console.log(`✅ [USER_CTRL] Utilisateur ${userToDelete.username} supprimé avec succès`);

      return res.status(200).json({
        success: true,
      message: `Utilisateur "${userToDelete.username}" supprimé avec succès`,
      data: {
        deletedUser: {
          id: userToDelete.id,
          username: userToDelete.username,
          role: userToDelete.role?.name
        }
      }
      });

    } catch (error) {
    console.error('❌ [USER_CTRL] Erreur lors de la suppression:', error);
    
    // Gestion spécifique des erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation lors de la suppression',
        errorCode: 'VALIDATION_ERROR',
        details: error.errors.map(err => ({
          field: err.path,
          value: err.value,
          message: err.message
        }))
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression de l\'utilisateur',
      errorCode: 'USER_DELETION_ERROR'
    });
  }
}

// ...existing code...

  /**
   * Activer un utilisateur
   */
  async activateUser(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id, {
        include: [{
          model: Role,
          as: 'role'
        }]
      });

      if (!user) {
        throw createError(ErrorTypes.USER.NOT_FOUND, 'Utilisateur non trouvé');
      }

      // Vérifier les droits hiérarchiques
         const currentUserRole = req.user.role?.name;
      if (!this.canManageRole(currentUserRole, user.role.name)) {
        throw createError(
          ErrorTypes.AUTHORIZATION.FORBIDDEN,
          `Votre rôle "${currentUserRole}" ne vous permet pas d'activer un utilisateur avec le rôle "${user.role.name}"`
        );
      }

      user.isActive = true;
      await user.save();

      // Journaliser l'activation
      await AuditService.logActivity({
        userId: req.user.id,
        action: 'ACTIVATE_USER',
        description: `Activation de l'utilisateur "${user.username}" par ${req.user.username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'USER',
        resourceId: user.id,
        status: 'SUCCESS'
      });

      return res.status(200).json({
        success: true,
        message: 'Utilisateur activé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de l\'activation:', error);
      next(error);
    }
  }

  /**
   * Désactiver un utilisateur
   */
  async deactivateUser(req, res, next) {
    try {
      const { id } = req.params;
      
      // Empêcher l'auto-désactivation
      if (parseInt(id) === req.user.id) {
        throw createError(ErrorTypes.VALIDATION.INVALID_FORMAT, 'Vous ne pouvez pas vous désactiver vous-même');
      }

      const user = await User.findByPk(id, {
        include: [{
          model: Role,
          as: 'role'
        }]
      });

      if (!user) {
        throw createError(ErrorTypes.USER.NOT_FOUND, 'Utilisateur non trouvé');
      }

      // Vérifier les droits hiérarchiques
     const currentUserRole = req.user.role?.name;
      if (!this.canManageRole(currentUserRole, user.role.name)) {
        throw createError(
          ErrorTypes.AUTHORIZATION.FORBIDDEN,
          `Votre rôle "${currentUserRole}" ne vous permet pas de désactiver un utilisateur avec le rôle "${user.role.name}"`
        );
      }

      user.isActive = false;
      await user.save();

      // Terminer toutes les sessions actives de cet utilisateur
      await AuditService.endAllUserSessions(
        user.id, 
        req.ip || req.connection.remoteAddress, 
        'ADMIN_TERMINATED'
      );

      // Journaliser la désactivation
      await AuditService.logActivity({
        userId: req.user.id,
        action: 'DEACTIVATE_USER',
        description: `Désactivation de l'utilisateur "${user.username}" par ${req.user.username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'USER',
        resourceId: user.id,
        status: 'SUCCESS'
      });

      return res.status(200).json({
        success: true,
        message: 'Utilisateur désactivé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la désactivation:', error);
      next(error);
    }
  }

  /**
   * Changer le rôle d'un utilisateur
   */
  async changeUserRole(req, res, next) {
    try {
      const { userId, roleId } = req.body;

      if (!userId || !roleId) {
        throw createError(ErrorTypes.VALIDATION.MISSING_FIELDS, 'userId et roleId sont requis');
      }

      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'role'
        }]
      });

      if (!user) {
        throw createError(ErrorTypes.USER.NOT_FOUND, 'Utilisateur non trouvé');
      }

      const targetRole = await Role.findByPk(roleId);
      if (!targetRole) {
        throw createError(ErrorTypes.ROLE.NOT_FOUND, 'Rôle cible non trouvé');
      }

      // Empêcher le changement de son propre rôle
      if (user.id === req.user.id) {
        throw createError(ErrorTypes.VALIDATION.INVALID_FORMAT, 'Vous ne pouvez pas changer votre propre rôle');
      }

      // Vérifier les droits hiérarchiques pour l'ancien et le nouveau rôle
      const currentUserRole = req.user.role?.name;
      if (!this.canManageRole(currentUserRole, user.role.name) || 
          !this.canManageRole(currentUserRole, targetRole.name)) {
        throw createError(
          ErrorTypes.AUTHORIZATION.FORBIDDEN,
          `Votre rôle "${currentUserRole}" ne vous permet pas cette opération de changement de rôle`
        );
      }

      const oldRoleId = user.roleId;
      const oldRoleName = user.role.name;
      
      user.roleId = roleId;
      await user.save();

      // Journaliser le changement de rôle
      await AuditService.logActivity({
        userId: req.user.id,
        action: 'CHANGE_USER_ROLE',
        description: `Changement de rôle pour "${user.username}" de "${oldRoleName}" vers "${targetRole.name}" par ${req.user.username}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'USER',
        resourceId: user.id,
        oldValues: { roleId: oldRoleId, roleName: oldRoleName },
        newValues: { roleId: roleId, roleName: targetRole.name },
        status: 'SUCCESS'
      });

      return res.status(200).json({
        success: true,
        message: 'Rôle changé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
      next(error);
    }
  }
}

// Exporter une instance de la classe
module.exports = new UserController();