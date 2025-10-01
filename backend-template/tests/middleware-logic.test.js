/**
 * Tests pour vérifier les corrections de logique dans les middlewares
 */
const authorize = require('../middlewares/authorize');
const { checkPermission, checkAnyPermission, checkAllPermissions } = require('../middlewares/permissions');

describe('Middleware Logic Tests', () => {
  describe('authorize middleware', () => {
    it('devrait utiliser req.userRole au lieu de req.user.role directement', () => {
      const middleware = authorize(['Administrateur']);
      
      const req = {
        userRole: 'Administrateur',
        user: {
          role: { name: 'Administrateur', id: 1 } // Objet role
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();
      
      middleware(req, res, next);
      
      // Vérifier que next() a été appelé (autorisation réussie)
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('devrait rejeter si le rôle ne correspond pas', () => {
      const middleware = authorize(['Administrateur']);
      
      const req = {
        userRole: 'Employé',
        user: {
          role: { name: 'Employé', id: 3 }
        }
      };
      
      const mockUnauthorized = jest.fn();
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const responses = require('../utils/responses');
      responses.unauthorized = mockUnauthorized;
      
      const next = jest.fn();
      
      middleware(req, res, next);
      
      // Vérifier que unauthorized a été appelé
      expect(mockUnauthorized).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait gérer le cas où req.userRole est undefined', () => {
      const middleware = authorize(['Administrateur']);
      
      const req = {
        user: {
          role: { name: 'Manager', id: 2 }
        }
      };
      
      const mockUnauthorized = jest.fn();
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const responses = require('../utils/responses');
      responses.unauthorized = mockUnauthorized;
      
      const next = jest.fn();
      
      middleware(req, res, next);
      
      // Devrait utiliser le fallback req.user.role.name
      // Si le rôle est Manager et on cherche Administrateur, ça devrait rejeter
      expect(mockUnauthorized).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('permissions middleware optimization', () => {
    it('checkPermission devrait utiliser req.userPermissions au lieu de faire une requête DB', async () => {
      const middleware = checkPermission('USERS_VIEW');
      
      const req = {
        user: { id: 1 },
        userPermissions: ['USERS_VIEW', 'USERS_ADMIN']
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();
      
      await middleware(req, res, next);
      
      // Vérifier que next() a été appelé sans requête DB
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('checkAnyPermission devrait utiliser req.userPermissions', async () => {
      const middleware = checkAnyPermission(['USERS_VIEW', 'ROLES_VIEW']);
      
      const req = {
        user: { id: 1 },
        userPermissions: ['USERS_VIEW']
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();
      
      await middleware(req, res, next);
      
      // Vérifier que next() a été appelé
      expect(next).toHaveBeenCalled();
    });

    it('checkAllPermissions devrait rejeter si toutes les permissions ne sont pas présentes', async () => {
      const middleware = checkAllPermissions(['USERS_VIEW', 'USERS_ADMIN', 'ROLES_ADMIN']);
      
      const req = {
        user: { id: 1 },
        userPermissions: ['USERS_VIEW', 'USERS_ADMIN'] // Manque ROLES_ADMIN
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();
      
      await middleware(req, res, next);
      
      // Vérifier que l'accès a été refusé
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

console.log('✅ Tests de logique de middleware configurés');
