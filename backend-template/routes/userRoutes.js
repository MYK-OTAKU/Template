// filepath: c:\Users\Mohamed\Desktop\Backend 2.0\gaming-center-backend\routes\userRoutes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate, hasPermission, hasRole, canManageUser } = require('../middlewares/auth');
const { logResourceActivity } = require('../middlewares/audit');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes de consultation
router.get('/profile', UserController.getUserProfile);
router.get('/', hasPermission('USERS_VIEW'), UserController.getAllUsers);
router.get('/:id', hasPermission('USERS_VIEW'), logResourceActivity('USER'), UserController.getUserById);

// Route de création d'utilisateur avec vérification hiérarchique
router.post('/', hasPermission('USERS_ADMIN'), canManageUser(), logResourceActivity('USER'), UserController.createUser);

// Routes de modification avec contrôles hiérarchiques
router.put('/:id', hasPermission('USERS_ADMIN'), canManageUser(), logResourceActivity('USER'), UserController.updateUser);
router.delete('/:id', hasPermission('USERS_ADMIN'), canManageUser(), logResourceActivity('USER'), UserController.deleteUser);

// Gestion des statuts et rôles
router.put('/:id/activate', hasPermission('USERS_ADMIN'), canManageUser(), UserController.activateUser);
router.put('/:id/deactivate', hasPermission('USERS_ADMIN'), canManageUser(), UserController.deactivateUser);
router.post('/change-role', hasPermission('USERS_ADMIN'), UserController.changeUserRole);

module.exports = router;