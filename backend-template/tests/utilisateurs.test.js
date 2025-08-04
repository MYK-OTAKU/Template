const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../database/sequelize');
const Utilisateurs = require('../models/Utilisateur');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const hashedPassword = await bcrypt.hash('password123', 10);
  await Utilisateurs.create({
    nom: 'Doe',
    prenom: 'John',
    role: 'admin',
    nomUtilisateur: 'johndoe',
    motDePasse: hashedPassword,
    email: 'johndoe@example.com',
    numeroTel: '1234567890',
    adresse: '123 Main St'
  });
});

describe('Tests des routes Utilisateurs', () => {
  let token;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        nomUtilisateur: 'johndoe',
        motDePasse: 'password123'
      });

    if (response.body.data) {
      token = response.body.data.token;
    } else {
      console.error('Échec de la connexion :', response.body);
    }
  });

  test('Connexion d\'un utilisateur', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({
        nomUtilisateur: 'johndoe',
        motDePasse: 'password123'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty('token');
  });

  test('Récupération de tous les utilisateurs', async () => {
    if (!token) {
      throw new Error('Token non généré');
    }

    const response = await request(app)
      .get('/api/utilisateurs')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  test('Création d\'un nouvel utilisateur', async () => {
    if (!token) {
      throw new Error('Token non généré');
    }

    const response = await request(app)
      .post('/api/utilisateurs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'Doe',
        prenom: 'Jane',
        role: 'serveur',
        nomUtilisateur: 'janedoe',
        motDePasse: 'password123',
        email: 'janedoe@example.com',
        numeroTel: '0987654321',
        adresse: '456 Main St'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });

  test('Réinitialisation de mot de passe - Demande de réinitialisation', async () => {
    const response = await request(app)
      .post('/api/request-password-reset')
      .send({
        email: 'johndoe@example.com'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Email de réinitialisation envoyé');
  });

  test('Réinitialisation de mot de passe - Réinitialisation du mot de passe', async () => {
    // Simulez la création d'un token pour la réinitialisation
    const resetToken = jwt.sign({ id: 1 }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    const response = await request(app)
      .post(`/api/reset-password/${resetToken}`)
      .send({
        newPassword: 'newpassword123'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Mot de passe réinitialisé avec succès');
  });

  test('Déconnexion', async () => {
    const response = await request(app)
      .post('/api/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Déconnexion réussie');
  });
});

afterAll(async () => {
  await sequelize.close();
});
