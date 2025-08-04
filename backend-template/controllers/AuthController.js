const AuthService = require('../services/AuthService');
const { User, Role } = require('../models');
const { createError, ErrorTypes } = require('../utils/errorHandler');

class AuthController {
  constructor() {
    // Liez explicitement 'this' à toutes les méthodes qui l'utilisent
    // afin que le contexte de 'this' soit toujours l'instance de AuthController
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.verifyTwoFactor = this.verifyTwoFactor.bind(this);
    this.logout = this.logout.bind(this);
    this.enableTwoFactor = this.enableTwoFactor.bind(this);
    this.disableTwoFactor = this.disableTwoFactor.bind(this);
    this.canManageRole = this.canManageRole.bind(this); // canManageRole utilise getRoleHierarchy() via 'this'
    this.formatExpiryTime = this.formatExpiryTime.bind(this); // formatExpiryTime est directement concerné
  }

  // Fonction utilitaire pour vérifier la hiérarchie des rôles
  getRoleHierarchy() {
    return {
      'Administrateur': 3,
      'Manager': 2,
      'Employé': 1
    };
  }

  canManageRole(currentUserRole, targetRole) {
    const hierarchy = this.getRoleHierarchy();
    const currentLevel = hierarchy[currentUserRole] || 0;
    const targetLevel = hierarchy[targetRole] || 0;
    
    if (targetRole === 'Administrateur') {
      return currentUserRole === 'Administrateur';
    }
    
    return currentLevel > targetLevel;
  }

