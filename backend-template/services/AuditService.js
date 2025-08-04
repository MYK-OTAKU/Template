const { ActivityLog, UserSession } = require('../models');
const sequelize = require('sequelize');
const { Op } = require('sequelize');

class AuditService {
  /**
   * Journaliser une activité utilisateur
   */
  static async logActivity(data) {
    try {
      const activityData = {
        ...data,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null
      };

      return await ActivityLog.create(activityData);
    } catch (error) {
      console.error('Erreur lors de la journalisation:', error);
      throw error;
    }
  }

  /**
   * Vérifier si l'adresse IP a changé et mettre à jour la session
   */
  static async checkIpChange(session, currentIp) {
    try {
      if (!session || typeof session !== 'object') {
        console.error('Session invalide:', session);
        return false;
      }

      if (session.ipAddress !== currentIp) {
        // Stocker l'ancienne IP
        session.previousIp = session.ipAddress;
        session.ipAddress = currentIp;
        session.ipChanged = true;
        session.ipChangeDate = new Date();
        
        await session.save();
        
        // Journaliser le changement d'IP
        await this.logActivity({
          userId: session.userId,
          action: 'IP_CHANGE',
          description: `Changement d'adresse IP détecté: ${session.previousIp} -> ${currentIp}`,
          ipAddress: currentIp,
          resourceType: 'USER_SESSION',
          resourceId: session.id,
          status: 'WARNING'
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification du changement d\'IP:', error);
      return false;
    }
  }

  /**
   * Mettre à jour l'activité de session d'un utilisateur
   */
  static async updateSessionActivity(userId, ipAddress, userAgent) {
    try {
      // Trouver la session active la plus récente pour cet utilisateur
      let session = await UserSession.findOne({
        where: {
          userId: userId,
          isActive: true
        },
        order: [['createdAt', 'DESC']]
      });

      if (!session) {
        // Créer une nouvelle session si aucune session active n'existe
        session = await UserSession.create({
          userId,
          ipAddress,
          userAgent,
          isActive: true,
          lastActivity: new Date(),
          loginDate: new Date()
        });
      } else {
        // Vérifier le changement d'IP
        await this.checkIpChange(session, ipAddress);
        
        // Mettre à jour la dernière activité
        session.lastActivity = new Date();
        session.userAgent = userAgent; // Mettre à jour le user agent si nécessaire
        
        await session.save();
      }

      return session;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'activité de session:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle session utilisateur
   */
  static async createUserSession(data) {
    try {
      const sessionData = {
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        isActive: true,
        lastActivity: new Date(),
        loginDate: new Date(),
        refreshTokenId: data.refreshTokenId || null
      };

      const session = await UserSession.create(sessionData);

      // Journaliser la création de session
      await this.logActivity({
        userId: data.userId,
        action: 'SESSION_START',
        description: 'Nouvelle session utilisateur créée',
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        resourceType: 'USER_SESSION',
        resourceId: session.id,
        status: 'SUCCESS'
      });

      return session;
    } catch (error) {
      console.error('Erreur lors de la création de session:', error);
      throw error;
    }
  }

  /**
   * Terminer une session utilisateur
   */
  static async endUserSession(userId, ipAddress, reason = 'EXPLICIT') {
    try {
      const sessionsTerminated = await UserSession.update(
        {
          isActive: false,
          logoutDate: new Date(),
          logoutReason: reason
        },
        {
          where: {
            userId: userId,
            isActive: true
          }
        }
      );

      // Journaliser la fin de session
      await this.logActivity({
        userId: userId,
        action: 'SESSION_END',
        description: `Session terminée: ${reason}`,
        ipAddress,
        resourceType: 'USER_SESSION',
        status: 'SUCCESS'
      });

      return sessionsTerminated[0] || 0;
    } catch (error) {
      console.error('Erreur lors de la terminaison de session:', error);
      throw error;
    }
  }

  /**
   * Terminer toutes les sessions actives d'un utilisateur - CORRIGÉ
   */
  static async endAllUserSessions(userId, ipAddress, reason = 'EXPLICIT') {
    try {
      console.log(`🔚 [AUDIT] Terminaison des sessions pour userId: ${userId}, raison: ${reason}`);
      
      // CRITIQUE : Vérifier que la raison est valide selon le modèle UserSession mis à jour
      const validReasons = [
        'EXPLICIT', 
        'TIMEOUT', 
        'NEW_LOGIN', 
        'NEW_LOGIN_2FA', 
        'ADMIN_LOGOUT',
        'USER_DELETED',      // AJOUTÉ - Critique pour la suppression d'utilisateur
        'ACCOUNT_DISABLED',  
        'SECURITY_BREACH',   
        'MAINTENANCE',
        'TWO_FACTOR_DISABLED'
      ];
      
      if (!validReasons.includes(reason)) {
        console.warn(`⚠️  [AUDIT] Raison invalide: ${reason}, utilisation de EXPLICIT par défaut`);
        reason = 'EXPLICIT';
      }

      // Rechercher les sessions actives
      const activeSessions = await UserSession.findAll({
        where: {
          userId: userId,
          isActive: true
        }
      });

      console.log(`🔍 [AUDIT] ${activeSessions.length} session(s) active(s) trouvée(s) pour userId: ${userId}`);

      let terminatedCount = 0;

      // Terminer chaque session individuellement
      for (const session of activeSessions) {
        try {
          await session.update({
            isActive: false,
            logoutTime: new Date(),
            logoutReason: reason
          });
          terminatedCount++;
          console.log(`✅ [AUDIT] Session ${session.id} terminée avec raison: ${reason}`);
        } catch (updateError) {
          console.error(`❌ [AUDIT] Erreur lors de la mise à jour de la session ${session.id}:`, updateError.message);
          
          // Si c'est une erreur de validation, loguer les détails
          if (updateError.name === 'SequelizeValidationError') {
            console.error('❌ [AUDIT] Détails validation:', updateError.errors.map(err => ({
              field: err.path,
              value: err.value,
              message: err.message
            })));
          }
        }
      }

      console.log(`✅ [AUDIT] ${terminatedCount}/${activeSessions.length} session(s) terminée(s) pour userId: ${userId}`);
      return terminatedCount;
    } catch (error) {
      console.error('❌ [AUDIT] Erreur lors de la terminaison de toutes les sessions:', error);
      throw error;
    }
  }

  /**
   * Nettoie automatiquement les sessions inactives
   */
  static async cleanupInactiveSessions(inactiveThresholdMinutes = 240) {
    try {
      console.log(`🧹 [AUDIT] Nettoyage des sessions inactives (seuil: ${inactiveThresholdMinutes} minutes)`);
      
      const thresholdDate = new Date(Date.now() - inactiveThresholdMinutes * 60 * 1000);
      
      // ✅ SOLUTION SIMPLE: Marquer les sessions comme inactives au lieu de les supprimer
      const { UserSession } = require('../models');
      const { Op } = require('sequelize');
      
      const [updatedCount] = await UserSession.update(
        {
          isActive: false,
          logoutDate: new Date(),
          logoutReason: 'TIMEOUT'
        },
        {
          where: {
            isActive: true,
            lastActivity: {
              [Op.lt]: thresholdDate
            }
          }
        }
      );
      
      console.log(`✅ [AUDIT] ${updatedCount} session(s) inactive(s) marquée(s) comme fermée(s)`);
      return updatedCount;
      
    } catch (error) {
      console.error('❌ [AUDIT] Erreur lors du nettoyage des sessions inactives:', error);
      throw error;
    }
  }
}

module.exports = AuditService;