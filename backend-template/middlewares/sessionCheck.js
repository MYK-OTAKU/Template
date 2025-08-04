const { UserSession } = require('../models');

/**
 * Middleware pour vérifier si la session utilisateur est toujours active
 */
const checkActiveSession = async (req, res, next) => {
  try {
    // Récupérer les informations de session depuis le token JWT
    const userId = req.user?.id;
    const sessionId = req.user?.sessionId; // Vous devez ajouter sessionId au JWT lors du login
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
        errorCode: 'INVALID_TOKEN'
      });
    }

    // Vérifier si l'utilisateur a une session active
    const activeSession = await UserSession.findOne({
      where: {
        userId: userId,
        isActive: true,
        ...(sessionId && { id: sessionId }) // Vérifier la session spécifique si disponible
      }
    });

    if (!activeSession) {
      return res.status(401).json({
        success: false,
        message: 'Session expirée ou terminée',
        errorCode: 'SESSION_TERMINATED'
      });
    }

    // Mettre à jour la dernière activité
    await activeSession.update({
      lastActivity: new Date()
    });

    next();
  } catch (error) {
    console.error('❌ [SESSION_CHECK] Erreur:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur de vérification de session',
      errorCode: 'SESSION_CHECK_ERROR'
    });
  }
};

module.exports = { checkActiveSession };