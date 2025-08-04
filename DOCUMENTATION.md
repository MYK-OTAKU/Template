# Dashboard Template - Documentation Complète

**Version:** 1.0.0  
**Auteur:** Manus AI  
**Date:** 31 juillet 2025

## Table des Matières

1. [Introduction](#introduction)
2. [Architecture du Projet](#architecture-du-projet)
3. [Installation et Configuration](#installation-et-configuration)
4. [Frontend React](#frontend-react)
5. [Backend Node.js](#backend-nodejs)
6. [Système d'Authentification](#système-dauthentification)
7. [Gestion des Utilisateurs, Rôles et Permissions](#gestion-des-utilisateurs-rôles-et-permissions)
8. [Système de Notifications](#système-de-notifications)
9. [Thèmes et Personnalisation](#thèmes-et-personnalisation)
10. [Internationalisation](#internationalisation)
11. [Déploiement](#déploiement)
12. [Guide de Développement](#guide-de-développement)
13. [API Reference](#api-reference)
14. [Dépannage](#dépannage)
15. [Contribution](#contribution)

---

## Introduction

Ce template de dashboard est une solution complète et moderne pour créer rapidement des applications web d'administration. Il combine un frontend React avec un backend Node.js, offrant toutes les fonctionnalités essentielles d'un système de gestion d'entreprise.

### Caractéristiques Principales

Le template a été conçu pour être **générique et réutilisable**, permettant aux développeurs de créer rapidement des dashboards personnalisés sans partir de zéro. Il intègre les meilleures pratiques de développement moderne et offre une base solide pour tout type d'application d'administration.

**Fonctionnalités clés :**
- Authentification complète avec JWT et 2FA
- Gestion avancée des utilisateurs, rôles et permissions
- Système de notifications en temps réel
- Thèmes personnalisables (clair/sombre)
- Support multi-langues (français/anglais)
- Interface responsive et moderne
- API RESTful documentée
- Base de données flexible (SQLite/PostgreSQL)

### Évolution du Projet

Ce template est né de la transformation de deux repositories existants initialement conçus pour la gestion d'un club de gaming. L'objectif était de généraliser ces composants spécifiques pour créer un template réutilisable dans n'importe quel contexte d'entreprise.

**Transformations effectuées :**
- Refactorisation complète de l'interface utilisateur
- Généralisation des composants métier
- Amélioration du système de notifications
- Intégration de react-toastify pour une meilleure UX
- Création d'un système de thèmes personnalisables
- Ajout de traductions complètes
- Optimisation de la configuration de base de données

---


## Architecture du Projet

### Vue d'Ensemble

L'architecture du template suit une approche moderne de séparation des préoccupations, avec un frontend React découplé d'un backend Node.js. Cette architecture permet une grande flexibilité de déploiement et facilite la maintenance à long terme.

```
Dashboard Template
├── frontend-template/          # Application React
│   ├── src/
│   │   ├── components/         # Composants réutilisables
│   │   ├── pages/             # Pages de l'application
│   │   ├── contexts/          # Contextes React (Auth, Theme, etc.)
│   │   ├── hooks/             # Hooks personnalisés
│   │   ├── services/          # Services API
│   │   ├── utils/             # Utilitaires
│   │   └── locales/           # Fichiers de traduction
│   ├── public/                # Assets statiques
│   └── package.json
└── backend-template/           # API Node.js
    ├── controllers/           # Contrôleurs de routes
    ├── models/               # Modèles Sequelize
    ├── routes/               # Définition des routes
    ├── middlewares/          # Middlewares Express
    ├── services/             # Services métier
    ├── config/               # Configuration
    └── package.json
```

### Stack Technologique

**Frontend :**
- **React 19.1.0** - Framework JavaScript moderne
- **Vite** - Outil de build rapide et moderne
- **Tailwind CSS** - Framework CSS utilitaire
- **React Router** - Gestion des routes côté client
- **React Query** - Gestion de l'état des données asynchrones
- **React Toastify** - Système de notifications
- **Lucide React** - Icônes modernes
- **Recharts** - Graphiques et visualisations

**Backend :**
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web minimaliste
- **Sequelize** - ORM pour bases de données
- **JWT** - Authentification par tokens
- **Bcrypt** - Hachage des mots de passe
- **Passport.js** - Stratégies d'authentification
- **Multer** - Gestion des uploads de fichiers

**Base de Données :**
- **SQLite** - Base de données locale (développement)
- **PostgreSQL** - Base de données production (Supabase compatible)

### Patterns Architecturaux

**Frontend - Architecture par Composants :**
Le frontend utilise une architecture basée sur des composants réutilisables, organisés selon les principes de la composition React. Chaque composant a une responsabilité unique et peut être facilement testé et maintenu.

**Backend - Architecture MVC :**
Le backend suit le pattern Model-View-Controller adapté pour une API REST :
- **Models** : Définition des entités et relations de données
- **Controllers** : Logique métier et traitement des requêtes
- **Routes** : Points d'entrée de l'API et validation des paramètres

**Gestion d'État :**
- **React Context** pour l'état global (authentification, thème, langue)
- **React Query** pour la gestion du cache et des requêtes API
- **Local State** pour l'état des composants individuels

### Communication Frontend-Backend

La communication entre le frontend et le backend s'effectue exclusivement via une API REST. Cette approche garantit une séparation claire des responsabilités et permet un déploiement indépendant des deux parties.

**Protocole de Communication :**
- **Format** : JSON pour tous les échanges
- **Authentification** : JWT Bearer tokens
- **CORS** : Configuration flexible pour le développement et la production
- **Validation** : Validation côté client et serveur
- **Gestion d'Erreurs** : Codes de statut HTTP standardisés

---


## Installation et Configuration

### Prérequis

Avant de commencer l'installation, assurez-vous que votre environnement de développement dispose des outils suivants :

**Outils Requis :**
- **Node.js** version 18.0 ou supérieure
- **npm** version 8.0 ou supérieure (ou yarn/pnpm)
- **Git** pour le clonage des repositories
- **Un éditeur de code** (VS Code recommandé)

**Outils Optionnels :**
- **Docker** pour la containerisation
- **PostgreSQL** pour la base de données de production
- **Postman** ou équivalent pour tester l'API

### Installation du Backend

**Étape 1 : Clonage et Installation**

```bash
# Cloner le repository backend
git clone <backend-repository-url> backend-template
cd backend-template

# Installer les dépendances
npm install

# Installer les outils de compilation (si nécessaire pour SQLite)
sudo apt-get install build-essential  # Linux
# ou
xcode-select --install  # macOS
```

**Étape 2 : Configuration de l'Environnement**

Créez un fichier `.env` à la racine du projet backend en vous basant sur `.env.example` :

```env
# Configuration de la base de données
DB_TYPE=sqlite
SQLITE_PATH=./database.sqlite

# Configuration JWT
JWT_SECRET=votre_clé_secrète_très_sécurisée
JWT_EXPIRES_IN=24h

# Configuration du serveur
PORT=3000
NODE_ENV=development

# Configuration CORS
CORS_ORIGIN=http://localhost:5173

# Configuration de l'application
APP_NAME=Dashboard Template
APP_URL=http://localhost:3000
```

**Étape 3 : Initialisation de la Base de Données**

```bash
# Démarrer le serveur (la base de données sera créée automatiquement)
npm start

# Ou créer un utilisateur administrateur
node createAdminUser.js
```

### Installation du Frontend

**Étape 1 : Clonage et Installation**

```bash
# Cloner le repository frontend
git clone <frontend-repository-url> frontend-template
cd frontend-template

# Installer les dépendances
npm install
```

**Étape 2 : Configuration de l'Environnement**

Créez un fichier `.env` à la racine du projet frontend :

```env
# Configuration de l'API
VITE_API_URL=http://localhost:3000/api

# Configuration de l'application
VITE_APP_NAME=Dashboard Template
VITE_APP_VERSION=1.0.0

# Configuration du développement
VITE_DEV_MODE=true
```

**Étape 3 : Démarrage du Serveur de Développement**

```bash
# Démarrer le serveur de développement
npm run dev

# L'application sera accessible sur http://localhost:5173
```

### Configuration de la Base de Données

Le template supporte deux types de bases de données selon vos besoins :

**SQLite (Recommandé pour le Développement) :**
- Configuration automatique
- Aucune installation supplémentaire requise
- Fichier de base de données local
- Idéal pour les tests et le développement

**PostgreSQL/Supabase (Recommandé pour la Production) :**

```env
# Configuration PostgreSQL
DB_TYPE=postgres
DB_NAME=dashboard_template_db
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_HOST=localhost
DB_PORT=5432
```

**Configuration Supabase :**

```env
# Configuration Supabase
DB_TYPE=postgres
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_supabase
DB_HOST=db.votre-projet.supabase.co
DB_PORT=5432
```

### Vérification de l'Installation

**Test du Backend :**

```bash
# Vérifier que l'API répond
curl http://localhost:3000/api/auth/status

# Réponse attendue :
# {"success": true, "message": "API is running"}
```

**Test du Frontend :**
1. Ouvrez votre navigateur sur `http://localhost:5173`
2. Vous devriez voir la page de connexion du dashboard
3. Vérifiez que les thèmes clair/sombre fonctionnent
4. Testez le changement de langue

### Configuration Avancée

**Variables d'Environnement Complètes :**

```env
# Backend (.env)
# Base de données
DB_TYPE=sqlite|postgres
SQLITE_PATH=./database.sqlite
DB_NAME=dashboard_template_db
DB_USER=username
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_TIMEZONE=+00:00

# Authentification
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Serveur
PORT=3000
NODE_ENV=development|production

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Application
APP_NAME=Dashboard Template
APP_URL=http://localhost:3000
```

```env
# Frontend (.env)
# API
VITE_API_URL=http://localhost:3000/api

# Application
VITE_APP_NAME=Dashboard Template
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Template de dashboard moderne

# Développement
VITE_DEV_MODE=true
VITE_DEBUG_MODE=false

# Fonctionnalités
VITE_ENABLE_2FA=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_THEMES=true
```

---


## Frontend React

### Structure des Composants

Le frontend React est organisé selon une architecture modulaire qui favorise la réutilisabilité et la maintenabilité. Chaque composant a une responsabilité spécifique et peut être facilement testé et modifié.

**Organisation des Dossiers :**

```
src/
├── components/                 # Composants réutilisables
│   ├── Dashboard/             # Composants du tableau de bord
│   ├── Header/                # En-tête de l'application
│   ├── Sidebar/               # Barre latérale de navigation
│   ├── Login/                 # Composants d'authentification
│   ├── Toast/                 # Système de notifications
│   ├── ThemeCustomizer/       # Personnalisation des thèmes
│   ├── common/                # Composants communs
│   └── ui/                    # Composants d'interface de base
├── pages/                     # Pages de l'application
│   ├── Home/                  # Page d'accueil
│   ├── Users/                 # Gestion des utilisateurs
│   ├── Roles/                 # Gestion des rôles
│   ├── Permissions/           # Gestion des permissions
│   ├── Settings/              # Paramètres
│   └── Notifications/         # Centre de notifications
├── contexts/                  # Contextes React
│   ├── AuthContext.jsx        # Authentification
│   ├── ThemeContext.jsx       # Gestion des thèmes
│   ├── LanguageContext.jsx    # Internationalisation
│   └── NotificationContext.jsx # Notifications
├── hooks/                     # Hooks personnalisés
│   ├── useAuth.js             # Hook d'authentification
│   ├── useNotifications.js    # Hook de notifications
│   └── useLocalStorage.js     # Hook de stockage local
├── services/                  # Services API
│   ├── authService.js         # Service d'authentification
│   ├── userService.js         # Service utilisateurs
│   └── notificationService.js # Service notifications
├── utils/                     # Utilitaires
│   ├── toast.js               # Utilitaires de notifications
│   ├── validation.js          # Validation des formulaires
│   └── constants.js           # Constantes de l'application
└── locales/                   # Fichiers de traduction
    ├── fr.json                # Traductions françaises
    └── en.json                # Traductions anglaises
```

### Composants Principaux

**Dashboard Component :**
Le composant Dashboard sert de conteneur principal pour l'application authentifiée. Il gère la mise en page générale, la navigation et l'affichage des différentes pages selon les routes.

```jsx
// Exemple d'utilisation du Dashboard
import Dashboard from './components/Dashboard/Dashboard';

function App() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

**Login Component :**
Le composant Login offre une interface d'authentification moderne avec support de l'authentification à deux facteurs. Il intègre des animations fluides et s'adapte automatiquement au thème sélectionné.

**Caractéristiques du Login :**
- Interface responsive avec animations
- Support des thèmes clair/sombre
- Validation en temps réel
- Gestion des erreurs intégrée
- Animations de fond personnalisables
- Support de l'authentification 2FA

**Header Component :**
L'en-tête de l'application contient les éléments de navigation principaux, le sélecteur de langue, le sélecteur de thème, et les notifications utilisateur.

**Sidebar Component :**
La barre latérale offre une navigation hiérarchique avec des icônes modernes. Elle s'adapte automatiquement aux permissions de l'utilisateur connecté.

### Gestion d'État avec React Context

Le template utilise plusieurs contextes React pour gérer l'état global de l'application de manière efficace et prévisible.

**AuthContext :**
Gère l'état d'authentification de l'utilisateur, les tokens JWT, et les informations de session.

```jsx
const { user, login, logout, isAuthenticated } = useAuth();
```

**ThemeContext :**
Contrôle le thème de l'application (clair/sombre/automatique) et permet la personnalisation des couleurs.

```jsx
const { theme, setTheme, effectiveTheme } = useTheme();
```

**LanguageContext :**
Gère la langue de l'interface et fournit les traductions.

```jsx
const { language, setLanguage, translations } = useLanguage();
```

**NotificationContext :**
Centralise la gestion des notifications toast et des notifications persistantes.

```jsx
const { showSuccess, showError, notifications } = useNotificationContext();
```

### Hooks Personnalisés

Le template inclut plusieurs hooks personnalisés qui encapsulent la logique métier et facilitent la réutilisation du code.

**useNotifications Hook :**
Ce hook offre une interface complète pour gérer les notifications côté client et serveur.

```jsx
const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  refreshNotifications
} = useNotifications();
```

**useAuth Hook :**
Simplifie l'accès aux fonctionnalités d'authentification dans tous les composants.

```jsx
const {
  user,
  login,
  logout,
  isAuthenticated,
  hasPermission,
  loading
} = useAuth();
```

### Système de Routage

Le routage utilise React Router v7 avec une structure hiérarchique qui respecte les permissions utilisateur.

**Structure des Routes :**

```jsx
<Routes>
  <Route path="/" element={<LoginPage />} />
  <Route path="/verify-2fa" element={<TwoFactorPage />} />
  <Route path="/dashboard/*" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
</Routes>
```

**Routes Protégées :**
Toutes les routes du dashboard sont protégées par le composant `ProtectedRoute` qui vérifie l'authentification et les permissions.

### Styling avec Tailwind CSS

Le template utilise Tailwind CSS pour un styling moderne et maintenir une cohérence visuelle. La configuration Tailwind a été étendue pour supporter les thèmes personnalisés.

**Variables CSS Personnalisées :**

```css
:root {
  --color-primary: 139 92 246;    /* purple-500 */
  --color-secondary: 6 182 212;   /* cyan-500 */
  --color-accent: 236 72 153;     /* pink-500 */
  --font-size-base: 16px;
}
```

**Classes Utilitaires Personnalisées :**

```css
.btn-primary {
  background: linear-gradient(135deg, rgb(var(--color-primary) / 1), rgb(var(--color-primary) / 0.8));
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700;
}
```

### Optimisations de Performance

**Code Splitting :**
Le template utilise le code splitting automatique de Vite pour optimiser les temps de chargement.

**React Query :**
La gestion du cache avec React Query réduit les requêtes réseau redondantes et améliore la réactivité de l'interface.

**Lazy Loading :**
Les composants non critiques sont chargés de manière paresseuse pour améliorer les performances initiales.

**Memoization :**
Les composants coûteux utilisent React.memo et useMemo pour éviter les re-rendus inutiles.

---


## Backend Node.js

### Architecture du Backend

Le backend Node.js suit une architecture modulaire basée sur Express.js, conçue pour être scalable et maintenable. L'organisation du code respecte les principes de séparation des responsabilités et facilite les tests unitaires.

**Structure des Dossiers :**

```
backend-template/
├── controllers/               # Contrôleurs de routes
│   ├── AuthController.js      # Authentification
│   ├── UserController.js      # Gestion des utilisateurs
│   ├── RoleController.js      # Gestion des rôles
│   └── NotificationController.js # Notifications
├── models/                    # Modèles Sequelize
│   ├── User.js               # Modèle utilisateur
│   ├── Role.js               # Modèle rôle
│   ├── Permission.js         # Modèle permission
│   ├── Notification.js       # Modèle notification
│   ├── Settings.js           # Modèle paramètres
│   └── index.js              # Associations des modèles
├── routes/                    # Définition des routes
│   ├── AuthRoutes.js         # Routes d'authentification
│   ├── UserRoutes.js         # Routes utilisateurs
│   ├── RoleRoutes.js         # Routes rôles
│   ├── NotificationRoutes.js # Routes notifications
│   └── SettingsRoutes.js     # Routes paramètres
├── middlewares/               # Middlewares Express
│   ├── auth.js               # Authentification JWT
│   ├── permissions.js        # Vérification des permissions
│   ├── cors.js               # Configuration CORS
│   └── validation.js         # Validation des données
├── services/                  # Services métier
│   ├── AuthService.js        # Service d'authentification
│   ├── EmailService.js       # Service d'email
│   └── NotificationService.js # Service de notifications
├── config/                    # Configuration
│   ├── sequelize.js          # Configuration base de données
│   └── passport.js           # Configuration Passport
├── utils/                     # Utilitaires
│   ├── errorHandler.js       # Gestion des erreurs
│   ├── responseHandler.js    # Standardisation des réponses
│   └── validation.js         # Utilitaires de validation
└── migrations/                # Migrations de base de données
```

### Configuration de Base de Données

Le template supporte deux types de bases de données avec une configuration dynamique basée sur les variables d'environnement.

**Configuration SQLite (Développement) :**

```javascript
// config/sequelize.js
if (dbType === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_PATH || './database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: false
    }
  });
}
```

**Configuration PostgreSQL (Production) :**

```javascript
if (dbType === 'postgres') {
  sequelize = new Sequelize({
    database: process.env.DB_NAME || 'dashboard_template_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
}
```

### Modèles de Données

**Modèle User :**
Le modèle utilisateur inclut toutes les informations nécessaires pour l'authentification et la gestion des profils.

```javascript
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'roles', key: 'id' }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isTwoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});
```

**Modèle Role :**
Gère les rôles utilisateur avec leurs permissions associées.

```javascript
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});
```

**Modèle Notification :**
Système de notifications flexible supportant les notifications globales et personnalisées.

```javascript
const Notification = sequelize.define('Notification', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = notification globale
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'system'),
    defaultValue: 'info'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isGlobal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});
```

**Modèle Settings :**
Système de paramètres flexible pour la configuration de l'application.

```javascript
const Settings = sequelize.define('Settings', {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string'
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});
```

### API Routes et Contrôleurs

**Routes d'Authentification :**

```javascript
// routes/AuthRoutes.js
router.post('/login', AuthController.login);
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/refresh', AuthController.refreshToken);
router.get('/me', authenticateToken, AuthController.getCurrentUser);
router.post('/verify-2fa', AuthController.verifyTwoFactor);
```

**Routes Utilisateurs :**

```javascript
// routes/UserRoutes.js
router.get('/', authenticateToken, checkPermission('users.read'), UserController.getAllUsers);
router.post('/', authenticateToken, checkPermission('users.create'), UserController.createUser);
router.put('/:id', authenticateToken, checkPermission('users.update'), UserController.updateUser);
router.delete('/:id', authenticateToken, checkPermission('users.delete'), UserController.deleteUser);
```

**Routes Notifications :**

```javascript
// routes/NotificationRoutes.js
router.get('/', authenticateToken, NotificationController.getUserNotifications);
router.put('/:id/read', authenticateToken, NotificationController.markAsRead);
router.post('/admin/create', authenticateToken, checkPermission('notifications.create'), NotificationController.createNotification);
```

### Middlewares de Sécurité

**Middleware d'Authentification :**

```javascript
// middlewares/auth.js
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};
```

**Middleware de Permissions :**

```javascript
// middlewares/permissions.js
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          include: [Permission]
        }]
      });

      const userPermissions = user.Role.Permissions.map(p => p.name);
      
      if (!userPermissions.includes(permission)) {
        return res.status(403).json({ message: 'Permission insuffisante' });
      }

      req.user.permissions = userPermissions;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Erreur de vérification des permissions' });
    }
  };
};
```

### Gestion des Erreurs

**Middleware de Gestion d'Erreurs :**

```javascript
// utils/errorHandler.js
const errorMiddleware = (err, req, res, next) => {
  console.error('Erreur:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: err.errors
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Conflit de données',
      field: err.errors[0].path
    });
  }

  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
};
```

### Services Métier

**Service d'Authentification :**

```javascript
// services/AuthService.js
class AuthService {
  static async login(username, password) {
    const user = await User.findOne({ 
      where: { username },
      include: [Role]
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Identifiants invalides');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return { user, token };
  }
}
```

**Service de Notifications :**

```javascript
// services/NotificationService.js
class NotificationService {
  static async createForUser(userId, title, message, options = {}) {
    return await Notification.create({
      userId,
      title,
      message,
      type: options.type || 'info',
      priority: options.priority || 'normal'
    });
  }

  static async broadcastToAll(title, message, options = {}) {
    return await Notification.create({
      userId: null,
      title,
      message,
      isGlobal: true,
      type: options.type || 'info',
      priority: options.priority || 'normal'
    });
  }
}
```

---


## Système d'Authentification

### Vue d'Ensemble

Le système d'authentification du template utilise JSON Web Tokens (JWT) pour une authentification stateless et sécurisée. Il supporte l'authentification à deux facteurs (2FA) et offre une gestion complète des sessions utilisateur.

**Fonctionnalités d'Authentification :**
- Authentification par nom d'utilisateur/mot de passe
- Tokens JWT avec expiration configurable
- Authentification à deux facteurs (TOTP)
- Refresh tokens pour la sécurité
- Gestion des sessions multiples
- Hachage sécurisé des mots de passe avec bcrypt

### Flux d'Authentification

**1. Connexion Standard :**
```
Client → POST /api/auth/login → Serveur
       ← JWT Token + User Info ←
```

**2. Connexion avec 2FA :**
```
Client → POST /api/auth/login → Serveur (vérifie credentials)
       ← Temporary Token ←
Client → POST /api/auth/verify-2fa → Serveur (vérifie TOTP)
       ← JWT Token + User Info ←
```

**3. Vérification de Token :**
```
Client → GET /api/auth/me (avec Bearer Token) → Serveur
       ← User Info ←
```

### Configuration JWT

```javascript
// Configuration JWT dans le backend
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  algorithm: 'HS256'
};

// Génération du token
const token = jwt.sign(
  { 
    id: user.id, 
    username: user.username,
    roleId: user.roleId 
  },
  jwtConfig.secret,
  { expiresIn: jwtConfig.expiresIn }
);
```

### Authentification à Deux Facteurs

Le template intègre l'authentification à deux facteurs basée sur TOTP (Time-based One-Time Password) compatible avec Google Authenticator et autres applications similaires.

**Activation du 2FA :**
1. L'utilisateur demande l'activation du 2FA
2. Le serveur génère un secret unique
3. Un QR code est généré pour l'application d'authentification
4. L'utilisateur confirme avec un code TOTP
5. Le 2FA est activé pour le compte

**Vérification 2FA :**
```javascript
// Service de vérification 2FA
const speakeasy = require('speakeasy');

const verifyTwoFactor = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Tolérance de 2 périodes (60 secondes)
  });
};
```

---

## Gestion des Utilisateurs, Rôles et Permissions

### Système de Rôles

Le template implémente un système de rôles et permissions flexible qui permet un contrôle d'accès granulaire aux différentes fonctionnalités de l'application.

**Hiérarchie des Permissions :**
```
Utilisateur → Rôle → Permissions
```

**Rôles par Défaut :**
- **Super Admin** : Accès complet à toutes les fonctionnalités
- **Admin** : Gestion des utilisateurs et configuration
- **Manager** : Gestion limitée des utilisateurs
- **User** : Accès de base aux fonctionnalités

### Gestion des Permissions

**Format des Permissions :**
Les permissions suivent le format `RESOURCE_ACTION` :
- `users.read` : Lire les utilisateurs
- `users.create` : Créer des utilisateurs
- `users.update` : Modifier des utilisateurs
- `users.delete` : Supprimer des utilisateurs
- `roles.manage` : Gérer les rôles
- `settings.admin` : Administrer les paramètres

**Vérification des Permissions :**
```javascript
// Côté backend
const hasPermission = (userPermissions, requiredPermission) => {
  return userPermissions.includes(requiredPermission);
};

