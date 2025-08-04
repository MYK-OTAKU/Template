const { sequelize, initDb } = require('../config/sequelize');
const { User, Role, Permission } = require('../models');
const bcrypt = require('bcryptjs');

async function migrateToSupabase() {
  console.log('🚀 Migration vers Supabase PostgreSQL...\n');

  try {
    // 1. Tester la connexion
    console.log('📡 Test de connexion à Supabase...');
    await sequelize.authenticate();
    console.log('✅ Connexion Supabase établie avec succès\n');

    // 2. Créer/synchroniser les tables
    console.log('📋 Synchronisation des modèles...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Tables créées/mises à jour\n');

    // 3. Vérifier si des données existent déjà
    const existingUsers = await User.count();
    console.log(`👤 Utilisateurs existants: ${existingUsers}`);

    if (existingUsers === 0) {
      console.log('📦 Création des données initiales...\n');

      // 4. Créer les rôles de base
      console.log('🎭 Création des rôles...');
      const adminRole = await Role.create({
        name: 'Administrateur',
        description: 'Accès complet à toutes les fonctionnalités',
        isActive: true
      });

      const employeeRole = await Role.create({
        name: 'Employé',
        description: 'Accès limité aux fonctionnalités de base',
        isActive: true
      });

      console.log('✅ Rôles créés');

      // 5. Créer les permissions de base
      console.log('🔑 Création des permissions...');
      const permissions = [
        { name: 'users.view', description: 'Voir les utilisateurs' },
        { name: 'users.create', description: 'Créer des utilisateurs' },
        { name: 'users.edit', description: 'Modifier les utilisateurs' },
        { name: 'users.delete', description: 'Supprimer les utilisateurs' },
        { name: 'roles.view', description: 'Voir les rôles' },
        { name: 'roles.create', description: 'Créer des rôles' },
        { name: 'roles.edit', description: 'Modifier les rôles' },
        { name: 'roles.delete', description: 'Supprimer les rôles' },
        { name: 'permissions.view', description: 'Voir les permissions' },
        { name: 'permissions.edit', description: 'Modifier les permissions' },
        { name: 'notifications.view', description: 'Voir les notifications' },
        { name: 'notifications.create', description: 'Créer des notifications' },
        { name: 'notifications.delete', description: 'Supprimer des notifications' },
        { name: 'settings.view', description: 'Voir les paramètres' },
        { name: 'settings.edit', description: 'Modifier les paramètres' },
        { name: 'postes.view', description: 'Voir les postes' },
        { name: 'postes.create', description: 'Créer des postes' },
        { name: 'postes.edit', description: 'Modifier les postes' },
        { name: 'postes.delete', description: 'Supprimer des postes' }
      ];

      for (const perm of permissions) {
        await Permission.create(perm);
      }
      console.log('✅ Permissions créées');

      // 6. Associer toutes les permissions au rôle administrateur
      console.log('🔗 Association des permissions...');
      const allPermissions = await Permission.findAll();
      await adminRole.addPermissions(allPermissions);
      
      // Associer quelques permissions de base à l'employé
      const basicPermissions = await Permission.findAll({
        where: {
          name: [
            'users.view',
            'notifications.view',
            'postes.view',
            'settings.view'
          ]
        }
      });
      await employeeRole.addPermissions(basicPermissions);
      console.log('✅ Permissions associées');

      // 7. Créer l'utilisateur administrateur par défaut
      console.log('👨‍💼 Création de l\'utilisateur admin...');
      const adminPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        username: 'admin',
        password: adminPassword,
        firstName: 'Administrateur',
        lastName: 'Système',
        email: 'admin@gamingcenter.com',
        phone: null,
        address: null,
        roleId: adminRole.id,
        isActive: true,
        lastLoginAt: null
      });

      console.log('✅ Utilisateur admin créé');
      console.log('📧 Email: admin@gamingcenter.com');
      console.log('🔑 Username: admin');
      console.log('🔒 Password: admin123');
    } else {
      console.log('ℹ️  Données existantes trouvées, migration des schémas uniquement');
    }

    console.log('\n🎉 Migration Supabase terminée avec succès !');
    console.log('🌐 Votre application utilise maintenant PostgreSQL via Supabase');
    
  } catch (error) {
    console.error('❌ Erreur durant la migration:', error);
    console.error('\n🔧 Vérifiez :');
    console.error('   - Les paramètres de connexion dans .env');
    console.error('   - Que Supabase est accessible');
    console.error('   - Les permissions de la base de données');
  } finally {
    await sequelize.close();
  }
}

// Exécuter la migration
if (require.main === module) {
  migrateToSupabase();
}

module.exports = { migrateToSupabase };
