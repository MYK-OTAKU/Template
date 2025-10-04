const { sequelize } = require('../../../config/sequelize');

// Configuration globale pour les tests
beforeAll(async () => {
  // Synchroniser la base de données de test
  await sequelize.sync({ force: true });
  console.log('🧪 Base de données de test synchronisée');
});

afterAll(async () => {
  // Fermer la connexion après tous les tests
  await sequelize.close();
  console.log('🧪 Connexion base de données fermée');
});

// Nettoyer entre chaque test
beforeEach(async () => {
  // Nettoyer toutes les tables
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

// Mocks globaux
jest.mock('../../services/AuditService', () => ({
  logActivity: jest.fn().mockResolvedValue(true),
  createUserSession: jest.fn().mockResolvedValue({ id: 1 }),
  endAllUserSessions: jest.fn().mockResolvedValue(1)
}));

// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'dashboard-template-test-secret-2024';
process.env.APP_NAME = 'Dashboard Template Test';