// Côté frontend
const { hasPermission } = useAuth();

if (hasPermission('users.create')) {
  // Afficher le bouton de création
}
```

### Interface de Gestion

**Page Utilisateurs :**
- Liste paginée avec filtres et recherche
- Création/modification d'utilisateurs
- Assignation de rôles
- Activation/désactivation de comptes
- Historique des connexions

**Page Rôles :**
- Gestion des rôles existants
- Création de nouveaux rôles
- Attribution de permissions
- Visualisation des utilisateurs par rôle

**Page Permissions :**
- Vue d'ensemble des permissions système
- Création de nouvelles permissions
- Catégorisation des permissions
- Audit des accès

---

## Système de Notifications

### Architecture des Notifications

Le système de notifications du template offre une solution complète pour informer les utilisateurs en temps réel. Il combine des notifications toast temporaires avec un système de notifications persistantes.

**Types de Notifications :**
- **Toast** : Notifications temporaires non-intrusives
- **Persistantes** : Notifications sauvegardées en base de données
- **Globales** : Notifications diffusées à tous les utilisateurs
- **Personnalisées** : Notifications ciblées par utilisateur

### Notifications Toast (Frontend)

**Intégration React Toastify :**
```javascript
// Configuration dans App.jsx
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      {/* Votre application */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}
```

**Utilisation des Toasts :**
```javascript
import { showToast } from '../utils/toast';

