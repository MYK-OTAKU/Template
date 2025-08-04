#!/usr/bin/env node

console.log('🚀 Démarrage du serveur backend...');

const fs = require('fs');
const path = require('path');

// Nettoyer la base de données existante
const dbPath = path.join(__dirname, 'database.sqlite');
if (fs.existsSync(dbPath)) {
  console.log('🗑️ Suppression de l\'ancienne base de données...');
  fs.unlinkSync(dbPath);
}

// Démarrer l'initialisation et le serveur
console.log('🔧 Initialisation de la base de données...');
require('./initAndStart.js');
