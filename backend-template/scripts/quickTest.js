const { sequelize } = require('../config/sequelize');
const { User, Notification } = require('../models');

async function quickTest() {
  try {
    console.log('🚀 Test rapide des notifications...');
    
    // 1. Vérifier les utilisateurs
    const users = await User.findAll();
    console.log(`👤 Utilisateurs trouvés: ${users.length}`);
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }
    
    const user = users[0];
    console.log(`✅ Utilisation de l'utilisateur: ${user.username} (ID: ${user.id})`);
    
    // 2. Créer une notification simple
    const notif = await Notification.create({
      userId: user.id,
      title: 'Test Simple',
      message: 'Message de test simple',
      type: 'info',
      priority: 'normal',
      isRead: false,
      isGlobal: false
    });
    
    console.log(`✅ Notification créée avec ID: ${notif.id}`);
    
    // 3. Vérifier le total
    const count = await Notification.count();
    console.log(`📊 Total notifications en DB: ${count}`);
    
    // 4. Test getForUser
    const result = await Notification.getForUser(user.id);
    console.log(`📋 getForUser retourne: ${result.count} notifications`);
    
    if (result.rows.length > 0) {
      result.rows.forEach((n, i) => {
        console.log(`  ${i+1}. [${n.id}] ${n.title}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

quickTest();