// Différents types de notifications
showToast.success('Opération réussie !');
showToast.error('Une erreur est survenue');
showToast.warning('Attention : action requise');
showToast.info('Information importante');
```

### Notifications Persistantes (Backend)

**Modèle de Notification :**
```javascript
const Notification = sequelize.define('Notification', {
  userId: DataTypes.INTEGER, // null pour notifications globales
  title: DataTypes.STRING,
  message: DataTypes.TEXT,
  type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'system'),
  priority: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
  isRead: DataTypes.BOOLEAN,
  isGlobal: DataTypes.BOOLEAN,
  expiresAt: DataTypes.DATE
});
```

**API de Notifications :**
```javascript
// Créer une notification pour un utilisateur
POST /api/notifications/admin/create
{
  "userId": 123,
  "title": "Nouveau message",
  "message": "Vous avez reçu un nouveau message",
  "type": "info",
  "priority": "normal"
}

// Diffuser une notification globale
POST /api/notifications/admin/broadcast
{
  "title": "Maintenance programmée",
  "message": "Le système sera en maintenance demain",
  "type": "warning",
  "priority": "high"
}
```

### Hook useNotifications

**Utilisation du Hook :**
```javascript
const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  refreshNotifications,
  isLoading
} = useNotifications({
  page: 1,
  limit: 20,
  unreadOnly: false
});
```

**Fonctionnalités du Hook :**
- Récupération automatique des notifications
- Gestion du cache avec React Query
- Mise à jour en temps réel du compteur
- Actions de lecture/suppression
- Pagination intégrée

---

## Thèmes et Personnalisation

### Système de Thèmes

Le template offre un système de thèmes flexible qui permet aux utilisateurs de personnaliser l'apparence de l'application selon leurs préférences.

**Thèmes Disponibles :**
- **Clair** : Thème par défaut avec couleurs claires
- **Sombre** : Thème sombre pour réduire la fatigue oculaire
- **Automatique** : Suit les préférences système de l'utilisateur

### Configuration des Thèmes

**Variables CSS Personnalisées :**
```css
:root {
  /* Couleurs principales */
  --color-primary: 139 92 246;    /* purple-500 */
  --color-secondary: 6 182 212;   /* cyan-500 */
  --color-accent: 236 72 153;     /* pink-500 */
  
  /* Taille de police */
  --font-size-base: 16px;
}

