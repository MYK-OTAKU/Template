const request = require('supertest');
const app = require('../../app');
const { TestFactory } = require('../helpers/testHelpers');
const { User } = require('../../models');
const AuthService = require('../../services/AuthService');
const speakeasy = require('speakeasy');

describe('🔐 AuthRoutes - Routes d\'Authentification Dashboard Template', () => {
  let adminUser, employeeUser, adminToken, employeeToken;

  beforeEach(async () => {
    // Créer les utilisateurs de test
    adminUser = await TestFactory.createAdminUser();
    employeeUser = await TestFactory.createEmployeeUser();
    
    // Générer les tokens
    adminToken = TestFactory.generateAuthToken(adminUser);
    employeeToken = TestFactory.generateAuthToken(employeeUser);
  });

  describe('📝 POST /auth/register - Création d\'utilisateur', () => {
    it('✅ Doit créer un utilisateur avec les droits Admin', async () => {
      const userData = {
        username: 'newuser',
        password: 'NewUser123!',
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@test.com',
        roleId: employeeUser.roleId
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Utilisateur créé avec succès');

      // Vérifier que l'utilisateur a été créé en base
      const createdUser = await User.findOne({ where: { username: 'newuser' } });
      expect(createdUser).toBeTruthy();
      expect(createdUser.email).toBe('newuser@test.com');
    });

    it('❌ Doit refuser la création sans permission USERS_ADMIN', async () => {
      const userData = {
        username: 'unauthorized',
        password: 'Test123!',
        firstName: 'Unauthorized',
        lastName: 'User',
        email: 'unauthorized@test.com',
        roleId: employeeUser.roleId
      };

      await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(userData)
        .expect(403);
    });

    it('❌ Doit refuser la création avec données manquantes', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'incomplete'
          // Données manquantes
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('MISSING_FIELDS');
    });
  });

  describe('🔐 POST /auth/login - Connexion utilisateur', () => {
    it('✅ Doit connecter un utilisateur avec identifiants valides', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'Admin123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('admin');
      expect(response.body.user.role.name).toBe('Administrateur');
    });

    it('❌ Doit refuser la connexion avec mot de passe incorrect', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('AUTHENTICATION_ERROR');
    });

    it('🔐 Doit demander 2FA si activé', async () => {
      // Activer 2FA pour l'utilisateur
      await User.update(
        { 
          twoFactorEnabled: true,
          twoFactorSecret: speakeasy.generateSecret().base32
        },
        { where: { id: adminUser.id } }
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'Admin123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.requireTwoFactor).toBe(true);
      expect(response.body.tempToken).toBeDefined();
      expect(response.body.canRegenerateQRCode).toBe(true);
    });
  });

  describe('🔒 POST /auth/verify-2fa - Vérification 2FA', () => {
    let tempToken, secret;

    beforeEach(async () => {
      // Configurer 2FA
      secret = speakeasy.generateSecret();
      await User.update(
        { 
          twoFactorEnabled: true,
          twoFactorSecret: secret.base32
        },
        { where: { id: adminUser.id } }
      );

      // Obtenir un token temporaire
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'Admin123!'
        });

      tempToken = loginResponse.body.tempToken;
    });

    it('✅ Doit vérifier un code 2FA valide', async () => {
      const validCode = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32'
      });

      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          token: tempToken,
          twoFactorCode: validCode
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('admin');
    });

    it('❌ Doit refuser un code 2FA invalide', async () => {
      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          token: tempToken,
          twoFactorCode: '123456'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('TWO_FACTOR_ERROR');
    });
  });

  describe('🚪 POST /auth/logout - Déconnexion', () => {
    it('✅ Doit déconnecter un utilisateur authentifié', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Déconnexion réussie');
    });

    it('❌ Doit refuser la déconnexion sans token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(401);
    });
  });

  describe('🔐 Gestion 2FA - Activation/Désactivation avec Régénération', () => {
    describe('GET /auth/2fa/status - Statut 2FA', () => {
      it('✅ Doit retourner le statut 2FA DISABLED', async () => {
        const response = await request(app)
          .get('/api/auth/2fa/status')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.twoFactorEnabled).toBe(false);
        expect(response.body.data.status).toBe('DISABLED');
      });

      it('✅ Doit retourner le statut 2FA ACTIVE', async () => {
        await User.update(
          { 
            twoFactorEnabled: true,
            twoFactorSecret: speakeasy.generateSecret().base32
          },
          { where: { id: adminUser.id } }
        );

        const response = await request(app)
          .get('/api/auth/2fa/status')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.twoFactorEnabled).toBe(true);
        expect(response.body.data.status).toBe('ACTIVE');
      });
    });

    describe('POST /auth/2fa/enable - Activation 2FA', () => {
      it('✅ Doit activer 2FA et générer QR Code', async () => {
        const response = await request(app)
          .post('/api/auth/2fa/enable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.qrCode).toBeDefined();
        expect(response.body.data.manualEntryKey).toBeDefined();
        expect(response.body.data.isNewSetup).toBe(true);

        // Vérifier en base
        const updatedUser = await User.findByPk(adminUser.id);
        expect(updatedUser.twoFactorEnabled).toBe(true);
        expect(updatedUser.twoFactorSecret).toBeTruthy();
      });

      it('✅ Doit régénérer QR Code avec forceNewSecret', async () => {
        // Première activation
        await request(app)
          .post('/api/auth/2fa/enable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});

        // Forcer la régénération
        const response = await request(app)
          .post('/api/auth/2fa/enable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ forceNewSecret: true })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.qrCode).toBeDefined();
        expect(response.body.data.isNewSetup).toBe(true);
      });
    });

    describe('POST /auth/2fa/disable - Désactivation 2FA', () => {
      beforeEach(async () => {
        // Activer 2FA d'abord
        await User.update(
          { 
            twoFactorEnabled: true,
            twoFactorSecret: speakeasy.generateSecret().base32
          },
          { where: { id: adminUser.id } }
        );
      });

      it('✅ Doit désactiver 2FA et supprimer le secret', async () => {
        const response = await request(app)
          .post('/api/auth/2fa/disable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.secretRemoved).toBe(true);
        expect(response.body.data.sessionsTerminated).toBe(true);

        // Vérifier en base
        const updatedUser = await User.findByPk(adminUser.id);
        expect(updatedUser.twoFactorEnabled).toBe(false);
        expect(updatedUser.twoFactorSecret).toBeNull();
      });

      it('✅ Doit conserver le secret si demandé', async () => {
        const response = await request(app)
          .post('/api/auth/2fa/disable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ keepSecret: true })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.secretRemoved).toBe(false);

        // Vérifier en base
        const updatedUser = await User.findByPk(adminUser.id);
        expect(updatedUser.twoFactorEnabled).toBe(false);
        expect(updatedUser.twoFactorSecret).toBeTruthy();
      });
    });

    describe('POST /auth/2fa/regenerate - Régénération Secret 2FA', () => {
      beforeEach(async () => {
        // Activer 2FA d'abord
        await User.update(
          { 
            twoFactorEnabled: true,
            twoFactorSecret: speakeasy.generateSecret().base32
          },
          { where: { id: adminUser.id } }
        );
      });

      it('✅ Doit régénérer le secret 2FA', async () => {
        const oldUser = await User.findByPk(adminUser.id);
        const oldSecret = oldUser.twoFactorSecret;

        const response = await request(app)
          .post('/api/auth/2fa/regenerate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.qrCode).toBeDefined();
        expect(response.body.data.manualEntryKey).toBeDefined();
        expect(response.body.data.isRegeneration).toBe(true);

        // Vérifier que le secret a changé
        const updatedUser = await User.findByPk(adminUser.id);
        expect(updatedUser.twoFactorSecret).not.toBe(oldSecret);
        expect(updatedUser.twoFactorEnabled).toBe(true);
      });
    });

    describe('🔄 Scénario de Réactivation après Désactivation', () => {
      it('✅ Doit générer nouveau QR Code lors de la réactivation', async () => {
        // 1. Activer 2FA
        const activationResponse = await request(app)
          .post('/api/auth/2fa/enable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});

        const originalSecret = activationResponse.body.data.manualEntryKey;

        // 2. Désactiver 2FA avec conservation du secret
        await request(app)
          .post('/api/auth/2fa/disable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ keepSecret: true });

        // 3. Réactiver 2FA
        const reactivationResponse = await request(app)
          .post('/api/auth/2fa/enable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});

        expect(reactivationResponse.body.success).toBe(true);
        expect(reactivationResponse.body.data.isReactivation).toBe(true);
        expect(reactivationResponse.body.data.qrCode).toBeDefined();
        
        // Le secret doit être différent (nouveau secret lors de la réactivation)
        expect(reactivationResponse.body.data.manualEntryKey).not.toBe(originalSecret);

        // Vérifier le statut final
        const statusResponse = await request(app)
          .get('/api/auth/2fa/status')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(statusResponse.body.data.status).toBe('ACTIVE');
      });

      it('✅ Doit réparer un état ENABLED_NO_SECRET', async () => {
        // Simuler un état corrompu : 2FA activé mais pas de secret
        await User.update(
          { 
            twoFactorEnabled: true,
            twoFactorSecret: null
          },
          { where: { id: adminUser.id } }
        );

        // Vérifier l'état problématique
        const statusResponse = await request(app)
          .get('/api/auth/2fa/status')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(statusResponse.body.data.status).toBe('ENABLED_NO_SECRET');

        // Réparer via activation forcée
        const repairResponse = await request(app)
          .post('/api/auth/2fa/enable')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ forceNewSecret: true });

        expect(repairResponse.body.success).toBe(true);
        expect(repairResponse.body.data.qrCode).toBeDefined();

        // Vérifier la réparation
        const finalStatusResponse = await request(app)
          .get('/api/auth/2fa/status')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(finalStatusResponse.body.data.status).toBe('ACTIVE');
      });
    });
  });

  describe('🔒 Tests de Sécurité et Autorisations', () => {
    it('❌ Doit refuser l\'accès aux routes protégées sans token', async () => {
      await request(app)
        .get('/api/auth/2fa/status')
        .expect(401);

      await request(app)
        .post('/api/auth/2fa/enable')
        .expect(401);

      await request(app)
        .post('/api/auth/logout')
        .expect(401);
    });

    it('❌ Doit refuser l\'accès avec token invalide', async () => {
      const invalidToken = 'Bearer invalid.token.here';

      await request(app)
        .get('/api/auth/2fa/status')
        .set('Authorization', invalidToken)
        .expect(401);
    });

    it('❌ Employé ne peut pas créer d\'utilisateur', async () => {
      const userData = {
        username: 'forbidden',
        password: 'Test123!',
        firstName: 'Forbidden',
        lastName: 'User',
        email: 'forbidden@test.com',
        roleId: employeeUser.roleId
      };

      await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(userData)
        .expect(403);
    });
  });

  describe('🧪 Tests d\'Intégration Complète', () => {
    it('✅ Cycle complet : Création → Connexion → 2FA → Déconnexion', async () => {
      // 1. Créer un nouvel utilisateur
      const userData = {
        username: 'testcycle',
        password: 'TestCycle123!',
        firstName: 'Test',
        lastName: 'Cycle',
        email: 'testcycle@test.com',
        roleId: employeeUser.roleId
      };

      await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      // 2. Se connecter avec ce nouvel utilisateur
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testcycle',
          password: 'TestCycle123!'
        })
        .expect(200);

      const userToken = loginResponse.body.token;

      // 3. Activer 2FA
      const enable2faResponse = await request(app)
        .post('/api/auth/2fa/enable')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(200);

      expect(enable2faResponse.body.data.qrCode).toBeDefined();

      // 4. Vérifier le statut 2FA
      const statusResponse = await request(app)
        .get('/api/auth/2fa/status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(statusResponse.body.data.status).toBe('ACTIVE');

      // 5. Se déconnecter
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });
  });
});