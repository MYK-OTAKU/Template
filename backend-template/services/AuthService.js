const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // AJOUTÉ : Import manquant
const speakeasy = require('speakeasy'); // AJOUTÉ : Import manquant
const QRCode = require('qrcode'); // AJOUTÉ : Import manquant
const { generateToken } = require('../config/jwt');
const { User, Role, Permission } = require('../models');
const { createError, ErrorTypes } = require('../utils/errorHandler');
const AuditService = require('./AuditService');

/**
 * Service d'Authentification Dashboard Template System
 * Principe Single Responsibility : Gestion exclusive de l'authentification
 * Conforme au cahier des charges avec hiérarchie de rôles et audit complet
 */
class AuthService {
  /**
   * Méthode register pour créer un utilisateur - STATIQUE
   */
  static async register(userData) {
    try {
      console.log('📝 [AUTH] Début d\'enregistrement utilisateur:', userData.username);

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.username === userData.username) {
          throw createError(ErrorTypes.USER.ALREADY_EXISTS, 'Ce nom d\'utilisateur existe déjà');
        }
        if (existingUser.email === userData.email) {
          throw createError(ErrorTypes.USER.ALREADY_EXISTS, 'Cet email existe déjà');
        }
      }

      // Créer l'utilisateur - Le hook du modèle se charge du hachage automatiquement
      const newUser = await User.create({
        ...userData
      });

