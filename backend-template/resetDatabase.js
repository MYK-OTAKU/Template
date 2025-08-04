require('dotenv').config();
const { initDb } = require('./config/sequelize');
const { initDefaultRolesAndPermissions } = require('./utils/permissionsInit');

const resetDatabase = async () => {
  try {
    console.log('🔄 Réinitialisation de la base de données...');
    
    // Connexion à la base de données avec force sync
    await initDb(true); // true pour forcer la recréation des tables
    
    console.log('✅ Base de données recréée');
    
    // Initialiser les rôles et permissions par défaut
    console.log('🔄 Initialisation des rôles et permissions...');
    await initDefaultRolesAndPermissions();
    
    console.log('✅ Base de données réinitialisée avec succès !');
    console.log('');
    console.log('🔑 Informations de connexion par défaut :');
    console.log('👤 Nom d\'utilisateur: admin');
    console.log('🔐 Mot de passe: admin123');
    console.log('');
    console.log('⚠️  N\'oubliez pas de changer le mot de passe après la première connexion !');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    process.exit(1);
  }
};

resetDatabase();
