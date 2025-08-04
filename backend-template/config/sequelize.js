const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration dynamique selon le type de base de données
const dbType = process.env.DB_TYPE || 'sqlite';

let sequelize;

if (dbType === 'sqlite') {
  // Configuration SQLite pour base de données locale
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_PATH || './database.sqlite',
    logging: false, // Désactiver les logs SQL pour un terminal plus propre
    define: {
      timestamps: true,
      underscored: false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (dbType === 'postgres') {
  // Configuration PostgreSQL/Supabase
  sequelize = new Sequelize({
    database: process.env.DB_NAME || 'postgres',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      timezone: process.env.DB_TIMEZONE || '+00:00',
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false, // Désactiver les logs SQL pour un terminal plus propre
    define: {
      timestamps: true,
      underscored: false
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  throw new Error(`Type de base de données non supporté: ${dbType}. Utilisez 'sqlite' ou 'postgres'.`);
}

const initDb = async (force = false) => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Connexion à la base de données ${dbType.toUpperCase()} établie avec succès.`);
    
    // Synchroniser les modèles avec la base de données
    if (process.env.NODE_ENV === 'development' || force) {
      if (force) {
        await sequelize.sync({ force: true });
        console.log('✅ Base de données recréée et modèles synchronisés.');
      } else {
        await sequelize.sync({ alter: true });
        console.log('✅ Modèles synchronisés avec la base de données.');
      }
    }
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données :', error);
    throw error;
  }
};

module.exports = { sequelize, initDb, dbType };