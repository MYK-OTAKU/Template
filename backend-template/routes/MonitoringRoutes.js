const express = require('express');
const router = express.Router();
const MonitoringController = require('../controllers/MonitoringController');
const { authenticate, hasPermission } = require('../middlewares/auth');
const { checkActiveSession } = require('../middlewares/sessionCheck');
const { User, UserSession, ActivityLog } = require('../models');
const { Op } = require('sequelize');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// ✅ Appliquer la vérification de session pour toutes les routes sensibles
router.use(checkActiveSession);

// ✅ CORRECTION: Vérification sécurisée des méthodes avec bind
const safeRoute = (path, method, controller, controllerMethod) => {
  if (typeof controller[controllerMethod] === 'function') {
    router[method](path, hasPermission('ADMIN'), controller[controllerMethod].bind(controller));
    console.log(`✅ Route ${method.toUpperCase()} ${path} enregistrée`);
  } else {
    console.warn(`⚠️ Méthode ${controllerMethod} non trouvée dans le contrôleur, route ignorée`);
  }
};

// ✅ Routes principales
safeRoute('/sessions', 'get', MonitoringController, 'getActiveSessions');
safeRoute('/sessions/:sessionId', 'delete', MonitoringController, 'terminateSession');
safeRoute('/activities', 'get', MonitoringController, 'getActivityLogs');
safeRoute('/activities/stats', 'get', MonitoringController, 'getActivityStats'); // ✅ AJOUT
safeRoute('/activities/actions', 'get', MonitoringController, 'getAvailableActions');
safeRoute('/users/:userId/connections', 'get', MonitoringController, 'getUserConnectionHistory');
safeRoute('/users/:userId/activities', 'get', MonitoringController, 'getUserActivities');

// ✅ Route dashboard stats
router.get('/dashboard/stats', hasPermission('ADMIN'), async (req, res) => {
  try {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    
    const stats = {
      todayLogins: 0,
      activeSessionsCount: 0,
      totalUsers: 0,
      todayActivities: 0
    };

    try {
      stats.todayLogins = await UserSession.count({
        where: { createdAt: { [Op.gte]: today } }
      });
    } catch (e) { console.warn('Erreur todayLogins:', e.message); }

    try {
      stats.activeSessionsCount = await UserSession.count({
        where: { isActive: true }
      });
    } catch (e) { console.warn('Erreur activeSessionsCount:', e.message); }

    try {
      stats.totalUsers = await User.count();
    } catch (e) { console.warn('Erreur totalUsers:', e.message); }

    try {
      stats.todayActivities = await ActivityLog.count({
        where: { createdAt: { [Op.gte]: today } }
      });
    } catch (e) { console.warn('Erreur todayActivities:', e.message); }

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ [MONITORING] Erreur stats dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques du dashboard',
      error: error.message
    });
  }
});

module.exports = router;