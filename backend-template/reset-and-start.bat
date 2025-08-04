@echo off
echo 🧹 Nettoyage complet et réinitialisation...

REM Aller dans le dossier backend
cd /d "C:\Users\Mohamed\Desktop\Template\backend-template"

REM Nettoyer la base de données
echo 🗑️ Suppression de l'ancienne base de données...
if exist database.sqlite del /f database.sqlite

REM Attendre un moment
timeout /t 2 /nobreak > nul

REM Initialiser et démarrer
echo 🚀 Initialisation et démarrage...
node initAndStart.js
