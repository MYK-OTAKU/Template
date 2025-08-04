const AuditService = require('../services/AuditService');
const { UserSession } = require('../models');
const { AUDIT_ACTIONS, RESOURCE_TYPES, ACTION_STATUS } = require('../constants/auditActions');

/**
 * Middleware pour vérifier et mettre à jour les sessions utilisateur
 */
exports.trackUserSession = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || null;

      // Trouver une session active pour cet utilisateur
      const activeSession = await UserSession.findOne({
        where: {
          userId: req.user.id,
          isActive: true
        },
        order: [['createdAt', 'DESC']]
      });

      if (activeSession) {
        // Mettre à jour la session existante
        await AuditService.updateSessionActivity(activeSession, ipAddress);
        req.userSession = activeSession;
      } else {
        // Créer une nouvelle session si nécessaire
        const sessionData = {
          userId: req.user.id,
          ipAddress,
          userAgent,
          refreshTokenId: req.refreshTokenId || null
        };
        const newSession = await AuditService.createUserSession(sessionData);
        req.userSession = newSession;
      }
    }
    next();
  } catch (error) {
    console.error('Erreur dans le middleware de suivi de session:', error);
    // Ne pas bloquer la requête en cas d'erreur de tracking
    next();
  }
};

/**
 * Middleware pour journaliser les actions sur les ressources (POST, PUT, DELETE)
 */
exports.logResourceActivity = (resourceType) => {
  return async (req, res, next) => {
    // Stocker la fonction originale de res.json
    const originalJson = res.json;

    // Remplacer res.json par notre fonction personnalisée
    res.json = function(data) {
      // Restaurer la fonction originale pour éviter les fuites de mémoire
      res.json = originalJson;

      // Si la réponse est un succès et que nous avons un utilisateur
      if (req.user && res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
        const userId = req.user.id;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || null;
        
        // Déterminer l'action basée sur la méthode HTTP
        let action = AUDIT_ACTIONS.CRUD.READ;
        let description = `Consultation de ${resourceType}`;
        let resourceId = req.params.id || null;
        let oldValues = null;
        let newValues = null;

        switch (req.method) {
          case 'POST':
            action = AUDIT_ACTIONS.CRUD.CREATE;
            description = `Création de ${resourceType}`;
            newValues = req.body;
            // Si la réponse contient l'ID de l'objet créé
            if (data.data && data.data.id) {
              resourceId = data.data.id;
            }
            break;
          case 'PUT':
          case 'PATCH':
            action = AUDIT_ACTIONS.CRUD.UPDATE;
            description = `Mise à jour de ${resourceType}`;
            oldValues = req.originalData || null;
            newValues = req.body;
            break;
          case 'DELETE':
            action = AUDIT_ACTIONS.CRUD.DELETE;
            description = `Suppression de ${resourceType}`;
            oldValues = req.originalData || null;
            break;
        }

        // Journaliser l'activité
        AuditService.logActivity({
          userId,
          action,
          description,
          ipAddress,
          userAgent,
          resourceType: resourceType.toUpperCase(),
          resourceId,
          oldValues,
          newValues,
          status: ACTION_STATUS.SUCCESS
        });
      }

      // Appeler la fonction json originale
      return originalJson.call(this, data);
    };

    next();
  };
};