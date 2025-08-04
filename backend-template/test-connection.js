const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testBackendConnectivity() {
  console.log('🧪 Test de connectivité du backend...');
  
  try {
    // Test de base
    console.log('1. Test de ping du serveur...');
    const pingResponse = await axios.get(`${BASE_URL}/auth/ping`).catch(() => null);
    if (!pingResponse) {
      console.log('❌ Serveur inaccessible sur http://localhost:3000');
      console.log('💡 Solutions possibles:');
      console.log('   - Démarrer le backend: cd backend-template && npm start');
      console.log('   - Vérifier le port 3000');
      console.log('   - Redémarrer avec: del database.sqlite && node initAndStart.js');
      return false;
    }
    console.log('✅ Serveur accessible');

    // Test de connexion admin
    console.log('2. Test de connexion admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data && loginResponse.data.success) {
      console.log('✅ Connexion admin réussie');
      console.log('🔑 Token reçu:', loginResponse.data.token ? 'Oui' : 'Non');
      
      // Test API avec token
      console.log('3. Test API avec authentification...');
      const token = loginResponse.data.token;
      const notifResponse = await axios.get(`${BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ API notifications OK:', notifResponse.data);
      
    } else {
      console.log('❌ Échec de connexion admin');
      console.log('🔧 Réponse:', loginResponse.data);
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Erreur lors du test:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Le serveur backend n\'est pas démarré');
      console.log('🚀 Commandes pour démarrer:');
      console.log('   cd backend-template');
      console.log('   del database.sqlite');
      console.log('   node initAndStart.js');
    }
    
    return false;
  }
}

// Exécuter le test
testBackendConnectivity().then(success => {
  if (success) {
    console.log('\n🎉 Tous les tests passés ! Le backend est prêt.');
  } else {
    console.log('\n❌ Des problèmes ont été détectés. Consultez les solutions ci-dessus.');
  }
  process.exit(success ? 0 : 1);
});