/* Mode sombre */
.dark {
  --color-background: 17 24 39;   /* gray-900 */
  --color-surface: 31 41 55;      /* gray-800 */
  --color-text: 243 244 246;      /* gray-100 */
}
```

**Configuration Tailwind :**
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          500: 'rgb(var(--color-primary) / 1)',
          // ... autres nuances
        }
      }
    }
  }
};
```

### Personnalisation Avancée

**Composant ThemeCustomizer :**
Le composant ThemeCustomizer permet aux utilisateurs de personnaliser :
- Couleurs principales (primaire, secondaire, accent)
- Taille de police (petite, moyenne, grande)
- Mode de thème (clair, sombre, automatique)

**Sauvegarde des Préférences :**
```javascript
// Sauvegarde dans localStorage
const saveThemePreferences = (preferences) => {
  localStorage.setItem('themePreferences', JSON.stringify(preferences));
  
  // Application immédiate des styles
  const root = document.documentElement;
  root.style.setProperty('--color-primary', preferences.primaryColor);
  root.style.setProperty('--font-size-base', preferences.fontSize);
};
```

---

## Internationalisation

### Support Multi-Langues

Le template supporte nativement le français et l'anglais, avec une architecture extensible pour ajouter d'autres langues.

**Fichiers de Traduction :**
```
src/locales/
├── fr.json    # Traductions françaises
└── en.json    # Traductions anglaises
```

