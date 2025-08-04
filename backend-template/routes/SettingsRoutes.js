const express = require('express');
const router = express.Router();

// Imports avec gestion d'erreur
let SettingsController, authenticateToken, checkPermission;

try {
  SettingsController = require('../controllers/SettingsController');
} catch (error) {
  console.error('Erreur lors de l\'import de SettingsController:', error.message);
  process.exit(1);
}

try {
  const authMiddleware = require('../middlewares/auth');
  authenticateToken = authMiddleware.authenticateToken;
} catch (error) {
  console.error('Erreur lors de l\'import du middleware auth:', error.message);
  process.exit(1);
}

try {
  const permissionsMiddleware = require('../middlewares/permissions');
  checkPermission = permissionsMiddleware.checkPermission;
} catch (error) {
  console.error('Erreur lors de l\'import du middleware permissions:', error.message);
  process.exit(1);
}

// Vérifier que toutes les fonctions sont définies
if (!SettingsController) {
  console.error('SettingsController est undefined');
  process.exit(1);
}

if (!authenticateToken) {
  console.error('authenticateToken est undefined');
  process.exit(1);
}

if (!checkPermission) {
  console.error('checkPermission est undefined');
  process.exit(1);
}

// Routes publiques (sans authentification)
router.get('/public', SettingsController.getPublicSettings);

// Routes utilisateur (authentification requise)
router.get('/user/preferences', authenticateToken, SettingsController.getUserPreferences);
router.put('/user/preferences', authenticateToken, SettingsController.updateUserPreferences);

// Routes admin (authentification + permissions requises)
router.get('/admin/all', 
  authenticateToken, 
  checkPermission('settings.read'), 
  SettingsController.getAllSettings
);

router.post('/admin', 
  authenticateToken, 
  checkPermission('settings.create'), 
  SettingsController.createSetting
);

router.post('/admin/bulk', 
  authenticateToken, 
  checkPermission('settings.create'), 
  SettingsController.bulkCreateSettings
);

router.put('/admin/:key', 
  authenticateToken, 
  checkPermission('settings.update'), 
  SettingsController.updateSetting
);

router.delete('/admin/:key', 
  authenticateToken, 
  checkPermission('settings.delete'), 
  SettingsController.deleteSetting
);

module.exports = router;