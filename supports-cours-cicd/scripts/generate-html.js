#!/usr/bin/env node

/**
 * Générateur HTML interactif pour les supports de cours CI/CD
 * Crée des versions web avec navigation interactive, QCM interactifs et exercices avec validation
 */

const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

class HTMLGenerator {
  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.outputDir = path.join(this.baseDir, 'html-output');
    this.templatesDir = path.join(this.baseDir, 'ressources', 'templates');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Génère tous les formats HTML interactifs
   */
  async generateAll() {
    console.log('🚀 Génération des formats HTML interactifs...');
    
    try {
      // Créer la structure de sortie
      this.createOutputStructure();
      
      // Copier les assets statiques
      this.copyStaticAssets();
      
      // Générer l'index principal
      await this.generateMainIndex();
      
      // Générer les modules
      await this.generateModules();
      
      // Générer les QCM interactifs
      await this.generateInteractiveQCM();
      
      // Générer les exercices interactifs
      await this.generateInteractiveExercises();
      
      // Générer les guides
      await this.generateGuides();
      
      console.log('✅ Génération HTML terminée avec succès!');
      console.log(`📁 Fichiers générés dans: ${this.outputDir}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error);
      throw error;
    }
  }

  /**
   * Crée la structure de dossiers de sortie
   */
  createOutputStructure() {
    const dirs = [
      'modules',
      'exercices', 
      'evaluations',
      'guides',
      'assets/css',
      'assets/js',
      'assets/images'
    ];
    
    dirs.forEach(dir => {
      const fullPath = path.join(this.outputDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Copie les assets statiques (CSS, JS, images)
   */
  copyStaticAssets() {
    // Générer le CSS principal
    this.generateMainCSS();
    
    // Générer le JavaScript principal
    this.generateMainJS();
    
    // Copier les images si elles existent
    const imagesDir = path.join(this.baseDir, 'ressources', 'images');
    if (fs.existsSync(imagesDir)) {
      this.copyDirectory(imagesDir, path.join(this.outputDir, 'assets', 'images'));
    }
  }

  /**
   * Génère le fichier CSS principal
   */
  generateMainCSS() {
    const css = `
/* Styles pour les supports de cours CI/CD interactifs */

:root {
  --primary-color: #2563eb;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --background-color: #f8fafc;
  --card-background: #ffffff;
  --text-color: #1e293b;
  --border-color: #e2e8f0;
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.header {
  background: var(--card-background);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 20px;
}

.logo h1 {
  color: var(--primary-color);
  font-size: 1.5rem;
}

.navigation ul {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.navigation a {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
  transition: color 0.3s;
}

.navigation a:hover {
  color: var(--primary-color);
}

/* Main Content */
.main-content {
  padding: 2rem 0;
}

.hero-section {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(135deg, var(--primary-color), #3b82f6);
  color: white;
  border-radius: 12px;
  margin-bottom: 3rem;
}

.module-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  margin-bottom: 1rem;
}

.module-title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.module-description {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.module-meta {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: 1rem;
}

/* Content Sections */
.content-section {
  background: var(--card-background);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow);
}

.content-section h2 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.content-section h3 {
  color: var(--secondary-color);
  margin: 1.5rem 0 1rem 0;
}

/* Listes */
.objectives-list {
  list-style: none;
  padding-left: 0;
}

.objectives-list li {
  padding: 0.5rem 0;
  padding-left: 2rem;
  position: relative;
}

.objectives-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--success-color);
  font-weight: bold;
}

/* Code Blocks */
.code-block {
  background: #1e293b;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  color: #e2e8f0;
}

/* Alerts */
.alert {
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border-left: 4px solid;
}

.alert-info {
  background: #dbeafe;
  border-color: var(--primary-color);
  color: #1e40af;
}

.alert-success {
  background: #d1fae5;
  border-color: var(--success-color);
  color: #065f46;
}

.alert-warning {
  background: #fef3c7;
  border-color: var(--warning-color);
  color: #92400e;
}

.alert-error {
  background: #fee2e2;
  border-color: var(--error-color);
  color: #991b1b;
}

/* Exercise Cards */
.exercise-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 2rem;
  overflow: hidden;
}

.exercise-header {
  background: var(--primary-color);
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exercise-header h3 {
  margin: 0;
  color: white;
}

.exercise-duration {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
}

.exercise-content {
  padding: 1.5rem;
}

.instructions-list {
  padding-left: 1.5rem;
}

.instructions-list li {
  margin-bottom: 0.5rem;
}

/* Interactive Exercise Form */
.exercise-form {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 1rem;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

/* QCM Styles */
.qcm-container {
  max-width: 800px;
  margin: 0 auto;
}

.question-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

.question-card.answered {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.question-card.correct {
  border-color: var(--success-color);
  background: rgba(16, 185, 129, 0.05);
}

.question-card.incorrect {
  border-color: var(--error-color);
  background: rgba(239, 68, 68, 0.05);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.question-number {
  background: var(--primary-color);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
}

.question-type {
  background: var(--secondary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.question-text {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option:hover {
  border-color: var(--primary-color);
  background: rgba(37, 99, 235, 0.05);
}

.option input[type="radio"],
.option input[type="checkbox"] {
  margin-right: 1rem;
  transform: scale(1.2);
}

.option.selected {
  border-color: var(--primary-color);
  background: rgba(37, 99, 235, 0.1);
}

.option.correct {
  border-color: var(--success-color);
  background: rgba(16, 185, 129, 0.1);
}

.option.incorrect {
  border-color: var(--error-color);
  background: rgba(239, 68, 68, 0.1);
}

/* Association Questions */
.association-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin: 1rem 0;
}

.association-column h4 {
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.association-item {
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.association-item:hover {
  border-color: var(--primary-color);
}

.association-item.selected {
  border-color: var(--primary-color);
  background: rgba(37, 99, 235, 0.1);
}

.association-item.matched {
  border-color: var(--success-color);
  background: rgba(16, 185, 129, 0.1);
}

/* Explanation */
.explanation {
  background: #f8fafc;
  border-left: 4px solid var(--primary-color);
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 0 8px 8px 0;
  display: none;
}

.explanation.show {
  display: block;
}

.explanation h4 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
  text-align: center;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-success {
  background: var(--success-color);
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-secondary {
  background: var(--secondary-color);
  color: white;
}

.btn-secondary:hover {
  background: #475569;
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover {
  background: var(--primary-color);
  color: white;
}

/* QCM Controls */
.qcm-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2rem 0;
  padding: 1rem;
  background: var(--card-background);
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.qcm-progress {
  flex: 1;
  margin: 0 2rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--secondary-color);
}

/* Results */
.results-container {
  background: var(--card-background);
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: var(--shadow);
  text-align: center;
}

.score-display {
  font-size: 3rem;
  font-weight: bold;
  margin: 1rem 0;
}

.score-display.excellent {
  color: var(--success-color);
}

.score-display.good {
  color: var(--primary-color);
}

.score-display.needs-improvement {
  color: var(--warning-color);
}

.score-display.poor {
  color: var(--error-color);
}

.competence-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.competence-item {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.competence-score {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

/* Navigation */
.module-navigation {
  display: flex;
  justify-content: space-between;
  margin: 3rem 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-color);
  transition: all 0.3s ease;
}

.nav-link:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* Footer */
.footer {
  background: var(--text-color);
  color: white;
  padding: 2rem 0;
  margin-top: 4rem;
}

.footer .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-links {
  display: flex;
  gap: 2rem;
}

.footer-link {
  color: white;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.footer-link:hover {
  opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }
  
  .header .container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .navigation ul {
    gap: 1rem;
  }
  
  .module-title {
    font-size: 2rem;
  }
  
  .module-meta {
    flex-direction: column;
    gap: 1rem;
  }
  
  .association-container {
    grid-template-columns: 1fr;
  }
  
  .qcm-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .qcm-progress {
    margin: 0;
    width: 100%;
  }
  
  .module-navigation {
    flex-direction: column;
    gap: 1rem;
  }
  
  .footer .container {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}

/* Additional CSS for modules and exercises grid */
.modules-grid,
.qcm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.module-card,
.qcm-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.module-card:hover,
.qcm-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
  transform: translateY(-2px);
}

.module-card h3,
.qcm-card h3 {
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.module-card h3 a {
  text-decoration: none;
  color: inherit;
}

.module-card h3 a:hover {
  text-decoration: underline;
}

.module-card p,
.qcm-card p {
  margin-bottom: 1rem;
  color: var(--secondary-color);
}

.module-card .module-meta,
.qcm-card .qcm-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: var(--secondary-color);
}

.difficulty-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}

.difficulty-débutant {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.difficulty-intermédiaire {
  background: rgba(37, 99, 235, 0.1);
  color: var(--primary-color);
}

.difficulty-avancé {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
}

.evaluation-links,
.guides-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.field-error {
  color: var(--error-color);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.form-group input.error,
.form-group textarea.error,
.form-group select.error {
  border-color: var(--error-color);
}

.exercise-result {
  margin-top: 1rem;
}

/* Timer styles */
.qcm-timer {
  font-weight: bold;
  color: var(--primary-color);
}

/* Print Styles */
@media print {
  .header,
  .footer,
  .qcm-controls,
  .qcm-navigation,
  .exercise-form,
  .btn {
    display: none;
  }
  
  .main-content {
    padding: 0;
  }
  
  .content-section {
    box-shadow: none;
    border: 1px solid var(--border-color);
  }
}
`;

    fs.writeFileSync(path.join(this.outputDir, 'assets', 'css', 'styles.css'), css);
  }

  /**
   * Génère le fichier JavaScript principal
   */
  generateMainJS() {
    const js = `
/**
 * JavaScript pour les supports de cours CI/CD interactifs
 */

class InteractiveCourse {
  constructor() {
    this.currentQuestion = 0;
    this.answers = {};
    this.score = 0;
    this.qcmData = null;
    this.exerciseData = null;
    
    this.init();
  }

  init() {
    // Initialiser les QCM si présents
    if (document.querySelector('.qcm-container')) {
      this.initQCM();
    }
    
    // Initialiser les exercices si présents
    if (document.querySelector('.exercise-form')) {
      this.initExercises();
    }
    
    // Initialiser la navigation
    this.initNavigation();
    
    // Initialiser les éléments interactifs
    this.initInteractiveElements();
  }

  /**
   * Initialise les QCM interactifs
   */
  initQCM() {
    // Charger les données QCM depuis l'attribut data
    const qcmContainer = document.querySelector('.qcm-container');
    if (qcmContainer && qcmContainer.dataset.qcmData) {
      try {
        this.qcmData = JSON.parse(qcmContainer.dataset.qcmData);
        this.renderQCM();
      } catch (error) {
        console.error('Erreur lors du chargement des données QCM:', error);
      }
    }
  }

  /**
   * Rend le QCM interactif
   */
  renderQCM() {
    if (!this.qcmData) return;

    const container = document.querySelector('.qcm-container');
    container.innerHTML = '';

    // Créer les contrôles QCM
    const controls = this.createQCMControls();
    container.appendChild(controls);

    // Créer les questions
    this.qcmData.questions.forEach((question, index) => {
      const questionElement = this.createQuestionElement(question, index);
      container.appendChild(questionElement);
    });

    // Créer les boutons de navigation
    const navigation = this.createQCMNavigation();
    container.appendChild(navigation);

    // Afficher la première question
    this.showQuestion(0);
  }

  /**
   * Crée les contrôles du QCM
   */
  createQCMControls() {
    const controls = document.createElement('div');
    controls.className = 'qcm-controls';
    
    controls.innerHTML = \`
      <div class="qcm-info">
        <h3>\${this.qcmData.titre}</h3>
        <p>Durée: \${this.qcmData.duree_minutes} minutes</p>
      </div>
      <div class="qcm-progress">
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
        <div class="progress-text" id="progress-text">Question 1 sur \${this.qcmData.questions.length}</div>
      </div>
      <div class="qcm-timer">
        <span id="timer">\${this.qcmData.duree_minutes}:00</span>
      </div>
    \`;

    return controls;
  }

  /**
   * Crée un élément de question
   */
  createQuestionElement(question, index) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-card';
    questionDiv.id = \`question-\${index}\`;
    questionDiv.style.display = index === 0 ? 'block' : 'none';

    let optionsHTML = '';
    
    switch (question.type) {
      case 'choix-multiple':
        optionsHTML = this.createMultipleChoiceOptions(question, index);
        break;
      case 'vrai-faux':
        optionsHTML = this.createTrueFalseOptions(question, index);
        break;
      case 'association':
        optionsHTML = this.createAssociationOptions(question, index);
        break;
    }

    questionDiv.innerHTML = \`
      <div class="question-header">
        <div class="question-number">Question \${index + 1}</div>
        <div class="question-type">\${question.type}</div>
      </div>
      <div class="question-text">\${question.question}</div>
      <div class="options">
        \${optionsHTML}
      </div>
      <div class="explanation" id="explanation-\${index}">
        <h4>💡 Explication</h4>
        <p>\${question.explication}</p>
      </div>
    \`;

    return questionDiv;
  }

  /**
   * Crée les options pour les questions à choix multiples
   */
  createMultipleChoiceOptions(question, questionIndex) {
    return question.options.map((option, optionIndex) => \`
      <label class="option" data-question="\${questionIndex}" data-option="\${optionIndex}">
        <input type="radio" name="q\${questionIndex}" value="\${optionIndex}">
        <span>\${option}</span>
      </label>
    \`).join('');
  }

  /**
   * Crée les options pour les questions vrai/faux
   */
  createTrueFalseOptions(question, questionIndex) {
    return \`
      <label class="option" data-question="\${questionIndex}" data-option="true">
        <input type="radio" name="q\${questionIndex}" value="true">
        <span>Vrai</span>
      </label>
      <label class="option" data-question="\${questionIndex}" data-option="false">
        <input type="radio" name="q\${questionIndex}" value="false">
        <span>Faux</span>
      </label>
    \`;
  }

  /**
   * Crée les options pour les questions d'association
   */
  createAssociationOptions(question, questionIndex) {
    return \`
      <div class="association-container">
        <div class="association-column">
          <h4>Éléments à associer</h4>
          \${question.elements_gauche.map((element, index) => \`
            <div class="association-item" data-question="\${questionIndex}" data-left="\${index}">
              \${element}
            </div>
          \`).join('')}
        </div>
        <div class="association-column">
          <h4>Correspondances</h4>
          \${question.elements_droite.map((element, index) => \`
            <div class="association-item" data-question="\${questionIndex}" data-right="\${index}">
              \${element}
            </div>
          \`).join('')}
        </div>
      </div>
    \`;
  }

  /**
   * Crée la navigation du QCM
   */
  createQCMNavigation() {
    const nav = document.createElement('div');
    nav.className = 'qcm-navigation';
    
    nav.innerHTML = \`
      <button class="btn btn-secondary" id="prev-question" onclick="course.previousQuestion()">
        ← Précédent
      </button>
      <button class="btn btn-primary" id="next-question" onclick="course.nextQuestion()">
        Suivant →
      </button>
      <button class="btn btn-success" id="submit-qcm" onclick="course.submitQCM()" style="display: none;">
        Terminer le QCM
      </button>
    \`;

    return nav;
  }

  /**
   * Affiche une question spécifique
   */
  showQuestion(index) {
    // Masquer toutes les questions
    document.querySelectorAll('.question-card').forEach(card => {
      card.style.display = 'none';
    });

    // Afficher la question courante
    const currentCard = document.getElementById(\`question-\${index}\`);
    if (currentCard) {
      currentCard.style.display = 'block';
    }

    this.currentQuestion = index;
    this.updateProgress();
    this.updateNavigation();
  }

  /**
   * Met à jour la barre de progression
   */
  updateProgress() {
    const progress = ((this.currentQuestion + 1) / this.qcmData.questions.length) * 100;
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (progressFill) {
      progressFill.style.width = \`\${progress}%\`;
    }

    if (progressText) {
      progressText.textContent = \`Question \${this.currentQuestion + 1} sur \${this.qcmData.questions.length}\`;
    }
  }

  /**
   * Met à jour les boutons de navigation
   */
  updateNavigation() {
    const prevBtn = document.getElementById('prev-question');
    const nextBtn = document.getElementById('next-question');
    const submitBtn = document.getElementById('submit-qcm');

    if (prevBtn) {
      prevBtn.style.display = this.currentQuestion === 0 ? 'none' : 'inline-block';
    }

    if (nextBtn && submitBtn) {
      if (this.currentQuestion === this.qcmData.questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
      } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
      }
    }
  }

  /**
   * Question précédente
   */
  previousQuestion() {
    if (this.currentQuestion > 0) {
      this.showQuestion(this.currentQuestion - 1);
    }
  }

  /**
   * Question suivante
   */
  nextQuestion() {
    if (this.currentQuestion < this.qcmData.questions.length - 1) {
      this.showQuestion(this.currentQuestion + 1);
    }
  }

  /**
   * Soumet le QCM
   */
  submitQCM() {
    if (confirm('Êtes-vous sûr de vouloir terminer le QCM ? Vous ne pourrez plus modifier vos réponses.')) {
      this.calculateScore();
      this.showResults();
    }
  }

  /**
   * Calcule le score
   */
  calculateScore() {
    let totalPoints = 0;
    let earnedPoints = 0;
    const competenceScores = {};

    this.qcmData.questions.forEach((question, index) => {
      const questionPoints = this.qcmData.scoring.ponderation_par_difficulte[question.difficulte] || 1;
      totalPoints += questionPoints;

      const userAnswer = this.answers[index];
      let isCorrect = false;

      switch (question.type) {
        case 'choix-multiple':
          isCorrect = userAnswer === question.reponse_correcte;
          break;
        case 'vrai-faux':
          isCorrect = (userAnswer === 'true') === question.reponse_correcte;
          break;
        case 'association':
          // Logique d'association plus complexe
          isCorrect = this.checkAssociationAnswer(question, userAnswer);
          break;
      }

      if (isCorrect) {
        earnedPoints += questionPoints;
        
        // Comptabiliser par compétence
        const competence = question.competence;
        if (!competenceScores[competence]) {
          competenceScores[competence] = { earned: 0, total: 0 };
        }
        competenceScores[competence].earned += questionPoints;
      }

      // Ajouter au total par compétence
      const competence = question.competence;
      if (!competenceScores[competence]) {
        competenceScores[competence] = { earned: 0, total: 0 };
      }
      competenceScores[competence].total += questionPoints;
    });

    this.score = Math.round((earnedPoints / totalPoints) * 100);
    this.competenceScores = competenceScores;
  }

  /**
   * Vérifie la réponse d'association
   */
  checkAssociationAnswer(question, userAnswer) {
    if (!userAnswer || !Array.isArray(userAnswer)) return false;
    
    const correctAssociations = question.associations_correctes;
    return JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAssociations.sort());
  }

  /**
   * Affiche les résultats
   */
  showResults() {
    const container = document.querySelector('.qcm-container');
    
    let scoreClass = 'poor';
    let scoreMessage = 'À améliorer';
    
    if (this.score >= 90) {
      scoreClass = 'excellent';
      scoreMessage = 'Excellent !';
    } else if (this.score >= 70) {
      scoreClass = 'good';
      scoreMessage = 'Bien !';
    } else if (this.score >= 50) {
      scoreClass = 'needs-improvement';
      scoreMessage = 'Peut mieux faire';
    }

    const competenceBreakdown = Object.entries(this.competenceScores)
      .map(([competence, scores]) => {
        const percentage = Math.round((scores.earned / scores.total) * 100);
        return \`
          <div class="competence-item">
            <div class="competence-score \${percentage >= 70 ? 'good' : 'needs-improvement'}">
              \${percentage}%
            </div>
            <div class="competence-name">Compétence \${competence}</div>
          </div>
        \`;
      }).join('');

    container.innerHTML = \`
      <div class="results-container">
        <h2>🎉 Résultats du QCM</h2>
        <div class="score-display \${scoreClass}">\${this.score}%</div>
        <p class="score-message">\${scoreMessage}</p>
        
        <div class="competence-breakdown">
          <h3>Détail par compétence</h3>
          \${competenceBreakdown}
        </div>
        
        <div class="results-actions">
          <button class="btn btn-primary" onclick="course.reviewAnswers()">
            Revoir les réponses
          </button>
          <button class="btn btn-secondary" onclick="course.restartQCM()">
            Recommencer
          </button>
          <button class="btn btn-success" onclick="course.generateReport()">
            Générer le rapport
          </button>
        </div>
      </div>
    \`;
  }

  /**
   * Initialise les exercices interactifs
   */
  initExercises() {
    const exerciseForms = document.querySelectorAll('.exercise-form');
    exerciseForms.forEach(form => {
      this.setupExerciseValidation(form);
    });
  }

  /**
   * Configure la validation des exercices
   */
  setupExerciseValidation(form) {
    const submitBtn = form.querySelector('.submit-exercise');
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.validateExercise(form);
      });
    }

    // Validation en temps réel
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.validateField(input);
      });
    });
  }

  /**
   * Valide un exercice
   */
  validateExercise(form) {
    const exerciseId = form.dataset.exerciseId;
    const formData = new FormData(form);
    const answers = {};

    for (let [key, value] of formData.entries()) {
      answers[key] = value;
    }

    // Ici, vous pourriez implémenter une logique de validation spécifique
    // Pour l'instant, on simule une validation basique
    const isValid = this.checkExerciseAnswers(exerciseId, answers);
    
    this.showExerciseResult(form, isValid, answers);
  }

  /**
   * Vérifie les réponses d'un exercice
   */
  checkExerciseAnswers(exerciseId, answers) {
    // Logique de validation à implémenter selon les exercices
    // Pour l'instant, on retourne true si tous les champs sont remplis
    return Object.values(answers).every(value => value.trim() !== '');
  }

  /**
   * Affiche le résultat d'un exercice
   */
  showExerciseResult(form, isValid, answers) {
    const resultDiv = form.querySelector('.exercise-result') || document.createElement('div');
    resultDiv.className = 'exercise-result';

    if (isValid) {
      resultDiv.innerHTML = \`
        <div class="alert alert-success">
          <strong>✅ Exercice réussi !</strong>
          <p>Félicitations, vous avez correctement complété cet exercice.</p>
        </div>
      \`;
    } else {
      resultDiv.innerHTML = \`
        <div class="alert alert-error">
          <strong>❌ Exercice incomplet</strong>
          <p>Veuillez vérifier vos réponses et compléter tous les champs requis.</p>
        </div>
      \`;
    }

    if (!form.querySelector('.exercise-result')) {
      form.appendChild(resultDiv);
    }
  }

  /**
   * Valide un champ individuel
   */
  validateField(input) {
    const value = input.value.trim();
    const isRequired = input.hasAttribute('required');
    
    if (isRequired && !value) {
      input.classList.add('error');
      this.showFieldError(input, 'Ce champ est requis');
    } else {
      input.classList.remove('error');
      this.hideFieldError(input);
    }
  }

  /**
   * Affiche une erreur de champ
   */
  showFieldError(input, message) {
    let errorDiv = input.parentNode.querySelector('.field-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      input.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
  }

  /**
   * Masque l'erreur de champ
   */
  hideFieldError(input) {
    const errorDiv = input.parentNode.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  /**
   * Initialise la navigation
   */
  initNavigation() {
    // Navigation fluide
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  /**
   * Initialise les éléments interactifs
   */
  initInteractiveElements() {
    // Gestion des événements pour les options QCM
    document.addEventListener('click', (e) => {
      if (e.target.closest('.option')) {
        this.handleOptionClick(e.target.closest('.option'));
      }
    });

    // Gestion des éléments d'association
    document.addEventListener('click', (e) => {
      if (e.target.closest('.association-item')) {
        this.handleAssociationClick(e.target.closest('.association-item'));
      }
    });
  }

  /**
   * Gère le clic sur une option
   */
  handleOptionClick(option) {
    const questionIndex = parseInt(option.dataset.question);
    const optionValue = option.dataset.option;

    // Enregistrer la réponse
    this.answers[questionIndex] = optionValue;

    // Marquer la question comme répondue
    const questionCard = document.getElementById(\`question-\${questionIndex}\`);
    if (questionCard) {
      questionCard.classList.add('answered');
    }
  }

  /**
   * Gère le clic sur un élément d'association
   */
  handleAssociationClick(item) {
    const questionIndex = parseInt(item.dataset.question);
    
    if (item.dataset.left !== undefined) {
      // Élément de gauche sélectionné
      this.selectedLeft = parseInt(item.dataset.left);
      document.querySelectorAll(\`[data-question="\${questionIndex}"][data-left]\`).forEach(el => {
        el.classList.remove('selected');
      });
      item.classList.add('selected');
    } else if (item.dataset.right !== undefined && this.selectedLeft !== undefined) {
      // Élément de droite sélectionné, créer l'association
      const rightIndex = parseInt(item.dataset.right);
      
      if (!this.answers[questionIndex]) {
        this.answers[questionIndex] = [];
      }
      
      this.answers[questionIndex].push([this.selectedLeft, rightIndex]);
      
      // Marquer les éléments comme associés
      item.classList.add('matched');
      document.querySelector(\`[data-question="\${questionIndex}"][data-left="\${this.selectedLeft}"]\`).classList.add('matched');
      
      this.selectedLeft = undefined;
    }
  }
}

// Initialiser l'application
let course;
document.addEventListener('DOMContentLoaded', () => {
  course = new InteractiveCourse();
});

// Fonctions utilitaires globales
function toggleExplanation(questionIndex) {
  const explanation = document.getElementById(\`explanation-\${questionIndex}\`);
  if (explanation) {
    explanation.classList.toggle('show');
  }
}

function copyCode(button) {
  const codeBlock = button.nextElementSibling.querySelector('code');
  if (codeBlock) {
    navigator.clipboard.writeText(codeBlock.textContent).then(() => {
      button.textContent = 'Copié !';
      setTimeout(() => {
        button.textContent = 'Copier';
      }, 2000);
    });
  }
}
`;

    fs.writeFileSync(path.join(this.outputDir, 'assets', 'js', 'scripts.js'), js);
  }
   
  /**

   * Génère l'index principal
   */
  async generateMainIndex() {
    const indexContent = await this.loadMarkdownFile('index.md');
    const navigationContent = await this.loadMarkdownFile('navigation.md');
    
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formation CI/CD - Supports de Cours Interactifs</title>
    <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="logo">
                <h1>Formation CI/CD</h1>
            </div>
            <nav class="navigation">
                <ul>
                    <li><a href="#modules">Modules</a></li>
                    <li><a href="#exercices">Exercices</a></li>
                    <li><a href="#evaluations">Évaluations</a></li>
                    <li><a href="#guides">Guides</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <section class="hero-section">
                <div class="module-badge">Formation Complète</div>
                <h1 class="module-title">Supports de Cours CI/CD Interactifs</h1>
                <p class="module-description">Formation complète sur l'intégration et le déploiement continus avec exercices pratiques et évaluations interactives</p>
                <div class="module-meta">
                    <span class="duration">⏱️ Durée: 5 jours</span>
                    <span class="difficulty">📊 Niveau: Intermédiaire</span>
                </div>
            </section>

            <section id="modules" class="content-section">
                <h2>📚 Modules de Formation</h2>
                <div class="modules-grid">
                    <div class="module-card">
                        <h3><a href="modules/module-1.html">Module 1 - Fondamentaux CI/CD</a></h3>
                        <p>Introduction aux concepts de base, pipelines et outils essentiels</p>
                        <div class="module-meta">
                            <span>⏱️ 4h</span>
                            <span>📋 8 questions</span>
                            <span>🔧 3 exercices</span>
                        </div>
                    </div>
                    <div class="module-card">
                        <h3><a href="modules/module-2.html">Module 2 - IA et Automatisation</a></h3>
                        <p>Intelligence artificielle appliquée aux tests automatisés</p>
                        <div class="module-meta">
                            <span>⏱️ 10h</span>
                            <span>📋 20 questions</span>
                            <span>🔧 5 exercices</span>
                        </div>
                    </div>
                    <div class="module-card">
                        <h3><a href="modules/module-3.html">Module 3 - Tests Fonctionnels</a></h3>
                        <p>Tests fonctionnels, de performance et de sécurité</p>
                        <div class="module-meta">
                            <span>⏱️ 6h</span>
                            <span>📋 12 questions</span>
                            <span>🔧 6 exercices</span>
                        </div>
                    </div>
                    <div class="module-card">
                        <h3><a href="modules/module-4.html">Module 4 - Documentation</a></h3>
                        <p>Documentation, reporting et monitoring des tests</p>
                        <div class="module-meta">
                            <span>⏱️ 2h</span>
                            <span>📋 6 questions</span>
                            <span>🔧 2 exercices</span>
                        </div>
                    </div>
                </div>
            </section>

            <section id="evaluations" class="content-section">
                <h2>📋 Évaluations</h2>
                <div class="evaluation-links">
                    <a href="evaluations/qcm-final.html" class="btn btn-primary">QCM Final (45 questions)</a>
                    <a href="evaluations/qcm-intermediaires.html" class="btn btn-secondary">QCM Intermédiaires</a>
                </div>
            </section>

            <section id="guides" class="content-section">
                <h2>📖 Guides</h2>
                <div class="guides-links">
                    <a href="guides/guide-formateur.html" class="btn btn-outline">Guide Formateur</a>
                    <a href="guides/guide-apprenant.html" class="btn btn-outline">Guide Apprenant</a>
                </div>
            </section>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Formation CI/CD - Tous droits réservés</p>
            <div class="footer-links">
                <a href="guides/guide-formateur.html" class="footer-link">Guide Formateur</a>
                <a href="guides/guide-apprenant.html" class="footer-link">Guide Apprenant</a>
                <a href="#" class="footer-link">Support</a>
            </div>
        </div>
    </footer>

    <script src="assets/js/scripts.js"></script>
</body>
</html>`;

    fs.writeFileSync(path.join(this.outputDir, 'index.html'), html);
  }

  /**
   * Génère les modules HTML
   */
  async generateModules() {
    const modules = [
      { id: 'module-1', name: 'Fondamentaux CI/CD', duration: '4h' },
      { id: 'module-2', name: 'IA et Automatisation', duration: '10h' },
      { id: 'module-3', name: 'Tests Fonctionnels', duration: '6h' },
      { id: 'module-4', name: 'Documentation', duration: '2h' }
    ];

    for (const module of modules) {
      await this.generateModuleHTML(module);
    }
  }

  /**
   * Génère le HTML d'un module spécifique
   */
  async generateModuleHTML(module) {
    const moduleDir = path.join(this.baseDir, 'modules', module.id);
    let moduleContent = '';
    
    // Charger le contenu du module s'il existe
    const readmePath = path.join(moduleDir, 'README.md');
    if (fs.existsSync(readmePath)) {
      moduleContent = await this.loadMarkdownFile(path.relative(this.baseDir, readmePath));
    }

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${module.name} - Formation CI/CD</title>
    <link rel="stylesheet" href="../assets/css/styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="logo">
                <h1><a href="../index.html">Formation CI/CD</a></h1>
            </div>
            <nav class="navigation">
                <ul>
                    <li><a href="#contenu">Contenu</a></li>
                    <li><a href="#exercices">Exercices</a></li>
                    <li><a href="#evaluation">Évaluation</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <section class="hero-section">
                <div class="module-badge">${module.id.toUpperCase()}</div>
                <h1 class="module-title">${module.name}</h1>
                <p class="module-description">Module de formation avec contenu théorique, exercices pratiques et évaluation</p>
                <div class="module-meta">
                    <span class="duration">⏱️ Durée: ${module.duration}</span>
                    <span class="difficulty">📊 Niveau: Intermédiaire</span>
                </div>
            </section>

            <section id="contenu" class="content-section">
                <h2>📚 Contenu du Module</h2>
                ${md.render(moduleContent)}
            </section>

            <section id="exercices" class="content-section">
                <h2>🔧 Exercices Pratiques</h2>
                <div class="exercises-list">
                    <p>Les exercices pour ce module sont disponibles dans la section exercices.</p>
                    <a href="../exercices/${module.id}.html" class="btn btn-primary">Accéder aux exercices</a>
                </div>
            </section>

            <section id="evaluation" class="content-section">
                <h2>📋 Évaluation</h2>
                <div class="evaluation-info">
                    <p>Testez vos connaissances avec le QCM intermédiaire de ce module.</p>
                    <a href="../evaluations/qcm-${module.id}.html" class="btn btn-success">Commencer le QCM</a>
                </div>
            </section>

            <div class="module-navigation">
                ${this.generateModuleNavigation(module.id)}
            </div>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Formation CI/CD - Tous droits réservés</p>
            <div class="footer-links">
                <a href="../guides/guide-formateur.html" class="footer-link">Guide Formateur</a>
                <a href="../guides/guide-apprenant.html" class="footer-link">Guide Apprenant</a>
                <a href="../index.html" class="footer-link">Accueil</a>
            </div>
        </div>
    </footer>

    <script src="../assets/js/scripts.js"></script>
</body>
</html>`;

    fs.writeFileSync(path.join(this.outputDir, 'modules', `${module.id}.html`), html);
  }

  /**
   * Génère la navigation entre modules
   */
  generateModuleNavigation(currentModuleId) {
    const modules = ['module-1', 'module-2', 'module-3', 'module-4'];
    const currentIndex = modules.indexOf(currentModuleId);
    
    let navigation = '';
    
    if (currentIndex > 0) {
      const prevModule = modules[currentIndex - 1];
      navigation += `<a href="${prevModule}.html" class="nav-link">← Module précédent</a>`;
    } else {
      navigation += '<div></div>';
    }
    
    if (currentIndex < modules.length - 1) {
      const nextModule = modules[currentIndex + 1];
      navigation += `<a href="${nextModule}.html" class="nav-link">Module suivant →</a>`;
    } else {
      navigation += '<div></div>';
    }
    
    return navigation;
  }

  /**
   * Génère les QCM interactifs
   */
  async generateInteractiveQCM() {
    // Générer la page d'index des QCM intermédiaires
    await this.generateQCMIndex();
    
    // Générer chaque QCM intermédiaire
    const qcmFiles = [
      'qcm-module-1-fondamentaux.json',
      'qcm-module-2-ia-automatisation.json',
      'qcm-module-2-ml-optimisation.json',
      'qcm-module-3-tests-fonctionnels.json',
      'qcm-module-4-documentation.json'
    ];

    for (const qcmFile of qcmFiles) {
      await this.generateQCMHTML(qcmFile);
    }

    // Générer le QCM final
    await this.generateFinalQCMHTML();
  }

  /**
   * Génère la page d'index des QCM
   */
  async generateQCMIndex() {
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QCM Intermédiaires - Formation CI/CD</title>
    <link rel="stylesheet" href="../assets/css/styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="logo">
                <h1><a href="../index.html">Formation CI/CD</a></h1>
            </div>
            <nav class="navigation">
                <ul>
                    <li><a href="../index.html">Accueil</a></li>
                    <li><a href="#qcm-intermediaires">QCM Intermédiaires</a></li>
                    <li><a href="qcm-final.html">QCM Final</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <section class="hero-section">
                <div class="module-badge">ÉVALUATIONS</div>
                <h1 class="module-title">QCM Intermédiaires</h1>
                <p class="module-description">Évaluez vos connaissances à chaque étape de la formation</p>
            </section>

            <section id="qcm-intermediaires" class="content-section">
                <h2>📋 QCM par Module</h2>
                <div class="qcm-grid">
                    <div class="qcm-card">
                        <h3>Module 1 - Fondamentaux CI/CD</h3>
                        <p>8 questions sur les concepts de base</p>
                        <div class="qcm-meta">
                            <span>⏱️ 20 min</span>
                            <span>📊 Seuil: 70%</span>
                        </div>
                        <a href="qcm-module-1-fondamentaux.html" class="btn btn-primary">Commencer</a>
                    </div>
                    
                    <div class="qcm-card">
                        <h3>Module 2 - IA et Automatisation</h3>
                        <p>10 questions sur l'IA dans les tests</p>
                        <div class="qcm-meta">
                            <span>⏱️ 25 min</span>
                            <span>📊 Seuil: 70%</span>
                        </div>
                        <a href="qcm-module-2-ia-automatisation.html" class="btn btn-primary">Commencer</a>
                    </div>
                    
                    <div class="qcm-card">
                        <h3>Module 2 - ML et Optimisation</h3>
                        <p>10 questions sur le machine learning</p>
                        <div class="qcm-meta">
                            <span>⏱️ 25 min</span>
                            <span>📊 Seuil: 70%</span>
                        </div>
                        <a href="qcm-module-2-ml-optimisation.html" class="btn btn-primary">Commencer</a>
                    </div>
                    
                    <div class="qcm-card">
                        <h3>Module 3 - Tests Fonctionnels</h3>
                        <p>12 questions sur les tests fonctionnels et non-fonctionnels</p>
                        <div class="qcm-meta">
                            <span>⏱️ 30 min</span>
                            <span>📊 Seuil: 70%</span>
                        </div>
                        <a href="qcm-module-3-tests-fonctionnels.html" class="btn btn-primary">Commencer</a>
                    </div>
                    
                    <div class="qcm-card">
                        <h3>Module 4 - Documentation</h3>
                        <p>6 questions sur la documentation et le monitoring</p>
                        <div class="qcm-meta">
                            <span>⏱️ 15 min</span>
                            <span>📊 Seuil: 70%</span>
                        </div>
                        <a href="qcm-module-4-documentation.html" class="btn btn-primary">Commencer</a>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Formation CI/CD - Tous droits réservés</p>
            <div class="footer-links">
                <a href="../guides/guide-formateur.html" class="footer-link">Guide Formateur</a>
                <a href="../guides/guide-apprenant.html" class="footer-link">Guide Apprenant</a>
                <a href="../index.html" class="footer-link">Accueil</a>
            </div>
        </div>
    </footer>

    <script src="../assets/js/scripts.js"></script>
</body>
</html>`;

    fs.writeFileSync(path.join(this.outputDir, 'evaluations', 'qcm-intermediaires.html'), html);
  }

  /**
   * Génère le HTML d'un QCM spécifique
   */
  async generateQCMHTML(qcmFile) {
    const qcmPath = path.join(this.baseDir, 'evaluations', 'qcm-intermediaires', qcmFile);
    
    if (!fs.existsSync(qcmPath)) {
      console.warn(`QCM file not found: ${qcmPath}`);
      return;
    }

    const qcmData = JSON.parse(fs.readFileSync(qcmPath, 'utf8'));
    const qcmId = qcmData.qcm.id;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${qcmData.qcm.titre} - Formation CI/CD</title>
    <link rel="stylesheet" href="../assets/css/styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="logo">
                <h1><a href="../index.html">Formation CI/CD</a></h1>
            </div>
            <nav class="navigation">
                <ul>
                    <li><a href="../index.html">Accueil</a></li>
                    <li><a href="qcm-intermediaires.html">QCM Intermédiaires</a></li>
                    <li><a href="qcm-final.html">QCM Final</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <section class="hero-section">
                <div class="module-badge">QCM INTERMÉDIAIRE</div>
                <h1 class="module-title">${qcmData.qcm.titre}</h1>
                <p class="module-description">${qcmData.qcm.description}</p>
                <div class="module-meta">
                    <span class="duration">⏱️ Durée: ${qcmData.qcm.duree_minutes} minutes</span>
                    <span class="difficulty">📊 Seuil: ${qcmData.qcm.scoring.seuil_reussite}%</span>
                </div>
            </section>

            <section class="content-section">
                <div class="qcm-instructions">
                    <h3>📋 Instructions</h3>
                    <ul>
                        ${qcmData.qcm.instructions.consignes.map(consigne => `<li>${consigne}</li>`).join('')}
                    </ul>
                    <p><strong>Barème:</strong> ${qcmData.qcm.instructions.bareme}</p>
                </div>
            </section>

            <section class="content-section">
                <div class="qcm-container" data-qcm-data='${JSON.stringify(qcmData.qcm)}'>
                    <!-- Le QCM sera généré dynamiquement par JavaScript -->
                </div>
            </section>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Formation CI/CD - Tous droits réservés</p>
            <div class="footer-links">
                <a href="../guides/guide-formateur.html" class="footer-link">Guide Formateur</a>
                <a href="../guides/guide-apprenant.html" class="footer-link">Guide Apprenant</a>
                <a href="../index.html" class="footer-link">Accueil</a>
            </div>
        </div>
    </footer>

    <script src="../assets/js/scripts.js"></script>
</body>
</html>`;

    const outputFileName = qcmFile.replace('.json', '.html');
    fs.writeFileSync(path.join(this.outputDir, 'evaluations', outputFileName), html);
  }

  /**
   * Génère le QCM final
   */
  async generateFinalQCMHTML() {
    const qcmPath = path.join(this.baseDir, 'evaluations', 'qcm-final', 'qcm-final-evaluation.json');
    
    if (!fs.existsSync(qcmPath)) {
      console.warn(`Final QCM file not found: ${qcmPath}`);
      return;
    }

    const qcmData = JSON.parse(fs.readFileSync(qcmPath, 'utf8'));

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QCM Final - Formation CI/CD</title>
    <link rel="stylesheet" href="../assets/css/styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="logo">
                <h1><a href="../index.html">Formation CI/CD</a></h1>
            </div>
            <nav class="navigation">
                <ul>
                    <li><a href="../index.html">Accueil</a></li>
                    <li><a href="qcm-intermediaires.html">QCM Intermédiaires</a></li>
                    <li><a href="#evaluation">Évaluation Finale</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <section class="hero-section">
                <div class="module-badge">ÉVALUATION FINALE</div>
                <h1 class="module-title">QCM Final de Certification</h1>
                <p class="module-description">Évaluation finale couvrant tous les modules de la formation CI/CD</p>
                <div class="module-meta">
                    <span class="duration">⏱️ Durée: 60 minutes</span>
                    <span class="difficulty">📊 45 questions</span>
                    <span class="difficulty">🎯 Certification ECF</span>
                </div>
            </section>

            <section class="content-section">
                <div class="qcm-instructions">
                    <h3>📋 Instructions Importantes</h3>
                    <div class="alert alert-warning">
                        <strong>⚠️ Attention:</strong> Cette évaluation finale est certifiante. Vous ne pourrez la passer qu'une seule fois.
                    </div>
                    <ul>
                        <li>Vous disposez de 60 minutes pour répondre aux 45 questions</li>
                        <li>Toutes les questions sont obligatoires</li>
                        <li>Vous pouvez revenir sur vos réponses avant la validation finale</li>
                        <li>Le seuil de réussite est fixé à 70%</li>
                        <li>L'évaluation couvre toutes les compétences: C8, C17, C18, C19, C20, C33</li>
                    </ul>
                </div>
            </section>

            <section id="evaluation" class="content-section">
                <div class="qcm-container" data-qcm-data='${JSON.stringify(qcmData.qcm)}'>
                    <!-- Le QCM sera généré dynamiquement par JavaScript -->
                </div>
            </section>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Formation CI/CD - Tous droits réservés</p>
            <div class="footer-links">
                <a href="../guides/guide-formateur.html" class="footer-link">Guide Formateur</a>
                <a href="../guides/guide-apprenant.html" class="footer-link">Guide Apprenant</a>
                <a href="../index.html" class="footer-link">Accueil</a>
            </div>
        </div>
    </footer>

    <script src="../assets/js/scripts.js"></script>
</body>
</html>`;

    fs.writeFileSync(path.join(this.outputDir, 'evaluations', 'qcm-final.html'), html);
  }

  /**
   * Génère les exercices interactifs
   */
  async generateInteractiveExercises() {
    const modules = ['module-1', 'module-2', 'module-3', 'module-4'];
    
    for (const module of modules) {
      await this.generateModuleExercises(module);
    }
  }

  /**
   * Génère les exercices d'un module
   */
  async generateModuleExercises(moduleId) {
    const exercisesData = this.getExercisesForModule(moduleId);
    
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exercices ${moduleId.toUpperCase()} - Formation CI/CD</title>
    <link rel="stylesheet" href="../assets/css/styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="logo">
                <h1><a href="../index.html">Formation CI/CD</a></h1>
            </div>
            <nav class="navigation">
                <ul>
                    <li><a href="../index.html">Accueil</a></li>
                    <li><a href="../modules/${moduleId}.html">Retour au module</a></li>
                    <li><a href="#exercices">Exercices</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <section class="hero-section">
                <div class="module-badge">${moduleId.toUpperCase()}</div>
                <h1 class="module-title">Exercices Pratiques</h1>
                <p class="module-description">Mettez en pratique les concepts appris dans ce module</p>
            </section>

            <section id="exercices" class="content-section">
                <h2>🔧 Liste des Exercices</h2>
                ${this.generateExercisesList(exercisesData)}
            </section>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Formation CI/CD - Tous droits réservés</p>
            <div class="footer-links">
                <a href="../guides/guide-formateur.html" class="footer-link">Guide Formateur</a>
                <a href="../guides/guide-apprenant.html" class="footer-link">Guide Apprenant</a>
                <a href="../index.html" class="footer-link">Accueil</a>
            </div>
        </div>
    </footer>

    <script src="../assets/js/scripts.js"></script>
</body>
</html>`;

    fs.writeFileSync(path.join(this.outputDir, 'exercices', `${moduleId}.html`), html);
  }

  /**
   * Obtient les exercices pour un module donné
   */
  getExercisesForModule(moduleId) {
    // Données d'exemple des exercices basées sur les tâches complétées
    const exercisesData = {
      'module-1': [
        {
          id: 'ex-1-1',
          title: 'Premier pipeline CI/CD avec GitHub Actions',
          duration: '30 min',
          difficulty: 'Débutant',
          objective: 'Créer votre premier pipeline CI/CD automatisé',
          description: 'Configurez un workflow GitHub Actions pour automatiser les tests et le déploiement'
        },
        {
          id: 'ex-1-2', 
          title: 'Configuration de tests automatisés avec Docker',
          duration: '45 min',
          difficulty: 'Intermédiaire',
          objective: 'Intégrer Docker dans votre pipeline de tests',
          description: 'Utilisez Docker pour créer un environnement de test reproductible'
        },
        {
          id: 'ex-1-3',
          title: 'Intégration de tests en parallèle',
          duration: '40 min', 
          difficulty: 'Intermédiaire',
          objective: 'Optimiser les temps d\'exécution avec la parallélisation',
          description: 'Configurez l\'exécution parallèle des tests pour améliorer les performances'
        }
      ],
      'module-2': [
        {
          id: 'ex-2-1',
          title: 'Configuration et utilisation de Testim',
          duration: '60 min',
          difficulty: 'Intermédiaire',
          objective: 'Découvrir les tests automatisés avec IA',
          description: 'Configurez Testim pour créer des tests intelligents et auto-réparants'
        },
        {
          id: 'ex-2-2',
          title: 'Tests visuels automatisés avec Applitools',
          duration: '50 min',
          difficulty: 'Intermédiaire',
          objective: 'Implémenter des tests visuels avec IA',
          description: 'Utilisez Applitools pour détecter automatiquement les régressions visuelles'
        },
        {
          id: 'ex-2-3',
          title: 'Détection d\'anomalies dans les logs avec IA',
          duration: '45 min',
          difficulty: 'Avancé',
          objective: 'Analyser les logs avec des algorithmes d\'IA',
          description: 'Implémentez un système de détection d\'anomalies dans les logs d\'application'
        },
        {
          id: 'ex-2-4',
          title: 'Génération de cas de test avec modèles NLP',
          duration: '55 min',
          difficulty: 'Avancé',
          objective: 'Automatiser la création de tests avec NLP',
          description: 'Utilisez des modèles de traitement du langage naturel pour générer des cas de test'
        },
        {
          id: 'ex-2-5',
          title: 'Analyse prédictive des zones à risque',
          duration: '50 min',
          difficulty: 'Avancé',
          objective: 'Prédire les zones de code à risque',
          description: 'Implémentez un modèle prédictif pour identifier les zones de code susceptibles de contenir des bugs'
        }
      ],
      'module-3': [
        {
          id: 'ex-3-1',
          title: 'Tests UI avec Selenium et Cypress',
          duration: '60 min',
          difficulty: 'Intermédiaire',
          objective: 'Maîtriser les tests d\'interface utilisateur',
          description: 'Créez des tests automatisés d\'interface avec Selenium et Cypress'
        },
        {
          id: 'ex-3-2',
          title: 'Tests API avec Postman et RestAssured',
          duration: '45 min',
          difficulty: 'Intermédiaire',
          objective: 'Automatiser les tests d\'API',
          description: 'Testez vos APIs avec Postman et RestAssured pour garantir leur fiabilité'
        },
        {
          id: 'ex-3-3',
          title: 'Simulation de charge avec JMeter',
          duration: '50 min',
          difficulty: 'Intermédiaire',
          objective: 'Évaluer les performances sous charge',
          description: 'Utilisez JMeter pour simuler une charge importante et analyser les performances'
        },
        {
          id: 'ex-3-4',
          title: 'Monitoring des temps de réponse',
          duration: '40 min',
          difficulty: 'Intermédiaire',
          objective: 'Surveiller les performances en continu',
          description: 'Mettez en place un système de monitoring des temps de réponse'
        },
        {
          id: 'ex-3-5',
          title: 'Scan de vulnérabilités avec OWASP ZAP',
          duration: '55 min',
          difficulty: 'Avancé',
          objective: 'Détecter les failles de sécurité',
          description: 'Utilisez OWASP ZAP pour identifier et corriger les vulnérabilités de sécurité'
        },
        {
          id: 'ex-3-6',
          title: 'Analyse des dépendances avec Snyk',
          duration: '35 min',
          difficulty: 'Intermédiaire',
          objective: 'Sécuriser les dépendances du projet',
          description: 'Analysez et sécurisez les dépendances de votre projet avec Snyk'
        }
      ],
      'module-4': [
        {
          id: 'ex-4-1',
          title: 'Génération de rapports avec Allure Report',
          duration: '40 min',
          difficulty: 'Intermédiaire',
          objective: 'Créer des rapports de tests détaillés',
          description: 'Générez des rapports de tests visuels et informatifs avec Allure'
        },
        {
          id: 'ex-4-2',
          title: 'Configuration de dashboards avec Grafana et Prometheus',
          duration: '60 min',
          difficulty: 'Avancé',
          objective: 'Surveiller les métriques en temps réel',
          description: 'Créez des tableaux de bord pour monitorer vos tests et applications'
        }
      ]
    };

    return exercisesData[moduleId] || [];
  }

  /**
   * Génère la liste des exercices
   */
  generateExercisesList(exercises) {
    return exercises.map(exercise => `
      <div class="exercise-card">
        <div class="exercise-header">
          <h3>${exercise.title}</h3>
          <span class="exercise-duration">${exercise.duration}</span>
        </div>
        <div class="exercise-content">
          <p><strong>Objectif:</strong> ${exercise.objective}</p>
          <p>${exercise.description}</p>
          <div class="exercise-meta">
            <span class="difficulty-badge difficulty-${exercise.difficulty.toLowerCase()}">${exercise.difficulty}</span>
          </div>
          
          <div class="exercise-form" data-exercise-id="${exercise.id}">
            <h4>💻 Zone de Travail</h4>
            <div class="form-group">
              <label for="${exercise.id}-code">Code/Configuration:</label>
              <textarea id="${exercise.id}-code" name="code" placeholder="Saisissez votre code ou configuration ici..." required></textarea>
            </div>
            <div class="form-group">
              <label for="${exercise.id}-result">Résultat obtenu:</label>
              <textarea id="${exercise.id}-result" name="result" placeholder="Décrivez le résultat obtenu..."></textarea>
            </div>
            <div class="form-group">
              <label for="${exercise.id}-notes">Notes personnelles:</label>
              <textarea id="${exercise.id}-notes" name="notes" placeholder="Vos observations et apprentissages..."></textarea>
            </div>
            <button type="button" class="btn btn-primary submit-exercise">Valider l'exercice</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Génère les guides
   */
  async generateGuides() {
    await this.generateGuideHTML('guide-formateur.md', 'Guide Formateur');
    await this.generateGuideHTML('guide-apprenant.md', 'Guide Apprenant');
  }

  /**
   * Génère le HTML d'un guide
   */
  async generateGuideHTML(guideFile, title) {
    const guidePath = path.join(this.baseDir, 'guides', guideFile);
    let guideContent = '';
    
    if (fs.existsSync(guidePath)) {
      guideContent = await this.loadMarkdownFile(path.relative(this.baseDir, guidePath));
    }

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Formation CI/CD</title>
    <link rel="stylesheet" href="../assets/css/styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="logo">
                <h1><a href="../index.html">Formation CI/CD</a></h1>
            </div>
            <nav class="navigation">
                <ul>
                    <li><a href="../index.html">Accueil</a></li>
                    <li><a href="guide-formateur.html">Guide Formateur</a></li>
                    <li><a href="guide-apprenant.html">Guide Apprenant</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <section class="hero-section">
                <div class="module-badge">GUIDE</div>
                <h1 class="module-title">${title}</h1>
                <p class="module-description">Documentation complète pour une utilisation optimale des supports de formation</p>
            </section>

            <section class="content-section">
                <div class="guide-content">
                    ${md.render(guideContent)}
                </div>
            </section>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Formation CI/CD - Tous droits réservés</p>
            <div class="footer-links">
                <a href="guide-formateur.html" class="footer-link">Guide Formateur</a>
                <a href="guide-apprenant.html" class="footer-link">Guide Apprenant</a>
                <a href="../index.html" class="footer-link">Accueil</a>
            </div>
        </div>
    </footer>

    <script src="../assets/js/scripts.js"></script>
</body>
</html>`;

    const outputFileName = guideFile.replace('.md', '.html');
    fs.writeFileSync(path.join(this.outputDir, 'guides', outputFileName), html);
  }

  /**
   * Charge un fichier Markdown
   */
  async loadMarkdownFile(relativePath) {
    const fullPath = path.join(this.baseDir, relativePath);
    
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
    
    return `# Contenu en cours de développement\n\nLe contenu de ce fichier sera ajouté prochainement.`;
  }

  /**
   * Copie un dossier récursivement
   */
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// Exécution du générateur si appelé directement
if (require.main === module) {
  const generator = new HTMLGenerator();
  generator.generateAll().catch(console.error);
}

module.exports = HTMLGenerator;