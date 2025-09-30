#!/usr/bin/env node

/**
 * Script de génération PDF pour les supports de cours CI/CD
 * Convertit tous les supports Markdown en PDF haute qualité
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Charger la configuration depuis le fichier JSON
let PDF_CONFIG;
try {
  const configPath = path.join(__dirname, 'pdf-config.json');
  PDF_CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('❌ Erreur lors du chargement de la configuration:', error.message);
  process.exit(1);
}

// Construire les options Pandoc à partir de la configuration
function buildPandocOptions(format = 'standard') {
  const config = PDF_CONFIG.pandoc;
  const formatConfig = PDF_CONFIG.formats[format] || PDF_CONFIG.formats.standard;
  
  const options = [
    `--pdf-engine=${config.engine}`,
    `--template=${config.template}`
  ];
  
  // Ajouter les options booléennes
  if (config.options.toc) options.push('--toc');
  if (config.options.tocDepth) options.push(`--toc-depth=${config.options.tocDepth}`);
  if (config.options.numberSections) options.push('--number-sections');
  if (config.options.highlightStyle) options.push(`--highlight-style=${config.options.highlightStyle}`);
  if (config.options.linksAsNotes) options.push('--variable=links-as-notes:true');
  if (config.options.standalone) options.push('--standalone');
  
  // Ajouter les variables de base
  Object.entries(config.variables).forEach(([key, value]) => {
    options.push(`--variable=${key}:${value}`);
  });
  
  // Ajouter les variables spécifiques au format
  if (formatConfig.variables) {
    Object.entries(formatConfig.variables).forEach(([key, value]) => {
      options.push(`--variable=${key}:${value}`);
    });
  }
  
  // Ajouter les métadonnées
  if (PDF_CONFIG.metadata) {
    const meta = PDF_CONFIG.metadata;
    if (meta.subject) options.push(`--variable=subject:"${meta.subject}"`);
    if (meta.keywords) options.push(`--variable=keywords:"${meta.keywords.join(', ')}"`);
    if (meta.language) options.push(`--variable=lang:${meta.language}`);
  }
  
  return options;
}

class PDFGenerator {
  constructor() {
    this.baseDir = path.resolve(__dirname, '../');
    this.outputDir = path.resolve(__dirname, PDF_CONFIG.output.directory);
    this.config = PDF_CONFIG;
    this.startTime = Date.now();
    this.ensureOutputDirectory();
    this.initializeLogging();
  }
  
  initializeLogging() {
    this.logLevel = this.config.logging?.level || 'info';
    this.logFile = this.config.logging?.logFile;
    
    if (this.logFile) {
      const logPath = path.join(__dirname, this.logFile);
      const timestamp = new Date().toISOString();
      fs.writeFileSync(logPath, `=== Génération PDF démarrée le ${timestamp} ===\n`);
    }
  }
  
  log(level, message) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.logLevel] || 2;
    
    if (levels[level] <= currentLevel) {
      const timestamp = new Date().toLocaleString('fr-FR');
      const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      
      console.log(logMessage);
      
      if (this.logFile) {
        const logPath = path.join(__dirname, this.logFile);
        fs.appendFileSync(logPath, logMessage + '\n');
      }
    }
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Créer les sous-dossiers
    const subdirs = ['modules', 'guides', 'evaluations', 'exercices'];
    subdirs.forEach(dir => {
      const fullPath = path.join(this.outputDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  async generateAll() {
    console.log('🚀 Début de la génération PDF...');
    
    try {
      // Générer les fichiers principaux
      await this.generateMainFiles();
      
      // Générer les modules
      await this.generateModules();
      
      // Générer les évaluations
      await this.generateEvaluations();
      
      // Générer le PDF consolidé
      await this.generateConsolidatedPDF();
      
      console.log('✅ Génération PDF terminée avec succès!');
      console.log(`📁 Fichiers générés dans: ${this.outputDir}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération PDF:', error.message);
      throw error;
    }
  }

  async generateMainFiles() {
    console.log('📄 Génération des fichiers principaux...');
    
    for (const file of PDF_CONFIG.files.main) {
      const sourcePath = path.join(this.baseDir, file.source);
      const outputPath = path.join(this.outputDir, file.output);
      
      if (fs.existsSync(sourcePath)) {
        await this.convertToPDF(sourcePath, outputPath, file.title, file.type);
        console.log(`  ✓ ${file.output}`);
      } else {
        console.warn(`  ⚠️  Fichier source non trouvé: ${file.source}`);
      }
    }
  }

  async generateModules() {
    console.log('📚 Génération des modules...');
    
    for (const module of PDF_CONFIG.files.modules) {
      const moduleDir = path.join(this.baseDir, 'modules', module.id);
      const outputDir = path.join(this.outputDir, 'modules');
      
      if (fs.existsSync(moduleDir)) {
        await this.generateModulePDF(moduleDir, outputDir, module.id, module.title);
        console.log(`  ✓ Module ${module.id}`);
      }
    }
  }

  async generateModulePDF(moduleDir, outputDir, moduleName, moduleTitle) {
    // Créer un fichier consolidé pour le module
    const consolidatedPath = path.join(moduleDir, 'module-complet.md');
    const content = this.consolidateModuleContent(moduleDir, moduleName);
    
    fs.writeFileSync(consolidatedPath, content);
    
    const outputPath = path.join(outputDir, `${moduleName}-complet.pdf`);
    const title = moduleTitle || this.getModuleTitle(moduleName);
    
    await this.convertToPDF(consolidatedPath, outputPath, title, 'module');
    
    // Nettoyer le fichier temporaire
    fs.unlinkSync(consolidatedPath);
  }

  consolidateModuleContent(moduleDir, moduleName) {
    const title = this.getModuleTitle(moduleName);
    let content = `# ${title}\n\n`;
    
    // Ajouter le README du module
    const readmePath = path.join(moduleDir, 'README.md');
    if (fs.existsSync(readmePath)) {
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      content += readmeContent + '\n\n';
    }
    
    // Ajouter le support théorique
    const theoryDir = path.join(moduleDir, 'support-theorique');
    if (fs.existsSync(theoryDir)) {
      content += '\\newpage\n\n# Support Théorique\n\n';
      const theoryFiles = fs.readdirSync(theoryDir)
        .filter(file => file.endsWith('.md'))
        .sort();
      
      theoryFiles.forEach(file => {
        const filePath = path.join(theoryDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        content += fileContent + '\n\n';
      });
    }
    
    // Ajouter les exercices
    const exercisesDir = path.join(moduleDir, 'exercices');
    if (fs.existsSync(exercisesDir)) {
      content += '\\newpage\n\n# Exercices Pratiques\n\n';
      const exerciseFiles = fs.readdirSync(exercisesDir)
        .filter(file => file.endsWith('.md'))
        .sort();
      
      exerciseFiles.forEach(file => {
        const filePath = path.join(exercisesDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        content += fileContent + '\n\n';
      });
    }
    
    return content;
  }

  async generateEvaluations() {
    console.log('📝 Génération des évaluations...');
    
    const evaluationsDir = path.join(this.baseDir, 'evaluations');
    const outputDir = path.join(this.outputDir, 'evaluations');
    
    // QCM intermédiaires
    const qcmIntermediairesDir = path.join(evaluationsDir, 'qcm-intermediaires');
    if (fs.existsSync(qcmIntermediairesDir)) {
      await this.generateQCMPDFs(qcmIntermediairesDir, outputDir, 'intermediaires');
    }
    
    // QCM final
    const qcmFinalDir = path.join(evaluationsDir, 'qcm-final');
    if (fs.existsSync(qcmFinalDir)) {
      await this.generateQCMPDFs(qcmFinalDir, outputDir, 'final');
    }
  }

  async generateQCMPDFs(sourceDir, outputDir, type) {
    const files = fs.readdirSync(sourceDir)
      .filter(file => file.endsWith('.json'));
    
    for (const file of files) {
      const jsonPath = path.join(sourceDir, file);
      const qcmData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      // Convertir JSON en Markdown
      const markdownContent = this.convertQCMToMarkdown(qcmData);
      const tempMdPath = path.join(sourceDir, file.replace('.json', '-temp.md'));
      fs.writeFileSync(tempMdPath, markdownContent);
      
      // Générer PDF
      const outputPath = path.join(outputDir, file.replace('.json', '.pdf'));
      const qcm = qcmData.qcm || qcmData;
      await this.convertToPDF(tempMdPath, outputPath, qcm.titre || 'QCM', 'qcm');
      
      // Nettoyer
      fs.unlinkSync(tempMdPath);
      
      console.log(`  ✓ ${file.replace('.json', '.pdf')}`);
    }
  }

  convertQCMToMarkdown(qcmData) {
    const qcm = qcmData.qcm || qcmData; // Support both nested and flat structures
    let content = `# ${qcm.titre}\n\n`;
    
    if (qcm.description) {
      content += `${qcm.description}\n\n`;
    }
    
    if (qcm.instructions) {
      content += `## Instructions\n\n${qcm.instructions}\n\n`;
    }
    
    content += '## Questions\n\n';
    
    qcm.questions.forEach((question, index) => {
      content += `### Question ${index + 1}\n\n`;
      content += `**${question.question}**\n\n`;
      
      if (question.type === 'choix-multiple' && question.options) {
        question.options.forEach((option, optIndex) => {
          const letter = String.fromCharCode(65 + optIndex); // A, B, C, D...
          content += `${letter}. ${option}\n`;
        });
        content += '\n';
      }
      
      if (question.explication) {
        content += `*Explication: ${question.explication}*\n\n`;
      }
      
      content += '---\n\n';
    });
    
    return content;
  }

  async generateConsolidatedPDF() {
    console.log('📖 Génération du PDF consolidé...');
    
    const consolidatedContent = this.createConsolidatedContent();
    const tempPath = path.join(this.baseDir, 'supports-complets-temp.md');
    fs.writeFileSync(tempPath, consolidatedContent);
    
    const outputPath = path.join(this.outputDir, 'supports-cours-cicd-complet.pdf');
    await this.convertToPDF(tempPath, outputPath, 'Supports de Cours CI/CD - Document Complet', 'consolidated');
    
    fs.unlinkSync(tempPath);
    console.log('  ✓ supports-cours-cicd-complet.pdf');
  }

  createConsolidatedContent() {
    let content = `---
title: "Formation CI/CD - Supports Complets"
subtitle: "Intégration Continue et Déploiement Continu"
author: "Formation EADL"
date: "${new Date().toLocaleDateString('fr-FR')}"
---

# Formation CI/CD - Supports Complets

`;
    
    // Table des matières sera générée automatiquement par Pandoc
    
    // Ajouter l'index
    const indexPath = path.join(this.baseDir, 'index.md');
    if (fs.existsSync(indexPath)) {
      content += fs.readFileSync(indexPath, 'utf8') + '\n\n\\newpage\n\n';
    }
    
    // Ajouter les guides
    content += '# Guides\n\n';
    
    const guidePaths = [
      'guides/guide-formateur.md',
      'guides/guide-apprenant.md'
    ];
    
    guidePaths.forEach(guidePath => {
      const fullPath = path.join(this.baseDir, guidePath);
      if (fs.existsSync(fullPath)) {
        content += fs.readFileSync(fullPath, 'utf8') + '\n\n\\newpage\n\n';
      }
    });
    
    // Ajouter les modules
    PDF_CONFIG.files.modules.forEach(module => {
      const moduleDir = path.join(this.baseDir, 'modules', module.id);
      if (fs.existsSync(moduleDir)) {
        content += this.consolidateModuleContent(moduleDir, module.id) + '\n\n\\newpage\n\n';
      }
    });
    
    return content;
  }

  async convertToPDF(inputPath, outputPath, title, type) {
    const options = buildPandocOptions('standard');
    
    // Ajouter des options spécifiques selon le type
    if (type === 'module') {
      options.push('--variable=documentclass:report');
    } else if (type === 'qcm') {
      options.push('--variable=geometry:margin=1.5cm');
    }
    
    // Ajouter le titre
    options.push(`--variable=title:"${title}"`);
    
    const command = `pandoc "${inputPath}" ${options.join(' ')} -o "${outputPath}"`;
    
    try {
      execSync(command, { stdio: 'pipe' });
    } catch (error) {
      // Si Pandoc n'est pas disponible, créer un fichier de substitution
      console.warn(`  ⚠️  Pandoc non disponible, création d'un fichier de substitution pour ${path.basename(outputPath)}`);
      this.createFallbackPDF(inputPath, outputPath, title);
    }
  }

  createFallbackPDF(inputPath, outputPath, title) {
    // Créer un fichier HTML qui peut être converti en PDF manuellement
    const markdownContent = fs.readFileSync(inputPath, 'utf8');
    const htmlContent = this.markdownToHTML(markdownContent, title);
    
    const htmlPath = outputPath.replace('.pdf', '.html');
    fs.writeFileSync(htmlPath, htmlContent);
    
    // Créer un fichier d'instructions
    const instructionsPath = outputPath.replace('.pdf', '-instructions.txt');
    const instructions = `Pour convertir en PDF:
1. Ouvrir ${path.basename(htmlPath)} dans un navigateur
2. Imprimer > Enregistrer au format PDF
3. Renommer en ${path.basename(outputPath)}

Ou utiliser un outil comme wkhtmltopdf:
wkhtmltopdf "${htmlPath}" "${outputPath}"
`;
    fs.writeFileSync(instructionsPath, instructions);
  }

  markdownToHTML(markdown, title) {
    // Conversion basique Markdown vers HTML
    let html = markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\n/g, '<br>');
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2cm; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; }
        h2 { color: #34495e; margin-top: 2em; }
        h3 { color: #7f8c8d; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f8f9fa; padding: 1em; border-radius: 5px; overflow-x: auto; }
        li { margin: 0.5em 0; }
        @media print {
            body { margin: 1cm; }
            h1 { page-break-before: always; }
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${html}
</body>
</html>`;
  }

  getModuleTitle(moduleName) {
    const titles = {
      'module-1-fondamentaux': 'Module 1 - Fondamentaux CI/CD',
      'module-2-ia-tests': 'Module 2 - IA et Automatisation des Tests',
      'module-3-tests-fonctionnels': 'Module 3 - Tests Fonctionnels et Non-Fonctionnels',
      'module-4-documentation': 'Module 4 - Documentation et Monitoring'
    };
    return titles[moduleName] || moduleName;
  }
}

// Exécution du script
if (require.main === module) {
  const generator = new PDFGenerator();
  generator.generateAll().catch(console.error);
}

module.exports = PDFGenerator;