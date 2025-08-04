const axios = require('axios');

const testBackend = async () => {
  const baseURL = 'http://localhost:3000/api';
  
  console.log('🧪 Test de l\'API backend...\n');
  
  // Test 1: Connexion générale
  try {
    console.log('1️⃣ Test de ping général...');
    const response = await axios.get(`${baseURL}/auth/login`, {
      validateStatus: () => true // Accept any status
    });
    console.log(`✅ Serveur répond avec le statut: ${response.status}`);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Serveur backend non démarré sur le port 3000');
      return;
    }
    console.log('⚠️ Erreur de connexion:', error.message);
  }
  
  // Test 2: Login avec credentials corrects
  try {
    console.log('\n2️⃣ Test de login admin...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Login réussi!');
    console.log('👤 Utilisateur:', loginResponse.data.data.user.username);
    console.log('🎭 Rôle:', loginResponse.data.data.user.role.name);
    console.log('🔑 Token reçu:', loginResponse.data.data.token ? 'Oui' : 'Non');
    
    // Test 3: Notifications avec token
    const token = loginResponse.data.data.token;
    try {
      console.log('\n3️⃣ Test des notifications...');
      const notifResponse = await axios.get(`${baseURL}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Notifications OK, count:', notifResponse.data.data.count);
    } catch (error) {
      console.log('⚠️ Erreur notifications:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.log('❌ Erreur de login:', error.response?.status, error.response?.data);
  }
  
  console.log('\n🏁 Tests terminés');
};

testBackend();
