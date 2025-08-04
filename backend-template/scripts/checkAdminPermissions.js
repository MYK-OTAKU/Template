const { sequelize } = require('../config/sequelize');
const { User, Role, Permission, RolePermission } = require('../models');

async function checkAdminPermissions() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion établie');
    
    const admin = await User.findOne({ 
      where: { username: 'admin' },
      include: [{
        model: Role,
        include: [{
          model: Permission,
          through: { attributes: [] }
        }]
      }]
    });
    
    if (admin && admin.Role) {
      console.log(`📋 Permissions de l'admin (${admin.Role.name}):`);
      admin.Role.Permissions.forEach(p => {
        console.log(`  - ${p.name}: ${p.description}`);
      });
      
      const hasNotifDelete = admin.Role.Permissions.some(p => p.name === 'notifications.delete');
      console.log(`\n🔍 Permission "notifications.delete": ${hasNotifDelete ? '✅ PRÉSENTE' : '❌ MANQUANTE'}`);
      
    } else {
      console.log('❌ Admin ou rôle non trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  checkAdminPermissions();
}

module.exports = { checkAdminPermissions };
