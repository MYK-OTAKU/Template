const { sequelize } = require('./config/sequelize');
const { User } = require('./models');

const resetAdminUser = async () => {
  try {
    console.log('🧹 Réinitialisation de l\'utilisateur admin...');
    
    // Connexion à Supabase
    await sequelize.authenticate();
    console.log('✅ Connexion Supabase établie');
    
    // Supprimer l'utilisateur admin s'il existe
    const deletedCount = await User.destroy({
      where: { username: 'admin' }
    });
    
    if (deletedCount > 0) {
      console.log(`✅ ${deletedCount} utilisateur(s) admin supprimé(s)`);
    } else {
      console.log('ℹ️ Aucun utilisateur admin trouvé');
    }
    
    console.log('🎉 Réinitialisation terminée');
    console.log('🚀 Vous pouvez maintenant relancer: node initAndStart.js');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error.message);
    console.error('🔍 Stack trace:', error.stack);
    process.exit(1);
  }
};

resetAdminUser();
