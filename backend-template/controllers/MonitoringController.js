const { User, UserSession, ActivityLog, sequelize } = require('../models'); // ✅ CORRECTION : Ajouter sequelize à l'import
const { Op } = require('sequelize');
const AuditService = require('../services/AuditService');

class MonitoringController {
  /**
   * ✅ CORRIGÉ: Récupérer les sessions actives avec durées
   */
  async getActiveSessions(req, res) {
    try {
      const inactivityPeriod = parseInt(req.query.inactivityPeriod) || 30;
      const inactiveDate = new Date(Date.now() - inactivityPeriod * 60 * 1000);

      console.log(`📊 [MONITORING] Récupération sessions actives (seuil: ${inactivityPeriod}min)`);

      const sessions = await UserSession.findAll({
        where: { isActive: true },
        include: [{
          model: User,
          attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'roleId']
        }],
        order: [['lastActivity', 'DESC']]
      });

      const result = { active: [], inactive: [] };

      sessions.forEach(session => {
        const sessionData = session.toJSON();
        const lastActivityDate = new Date(sessionData.lastActivity);
        const isCurrentlyActive = lastActivityDate > inactiveDate;
        
        // Calculer la durée
        if (sessionData.createdAt) {
          const startTime = new Date(sessionData.createdAt);
          const currentTime = new Date();
          const durationMs = currentTime - startTime;
          const durationMinutes = Math.max(0, Math.floor(durationMs / (1000 * 60)));
          
          sessionData.duration = {
            minutes: durationMinutes,
            hours: Math.floor(durationMinutes / 60),
            displayMinutes: durationMinutes % 60,
            formatted: durationMinutes > 60 
              ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
              : `${durationMinutes}m`
          };
        }
        
        sessionData.isCurrentlyActive = isCurrentlyActive;

        if (isCurrentlyActive) {
          result.active.push(sessionData);
        } else {
          result.inactive.push(sessionData);
        }
      });

      console.log(`✅ [MONITORING] ${result.active.length} actives, ${result.inactive.length} inactives`);

      return res.status(200).json({
        success: true,
        data: result,
        counts: {
          active: result.active.length,
          inactive: result.inactive.length,
          total: sessions.length
        }
      });
    } catch (error) {
      console.error('❌ [MONITORING] Erreur sessions:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des sessions actives',
        error: error.message
      });
    }
  }

  /**
   * ✅ CORRIGÉ: Logs d'activité avec stats corrigées
   */
  async getActivityLogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const userId = req.query.userId ? parseInt(req.query.userId) : null;
      const action = req.query.action || null;
      const status = req.query.status || null;
      const resourceType = req.query.resourceType || null;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
      const search = req.query.search || null;

      const whereConditions = {};
      if (userId) whereConditions.userId = userId;
      if (action) whereConditions.action = action;
      if (status) whereConditions.status = status;
      if (resourceType) whereConditions.resourceType = resourceType;
      
      if (search) {
        whereConditions[Op.or] = [
          { description: { [Op.like]: `%${search}%` } },
          { action: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (startDate || endDate) {
        whereConditions.createdAt = {};
        if (startDate) whereConditions.createdAt[Op.gte] = startDate;
        if (endDate) whereConditions.createdAt[Op.lte] = endDate;
      }

      const { count, rows } = await ActivityLog.findAndCountAll({
        where: whereConditions,
        include: [{
          model: User,
          attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
          required: false
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit
      });

      // ✅ CORRECTION: Appel de la méthode avec this
      const stats = await this.getQuickActivityStats(whereConditions);

      return res.status(200).json({
        success: true,
        data: rows,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
        stats,
        filters: { userId, action, status, resourceType, search, startDate, endDate }
      });
    } catch (error) {
      console.error('❌ [MONITORING] Erreur logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des logs d\'activité',
        error: error.message
      });
    }
  }

  /**
   * ✅ CORRIGÉ: Statistiques d'activité complètes
   */
  async getActivityStats(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      console.log(`📊 [MONITORING] Récupération stats activités sur ${days} jours`);

      // ✅ IMPORT SEQUELIZE depuis models
      const { sequelize } = require('../models');

      // Statistiques générales
      const [totalLogs, successLogs, failureLogs, uniqueUsers] = await Promise.all([
        ActivityLog.count({
          where: { createdAt: { [Op.gte]: startDate } }
        }),
        ActivityLog.count({
          where: { 
            createdAt: { [Op.gte]: startDate },
            status: 'SUCCESS'
          }
        }),
        ActivityLog.count({
          where: { 
            createdAt: { [Op.gte]: startDate },
            status: 'FAILURE'
          }
        }),
        ActivityLog.count({
          distinct: true,
          col: 'userId',
          where: { 
            createdAt: { [Op.gte]: startDate },
            userId: { [Op.not]: null }
          }
        })
      ]);

      // ✅ CORRECTION: Top actions avec Sequelize uniquement
      const topActions = await ActivityLog.findAll({
        attributes: [
          'action',
          [sequelize.fn('COUNT', sequelize.col('action')), 'count']
        ],
        where: {
          createdAt: { [Op.gte]: startDate }
        },
        group: ['action'],
        order: [[sequelize.fn('COUNT', sequelize.col('action')), 'DESC']],
        limit: 10,
        raw: true
      });

      // Activité par jour (7 derniers jours)
      const dailyActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayCount = await ActivityLog.count({
          where: {
            createdAt: {
              [Op.gte]: dayStart,
              [Op.lte]: dayEnd
            }
          }
        });

        dailyActivity.push({
          date: dayStart.toISOString().split('T')[0],
          count: dayCount
        });
      }

      const stats = {
        period: { days, startDate: startDate.toISOString() },
        totals: {
          totalLogs,
          successLogs,
          failureLogs,
          uniqueUsers,
          successRate: totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 0
        },
        topActions: topActions.map(action => ({
          action: action.action,
          count: parseInt(action.count)
        })),
        dailyActivity
      };

      console.log(`✅ [MONITORING] Stats générées pour ${days} jours`);

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ [MONITORING] Erreur stats activités:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques d\'activité',
        error: error.message
      });
    }
  }

  /**
   * ✅ CORRIGÉ: Historique connexion utilisateur avec durées
   */
  async getUserConnectionHistory(req, res) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      console.log(`📋 [MONITORING] Historique utilisateur ${userId}`);

      const { count, rows } = await UserSession.findAndCountAll({
        where: { userId },
        include: [{
          model: User,
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit
      });

      // ✅ Calculer les durées
      const sessionsWithDuration = rows.map(session => {
        const sessionData = session.toJSON();
        
        if (sessionData.createdAt) {
          const startTime = new Date(sessionData.createdAt);
          let endTime;
          
          if (sessionData.isActive) {
            endTime = sessionData.lastActivity ? new Date(sessionData.lastActivity) : new Date();
          } else {
            // ✅ PRIORITÉ: logoutDate > lastActivity > updatedAt
            endTime = sessionData.logoutDate ? new Date(sessionData.logoutDate) : 
                     sessionData.lastActivity ? new Date(sessionData.lastActivity) : 
                     new Date(sessionData.updatedAt || sessionData.createdAt);
          }
          
          const durationMs = endTime - startTime;
          const durationMinutes = Math.max(0, Math.floor(durationMs / (1000 * 60)));
          
          sessionData.duration = {
            minutes: durationMinutes,
            hours: Math.floor(durationMinutes / 60),
            displayMinutes: durationMinutes % 60,
            formatted: durationMinutes > 60 
              ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
              : `${durationMinutes}m`
          };
          
          console.log(`⏱️ Session ${sessionData.id}: ${sessionData.duration.formatted}`);
        } else {
          sessionData.duration = { minutes: 0, hours: 0, displayMinutes: 0, formatted: '0m' };
        }
        
        return sessionData;
      });

      return res.status(200).json({
        success: true,
        data: sessionsWithDuration,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) }
      });
    } catch (error) {
      console.error('❌ [MONITORING] Erreur historique:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'historique',
        error: error.message
      });
    }
  }

  /**
   * ✅ NOUVEAU: Récupérer les activités d'un utilisateur spécifique
   */
  async getUserActivities(req, res) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const action = req.query.action || null;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

      const whereConditions = { userId: parseInt(userId) };
      if (action) whereConditions.action = action;
      
      if (startDate || endDate) {
        whereConditions.createdAt = {};
        if (startDate) whereConditions.createdAt[Op.gte] = startDate;
        if (endDate) whereConditions.createdAt[Op.lte] = endDate;
      }

      const { count, rows } = await ActivityLog.findAndCountAll({
        where: whereConditions,
        include: [{
          model: User,
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit
      });

      return res.status(200).json({
        success: true,
        data: rows,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
        filters: { userId, action, startDate, endDate }
      });
    } catch (error) {
      console.error('❌ [MONITORING] Erreur activités utilisateur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des activités utilisateur',
        error: error.message
      });
    }
  }

  /**
   * ✅ AMÉLIORÉ: Terminer session avec invalidation
   */
  async terminateSession(req, res) {
    try {
      const { sessionId } = req.params;
      const adminUserId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const session = await UserSession.findByPk(sessionId, {
        include: [{ model: User, attributes: ['id', 'username', 'firstName', 'lastName'] }]
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session non trouvée',
          errorCode: 'SESSION_NOT_FOUND'
        });
      }

      if (!session.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cette session est déjà terminée',
          errorCode: 'SESSION_ALREADY_TERMINATED'
        });
      }

      // ✅ IMPORTANT: Terminer la session
      await session.update({
        isActive: false,
        logoutDate: new Date(),
        logoutReason: 'ADMIN_TERMINATED'
      });

      // Log de l'action
      await AuditService.logActivity({
        userId: adminUserId,
        action: 'ADMIN_TERMINATE_SESSION',
        description: `Session de ${session.user.username} terminée par l'administrateur`,
        ipAddress,
        userAgent: req.headers['user-agent'],
        resourceType: 'USER_SESSION',
        resourceId: session.id,
        status: 'SUCCESS'
      });

      return res.status(200).json({
        success: true,
        message: `Session de ${session.user.username} terminée avec succès`,
        data: {
          sessionId: session.id,
          username: session.user.username,
          terminatedAt: new Date(),
          terminatedBy: req.user.username
        }
      });
    } catch (error) {
      console.error('❌ Erreur terminaison session:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la terminaison de la session',
        error: error.message
      });
    }
  }

  /**
   * ✅ CORRIGÉ: Statistiques rapides (méthode avec this)
   */
  async getQuickActivityStats(whereConditions) {
    try {
      const [successCount, failureCount, totalToday] = await Promise.all([
        ActivityLog.count({ where: { ...whereConditions, status: 'SUCCESS' } }),
        ActivityLog.count({ where: { ...whereConditions, status: 'FAILURE' } }),
        ActivityLog.count({
          where: {
            ...whereConditions,
            createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        })
      ]);

      return {
        successCount,
        failureCount,
        totalToday,
        successRate: successCount + failureCount > 0 
          ? Math.round((successCount / (successCount + failureCount)) * 100) 
          : 0
      };
    } catch (error) {
      console.error('❌ Erreur stats:', error);
      return { successCount: 0, failureCount: 0, totalToday: 0, successRate: 0 };
    }
  }

  /**
   * ✅ Actions disponibles
   */
  async getAvailableActions(req, res) {
    try {
      const [actions, resourceTypes] = await Promise.all([
        ActivityLog.findAll({
          attributes: ['action', [sequelize.fn('COUNT', sequelize.col('action')), 'count']],
          group: ['action'],
          order: [[sequelize.fn('COUNT', sequelize.col('action')), 'DESC']]
        }),
        ActivityLog.findAll({
          attributes: ['resourceType', [sequelize.fn('COUNT', sequelize.col('resourceType')), 'count']],
          where: { resourceType: { [Op.not]: null } },
          group: ['resourceType'],
          order: [[sequelize.fn('COUNT', sequelize.col('resourceType')), 'DESC']]
        })
      ]);

      return res.status(200).json({
        success: true,
        data: {
          actions: actions.map(a => ({ action: a.action, count: parseInt(a.dataValues.count) })),
          resourceTypes: resourceTypes.map(r => ({ resourceType: r.resourceType, count: parseInt(r.dataValues.count) }))
        }
      });
    } catch (error) {
      console.error('❌ [MONITORING] Erreur actions:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des actions disponibles',
        error: error.message
      });
    }
  }
}

module.exports = new MonitoringController();