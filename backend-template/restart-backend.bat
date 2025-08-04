@echo off
echo 🚀 Redémarrage du backend...
echo.

REM Arrêter les processus Node.js existants
echo 🛑 Arrêt des processus Node.js existants...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

REM Supprimer l'ancienne base de données
echo 🗑️ Suppression de l'ancienne base de données...
if exist database.sqlite del database.sqlite

REM Démarrer le serveur
echo 🔧 Initialisation et démarrage du serveur...
echo.
node initAndStart.js
