const cors = require('cors');
require('dotenv').config();

// Liste des origines autorisées selon l'environnement
const allowedOrigins = {
  development: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  production: ['https://votre-domaine-production.com']
};

// Configuration CORS avancée
const corsOptions = {
  origin: function(origin, callback) {
    // Obtenir les origines autorisées pour l'environnement actuel
    const currentEnv = process.env.NODE_ENV || 'development';
    const validOrigins = allowedOrigins[currentEnv];
    
    // Permettre les requêtes sans origine (comme les requêtes mobiles natives ou Postman)
    // En production, vous voudrez peut-être désactiver cette option
    if (!origin) {
      if (currentEnv === 'development') {
        return callback(null, true);
      } else {
        return callback(new Error('Origine non autorisée'), false);
      }
    }
    
    // Vérifier si l'origine est dans la liste des origines autorisées
    if (validOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Logger la tentative d'accès non autorisée
      console.warn(`Tentative d'accès non autorisée depuis l'origine: ${origin}`);
      callback(new Error('Origine non autorisée'), false);
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
  exposedHeaders: ['Content-Length', 'Content-Disposition'],
  optionsSuccessStatus: 204,
  maxAge: 86400, // Mise en cache préflight pendant 24h
  preflightContinue: false
};

// Exporter le middleware cors configuré
module.exports = cors(corsOptions);