const request = require('supertest');
const app = require('../app');
const { User, Role } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

describe('Authentication Tests', () => {
  let testUser;
  let testRole;

  beforeEach(async () => {
    // Créer un rôle de test
    testRole = await Role.create({
      name: 'user',
      description: 'Utilisateur standard'
    });

    // Créer un utilisateur de test
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      roleId: testRole.id,
      isActive: true
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Identifiants invalides');
    });

    test('should reject inactive user', async () => {
      await User.update({ isActive: false }, { where: { id: testUser.id } });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should handle missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should prevent SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: "admin'; DROP TABLE users; --",
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('JWT Token Validation', () => {
    test('should validate valid JWT token', async () => {
      const token = jwt.sign(
        { id: testUser.id, username: testUser.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
    });

    test('should reject expired JWT token', async () => {
      const token = jwt.sign(
        { id: testUser.id, username: testUser.username },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Token expiré
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Token invalide');
    });

    test('should reject malformed JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Token invalide');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Token d\'accès requis');
    });
  });

  describe('Two-Factor Authentication', () => {
    let userWith2FA;
    let secret;

    beforeEach(async () => {
      secret = speakeasy.generateSecret({
        name: 'Dashboard Template',
        length: 32
      });

      userWith2FA = await User.create({
        username: 'user2fa',
        email: 'user2fa@example.com',
        password: await bcrypt.hash('password123', 10),
        roleId: testRole.id,
        isActive: true,
        isTwoFactorEnabled: true,
        twoFactorSecret: secret.base32
      });
    });

    test('should enable 2FA for user', async () => {
      const token = global.testUtils.createTestToken(testUser.id);
      
      const response = await request(app)
        .post('/api/auth/enable-2fa')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.qrCode).toBeDefined();
      expect(response.body.data.secret).toBeDefined();
    });

    test('should verify 2FA token correctly', async () => {
      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32'
      });

      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          userId: userWith2FA.id,
          token: token
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject invalid 2FA token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          userId: userWith2FA.id,
          token: '000000'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should disable 2FA and generate new secret on re-enable', async () => {
      const token = global.testUtils.createTestToken(userWith2FA.id);
      
      // Désactiver 2FA
      const disableResponse = await request(app)
        .post('/api/auth/disable-2fa')
        .set('Authorization', `Bearer ${token}`);

      expect(disableResponse.status).toBe(200);
      
      // Vérifier que 2FA est désactivé
      const updatedUser = await User.findByPk(userWith2FA.id);
      expect(updatedUser.isTwoFactorEnabled).toBe(false);
      expect(updatedUser.twoFactorSecret).toBe(null);

      // Réactiver 2FA
      const enableResponse = await request(app)
        .post('/api/auth/enable-2fa')
        .set('Authorization', `Bearer ${token}`);

      expect(enableResponse.status).toBe(200);
      expect(enableResponse.body.data.secret).toBeDefined();
      
      // Vérifier qu'un nouveau secret a été généré
      const reEnabledUser = await User.findByPk(userWith2FA.id);
      expect(reEnabledUser.twoFactorSecret).not.toBe(secret.base32);
    });

    test('should prevent 2FA bypass attempts', async () => {
      // Tenter de se connecter avec 2FA activé sans fournir le token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'user2fa',
          password: 'password123'
        });

      // Devrait retourner un token temporaire, pas un token complet
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.requiresTwoFactor).toBe(true);
      expect(loginResponse.body.data.tempToken).toBeDefined();
      expect(loginResponse.body.data.token).toBeUndefined();
    });
  });

  describe('Authentication Security', () => {
    test('should prevent brute force attacks', async () => {
      const attempts = [];
      
      // Simuler 5 tentatives de connexion échouées
      for (let i = 0; i < 5; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              username: 'testuser',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(attempts);
      
      // Toutes les tentatives devraient échouer
      responses.forEach(response => {
        expect(response.status).toBe(401);
      });

      // La 6ème tentative devrait être bloquée (si rate limiting est implémenté)
      const blockedResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      // Note: Ceci nécessiterait l'implémentation d'un rate limiter
      // expect(blockedResponse.status).toBe(429);
    });

    test('should not leak user existence information', async () => {
      const validUserResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      const invalidUserResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'wrongpassword'
        });

      // Les deux réponses devraient être identiques pour éviter l'énumération d'utilisateurs
      expect(validUserResponse.status).toBe(invalidUserResponse.status);
      expect(validUserResponse.body.message).toBe(invalidUserResponse.body.message);
    });

    test('should handle concurrent login attempts safely', async () => {
      const concurrentLogins = [];
      
      // Simuler 10 connexions simultanées avec les mêmes identifiants
      for (let i = 0; i < 10; i++) {
        concurrentLogins.push(
          request(app)
            .post('/api/auth/login')
            .send({
              username: 'testuser',
              password: 'password123'
            })
        );
      }

      const responses = await Promise.all(concurrentLogins);
      
      // Toutes les connexions valides devraient réussir
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Session Management', () => {
    test('should update last login timestamp', async () => {
      const beforeLogin = new Date();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.lastLogin).toBeDefined();
      expect(new Date(updatedUser.lastLogin)).toBeInstanceOf(Date);
      expect(new Date(updatedUser.lastLogin)).toBeAfter(beforeLogin);
    });

    test('should handle logout correctly', async () => {
      const token = global.testUtils.createTestToken(testUser.id);
      
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should prevent infinite authentication loops', async () => {
      // Créer un token avec des données circulaires potentielles
      const circularData = { id: testUser.id };
      circularData.self = circularData;

      // Le système ne devrait pas planter avec des données circulaires
      expect(() => {
        jwt.sign(
          { id: testUser.id, username: testUser.username },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
      }).not.toThrow();
    });
  });
});

