const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/RoleController');
const { authenticate, hasPermission, hasRole, hasMinimumRole } = require('../middlewares/auth');
const { logResourceActivity } = require('../middlewares/audit');

// Middleware d'authentification selon le cahier des charges Gaming Center
router.use(authenticate);

// Routes de consultation - Accessibles selon les permissions définies
router.get('/', 
  hasPermission('ROLES_VIEW'), 
  logResourceActivity('ROLE'), 
  RoleController.getAllRoles
);

router.get('/:id', 
  hasPermission('ROLES_VIEW'), 
  logResourceActivity('ROLE'), 
  RoleController.getRoleById
);

router.get('/:id/permissions', 
  hasPermission('ROLES_VIEW'), 
  logResourceActivity('ROLE'), 
  RoleController.getRolePermissions
);

// Routes de gestion - Administrateur uniquement selon le cahier des charges
router.post('/', 
  hasRole('Administrateur'), 
  logResourceActivity('ROLE'), 
  RoleController.createRole
);

router.put('/:id', 
  hasRole('Administrateur'), 
  logResourceActivity('ROLE'), 
  RoleController.updateRole
);

router.delete('/:id', 
  hasRole('Administrateur'), 
  logResourceActivity('ROLE'), 
  RoleController.deleteRole
);

router.post('/:id/permissions', 
  hasRole('Administrateur'), 
  logResourceActivity('ROLE'), 
  RoleController.assignPermissionsToRole
);

module.exports = router;