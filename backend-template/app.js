const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const { initDb, sequelize } = require('./config/sequelize');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/AuthRoutes');
const roleRoutes = require('./routes/RoleRoutes');
const permissionRoutes = require('./routes/PermissionRoutes');
const monitoringRoutes = require('./routes/MonitoringRoutes');
const settingsRoutes = require('./routes/SettingsRoutes');
const { trackUserSession } = require('./middlewares/audit');
const { errorMiddleware } = require('./utils/errorHandler'); // Importez le middleware d'erreur
const { standardizeResponse } = require('./utils/responseHandler'); // Ajouter après les importations existantes
const sanitizeResponses = require('./middlewares/responseSanitizer');

const corsMiddleware = require('./middlewares/cors'); // Nouveau middleware à créer
const path = require('path');
const app = express();
require('dotenv').config();

app
  .use(favicon(__dirname + '/favicon.ico'))
   .use(morgan('dev'))
  .use(corsMiddleware) // Remplacer cors(corsOptions) par notre middleware personnalisé
  .use(bodyParser.json())
   .use(cookieParser())
  .use(trackUserSession)
  .use(standardizeResponse) // Ajouter ici
  .use(sanitizeResponses); // Ajouter ce middleware
// Configure Express to serve static files
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====================================
// ROUTES
// ====================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/monitoring', monitoringRoutes); // Ajouter les routes de monitoring

// Modified to be compatible with Vercel
const syncDatabase = async () => {
  try {
    // Import models to ensure they're defined before syncing
    require('./models');
    
    // Juste vérifier la connexion sans sync agressif
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données vérifiée.');
    
    // Ne pas faire de sync automatique - laisser initAndStart.js gérer l'initialisation
    
  } catch (error) {
    console.error('Erreur lors de la vérification de la base de données :', error);
    throw error;
  }
};

// Importer la fonction d'initialisation des permissions depuis le fichier dédié
const { initDefaultRolesAndPermissions } = require('./utils/permissionsInit');

// Execute database synchronization only when starting the server
// or on first API call in a serverless environment
if (require.main === module) {
    const port = process.env.PORT || 3000;
  syncDatabase().then(() => {
    app.listen(port, () => console.log(`Our app is running on http://localhost:${port}`));
  });
}

// Middleware de gestion d'erreurs centralisé (à placer après toutes les routes)
app.use(errorMiddleware);

// Après l'initialisation de l'application

// Nettoyage automatique des sessions inactives toutes les heures
const AuditService = require('./services/AuditService');
setInterval(async () => {
  try {
    await AuditService.cleanupInactiveSessions(240); // Nettoyer après 3h d'inactivité
  } catch (error) {
    console.error('Erreur lors du nettoyage programmé des sessions:', error);
  }
}, 60 * 60 * 1000); // Exécution toutes les heures

module.exports = app;

