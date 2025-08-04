@echo off
echo 🧪 Test de l'état du système Dashboard...
echo.

echo 1. Test de connectivité du backend...
node test-connection.js
if errorlevel 1 (
    echo.
    echo ❌ Le backend n'est pas accessible.
    echo 💡 Solutions :
    echo    - Exécuter: restart-backend.bat
    echo    - Ou manuellement: del database.sqlite ^&^& node initAndStart.js
    echo.
    pause
    exit /b 1
)

echo.
echo 2. Vérification du frontend...
cd ..\frontend-template
if exist node_modules (
    echo ✅ Dependencies frontend installées
) else (
    echo ⚠️ Dependencies frontend manquantes
    echo 💡 Exécuter: npm install
)

echo.
echo 🎉 Tests terminés !
echo.
echo 📋 Instructions de démarrage :
echo    Backend: cd backend-template ^&^& restart-backend.bat
echo    Frontend: cd frontend-template ^&^& npm run dev
echo.
pause
