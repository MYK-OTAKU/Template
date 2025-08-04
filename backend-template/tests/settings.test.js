const request = require('supertest');
const app = require('../app');
const { User, Role, Settings } = require('../models');
const bcrypt = require('bcrypt');

describe('Settings System Tests', () => {
  let adminUser, regularUser, testRole;

  beforeEach(async () => {
    // Créer un rôle de test
    testRole = await Role.create({
      name: 'user',
      description: 'Utilisateur standard'
    });

    // Créer les utilisateurs de test
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      roleId: testRole.id,
      isActive: true
    });

    regularUser = await User.create({
      username: 'user',
      email: 'user@example.com',
      password: await bcrypt.hash('user123', 10),
      roleId: testRole.id,
      isActive: true
    });

    // Créer des paramètres par défaut
    await Settings.bulkCreate([
      {
        key: 'app.name',
        value: 'Dashboard Template',
        type: 'string',
        category: 'general',
        isPublic: true
      },
      {
        key: 'app.version',
        value: '1.0.0',
        type: 'string',
        category: 'general',
        isPublic: true
      },
      {
        key: 'security.session_timeout',
        value: '3600',
        type: 'number',
        category: 'security',
        isPublic: false
      },
      {
        key: 'features.notifications_enabled',
        value: 'true',
        type: 'boolean',
        category: 'features',
        isPublic: true
      },
      {
        key: 'email.smtp_config',
        value: JSON.stringify({
          host: 'smtp.example.com',
          port: 587,
          secure: false
        }),
        type: 'json',
        category: 'email',
        isPublic: false
      }
    ]);
  });

  describe('Public Settings Access', () => {
    test('should get public settings without authentication', async () => {
      const response = await request(app)
        .get('/api/settings/public');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toBeDefined();
      
      // Vérifier que seuls les paramètres publics sont retournés
      const publicSettings = response.body.data.settings;
      expect(publicSettings['app.name']).toBe('Dashboard Template');
      expect(publicSettings['app.version']).toBe('1.0.0');
      expect(publicSettings['features.notifications_enabled']).toBe(true);
      expect(publicSettings['security.session_timeout']).toBeUndefined();
      expect(publicSettings['email.smtp_config']).toBeUndefined();
    });

    test('should get settings by category', async () => {
      const response = await request(app)
        .get('/api/settings/public?category=general');

      expect(response.status).toBe(200);
      const settings = response.body.data.settings;
      expect(settings['app.name']).toBeDefined();
      expect(settings['app.version']).toBeDefined();
      expect(settings['features.notifications_enabled']).toBeUndefined();
    });

    test('should handle type conversion correctly', async () => {
      const response = await request(app)
        .get('/api/settings/public');

      expect(response.status).toBe(200);
      const settings = response.body.data.settings;
      
      // Vérifier les types
      expect(typeof settings['app.name']).toBe('string');
      expect(typeof settings['features.notifications_enabled']).toBe('boolean');
    });
  });

  describe('Admin Settings Management', () => {
    test('should get all settings for admin', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .get('/api/settings/admin/all')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const settings = response.body.data.settings;
      expect(Object.keys(settings)).toHaveLength(5);
      expect(settings['security.session_timeout']).toBe(3600);
      expect(settings['email.smtp_config']).toBeDefined();
    });

    test('should create new setting', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .post('/api/settings/admin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          key: 'ui.theme_default',
          value: 'light',
          type: 'string',
          category: 'ui',
          isPublic: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      // Vérifier que le paramètre a été créé
      const setting = await Settings.findOne({
        where: { key: 'ui.theme_default' }
      });
      expect(setting).toBeDefined();
      expect(setting.value).toBe('light');
    });

    test('should update existing setting', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .put('/api/settings/admin/app.name')
        .set('Authorization', `Bearer ${token}`)
        .send({
          value: 'Mon Dashboard Personnalisé',
          type: 'string',
          category: 'general',
          isPublic: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Vérifier que le paramètre a été mis à jour
      const setting = await Settings.findOne({
        where: { key: 'app.name' }
      });
      expect(setting.value).toBe('Mon Dashboard Personnalisé');
    });

    test('should delete setting', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .delete('/api/settings/admin/app.version')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Vérifier que le paramètre a été supprimé
      const setting = await Settings.findOne({
        where: { key: 'app.version' }
      });
      expect(setting).toBe(null);
    });

    test('should validate setting key format', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .post('/api/settings/admin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          key: 'invalid key with spaces',
          value: 'test',
          type: 'string',
          category: 'test',
          isPublic: true
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('format');
    });

    test('should prevent duplicate setting keys', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .post('/api/settings/admin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          key: 'app.name', // Clé déjà existante
          value: 'Duplicate',
          type: 'string',
          category: 'general',
          isPublic: true
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('User Settings (Preferences)', () => {
    test('should get user preferences', async () => {
      // Créer des préférences utilisateur
      await Settings.bulkCreate([
        {
          key: `user.${regularUser.id}.theme`,
          value: 'dark',
          type: 'string',
          category: 'user_preferences',
          isPublic: false
        },
        {
          key: `user.${regularUser.id}.language`,
          value: 'fr',
          type: 'string',
          category: 'user_preferences',
          isPublic: false
        },
        {
          key: `user.${regularUser.id}.notifications_email`,
          value: 'true',
          type: 'boolean',
          category: 'user_preferences',
          isPublic: false
        }
      ]);

      const token = global.testUtils.createTestToken(regularUser.id);
      
      const response = await request(app)
        .get('/api/settings/user/preferences')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const preferences = response.body.data.preferences;
      expect(preferences.theme).toBe('dark');
      expect(preferences.language).toBe('fr');
      expect(preferences.notifications_email).toBe(true);
    });

    test('should update user preferences', async () => {
      const token = global.testUtils.createTestToken(regularUser.id);
      
      const response = await request(app)
        .put('/api/settings/user/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'light',
          language: 'en',
          notifications_email: false,
          notifications_push: true,
          font_size: 'medium'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Vérifier que les préférences ont été sauvegardées
      const themeSettings = await Settings.findOne({
        where: { key: `user.${regularUser.id}.theme` }
      });
      expect(themeSettings.value).toBe('light');

      const languageSettings = await Settings.findOne({
        where: { key: `user.${regularUser.id}.language` }
      });
      expect(languageSettings.value).toBe('en');
    });

    test('should get default preferences for new user', async () => {
      const token = global.testUtils.createTestToken(regularUser.id);
      
      const response = await request(app)
        .get('/api/settings/user/preferences')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      
      // Devrait retourner les valeurs par défaut
      const preferences = response.body.data.preferences;
      expect(preferences.theme).toBe('auto'); // Valeur par défaut
      expect(preferences.language).toBe('fr'); // Valeur par défaut
      expect(preferences.notifications_email).toBe(true); // Valeur par défaut
    });

    test('should not access other user preferences', async () => {
      // Créer des préférences pour l'admin
      await Settings.create({
        key: `user.${adminUser.id}.theme`,
        value: 'dark',
        type: 'string',
        category: 'user_preferences',
        isPublic: false
      });

      const token = global.testUtils.createTestToken(regularUser.id);
      
      const response = await request(app)
        .get('/api/settings/user/preferences')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      
      // Ne devrait pas contenir les préférences de l'admin
      const preferences = response.body.data.preferences;
      expect(Object.keys(preferences)).not.toContain('admin_theme');
    });
  });

  describe('Settings Validation and Types', () => {
    test('should validate boolean settings', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .post('/api/settings/admin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          key: 'test.boolean_setting',
          value: 'not_a_boolean',
          type: 'boolean',
          category: 'test',
          isPublic: true
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('boolean');
    });

    test('should validate number settings', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .post('/api/settings/admin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          key: 'test.number_setting',
          value: 'not_a_number',
          type: 'number',
          category: 'test',
          isPublic: true
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('number');
    });

    test('should validate JSON settings', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .post('/api/settings/admin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          key: 'test.json_setting',
          value: 'invalid_json{',
          type: 'json',
          category: 'test',
          isPublic: true
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('JSON');
    });

    test('should handle complex JSON settings', async () => {
      const complexConfig = {
        database: {
          host: 'localhost',
          port: 5432,
          ssl: true,
          options: ['option1', 'option2']
        },
        cache: {
          enabled: true,
          ttl: 3600
        }
      };

      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .post('/api/settings/admin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          key: 'database.config',
          value: JSON.stringify(complexConfig),
          type: 'json',
          category: 'database',
          isPublic: false
        });

      expect(response.status).toBe(201);
      
      // Vérifier que le JSON complexe est correctement sauvegardé
      const setting = await Settings.findOne({
        where: { key: 'database.config' }
      });
      const parsedValue = JSON.parse(setting.value);
      expect(parsedValue.database.host).toBe('localhost');
      expect(parsedValue.cache.enabled).toBe(true);
    });
  });

  describe('Settings Security', () => {
    test('should prevent regular users from accessing admin settings', async () => {
      const token = global.testUtils.createTestToken(regularUser.id);
      
      const response = await request(app)
        .get('/api/settings/admin/all')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    test('should prevent regular users from modifying settings', async () => {
      const token = global.testUtils.createTestToken(regularUser.id);
      
      const response = await request(app)
        .put('/api/settings/admin/app.name')
        .set('Authorization', `Bearer ${token}`)
        .send({
          value: 'Hacked App Name',
          type: 'string',
          category: 'general',
          isPublic: true
        });

      expect(response.status).toBe(403);
    });

    test('should sanitize setting values', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .post('/api/settings/admin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          key: 'test.xss_setting',
          value: '<script>alert("XSS")</script>',
          type: 'string',
          category: 'test',
          isPublic: true
        });

      expect(response.status).toBe(201);
      
      // Vérifier que le contenu malveillant est nettoyé
      const setting = await Settings.findOne({
        where: { key: 'test.xss_setting' }
      });
      expect(setting.value).not.toContain('<script>');
    });

    test('should validate setting categories', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const response = await request(app)
        .post('/api/settings/admin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          key: 'test.invalid_category',
          value: 'test',
          type: 'string',
          category: 'invalid-category!@#',
          isPublic: true
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('category');
    });
  });

  describe('Settings Performance', () => {
    test('should cache frequently accessed settings', async () => {
      // Faire plusieurs requêtes pour les paramètres publics
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(request(app).get('/api/settings/public'));
      }

      const responses = await Promise.all(requests);
      
      // Toutes les requêtes devraient réussir rapidement
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('should handle bulk settings update efficiently', async () => {
      const token = global.testUtils.createTestToken(adminUser.id);
      
      const bulkSettings = {};
      for (let i = 1; i <= 50; i++) {
        bulkSettings[`bulk.setting_${i}`] = {
          value: `value_${i}`,
          type: 'string',
          category: 'bulk',
          isPublic: false
        };
      }

      const response = await request(app)
        .post('/api/settings/admin/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({ settings: bulkSettings });

      expect(response.status).toBe(201);
      expect(response.body.data.created).toBe(50);
      
      // Vérifier que tous les paramètres ont été créés
      const createdSettings = await Settings.count({
        where: { category: 'bulk' }
      });
      expect(createdSettings).toBe(50);
    });
  });
});

