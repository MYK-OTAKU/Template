const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🧹 Nettoyage de la base de données...');

// Supprimer le fichier de base de données s'il existe
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log('✅ Base de données supprimée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error.message);
    process.exit(1);
  }
} else {
  console.log('ℹ️ Aucune base de données existante trouvée');
}

console.log('✅ Nettoyage terminé');
