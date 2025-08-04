const express = require('express');
const router = express.Router();
const PermissionController = require('../controllers/PermissionController');
const { authenticate, hasPermission, hasRole } = require('../middlewares/auth');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes pour les permissions avec permissions requises
router.get('/', hasPermission('PERMISSIONS_VIEW'), PermissionController.getAllPermissions);
router.get('/:id', hasPermission('PERMISSIONS_VIEW'), PermissionController.getPermissionById);
router.post('/',  PermissionController.createPermission);
router.put('/:id',  PermissionController.updatePermission);
router.delete('/:id',  PermissionController.deletePermission);

module.exports = router;