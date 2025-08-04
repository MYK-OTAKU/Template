# 🚀 Dashboard Template - Template Moderne de Tableau de Bord

Un template complet et moderne pour créer rapidement des applications web d'administration avec React et Node.js.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.1.0-61dafb.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)

## ✨ Fonctionnalités

- 🔐 **Authentification complète** - JWT + 2FA
- 👥 **Gestion des utilisateurs** - Rôles et permissions granulaires
- 🔔 **Notifications en temps réel** - Toast + notifications persistantes
- 🎨 **Thèmes personnalisables** - Clair/Sombre + couleurs personnalisées
- 🌍 **Multi-langues** - Français/Anglais (extensible)
- 📱 **Interface responsive** - Design moderne avec Tailwind CSS
- 🗄️ **Base de données flexible** - SQLite/PostgreSQL
- 📚 **Documentation complète** - Guide détaillé inclus

## 🏗️ Architecture

```
Dashboard Template
├── frontend-template/     # Application React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   ├── contexts/      # Contextes React
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── services/      # Services API
│   │   └── locales/       # Traductions
│   └── package.json
└── backend-template/      # API Node.js
    ├── controllers/       # Contrôleurs
    ├── models/           # Modèles Sequelize
    ├── routes/           # Routes API
    ├── middlewares/      # Middlewares
    └── package.json
```

## 🚀 Installation Rapide

### Prérequis
- Node.js 18+
- npm ou yarn
- Git

### Backend
```bash
# Cloner et installer le backend
git clone <backend-repo> backend-template
cd backend-template
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Démarrer le serveur
npm start
```

### Frontend
```bash
# Cloner et installer le frontend
git clone <frontend-repo> frontend-template
cd frontend-template
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec l'URL de votre API

# Démarrer l'application
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📖 Documentation

La documentation complète est disponible dans le fichier [DOCUMENTATION.md](./DOCUMENTATION.md) et inclut :

- Guide d'installation détaillé
- Architecture du projet
- API Reference
- Guide de développement
- Instructions de déploiement
- Dépannage

## 🛠️ Technologies Utilisées

### Frontend
- **React 19.1.0** - Framework JavaScript
- **Vite** - Outil de build
- **Tailwind CSS** - Framework CSS
- **React Router** - Routage
- **React Query** - Gestion d'état
- **React Toastify** - Notifications
- **Lucide React** - Icônes

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM
- **JWT** - Authentification
- **Bcrypt** - Hachage des mots de passe
- **SQLite/PostgreSQL** - Base de données

## 🔧 Configuration

### Variables d'Environnement Backend
```env
# Base de données
DB_TYPE=sqlite
SQLITE_PATH=./database.sqlite

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# Serveur
PORT=3000
NODE_ENV=development
```

### Variables d'Environnement Frontend
```env
# API
VITE_API_URL=http://localhost:3000/api

# Application
VITE_APP_NAME=Dashboard Template
VITE_APP_VERSION=1.0.0
```

## 🎯 Utilisation

### Connexion par Défaut
- **Utilisateur :** admin
- **Mot de passe :** admin123

### Fonctionnalités Principales

1. **Tableau de Bord** - Vue d'ensemble avec statistiques
2. **Gestion des Utilisateurs** - CRUD complet avec rôles
3. **Gestion des Rôles** - Attribution de permissions
4. **Notifications** - Centre de notifications
5. **Paramètres** - Configuration de l'application
6. **Profil** - Gestion du profil utilisateur

## 🚀 Déploiement

### Production Simple
```bash
# Backend
npm run build
npm start

# Frontend
npm run build
# Servir le dossier dist/ avec nginx ou autre
```

### Docker
```bash
# Construire et démarrer avec Docker Compose
docker-compose up -d
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- 📚 [Documentation complète](./DOCUMENTATION.md)
- 🐛 [Signaler un bug](../../issues)
- 💡 [Demander une fonctionnalité](../../issues)
- 📧 Contact : support@dashboard-template.com

## 🎉 Remerciements

Ce template a été créé par **Manus AI** en transformant et généralisant des composants existants pour créer une solution réutilisable et moderne.

---

**Fait avec ❤️ par Manus AI**

