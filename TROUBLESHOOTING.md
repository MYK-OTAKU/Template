# 🔧 Guide de Résolution des Problèmes Frontend

## ✅ Problèmes Résolus

### 1. Erreur `getNotificationStats is not a function`
**Problème :** La fonction `getNotificationStats` manquait dans le NotificationContext.
**Solution :** Ajouté la fonction dans le context avec les statistiques des notifications.

### 2. Avertissement DOM - Attributs autocomplete manquants
**Problème :** Les champs de connexion n'avaient pas d'attributs `autocomplete`.
**Solution :** 
- Ajouté `autoComplete="username"` sur le champ nom d'utilisateur
- Ajouté `autoComplete="current-password"` sur le champ mot de passe

### 3. Erreurs répétées de connexion aux notifications
**Problème :** Le frontend faisait des appels répétés au backend même quand celui-ci n'était pas disponible.
**Solution :** Logique intelligente dans NotificationContext pour détecter et arrêter les tentatives si le serveur est inaccessible.

## 🚀 Démarrage du Backend

### Option 1: Script automatique (Recommandé)
```bash
cd backend-template
start-server.bat
```

### Option 2: Démarrage manuel
```bash
cd backend-template
node forceStart.js
```

### Option 3: Si problèmes persistent
```bash
cd backend-template
node cleanup.js
node initAndStart.js
```

## 🧪 Test du Backend

Pour vérifier que le backend fonctionne :
```bash
node testBackend.js
```

## 📋 Checklist de Démarrage

1. ✅ Backend démarré sur port 3000
2. ✅ Base de données initialisée
3. ✅ Utilisateur admin créé (admin/admin123)
4. ✅ Frontend sur port 5173
5. ✅ Connexion réussie

## 🔑 Identifiants par défaut

- **Username:** admin
- **Password:** admin123

## 🐛 Logs Importants à Surveiller

### Backend OK :
```
✅ Connexion à la base de données SQLITE établie avec succès
✅ Utilisateur admin créé avec succès
Our app is running on http://localhost:3000
```

### Frontend OK :
```
✅ [AUTH] Connexion réussie sans 2FA pour: admin
✅ [AUTH_CONTEXT] Connexion réussie sans 2FA pour: admin
```

## 🚨 Erreurs Communes

### 1. `ECONNREFUSED` ou `net::ERR_CONNECTION_REFUSED`
- Le backend n'est pas démarré
- Solution: Lancer `start-server.bat`

### 2. `500 Internal Server Error` 
- Problème de base de données
- Solution: Relancer `node forceStart.js`

### 3. `401 Unauthorized`
- Token invalide ou expiré
- Solution: Se reconnecter

### 4. Base de données verrouillée
- Fichier SQLite utilisé par un autre processus
- Solution: Fermer VS Code, puis relancer `forceStart.js`
