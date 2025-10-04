const { sequelize, initDb } = require('./config/sequelize');
const { User, Role, Permission, RolePermission } = require('./models');
const bcrypt = require('bcryptjs');

// Fonction pour vérifier la connexion Supabase
const checkSupabaseConnection = async () => {
  try {
    console.log('🔗 Vérification de la connexion Supabase...');
    await sequelize.authenticate();
    console.log('✅ Connexion Supabase établie avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion Supabase:', error.message);
    throw error;
  }
};

// Fonction pour initialiser les permissions par défaut
const initializePermissions = async () => {
  console.log('🔐 Initialisation des permissions...');
  
  const permissions = [
    { name: 'ADMIN', description: 'Accès administrateur complet' },
    { name: 'USERS_ADMIN', description: 'Gestion des utilisateurs' },
    { name: 'ROLES_MANAGE', description: 'Gestion des rôles' },
    { name: 'PERMISSIONS_MANAGE', description: 'Gestion des permissions' },
    { name: 'USERS_VIEW', description: 'Visualisation des utilisateurs' },
    { name: 'ROLES_VIEW', description: 'Visualisation des rôles' },
    { name: 'PERMISSIONS_VIEW', description: 'Visualisation des permissions' },
    { name: 'MONITORING_VIEW', description: 'Accès au monitoring' },
    { name: 'CONTENT_VIEW', description: 'Visualisation du contenu' },
    { name: 'CONTENT_MANAGE', description: 'Gestion du contenu' },
    { name: 'REPORTS_VIEW', description: 'Visualisation des rapports' },
    { name: 'SETTINGS_MANAGE', description: 'Gestion des paramètres' }
  ];

  for (const permData of permissions) {
    try {
      await Permission.findOrCreate({
        where: { name: permData.name },
        defaults: permData
      });
      console.log(`✅ Permission "${permData.name}" initialisée`);
    } catch (error) {
      console.error(`❌ Erreur lors de la création de la permission "${permData.name}":`, error.message);
    }
  }
};

// Fonction pour initialiser les rôles par défaut
const initializeRoles = async () => {
  console.log('👤 Initialisation des rôles...');
  
  try {
    // Créer le rôle Administrateur
    const [adminRole] = await Role.findOrCreate({
      where: { name: 'Administrateur' },
      defaults: {
        name: 'Administrateur',
        description: 'Administrateur système avec tous les droits'
      }
    });
    console.log('✅ Rôle Administrateur créé');

    // Récupérer toutes les permissions
    const allPermissions = await Permission.findAll();
    console.log(`📋 ${allPermissions.length} permissions trouvées`);

    // Associer toutes les permissions au rôle administrateur
    await adminRole.setPermissions(allPermissions);
    console.log('✅ Permissions associées au rôle Administrateur');

    return adminRole;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des rôles:', error.message);
    throw error;
  }
};

// Fonction pour créer l'utilisateur admin par défaut avec Supabase
const createDefaultAdmin = async (adminRole) => {
  console.log('🔑 Création de l\'utilisateur admin par défaut...');
  
  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (existingAdmin) {
      console.log('👤 Utilisateur admin déjà existant');
      console.log('🔄 Forcer la mise à jour du mot de passe pour assurer la cohérence...');
      
      // Forcer la mise à jour du mot de passe (le hook beforeUpdate se charge du hachage)
      await existingAdmin.update({ password: 'admin123' });
      console.log('✅ Mot de passe admin mis à jour avec succès');
      
      // Vérifier que le mot de passe fonctionne maintenant
      const testPassword = await bcrypt.compare('admin123', existingAdmin.password);
      if (testPassword) {
        console.log('✅ Vérification du mot de passe admin réussie');
      } else {
        console.log('⚠️ Problème de vérification du mot de passe détecté');
      }
      
      return existingAdmin;
    }

    console.log('👤 Création de l\'utilisateur admin...');
    
    // Créer l'utilisateur admin avec mot de passe en clair
    // Le hook beforeCreate du modèle User se charge automatiquement du hachage
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123', // Mot de passe en clair, sera haché par le hook beforeCreate
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@template.local',
      isActive: true,
      roleId: adminRole.id
    });

    console.log('✅ Utilisateur admin créé avec succès');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔐 Username: admin`);
    console.log(`🔑 Password: admin123`);
    
    // Vérifier immédiatement que le mot de passe fonctionne
    const testPassword = await bcrypt.compare('admin123', adminUser.password);
    if (testPassword) {
      console.log('✅ Vérification du mot de passe admin créé réussie');
    } else {
      console.log('❌ ERREUR: Le mot de passe admin ne fonctionne pas après création!');
    }
    
    return adminUser;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur admin:', error.message);
    console.error('🔍 Stack trace:', error.stack);
    throw error;
  }
};

// Fonction principale d'initialisation pour Supabase
const initializeDatabase = async () => {
  try {
    console.log('🔧 Initialisation complète de la base de données Supabase...');
    
    // Vérifier la connexion Supabase
    await checkSupabaseConnection();
    
    // Synchroniser les modèles avec Supabase (sans force pour préserver les données)
    console.log('🔄 Synchronisation des modèles avec Supabase...');
    await sequelize.sync({ alter: true }); // Utiliser alter au lieu de force pour préserver les données
    console.log('✅ Base de données synchronisée');

    // Initialiser les permissions
    await initializePermissions();

    // Initialiser les rôles
    const adminRole = await initializeRoles();

    // Créer l'utilisateur admin
    await createDefaultAdmin(adminRole);

    console.log('🎉 Initialisation de la base de données terminée avec succès !');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
};

// Fonction pour démarrer le serveur
const startServer = async () => {
  try {
    // Initialiser la base de données
    await initializeDatabase();
    
    // Démarrer l'application
    console.log('🚀 Démarrage du serveur...');
    require('./app');
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
};

// Exécuter si ce fichier est appelé directement
if (require.main === module) {
  startServer();
}

module.exports = { initializeDatabase, startServer };
