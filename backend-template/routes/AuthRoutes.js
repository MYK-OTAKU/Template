const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticate, hasPermission } = require('../middlewares/auth');

// Routes publiques
router.post('/login', AuthController.login);
router.post('/verify-2fa', AuthController.verifyTwoFactor);

// Routes protégées - Gestion 2FA personnelle
router.use(authenticate);

// Gestion 2FA utilisateur
router.get('/2fa/status', AuthController.getTwoFactorStatus);
router.post('/2fa/enable', AuthController.enableTwoFactor);
router.post('/2fa/disable', AuthController.disableTwoFactor);
router.post('/2fa/regenerate', AuthController.regenerateTwoFactorSecret);

// Autres routes protégées
router.post('/logout', AuthController.logout);

// Création d'utilisateur (avec contrôles hiérarchiques)
router.post('/register', hasPermission('USERS_ADMIN'), AuthController.register);

module.exports = router;