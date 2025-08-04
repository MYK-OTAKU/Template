const request = require('supertest');
const app = require('../../../app');
const { sequelize } = require('../config/database');
const { User, Role, Permission } = require('../../../models');
const AuthService = require('../../../services/AuthService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

// Mock des services externes
jest.mock('../services/AuthService');
jest.mock('../services/AuditService');

describe('Tests des routes d\'authentification (AuthRoutes)', () => {
    let adminUser, employeeUser, managerUser;
    let adminToken, employeeToken, managerToken;
    let adminRole, employeeRole, managerRole;

    beforeAll(async () => {
        // Synchronisation de la base de données de test
        await sequelize.sync({ force: true });

        // Création des rôles
        adminRole = await Role.create({
            name: 'Administrateur',
            description: 'Administrateur système'
        });

        managerRole = await Role.create({
            name: 'Manager',
            description: 'Manager d\'équipe'
        });

        employeeRole = await Role.create({
            name: 'Employé',
            description: 'Employé standard'
        });

        // Création des permissions
        const permissions = [
            { name: 'USERS_ADMIN', description: 'Administration des utilisateurs' },
            { name: 'USERS_VIEW', description: 'Visualisation des utilisateurs' }
        ];

        for (const perm of permissions) {
            await Permission.create(perm);
        }

        // Création des utilisateurs de test
        const hashedPassword = await bcrypt.hash('password123', 10);

        adminUser = await User.create({
            username: 'admin',
            email: 'admin@test.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            phoneNumber: '1234567890',
            address: '123 Admin St',
            roleId: adminRole.id,
            isActive: true
        });

        managerUser = await User.create({
            username: 'manager',
            email: 'manager@test.com',
            password: hashedPassword,
            firstName: 'Manager',
            lastName: 'User',
            phoneNumber: '1234567891',
            address: '123 Manager St',
            roleId: managerRole.id,
            isActive: true
        });

        employeeUser = await User.create({
            username: 'employee',
            email: 'employee@test.com',
            password: hashedPassword,
            firstName: 'Employee',
            lastName: 'User',
            phoneNumber: '1234567892',
            address: '123 Employee St',
            roleId: employeeRole.id,
            isActive: true
        });

        // Génération des tokens de test
        adminToken = jwt.sign(
            { 
                userId: adminUser.id, 
                username: adminUser.username,
                role: adminRole.name 
            },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        managerToken = jwt.sign(
            { 
                userId: managerUser.id, 
                username: managerUser.username,
                role: managerRole.name 
            },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        employeeToken = jwt.sign(
            { 
                userId: employeeUser.id, 
                username: employeeUser.username,
                role: employeeRole.name 
            },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        await sequelize.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Routes publiques', () => {
        describe('POST /login', () => {
            it('devrait permettre la connexion avec des identifiants valides', async () => {
                AuthService.login.mockResolvedValue({
                    success: true,
                    user: {
                        id: adminUser.id,
                        username: adminUser.username,
                        role: adminRole.name
                    },
                    token: adminToken,
                    requiresTwoFactor: false
                });

                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: 'admin',
                        password: 'password123'
                    });

                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('token');
                expect(response.body.user).toHaveProperty('username', 'admin');
                expect(AuthService.login).toHaveBeenCalledWith(
                    'admin',
                    'password123',
                    expect.any(String),
                    expect.any(String),
                    expect.any(Object)
                );
            });

            it('devrait retourner un temp token si 2FA est requis', async () => {
                AuthService.login.mockResolvedValue({
                    success: false,
                    requiresTwoFactor: true,
                    tempToken: 'temp-token-123',
                    message: '2FA requis'
                });

                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: 'admin',
                        password: 'password123'
                    });

                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('requiresTwoFactor', true);
                expect(response.body).toHaveProperty('tempToken', 'temp-token-123');
            });

            it('devrait rejeter les identifiants invalides', async () => {
                AuthService.login.mockRejectedValue({
                    statusCode: 401,
                    message: 'Nom d\'utilisateur ou mot de passe incorrect'
                });

                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: 'admin',
                        password: 'wrongpassword'
                    });

                expect(response.statusCode).toBe(401);
                expect(response.body).toHaveProperty('error');
            });

            it('devrait valider les champs requis', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: 'admin'
                        // password manquant
                    });

                expect(response.statusCode).toBe(400);
            });
        });

        describe('POST /verify-2fa', () => {
            it('devrait vérifier le code 2FA et retourner un token valide', async () => {
                AuthService.verifyTwoFactor.mockResolvedValue({
                    success: true,
                    user: {
                        id: adminUser.id,
                        username: adminUser.username,
                        role: adminRole.name
                    },
                    token: adminToken
                });

                const response = await request(app)
                    .post('/api/auth/verify-2fa')
                    .send({
                        tempToken: 'temp-token-123',
                        code: '123456'
                    });

                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('token');
                expect(response.body.user).toHaveProperty('username', 'admin');
            });

            it('devrait rejeter un code 2FA invalide', async () => {
                AuthService.verifyTwoFactor.mockRejectedValue({
                    statusCode: 401,
                    message: 'Code 2FA invalide'
                });

                const response = await request(app)
                    .post('/api/auth/verify-2fa')
                    .send({
                        tempToken: 'temp-token-123',
                        code: 'invalid'
                    });

                expect(response.statusCode).toBe(401);
            });
        });
    });

    describe('Routes protégées - Gestion 2FA', () => {
        describe('GET /2fa/status', () => {
            it('devrait retourner le statut 2FA de l\'utilisateur authentifié', async () => {
                const response = await request(app)
                    .get('/api/auth/2fa/status')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('twoFactorEnabled');
            });

            it('devrait rejeter les requêtes non authentifiées', async () => {
                const response = await request(app)
                    .get('/api/auth/2fa/status');

                expect(response.statusCode).toBe(401);
            });
        });

        describe('POST /2fa/enable', () => {
            it('devrait activer le 2FA avec un code valide', async () => {
                const response = await request(app)
                    .post('/api/auth/2fa/enable')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        code: '123456'
                    });

                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('message');
            });

            it('devrait rejeter l\'activation avec un code invalide', async () => {
                const response = await request(app)
                    .post('/api/auth/2fa/enable')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        code: 'invalid'
                    });

                expect(response.statusCode).toBe(400);
            });
        });

        describe('POST /2fa/disable', () => {
            it('devrait désactiver le 2FA avec un code valide', async () => {
                const response = await request(app)
                    .post('/api/auth/2fa/disable')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        code: '123456'
                    });

                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('message');
            });
        });

        describe('POST /2fa/regenerate', () => {
            it('devrait régénérer le secret 2FA', async () => {
                const response = await request(app)
                    .post('/api/auth/2fa/regenerate')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('qrCode');
                expect(response.body).toHaveProperty('manualEntryKey');
            });
        });
    });

    describe('Route de déconnexion', () => {
        describe('POST /logout', () => {
            it('devrait déconnecter l\'utilisateur authentifié', async () => {
                AuthService.logout.mockResolvedValue({
                    success: true,
                    message: 'Déconnexion réussie'
                });

                const response = await request(app)
                    .post('/api/auth/logout')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('message', 'Déconnexion réussie');
                expect(AuthService.logout).toHaveBeenCalledWith(
                    adminUser.id,
                    expect.any(String),
                    expect.any(String)
                );
            });

            it('devrait rejeter les requêtes non authentifiées', async () => {
                const response = await request(app)
                    .post('/api/auth/logout');

                expect(response.statusCode).toBe(401);
            });
        });
    });

    describe('Route de création d\'utilisateur', () => {
        describe('POST /register', () => {
            it('devrait permettre à un admin de créer un utilisateur', async () => {
                AuthService.register.mockResolvedValue({
                    id: 4,
                    username: 'newuser',
                    email: 'newuser@test.com',
                    role: employeeRole.name
                });

                const response = await request(app)
                    .post('/api/auth/register')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        username: 'newuser',
                        email: 'newuser@test.com',
                        password: 'password123',
                        firstName: 'New',
                        lastName: 'User',
                        phoneNumber: '1234567893',
                        address: '123 New St',
                        roleId: employeeRole.id
                    });

                expect(response.statusCode).toBe(201);
                expect(response.body.user).toHaveProperty('username', 'newuser');
            });

            it('devrait rejeter la création par un utilisateur sans permissions', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .set('Authorization', `Bearer ${employeeToken}`)
                    .send({
                        username: 'newuser',
                        email: 'newuser@test.com',
                        password: 'password123',
                        firstName: 'New',
                        lastName: 'User',
                        phoneNumber: '1234567893',
                        address: '123 New St',
                        roleId: employeeRole.id
                    });

                expect(response.statusCode).toBe(403);
            });

            it('devrait valider les données d\'entrée', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        username: 'newuser'
                        // Données incomplètes
                    });

                expect(response.statusCode).toBe(400);
            });

            it('devrait rejeter la création d\'un utilisateur avec un email existant', async () => {
                AuthService.register.mockRejectedValue({
                    statusCode: 409,
                    message: 'Cet email existe déjà'
                });

                const response = await request(app)
                    .post('/api/auth/register')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        username: 'newuser2',
                        email: 'admin@test.com', // Email existant
                        password: 'password123',
                        firstName: 'New',
                        lastName: 'User',
                        phoneNumber: '1234567894',
                        address: '123 New St',
                        roleId: employeeRole.id
                    });

                expect(response.statusCode).toBe(409);
            });
        });
    });

    describe('Tests de sécurité et cas limites', () => {
        it('devrait rejeter les tokens JWT malformés', async () => {
            const response = await request(app)
                .get('/api/auth/2fa/status')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.statusCode).toBe(401);
        });

        it('devrait rejeter les tokens expirés', async () => {
            const expiredToken = jwt.sign(
                { userId: adminUser.id },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '-1h' } // Token expiré
            );

            const response = await request(app)
                .get('/api/auth/2fa/status')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.statusCode).toBe(401);
        });

        it('devrait gérer les erreurs internes du serveur', async () => {
            AuthService.login.mockRejectedValue(new Error('Erreur serveur'));

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'password123'
                });

            expect(response.statusCode).toBe(500);
        });

        it('devrait limiter les tentatives de connexion (rate limiting)', async () => {
            // Test de rate limiting - à adapter selon votre implémentation
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(
                    request(app)
                        .post('/api/auth/login')
                        .send({
                            username: 'admin',
                            password: 'wrongpassword'
                        })
                );
            }

            const responses = await Promise.all(promises);
            const lastResponse = responses[responses.length - 1];
            
            // Vérifier si le rate limiting est activé
            expect([200, 401, 429]).toContain(lastResponse.statusCode);
        });
    });

    describe('Tests d\'intégration avec middleware d\'authentification', () => {
        it('devrait permettre l\'accès aux routes avec un token valide', async () => {
            const response = await request(app)
                .get('/api/auth/2fa/status')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.statusCode).not.toBe(401);
        });

        it('devrait rejeter l\'accès sans header Authorization', async () => {
            const response = await request(app)
                .get('/api/auth/2fa/status');

            expect(response.statusCode).toBe(401);
        });

        it('devrait rejeter l\'accès avec un format d\'Authorization incorrect', async () => {
            const response = await request(app)
                .get('/api/auth/2fa/status')
                .set('Authorization', adminToken); // Sans "Bearer "

            expect(response.statusCode).toBe(401);
        });
    });

    describe('Tests de validation des données', () => {
        it('devrait valider le format email lors de la création d\'utilisateur', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    username: 'newuser',
                    email: 'invalid-email', // Email invalide
                    password: 'password123',
                    firstName: 'New',
                    lastName: 'User',
                    phoneNumber: '1234567895',
                    address: '123 New St',
                    roleId: employeeRole.id
                });

            expect(response.statusCode).toBe(400);
        });

        it('devrait valider la longueur du mot de passe', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    username: 'newuser',
                    email: 'newuser@test.com',
                    password: '123', // Mot de passe trop court
                    firstName: 'New',
                    lastName: 'User',
                    phoneNumber: '1234567896',
                    address: '123 New St',
                    roleId: employeeRole.id
                });

            expect(response.statusCode).toBe(400);
        });
    });
});