const { Role, Permission, User } = require('../models');

const initDefaultRolesAndPermissions = async () => {
  try {
    // Créer les permissions par défaut
    const permissions = [
      // Permissions administratives
      { name: 'ADMIN', description: 'Accès administrateur complet' },
      { name: 'USERS_ADMIN', description: 'Gestion des utilisateurs' },
      { name: 'ROLES_MANAGE', description: 'Gestion des rôles' },
      { name: 'PERMISSIONS_MANAGE', description: 'Gestion des permissions' },
      
      // Permissions de visualisation
      { name: 'USERS_VIEW', description: 'Voir les utilisateurs' },
      { name: 'ROLES_VIEW', description: 'Voir les rôles' },
      { name: 'PERMISSIONS_VIEW', description: 'Voir les permissions' },
      { name: 'MONITORING_VIEW', description: 'Accès au monitoring' },
      
      // Permissions de contenu
      { name: 'CONTENT_VIEW', description: 'Voir le contenu' },
      { name: 'CONTENT_MANAGE', description: 'Gérer le contenu' },
      { name: 'REPORTS_VIEW', description: 'Voir les rapports' },
      { name: 'SETTINGS_MANAGE', description: 'Gérer les paramètres' }
    ];

    // Créer les permissions si elles n'existent pas
    for (const permData of permissions) {
      await Permission.findOrCreate({
        where: { name: permData.name },
        defaults: permData
      });
    }

    // Créer les rôles par défaut
    const roles = [
      { 
        name: 'Administrateur', 
        description: 'Accès complet au système',
        permissions: ['ADMIN', 'USERS_ADMIN', 'ROLES_MANAGE', 'PERMISSIONS_MANAGE', 'USERS_VIEW', 'ROLES_VIEW', 'PERMISSIONS_VIEW', 'MONITORING_VIEW', 'CONTENT_VIEW', 'CONTENT_MANAGE', 'REPORTS_VIEW', 'SETTINGS_MANAGE']
      },
      { 
        name: 'Manager', 
        description: 'Gestion opérationnelle',
        permissions: ['USERS_VIEW', 'CONTENT_VIEW', 'CONTENT_MANAGE', 'REPORTS_VIEW', 'MONITORING_VIEW']
      },
      { 
        name: 'Utilisateur', 
        description: 'Accès de base pour les utilisateurs',
        permissions: ['CONTENT_VIEW', 'REPORTS_VIEW']
      }
    ];

    // Créer les rôles et assigner les permissions
    for (const roleData of roles) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: { 
          name: roleData.name, 
          description: roleData.description 
        }
      });

      // Récupérer les permissions pour ce rôle
      const rolePermissions = await Permission.findAll({
        where: { name: roleData.permissions }
      });

      // Assigner les permissions au rôle
      await role.setPermissions(rolePermissions);
    }

    console.log('Rôles et permissions initialisés avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des rôles et permissions:', error);
    throw error;
  }
};

// Fonction pour créer un administrateur par défaut
const createDefaultAdmin = async () => {
  try {
    // Vérifier si un administrateur existe déjà
    const adminRole = await Role.findOne({ where: { name: 'Administrateur' } });
    
    if (!adminRole) {
      console.error('Le rôle Administrateur n\'existe pas');
      return;
    }

    const existingAdmin = await User.findOne({
      where: { roleId: adminRole.id }
    });

    if (existingAdmin) {
      console.log('Un utilisateur administrateur existe déjà');
      return;
    }

    // Créer l'utilisateur administrateur par défaut
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const adminUser = await User.create({
      username: 'admin',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Administrateur',
      email: 'admin@template.com',
      roleId: adminRole.id,
      isActive: true
    });

    console.log('✅ Utilisateur administrateur créé avec succès !');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Changez le mot de passe après la première connexion !');
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur par défaut:', error);
  }
};

module.exports = { initDefaultRolesAndPermissions };