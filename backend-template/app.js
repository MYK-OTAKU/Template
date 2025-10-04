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
const { errorMiddleware } = require('./utils/errorHandler');
const { standardizeResponse } = require('./utils/responseHandler');
const sanitizeResponses = require('./middlewares/responseSanitizer');
const { initDefaultRolesAndPermissions } = require('./utils/permissionsInit');
const corsMiddleware = require('./middlewares/cors');
const path = require('path');
const AuditService = require('./services/AuditService');
require('dotenv').config();

const app = express();

// ====================
// MIDDLEWARES
// ====================
app
  .use(favicon(path.join(__dirname, 'favicon.ico')))
  .use(morgan('dev'))
  .use(corsMiddleware)
  .use(bodyParser.json())
  .use(cookieParser())
  .use(trackUserSession)
  .use(standardizeResponse)
  .use(sanitizeResponses);

// ====================================
// ROUTES
// ====================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/monitoring', monitoringRoutes);

// ====================
// DATABASE SYNC
// ====================
const syncDatabase = async () => {
  try {
    console.log('🔄 [SYNC] Début de la synchronisation sécurisée...');
    
    // ✅ 1. INITIALISER LA CONNEXION DB EN PREMIER
    console.log('🔄 [SYNC] Initialisation de la connexion DB...');
    await initDb();
    // ✅ 3. SYNCHRONISATION DE LA BASE DE DONNÉES
    console.log('🔄 [SYNC] Synchronisation de la base de données...');
    await sequelize.sync({ 
      force: true, 
      alter: false, // Pas d'alter en production avec Neon
      logging: process.env.NODE_ENV === 'development' ? console.log : false 
    });
    console.log('✅ [SYNC] Synchronisation de base réussie');
    
    await initializeDefaultData();
        // await initDefaultRolesAndPermissions();

    // ✅ 2. IMPORTER ET SYNCHRONISER LES MODÈLES
    console.log('🔄 [SYNC] Import des modèles...');
    require('./models');
    
    // ✅ 4. INITIALISATION DES DONNÉES DE BASE DANS L'ORDRE CORRECT
    
    console.log('🎉 [SYNC] Synchronisation complète réussie!');
    
  } catch (error) {
    console.error('❌ [SYNC] Erreur lors de la synchronisation:', error);
    throw error;
  }
};

// ===== FONCTION D'INITIALISATION DES DONNÉES CORRIGÉE =====
const initializeDefaultData = async () => {
  try {
    console.log('🔄 [INIT] Début de l\'initialisation des données de base...');
    
    // ✅ 1. RÔLES ET PERMISSIONS EN PREMIER (dépendances de base)
    console.log('🔄 [INIT] Initialisation des rôles et permissions...');
    await initDefaultRolesAndPermissions();
    console.log('✅ [INIT] Rôles et permissions initialisés');
    
    // ✅ 2. TYPES DE POSTES (avant les postes)
    console.log('🔄 [INIT] Initialisation des types de postes...');
   
    
    // ✅ 3. CLIENT SYSTÈME (après les rôles)
   
    
    console.log('🎉 [INIT] Toutes les données de base initialisées avec succès!');
    
  } catch (error) {
    console.error('❌ [INIT] Erreur critique initialisation données:', error);
    // Continuer même en cas d'erreur pour ne pas bloquer l'app
  }
};



// ✅ DÉMARRAGE AVEC GESTION D'ERREURS ROBUSTE
if (require.main === module) {
  const port = process.env.PORT || 3000;
  
  console.log('🚀 [APP] Démarrage de l\'application Gaming Center...');
  console.log(`📋 [APP] Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ [APP] Base de données: ${process.env.DATABASE_URL ? 'Neon PostgreSQL' : 'Local'}`);
  
  syncDatabase()
    .then(() => {
      app.listen(port, () => {
        console.log(`🚀 [APP] Serveur démarré avec succès sur http://localhost:${port}`);
        console.log('✅ [APP] Toutes les initialisations terminées');
        console.log('📊 [APP] Application prête à recevoir des requêtes');
      });
    })
    .catch(error => {
      console.error('❌ [APP] Erreur fatale lors du démarrage:', error);
      
      // ✅ MODE DÉGRADÉ AVEC INITIALISATIONS MINIMALES
      console.log('🔄 [APP] Tentative de démarrage en mode dégradé...');
      
      // Essayer au moins d'initialiser la connexion DB
      initDb()
        .then(() => {
          app.listen(port, () => {
            console.log(`⚠️ [APP] Serveur démarré en mode dégradé sur http://localhost:${port}`);
            console.log('⚠️ [APP] Certaines fonctionnalités peuvent ne pas être disponibles');
            console.log('🔧 [APP] Vérifiez les logs pour les erreurs d\'initialisation');
          });
        })
        .catch(dbError => {
          console.error('❌ [APP] Impossible de se connecter à la base de données:', dbError);
          console.log('💀 [APP] Arrêt de l\'application - problème de connexion DB critique');
          process.exit(1);
        });
    });
}

// ====================
// ERROR HANDLER
// ====================
app.use(errorMiddleware);

// ====================
// CLEANUP TASK
// ====================
setInterval(async () => {
  try {
    await AuditService.cleanupInactiveSessions(240);
  } catch (error) {
    console.error('⚠️ [CLEANUP] Erreur nettoyage sessions:', error.message);
  }
}, 60 * 60 * 1000); // Toutes les heures

module.exports = app;