**Structure des Traductions :**
```json
{
  "auth": {
    "login": "Se connecter",
    "logout": "Se déconnecter",
    "username": "Nom d'utilisateur",
    "password": "Mot de passe"
  },
  "dashboard": {
    "welcome": "Bienvenue sur votre tableau de bord",
    "overview": "Vue d'ensemble"
  },
  "notifications": {
    "markAsRead": "Marquer comme lu",
    "deleteAll": "Tout supprimer"
  }
}
```

### Hook useLanguage

**Utilisation :**
```javascript
const { language, setLanguage, translations, t } = useLanguage();

// Changement de langue
setLanguage('en');

// Utilisation des traductions
<h1>{translations.dashboard.welcome}</h1>
<button>{t('auth.login')}</button>
```

**Détection Automatique :**
```javascript
// Détection de la langue du navigateur
const detectBrowserLanguage = () => {
  const browserLang = navigator.language.split('-')[0];
  return ['fr', 'en'].includes(browserLang) ? browserLang : 'fr';
};
```

---

## Guide de Développement

### Ajout de Nouvelles Fonctionnalités

**1. Création d'un Nouveau Modèle :**
```javascript
// models/NewModel.js
const NewModel = sequelize.define('NewModel', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: DataTypes.TEXT
});

module.exports = NewModel;
```

