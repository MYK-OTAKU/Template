const { sequelize } = require('../models');

// Configuration de l'environnement de test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.DB_TYPE = 'sqlite';
process.env.SQLITE_PATH = ':memory:';

// Configuration globale pour les tests
beforeAll(async () => {
  // Synchroniser la base de données en mémoire pour les tests
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Fermer la connexion à la base de données
  await sequelize.close();
});

beforeEach(async () => {
  // Nettoyer la base de données avant chaque test
  await sequelize.sync({ force: true });
});

// Utilitaires de test
global.testUtils = {
  // Créer un utilisateur de test
  createTestUser: async (userData = {}) => {
    const { User, Role } = require('../models');
    const bcrypt = require('bcrypt');
    
    // Créer un rôle par défaut si nécessaire
    const [role] = await Role.findOrCreate({
      where: { name: 'user' },
      defaults: { description: 'Utilisateur standard' }
    });

    const defaultUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      roleId: role.id,
      isActive: true
    };

    return await User.create({ ...defaultUser, ...userData });
  },

  // Créer un token JWT de test
  createTestToken: (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: userId, username: 'testuser' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  // Créer une requête authentifiée
  authenticatedRequest: (request, token) => {
    return request.set('Authorization', `Bearer ${token}`);
  }
};

