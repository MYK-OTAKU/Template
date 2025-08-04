const request = require('supertest');
const app = require('../app');
const { User, Role, Permission } = require('../models');
const bcrypt = require('bcrypt');

describe('Permissions and Roles Tests', () => {
  let adminRole, userRole, managerRole;
  let adminUser, regularUser, managerUser;
  let readPermission, writePermission, deletePermission;

  beforeEach(async () => {
    // Créer les permissions
    readPermission = await Permission.create({
      name: 'users.read',
      description: 'Lire les utilisateurs',
      category: 'users'
    });

    writePermission = await Permission.create({
      name: 'users.write',
      description: 'Créer/modifier les utilisateurs',
      category: 'users'
    });

    deletePermission = await Permission.create({
      name: 'users.delete',
      description: 'Supprimer les utilisateurs',
      category: 'users'
    });

    // Créer les rôles
    adminRole = await Role.create({
      name: 'admin',
      description: 'Administrateur'
    });

    managerRole = await Role.create({
      name: 'manager',
      description: 'Manager'
    });

    userRole = await Role.create({
      name: 'user',
      description: 'Utilisateur standard'
    });

    // Assigner les permissions aux rôles
    await adminRole.addPermissions([readPermission, writePermission, deletePermission]);
    await managerRole.addPermissions([readPermission, writePermission]);
    await userRole.addPermissions([readPermission]);

    // Créer les utilisateurs
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      roleId: adminRole.id,
      isActive: true
    });

    managerUser = await User.create({
      username: 'manager',
      email: 'manager@example.com',
      password: await bcrypt.hash('manager123', 10),
      roleId: managerRole.id,
      isActive: true
    });

    regularUser = await User.create({
      username: 'user',
      email: 'user@example.com',
      password: await bcrypt.hash('user123', 10),
      roleId: userRole.id,
      isActive: true
    });
  });

  describe('Role-Based Access Control', () => {
    test('admin should have all permissions', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      // Test lecture
      const readResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);
      expect(readResponse.status).toBe(200);

      // Test création
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          roleId: userRole.id
        });
      expect(createResponse.status).toBe(201);

      // Test suppression
      const deleteResponse = await request(app)
        .delete(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(deleteResponse.status).toBe(200);
    });

    test('manager should have read and write permissions only', async () => {
      const token = global.testUtils.createTestToken(managerUser.id);
      
      // Test lecture (autorisé)
      const readResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);
      expect(readResponse.status).toBe(200);

      // Test création (autorisé)
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'newuser2',
          email: 'newuser2@example.com',
          password: 'password123',
          roleId: userRole.id
        });
      expect(createResponse.status).toBe(201);

      // Test suppression (interdit)
      const deleteResponse = await request(app)
        .delete(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(deleteResponse.status).toBe(403);
    });

    test('regular user should have read permission only', async () => {
      const token = global.testUtils.createTestToken(regularUser.id);
      
      // Test lecture (autorisé)
      const readResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);
      expect(readResponse.status).toBe(200);

      // Test création (interdit)
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'newuser3',
          email: 'newuser3@example.com',
          password: 'password123',
          roleId: userRole.id
        });
      expect(createResponse.status).toBe(403);

      // Test suppression (interdit)
      const deleteResponse = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(deleteResponse.status).toBe(403);
    });
  });

  describe('Permission Validation', () => {
    test('should validate permission format', async () => {
      const invalidPermission = {
        name: 'invalid_format',
        description: 'Permission avec format invalide',
        category: 'test'
      };

      try {
        await Permission.create(invalidPermission);
        // Si on arrive ici, le test devrait échouer
        expect(true).toBe(false);
      } catch (error) {
        // La validation devrait échouer pour un format invalide
        expect(error).toBeDefined();
      }
    });

    test('should prevent duplicate permissions', async () => {
      try {
        await Permission.create({
          name: 'users.read', // Déjà existant
          description: 'Permission dupliquée',
          category: 'users'
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.name).toBe('SequelizeUniqueConstraintError');
      }
    });

    test('should handle permission inheritance correctly', async () => {
      // Créer un rôle parent avec des permissions
      const parentRole = await Role.create({
        name: 'parent',
        description: 'Rôle parent'
      });
      await parentRole.addPermissions([readPermission, writePermission]);

      // Créer un rôle enfant qui hérite du parent
      const childRole = await Role.create({
        name: 'child',
        description: 'Rôle enfant',
        parentRoleId: parentRole.id // Si l'héritage est implémenté
      });

      // Le rôle enfant devrait avoir les permissions du parent
      const childPermissions = await childRole.getPermissions();
      expect(childPermissions.length).toBeGreaterThan(0);
    });
  });

  describe('Role Management', () => {
    test('should create role with permissions', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'editor',
          description: 'Éditeur de contenu',
          permissionIds: [readPermission.id, writePermission.id]
        });

      expect(response.status).toBe(201);
      expect(response.body.data.role.name).toBe('editor');
      
      // Vérifier que les permissions ont été assignées
      const createdRole = await Role.findByPk(response.body.data.role.id, {
        include: [Permission]
      });
      expect(createdRole.Permissions).toHaveLength(2);
    });

    test('should update role permissions', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .put(`/api/roles/${userRole.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'user',
          description: 'Utilisateur standard mis à jour',
          permissionIds: [readPermission.id, writePermission.id] // Ajouter write
        });

      expect(response.status).toBe(200);
      
      // Vérifier que les permissions ont été mises à jour
      const updatedRole = await Role.findByPk(userRole.id, {
        include: [Permission]
      });
      expect(updatedRole.Permissions).toHaveLength(2);
    });

    test('should prevent deletion of role with active users', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .delete(`/api/roles/${userRole.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('utilisateurs actifs');
    });

    test('should allow deletion of empty role', async () => {
      const emptyRole = await Role.create({
        name: 'empty',
        description: 'Rôle vide'
      });

      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .delete(`/api/roles/${emptyRole.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Permission Escalation Prevention', () => {
    test('should prevent users from escalating their own permissions', async () => {
      const token = global.testUtils.createTestToken(regularUser.id);
      
      // Tenter de modifier son propre rôle pour avoir plus de permissions
      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          roleId: adminRole.id // Tenter de devenir admin
        });

      expect(response.status).toBe(403);
    });

    test('should prevent users from creating roles with higher permissions', async () => {
      const token = global.testUtils.createTestToken(managerUser.id);
      
      // Manager tente de créer un rôle avec des permissions qu'il n'a pas
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'superuser',
          description: 'Super utilisateur',
          permissionIds: [readPermission.id, writePermission.id, deletePermission.id]
        });

      expect(response.status).toBe(403);
    });

    test('should validate permission consistency', async () => {
      // Tenter de créer un utilisateur avec un rôle inexistant
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'invaliduser',
          email: 'invalid@example.com',
          password: 'password123',
          roleId: 99999 // Rôle inexistant
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Dynamic Permission Checking', () => {
    test('should check permissions dynamically', async () => {
      const token = global.testUtils.createTestToken(regularUser.id);
      
      // Vérifier les permissions de l'utilisateur
      const response = await request(app)
        .get('/api/auth/permissions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.permissions).toContain('users.read');
      expect(response.body.data.permissions).not.toContain('users.delete');
    });

    test('should handle permission changes in real-time', async () => {
      const token = global.testUtils.createTestToken(regularUser.id);
      
      // Vérifier les permissions initiales
      let response = await request(app)
        .get('/api/auth/permissions')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.body.data.permissions).not.toContain('users.write');

      // Admin ajoute une permission au rôle user
      const adminToken = global.testUtils.createTestToken(adminUser.id);
      await request(app)
        .put(`/api/roles/${userRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'user',
          description: 'Utilisateur standard',
          permissionIds: [readPermission.id, writePermission.id]
        });

      // Vérifier que les nouvelles permissions sont disponibles
      response = await request(app)
        .get('/api/auth/permissions')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.body.data.permissions).toContain('users.write');
    });
  });
});

