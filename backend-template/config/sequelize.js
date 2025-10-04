const { Sequelize } = require('sequelize');
require('dotenv').config();

try {
  require('pg');
} catch(e) {
  console.error("Erreur de chargement du module pg, tentative de correction...");
  const { execSync } = require('child_process');
  execSync('npm install pg --no-save');
  console.log("Module pg installé en runtime");
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    // Utiliser un fuseau horaire valide
    timezone: '+00:00',
  },
  logging: false,
});

const initDb = async () => {
    try {
      await sequelize.authenticate();
    console.log('La connexion a été établie avec succès avec PostgreSQL. la base de donne est prête à être utilisée.');
    } catch (error) {
    console.error('Impossible de se connecter à la base de données :', error);
  }
};

module.exports = { sequelize, initDb };