      console.log('✅ [AUTH] Utilisateur créé via AuthService:', newUser.username);
      return newUser;
    } catch (error) {
      console.error('❌ [AUTH] Erreur dans AuthService.register:', error);
      throw error;
    }
  }

  /**
   * Connexion utilisateur avec gestion intelligente des états 2FA - STATIQUE AMÉLIORÉE
   */
  static async login(username, password, ipAddress, userAgent, options = {}) {
    try {
      console.log('🔐 [AUTH] Tentative de connexion pour:', username, 'Options:', options);

      // Validation des paramètres selon le cahier des charges
      if (!username || !password) {
        throw createError(ErrorTypes.VALIDATION.MISSING_FIELDS, 'Nom d\'utilisateur et mot de passe requis');
      }

      // Rechercher l'utilisateur avec son rôle et permissions selon l'architecture Dashboard Template
      const user = await User.findOne({
        where: { username: username.trim() },
        include: [{
          model: Role,
          as: 'role',
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }]
      });

      // Utilisateur non trouvé - Sécurité par obscurité
      if (!user) {
        console.log('❌ [AUTH] Utilisateur non trouvé:', username);
        
        await AuditService.logActivity({
          userId: null,
          action: 'LOGIN_FAILED',
          description: `Tentative de connexion échouée: utilisateur "${username}" non trouvé`,
          ipAddress,
          userAgent,
          resourceType: 'AUTH',
          status: 'FAILURE'
        }).catch(err => console.error('❌ [AUTH] Erreur journalisation:', err));
        
        throw createError(ErrorTypes.AUTHENTICATION.INVALID_CREDENTIALS, 'Nom d\'utilisateur ou mot de passe incorrect');
      }

      // Vérification du statut du compte selon les règles Dashboard Template
      if (!user.isActive) {
        console.log('❌ [AUTH] Compte désactivé:', username);
        
        await AuditService.logActivity({
          userId: user.id,
          action: 'LOGIN_FAILED',
          description: `Tentative de connexion sur compte désactivé: ${username}`,
          ipAddress,
          userAgent,
          resourceType: 'AUTH',
          status: 'FAILURE'
        }).catch(err => console.error('❌ [AUTH] Erreur journalisation:', err));
        
        throw createError(ErrorTypes.AUTHENTICATION.ACCOUNT_DISABLED, 'Votre compte a été désactivé');
      }

      // Vérification du mot de passe avec bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log('❌ [AUTH] Mot de passe incorrect pour:', username);
        
        await AuditService.logActivity({
          userId: user.id,
          action: 'LOGIN_FAILED',
          description: `Tentative de connexion avec mot de passe incorrect: ${username}`,
          ipAddress,
          userAgent,
          resourceType: 'AUTH',
          status: 'FAILURE'
        }).catch(err => console.error('❌ [AUTH] Erreur journalisation:', err));
        
        throw createError(ErrorTypes.AUTHENTICATION.INVALID_CREDENTIALS, 'Nom d\'utilisateur ou mot de passe incorrect');
      }

      // GESTION 2FA AMÉLIORÉE - États possibles selon le cahier des charges
      if (user.twoFactorEnabled) {
        console.log('🔐 [AUTH] 2FA activé pour:', username);
        
        // Générer token temporaire pour 2FA
        const tempToken = jwt.sign(
          { 
            userId: user.id, 
            purpose: '2FA',
            username: user.username,
            timestamp: Date.now()
          },
          process.env.JWT_SECRET || 'dashboard-template-secret-2024',
          { expiresIn: '5m' }
        );

        // CRITIQUE : Vérifier l'état du secret 2FA + Nouvelle option de régénération
        let qrCodeData = null;
        let requiresNewSetup = false;

        // CAS 1: 2FA activé mais pas de secret (situation anormale - réparation)
        if (!user.twoFactorSecret) {
          console.log('⚠️ [AUTH] 2FA activé mais pas de secret - Régénération nécessaire');
          requiresNewSetup = true;
        }
        
        // CAS 2: NOUVEAU - L'utilisateur demande explicitement la régénération (perte d'accès)
        if (options.forceQRCodeRegeneration && user.twoFactorSecret) {
          console.log('🔄 [AUTH] Régénération QR Code demandée par l\'utilisateur');
          requiresNewSetup = true;
        }
        
        // ✅ CAS 3: CORRECTION - Après réactivation, toujours générer un nouveau secret
        // Détecter si c'est une réactivation récente (dernière modification < 5 minutes)
        const lastModified = user.updatedAt;
        const fiveMinutesAgo = new Date(Date.now() - 1 * 60 * 1000);
        
        if (user.twoFactorSecret && lastModified > fiveMinutesAgo) {
          console.log('🆕 [AUTH] Réactivation récente détectée - Nouveau setup requis');
          requiresNewSetup = true;
        }
        
        // CAS 4: Utilisateur demande explicitement un nouveau QR Code (via flag)
        // ou premier setup après réactivation
        if (requiresNewSetup) {
          console.log('🆕 [AUTH] Génération nouveau secret 2FA');
          
          try {
            const secret = speakeasy.generateSecret({
              name: `${process.env.APP_NAME || 'Dashboard Template'} (${user.username})`,
              length: 32
            });

            // Sauvegarder le nouveau secret
            user.twoFactorSecret = secret.base32;
            await user.save();

            // Générer le QR code
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
            
            qrCodeData = {
              secret: secret.base32,
              qrCode: qrCodeUrl,
              manualEntryKey: secret.base32,
              isNewSetup: true,
              reason: options.forceQRCodeRegeneration ? 'USER_REQUESTED_REGENERATION' : 
                     (requiresNewSetup ? 'SECRET_REGENERATION' : 'REACTIVATION_SETUP')
            };

            console.log('✅ [AUTH] Nouveau QR Code généré pour 2FA');
          } catch (qrError) {
            console.error('❌ [AUTH] Erreur génération QR Code:', qrError);
          }
        }

        // Journaliser la demande 2FA
        await AuditService.logActivity({
          userId: user.id,
          action: qrCodeData ? 'LOGIN_2FA_SETUP_REQUIRED' : 'LOGIN_2FA_REQUESTED',
          description: qrCodeData ? 
            `Nouveau setup 2FA requis pour: ${username} (${qrCodeData.reason})` : 
            `Code 2FA demandé pour: ${username}`,
          ipAddress,
          userAgent,
          resourceType: 'AUTH',
          status: 'PENDING'
        }).catch(err => console.error('❌ [AUTH] Erreur journalisation 2FA:', err));

        // NOUVEAU : Inclure un flag pour permettre la régénération depuis le frontend
        const result = {
          success: true,
          requireTwoFactor: true,
          tempToken,
          userId: user.id,
          message: qrCodeData ? 
            'Configuration 2FA requise - Nouveau QR Code généré' : 
            'Code d\'authentification à deux facteurs requis',
          canRegenerateQRCode: !qrCodeData && user.twoFactorSecret // NOUVEAU FLAG
        };

        // Données QR Code si génération nécessaire
        if (qrCodeData) {
          result.qrCodeUrl = qrCodeData.qrCode;
          result.manualEntryKey = qrCodeData.manualEntryKey;
          result.isNewSetup = qrCodeData.isNewSetup;
          result.setupReason = qrCodeData.reason;
        }

        return result;
      }

      // Connexion standard sans 2FA
      return await this.completeLogin(user, ipAddress, userAgent);

    } catch (error) {
      // Si c'est déjà une erreur personnalisée, la relancer
      if (error.type === 'CustomError') {
        throw error;
      }

      // Gestion des erreurs de base de données selon le cahier des charges
      if (error.name === 'SequelizeConnectionError' || error.name === 'ConnectionError') {
        console.error('❌ [AUTH] Erreur de connexion à la base de données:', error.message);
        throw createError(ErrorTypes.SYSTEM.CONNECTION_TIMEOUT, 'Service temporairement indisponible');
      }

      // Erreur générique avec logging
      console.error('❌ [AUTH] Erreur lors de la connexion:', error);
      throw createError(ErrorTypes.SYSTEM.INTERNAL_ERROR, 'Erreur lors de la connexion');
    }
  }

  /**
   * Finalisation de la connexion - Méthode helper STATIQUE
   */
  static async completeLogin(user, ipAddress, userAgent) {
    try {
      // Terminer les autres sessions actives selon la stratégie Dashboard Template
      await AuditService.endAllUserSessions(user.id, ipAddress, 'NEW_LOGIN')
        .catch(err => console.error('❌ [AUTH] Erreur terminaison sessions:', err));

      // Créer une nouvelle session utilisateur
      const session = await AuditService.createUserSession({
        userId: user.id,
        ipAddress,
        userAgent
      }).catch(err => {
        console.error('❌ [AUTH] Erreur création session:', err);
        return null;
      });

      // Générer le token JWT avec la configuration centralisée Dashboard Template
      const token = generateToken({
        userId: user.id,
        username: user.username,
        roleId: user.roleId,
        sessionId: session?.id || null
      });

      console.log('✅ [AUTH] Token généré pour:', user.username);

      // Journaliser la connexion réussie selon le cahier des charges
      await AuditService.logActivity({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        description: `Connexion réussie: ${user.username}`,
        ipAddress,
        userAgent,
        resourceType: 'AUTH',
        resourceId: session?.id || null,
        status: 'SUCCESS'
      }).catch(err => console.error('❌ [AUTH] Erreur journalisation:', err));

      // Mettre à jour la date de dernière connexion
      user.lastLoginDate = new Date();
      await user.save().catch(err => console.error('❌ [AUTH] Erreur mise à jour date:', err));

      console.log('✅ [AUTH] Connexion réussie pour:', user.username);

      return {
        success: true,
        token,
        expiresIn: 6 * 60, // 8 heures en secondes selon le cahier des charges
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: {
            id: user.role.id,
            name: user.role.name,
            description: user.role.description,
            permissions: user.role.permissions?.map(p => p.name) || []
          },
          isActive: user.isActive,
          twoFactorEnabled: user.twoFactorEnabled
        }
      };
    } catch (error) {
      console.error('❌ [AUTH] Erreur completeLogin:', error);
      throw error;
    }
  }

  /**
   * Vérification de l'authentification à deux facteurs - STATIQUE CORRIGÉE
   */
  static async verifyTwoFactor(tempToken, twoFactorCode, ipAddress, userAgent) {
    try {
      console.log('🔐 [AUTH] Vérification 2FA en cours...');

      // Vérifier le token temporaire avec la BONNE variable d'environnement
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'dashboard-template-secret-2024');
      
      if (decoded.purpose !== '2FA') {
        throw createError(ErrorTypes.AUTHENTICATION.INVALID_CREDENTIALS, 'Token temporaire invalide');
      }

      // Récupérer l'utilisateur avec ses relations selon l'architecture Dashboard Template
      const user = await User.findByPk(decoded.userId, {
        include: [{
          model: Role,
          as: 'role',
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }]
      });

      if (!user || !user.twoFactorSecret) {
        throw createError(ErrorTypes.AUTHENTICATION.INVALID_CREDENTIALS, 'Utilisateur ou secret 2FA non trouvé');
      }

      // Vérifier le code 2FA avec speakeasy
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2 // Permet 2 codes précédents/suivants (tolérance de 1 minute)
      });

      if (!verified) {
        console.log('❌ [AUTH] Code 2FA invalide pour:', user.username);
        
        // Journaliser l'échec 2FA
        await AuditService.logActivity({
          userId: user.id,
          action: 'LOGIN_2FA_FAILED',
          description: `Code 2FA invalide pour: ${user.username}`,
          ipAddress,
          userAgent,
          resourceType: 'AUTH',
          status: 'FAILURE'
        }).catch(err => console.error('❌ [AUTH] Erreur journalisation 2FA:', err));
        
        throw createError(ErrorTypes.AUTHENTICATION.INVALID_CREDENTIALS, 'Code d\'authentification à deux facteurs invalide');
      }

      console.log('✅ [AUTH] Code 2FA valide pour:', user.username);

      // Terminer toutes les sessions actives existantes avec raison spécifique 2FA
      await AuditService.endAllUserSessions(user.id, ipAddress, 'NEW_LOGIN_2FA')
        .catch(err => console.error('❌ [AUTH] Erreur terminaison sessions 2FA:', err));

      // Créer une nouvelle session utilisateur pour 2FA
      const session = await AuditService.createUserSession({
        userId: user.id,
        ipAddress,
        userAgent
      }).catch(err => {
        console.error('❌ [AUTH] Erreur création session 2FA:', err);
        return null;
      });

      // Générer le token final avec la configuration Dashboard Template
      const accessToken = generateToken({
        userId: user.id,
        username: user.username,
        roleId: user.roleId,
        sessionId: session?.id || null
      });

      // Journaliser la connexion 2FA réussie selon le cahier des charges
      await AuditService.logActivity({
        userId: user.id,
        action: 'LOGIN_2FA_SUCCESS',
        description: `Connexion 2FA réussie pour: ${user.username}`,
        ipAddress,
        userAgent,
        resourceType: 'AUTH',
        resourceId: session?.id || null,
        status: 'SUCCESS'
      }).catch(err => console.error('❌ [AUTH] Erreur journalisation 2FA:', err));

      // Mettre à jour la date de dernière connexion
      user.lastLoginDate = new Date();
      await user.save().catch(err => console.error('❌ [AUTH] Erreur mise à jour date 2FA:', err));

      console.log('✅ [AUTH] Connexion 2FA réussie pour:', user.username);

      return {
        success: true,
        token: accessToken,
        expiresIn: 6 * 60, // 8 heures selon le cahier des charges
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: {
            id: user.role.id,
            name: user.role.name,
            description: user.role.description,
            permissions: user.role.permissions?.map(p => p.name) || []
          },
          isActive: user.isActive,
          twoFactorEnabled: user.twoFactorEnabled
        },
        sessionId: session?.id || null
      };
    } catch (error) {
      console.error('❌ [AUTH] Erreur vérification 2FA:', error);
      
      if (error.type === 'CustomError') {
        throw error;
      }
      
      throw createError(ErrorTypes.AUTHENTICATION.INVALID_CREDENTIALS, 'Erreur lors de la vérification 2FA');
    }
  }

  /**
   * Méthode de déconnexion - STATIQUE selon le cahier des charges
   */
  static async logout(userId, ipAddress, userAgent) {
    try {
      console.log('🚪 [AUTH] Déconnexion userId:', userId);

      // Terminer toutes les sessions actives de l'utilisateur
      const sessionsTerminated = await AuditService.endAllUserSessions(userId, ipAddress, 'EXPLICIT')
        .catch(err => {
          console.error('❌ [AUTH] Erreur terminaison sessions logout:', err);
          return 0;
        });

      // Journaliser la déconnexion selon le cahier des charges Dashboard Template
      await AuditService.logActivity({
        userId,
        action: 'LOGOUT',
        description: 'Déconnexion explicite par l\'utilisateur',
        ipAddress,
        userAgent,
        resourceType: 'USER',
        status: 'SUCCESS'
      }).catch(err => console.error('❌ [AUTH] Erreur journalisation logout:', err));

      console.log('✅ [AUTH] Déconnexion réussie pour userId:', userId);

      return {
        success: true,
        message: 'Déconnexion réussie',
        sessionsTerminated
      };
    } catch (error) {
      console.error('❌ [AUTH] Erreur logout:', error);
      throw error;
    }
  }

  /**
   * Activation/Réactivation de l'authentification à deux facteurs - STATIQUE
   */
  static async enableTwoFactor(userId, forceNewSecret = false) {
    try {
      console.log('🔐 [AUTH] Activation 2FA pour userId:', userId, 'Force nouveau secret:', forceNewSecret);
      
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw createError(ErrorTypes.USER.NOT_FOUND, 'Utilisateur non trouvé');
      }

      let isReactivation = false;
      
      // Vérifier si c'est une réactivation
      if (user.twoFactorEnabled && user.twoFactorSecret && !forceNewSecret) {
        console.log('ℹ️ [AUTH] 2FA déjà activé pour:', user.username);
        
        // Régénérer le QR Code avec le secret existant pour affichage
        const secret = {
          base32: user.twoFactorSecret
        };
        
        const otpauthUrl = speakeasy.otpauthURL({
          secret: secret.base32,
          label: `${process.env.APP_NAME || 'Dashboard Template'} (${user.username})`,
          issuer: process.env.APP_NAME || 'Dashboard Template',
          encoding: 'base32'
        });
        
        const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
        
        return {
          secret: user.twoFactorSecret,
          qrCode: qrCodeUrl,
          manualEntryKey: user.twoFactorSecret,
          isAlreadyEnabled: true,
          message: 'Authentification à deux facteurs déjà active'
        };
      }

      // ✅ CORRECTION: Détecter la réactivation différemment
      if (!user.twoFactorEnabled && user.twoFactorSecret) {
        isReactivation = true;
        console.log('🔄 [AUTH] Réactivation 2FA détectée - Nouveau secret OBLIGATOIRE');
        forceNewSecret = true; // ✅ Forcer un nouveau secret lors de réactivation
      }

      // Générer un nouveau secret (toujours lors d'une activation/réactivation ou si forcé)
      const secret = speakeasy.generateSecret({
        name: `${process.env.APP_NAME || 'Dashboard Template'} (${user.username})`,
        issuer: process.env.APP_NAME || 'Dashboard Template',
        length: 32
      });

      // Sauvegarder le nouveau secret
      user.twoFactorSecret = secret.base32;
      user.twoFactorEnabled = true;
      await user.save();

      // Générer le QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Journaliser l'action selon le cahier des charges
      await AuditService.logActivity({
        userId: user.id,
        action: isReactivation ? 'TWO_FACTOR_REACTIVATED' : 'TWO_FACTOR_ENABLED',
        description: isReactivation ? 
          `Réactivation 2FA avec nouveau secret pour: ${user.username}` :
          `Activation 2FA pour: ${user.username}`,
        ipAddress: 'SYSTEM',
        userAgent: 'INTERNAL',
        resourceType: 'USER_SECURITY',
        resourceId: user.id,
        status: 'SUCCESS'
      }).catch(err => console.error('❌ [AUTH] Erreur journalisation activation 2FA:', err));

      console.log('✅ [AUTH] 2FA activé/réactivé pour:', user.username);

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32,
        isReactivation,
        isNewSetup: true,
        message: isReactivation ? 
          'Authentification à deux facteurs réactivée avec nouveau secret' :
          'Authentification à deux facteurs activée'
      };
    } catch (error) {
      console.error('❌ [AUTH] Erreur activation 2FA:', error);
      throw error;
    }
  }

  /**
   * Désactivation complète de l'authentification à deux facteurs - STATIQUE
   */
  static async disableTwoFactor(userId, keepSecret = false) {
    try {
      console.log('🔓 [AUTH] Désactivation 2FA pour userId:', userId, 'Conserver secret:', keepSecret);
      
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw createError(ErrorTypes.USER.NOT_FOUND, 'Utilisateur non trouvé');
      }

      if (!user.twoFactorEnabled) {
        console.log('ℹ️ [AUTH] 2FA déjà désactivé pour:', user.username);
        return {
          success: true,
          message: 'Authentification à deux facteurs déjà désactivée',
          wasAlreadyDisabled: true
        };
      }

      // Désactiver 2FA
      user.twoFactorEnabled = false;
      
      // SÉCURITÉ : Par défaut, supprimer le secret pour éviter les réutilisations
      // Sauf si explicitement demandé de le conserver (cas rare)
      if (!keepSecret) {
        user.twoFactorSecret = null;
        console.log('🗑️ [AUTH] Secret 2FA supprimé pour sécurité');
      }
      
      await user.save();

      // Terminer toutes les sessions actives pour forcer une nouvelle authentification
      await AuditService.endAllUserSessions(user.id, 'SYSTEM', 'TWO_FACTOR_DISABLED')
        .catch(err => console.error('❌ [AUTH] Erreur terminaison sessions:', err));

      // Journaliser la désactivation selon le cahier des charges
      await AuditService.logActivity({
        userId: user.id,
        action: 'TWO_FACTOR_DISABLED',
        description: `Désactivation 2FA pour: ${user.username}${keepSecret ? ' (secret conservé)' : ' (secret supprimé)'}`,
        ipAddress: 'SYSTEM',
        userAgent: 'INTERNAL',
        resourceType: 'USER_SECURITY',
        resourceId: user.id,
        status: 'SUCCESS'
      }).catch(err => console.error('❌ [AUTH] Erreur journalisation désactivation 2FA:', err));

      console.log('✅ [AUTH] 2FA désactivé pour:', user.username);

      return {
        success: true,
        message: 'Authentification à deux facteurs désactivée',
        secretRemoved: !keepSecret,
        sessionsTerminated: true
      };
    } catch (error) {
      console.error('❌ [AUTH] Erreur désactivation 2FA:', error);
      throw error;
    }
  }

  /**
   * Régénération forcée du secret 2FA (admin ou utilisateur) - STATIQUE
   */
  static async regenerateTwoFactorSecret(userId) {
    try {
      console.log('🔄 [AUTH] Régénération secret 2FA pour userId:', userId);
      
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw createError(ErrorTypes.USER.NOT_FOUND, 'Utilisateur non trouvé');
      }

      // Utiliser enableTwoFactor avec force pour régénérer
      const result = await this.enableTwoFactor(userId, true);

      // Journaliser la régénération
      await AuditService.logActivity({
        userId: user.id,
        action: 'TWO_FACTOR_SECRET_REGENERATED',
        description: `Régénération du secret 2FA pour: ${user.username}`,
        ipAddress: 'SYSTEM',
        userAgent: 'INTERNAL',
        resourceType: 'USER_SECURITY',
        resourceId: user.id,
        status: 'SUCCESS'
      }).catch(err => console.error('❌ [AUTH] Erreur journalisation régénération:', err));

      return {
        ...result,
        isRegeneration: true,
        message: 'Secret d\'authentification à deux facteurs régénéré'
      };
    } catch (error) {
      console.error('❌ [AUTH] Erreur régénération secret 2FA:', error);
      throw error;
    }
  }

  /**
   * Méthode utilitaire pour parser les durées - STATIQUE
   */
  static parseDuration(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch(unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }
}

module.exports = AuthService;