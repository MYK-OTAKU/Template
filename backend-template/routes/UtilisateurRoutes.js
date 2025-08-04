// filepath: c:\Users\Mohamed\Desktop\Backend 2.0\gaming-center-backend\routes\userRoutes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate, hasPermission } = require('../middlewares/auth');
const AuthController = require('../controllers/AuthController');

// User routes
router.post('/users', AuthController.register); // Uses AuthController for creation
router.get('/users/profile', authenticate, UserController.getUserProfile);
router.get('/users', authenticate, hasPermission('MANAGE_USERS'), UserController.listUsers);
router.get('/users/:id', authenticate, hasPermission('MANAGE_USERS'), UserController.getUser);
router.put('/users/:id', authenticate, hasPermission('MANAGE_USERS'), UserController.updateUser);
router.delete('/users/:id', authenticate, hasPermission('MANAGE_USERS'), UserController.deleteUser);

// User role management routes
router.post('/users/change-role', authenticate, hasPermission('MANAGE_USERS'), UserController.changeUserRole);
router.put('/users/:id/activate', authenticate, hasPermission('MANAGE_USERS'), UserController.activateUser);
router.put('/users/:id/deactivate', authenticate, hasPermission('MANAGE_USERS'), UserController.deactivateUser);

module.exports = router;