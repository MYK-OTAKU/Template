@echo off
echo 🚀 Démarrage du serveur backend...
echo.

REM Naviguer vers le dossier backend
cd /d "C:\Users\Mohamed\Desktop\Template\backend-template"

echo 📂 Dossier courant: %CD%
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé ou n'est pas dans le PATH
    pause
    exit /b 1
)

echo ✅ Node.js détecté: 
node --version

echo.
echo 🔄 Démarrage du serveur avec initialisation...
echo.

REM Démarrer le serveur avec le script de force start
node forceStart.js

echo.
echo 🏁 Processus terminé.
pause