  /**
   * Méthode pour formater le temps d'expiration de manière lisible
   */
  formatExpiryTime(expiryDate) {
    const now = new Date();
    const diff = expiryDate - now;
    
    if (diff <= 0) return 'Expiré';
    
    // Convertir en heures et minutes
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes} minutes`;
    }
  }

  /**
   * Création d'utilisateur avec vérification hiérarchique des rôles
   */
  async register(req, res) {
    try {
      const userData = req.body;
      
      if (!userData.username || !userData.password || !userData.firstName || !userData.lastName || !userData.roleId) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs requis doivent être remplis',
          errorCode: 'MISSING_FIELDS'
        });
      }

      // Si l'utilisateur est authentifié, vérifier les droits pour le rôle attribué
      if (req.user && req.user.id) {
        const targetRole = await Role.findByPk(userData.roleId);
        if (!targetRole) {
          return res.status(400).json({
            success: false,
            message: 'Rôle spécifié non trouvé',
            errorCode: 'ROLE_NOT_FOUND'
          });
        }

        const currentUserRole = req.user.role?.name;
        if (!this.canManageRole(currentUserRole, targetRole.name)) {
          return res.status(403).json({
            success: false,
            message: `Vous n'avez pas les droits pour créer un utilisateur avec le rôle "${targetRole.name}"`,
            errorCode: 'INSUFFICIENT_ROLE_PERMISSIONS'
          });
        }
      }
      
      const user = await AuthService.register(userData);
      
      return res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: user
      });
    } catch (error) {
      console.error('Erreur lors de la création d\'utilisateur:', error);
      
      const statusCode = error.statusCode || 400;
      const errorMessage = error.message || 'Erreur lors de la création de l\'utilisateur';
      const errorCode = error.errorCode || 'USER_CREATION_ERROR';
      
      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        errorCode: errorCode
      });
    }
  }

  /**
   * Connexion utilisateur avec nouvelle logique de token unique
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nom d\'utilisateur et mot de passe requis',
          errorCode: 'MISSING_CREDENTIALS'
        });
      }
      
      // Récupérer l'adresse IP du client et user-agent
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      const result = await AuthService.login(username, password, ipAddress, userAgent);
      
      // Si l'authentification à deux facteurs est requise
      if (result.requireTwoFactor) {
        return res.status(200).json({
          ...result,
          message: 'Code d\'authentification à deux facteurs requis'
        });
      }
      
      // Ajouter des informations sur l'expiration dans la réponse
      const expiryDate = new Date(Date.now() + (result.expiresIn * 1000));
      
      return res.status(200).json({
        ...result,
        expiryDate: expiryDate.toISOString(),
        expiryReadable: this.formatExpiryTime(expiryDate) // C'est ici que le 'this' posait problème
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      
      const statusCode = error.statusCode || 401;
      const errorMessage = error.message || 'Erreur lors de la connexion';
      const errorCode = error.errorCode || 'AUTHENTICATION_ERROR';
      
      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        errorCode: errorCode
      });
    }
  }

  /**
   * Vérification de l'authentification à deux facteurs
   */
  async verifyTwoFactor(req, res) {
    try {
      const { token, twoFactorCode } = req.body;
      
      if (!token || !twoFactorCode) {
        return res.status(400).json({
          success: false,
          message: 'Token et code 2FA requis',
          errorCode: 'MISSING_FIELDS'
        });
      }

      // Récupérer l'adresse IP et user-agent du client
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      const result = await AuthService.verifyTwoFactor(token, twoFactorCode, ipAddress, userAgent);
      
      // Ajouter des informations sur l'expiration dans la réponse
      if (result.success && result.token) {
        const expiryDate = new Date(Date.now() + (result.expiresIn * 1000));
        result.expiryDate = expiryDate.toISOString();
        result.expiryReadable = this.formatExpiryTime(expiryDate);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Erreur lors de la vérification 2FA:', error);
      
      const statusCode = error.statusCode || 401;
      const errorMessage = error.message || 'Erreur lors de la vérification 2FA';
      const errorCode = error.errorCode || 'TWO_FACTOR_ERROR';
      
      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        errorCode: errorCode
      });
    }
  }

  /**
   * Déconnexion simplifiée
   */
  async logout(req, res) {
    try {
      const userId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      await AuthService.logout(userId, ipAddress, userAgent);
      
      return res.status(200).json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la déconnexion',
        errorCode: 'LOGOUT_ERROR'
      });
    }
  }

  /**
   * Activation de l'authentification à deux facteurs - AMÉLIORÉE
   */
  async enableTwoFactor(req, res) {
    try {
      const userId = req.user.id;
      const { forceNewSecret = false } = req.body;
      
      console.log('🔧 [AUTH_CTRL] Activation 2FA pour userId:', userId, 'Force nouveau:', forceNewSecret);
      
      const result = await AuthService.enableTwoFactor(userId, forceNewSecret);
      
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          qrCode: result.qrCode,
          manualEntryKey: result.manualEntryKey,
          isReactivation: result.isReactivation || false,
          isAlreadyEnabled: result.isAlreadyEnabled || false,
          isNewSetup: result.isNewSetup || false
        }
      });
    } catch (error) {
      console.error('❌ [AUTH_CTRL] Erreur activation 2FA:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'activation de l\'authentification à deux facteurs',
        errorCode: 'TWO_FACTOR_ENABLE_ERROR'
      });
    }
  }

  /**
   * Désactivation de l'authentification à deux facteurs - AMÉLIORÉE
   */
  async disableTwoFactor(req, res) {
    try {
      const userId = req.user.id;
      const { keepSecret = false } = req.body; // Option avancée pour admin
      
      console.log('🔓 [AUTH_CTRL] Désactivation 2FA pour userId:', userId);
      
      const result = await AuthService.disableTwoFactor(userId, keepSecret);
      
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          wasAlreadyDisabled: result.wasAlreadyDisabled || false,
          secretRemoved: result.secretRemoved,
          sessionsTerminated: result.sessionsTerminated
        }
      });
    } catch (error) {
      console.error('❌ [AUTH_CTRL] Erreur désactivation 2FA:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la désactivation de l\'authentification à deux facteurs',
        errorCode: 'TWO_FACTOR_DISABLE_ERROR'
      });
    }
  }

  /**
   * Régénération du secret 2FA (nouvelle fonctionnalité)
   */
  async regenerateTwoFactorSecret(req, res) {
    try {
      const userId = req.user.id;
      
      console.log('🔄 [AUTH_CTRL] Régénération secret 2FA pour userId:', userId);
      
      const result = await AuthService.regenerateTwoFactorSecret(userId);
      
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          qrCode: result.qrCode,
          manualEntryKey: result.manualEntryKey,
          isRegeneration: true
        }
      });
    } catch (error) {
      console.error('❌ [AUTH_CTRL] Erreur régénération secret 2FA:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la régénération du secret 2FA',
        errorCode: 'TWO_FACTOR_REGENERATE_ERROR'
      });
    }
  }

  /**
   * Vérification du statut 2FA d'un utilisateur
   */
  async getTwoFactorStatus(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'twoFactorEnabled', 'twoFactorSecret']
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
          errorCode: 'USER_NOT_FOUND'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          userId: user.id,
          username: user.username,
          twoFactorEnabled: user.twoFactorEnabled,
          hasSecret: !!user.twoFactorSecret,
          status: user.twoFactorEnabled ? 
            (user.twoFactorSecret ? 'ACTIVE' : 'ENABLED_NO_SECRET') : 
            'DISABLED'
        }
      });
    } catch (error) {
      console.error('❌ [AUTH_CTRL] Erreur statut 2FA:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du statut 2FA',
        errorCode: 'TWO_FACTOR_STATUS_ERROR'
      });
    }
  }
}

module.exports = new AuthController();