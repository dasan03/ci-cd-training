#!/usr/bin/env node

/**
 * Script pour exécuter le générateur HTML interactif
 */

const HTMLGenerator = require('./generate-html.js');

async function main() {
  try {
    console.log('🚀 Démarrage de la génération HTML...');
    
    const generator = new HTMLGenerator();
    await generator.generateAll();
    
    console.log('✅ Génération terminée avec succès!');
    console.log('📁 Les fichiers HTML sont disponibles dans le dossier html-output/');
    console.log('🌐 Ouvrez html-output/index.html dans votre navigateur pour commencer');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}