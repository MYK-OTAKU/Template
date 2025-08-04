const { sequelize } = require('./config/sequelize');
const bcrypt = require('bcryptjs');

async function testAuth() {
  try {
    // Se connecter à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données OK');
    
    // Importer les modèles
    const User = require('./models/User');
    
    // Trouver l'admin
    const admin = await User.findOne({ where: { username: 'admin' } });
    
    if (!admin) {
      console.log('❌ Utilisateur admin non trouvé');
      return;
    }
    
    console.log('👤 Utilisateur admin trouvé:');
    console.log('- Username:', admin.username);
    console.log('- Password hash:', admin.password);
    
    // Tester la comparaison de mot de passe
    const isValid = await bcrypt.compare('admin123', admin.password);
    console.log('🔑 Test mot de passe "admin123":', isValid ? '✅ VALID' : '❌ INVALID');
    
    // Tester avec des mots de passe incorrects
    const isInvalid = await bcrypt.compare('wrongpassword', admin.password);
    console.log('🔑 Test mot de passe "wrongpassword":', isInvalid ? '❌ UNEXPECTED' : '✅ CORRECTLY REJECTED');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testAuth();