**2. Création des Routes :**
```javascript
// routes/NewModelRoutes.js
const express = require('express');
const router = express.Router();
const NewModelController = require('../controllers/NewModelController');

router.get('/', NewModelController.getAll);
router.post('/', NewModelController.create);

module.exports = router;
```

**3. Création du Contrôleur :**
```javascript
// controllers/NewModelController.js
class NewModelController {
  static async getAll(req, res) {
    try {
      const items = await NewModel.findAll();
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
```

**4. Ajout des Traductions :**
```json
// locales/fr.json
{
  "newFeature": {
    "title": "Nouvelle Fonctionnalité",
    "create": "Créer",
    "edit": "Modifier"
  }
}
```

### Bonnes Pratiques

**Sécurité :**
- Toujours valider les données d'entrée
- Utiliser les middlewares d'authentification
- Vérifier les permissions avant les actions sensibles
- Hasher les mots de passe avec bcrypt
- Utiliser HTTPS en production

**Performance :**
- Implémenter la pagination pour les listes
- Utiliser React.memo pour les composants coûteux
- Optimiser les requêtes SQL avec les includes
- Mettre en cache les données fréquemment utilisées

**Maintenabilité :**
- Respecter la structure des dossiers
- Documenter les fonctions complexes
- Utiliser des noms de variables explicites
- Séparer la logique métier des composants UI

