import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Test rapide pour voir si les providers sont bien hiérarchisés
const container = document.getElementById('root');
const root = createRoot(container);

console.log('🚀 Démarrage de l\'application avec la nouvelle hiérarchie des providers...');

root.render(<App />);
