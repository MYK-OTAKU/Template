const fs = require('fs');
const path = require('path');

console.log('🧹 Nettoyage forcé de la base de données...');

const dbPath = path.join(__dirname, 'database.sqlite');

// Tenter de supprimer le fichier plusieurs fois
let attempts = 0;
const maxAttempts = 5;

const cleanDatabase = () => {
  attempts++;
  
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      console.log(`✅ Base de données supprimée avec succès (tentative ${attempts})`);
      startInit();
    } catch (error) {
      if (attempts < maxAttempts) {
        console.log(`⏳ Tentative ${attempts}/${maxAttempts} échouée, nouvelle tentative dans 1 seconde...`);
        setTimeout(cleanDatabase, 1000);
      } else {
        console.error('❌ Impossible de supprimer la base de données après plusieurs tentatives');
        console.log('💡 Redémarrez votre éditeur de code et réessayez');
        process.exit(1);
      }
    }
  } else {
    console.log('ℹ️ Aucune base de données existante trouvée');
    startInit();
  }
};

const startInit = () => {
  console.log('🚀 Démarrage de l\'initialisation...');
  require('./initAndStart');
};

cleanDatabase();