---

## Déploiement

### Déploiement en Production

**Préparation du Backend :**
```bash
# Installation des dépendances de production
npm ci --only=production

# Configuration des variables d'environnement
export NODE_ENV=production
export DB_TYPE=postgres
export JWT_SECRET=your_production_secret

# Démarrage du serveur
npm start
```

**Préparation du Frontend :**
```bash
# Build de production
npm run build

# Les fichiers sont générés dans le dossier dist/
```

**Configuration Nginx :**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Déploiement avec Docker

**Dockerfile Backend :**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**Dockerfile Frontend :**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

**Docker Compose :**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend-template
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_TYPE=postgres
    depends_on:
      - database

  frontend:
    build: ./frontend-template
    ports:
      - "80:80"
    depends_on:
      - backend

  database:
    image: postgres:15
    environment:
      - POSTGRES_DB=dashboard_template_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Conclusion

Ce template de dashboard offre une base solide et moderne pour développer des applications web d'administration. Il intègre les meilleures pratiques de développement et fournit toutes les fonctionnalités essentielles pour créer rapidement des solutions professionnelles.

**Points Forts du Template :**
- Architecture modulaire et scalable
- Sécurité renforcée avec JWT et 2FA
- Interface utilisateur moderne et responsive
- Système de notifications complet
- Thèmes personnalisables
- Support multi-langues
- Documentation complète

**Prochaines Étapes :**
Pour utiliser ce template dans votre projet, suivez les instructions d'installation et adaptez les composants selon vos besoins spécifiques. N'hésitez pas à contribuer au projet en proposant des améliorations ou en signalant des problèmes.

---

**Auteur :** Manus AI  
**Version :** 1.0.0  
**Dernière mise à jour :** 31 juillet 2025

