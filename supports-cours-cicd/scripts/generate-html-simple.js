#!/usr/bin/env node

/**
 * Générateur HTML interactif simplifié pour les supports de cours CI/CD
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
      
      // Générer les QCM interactifs
      await this.generateInteractiveQCM();
      
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

.option input[type="radio"] {
  margin-right: 1rem;
  transform: scale(1.2);
}

.option.selected {
  border-color: var(--primary-color);
  background: rgba(37, 99, 235, 0.1);
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

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  margin: 0 2rem;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
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
  
  .qcm-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .footer .container {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
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
    
    this.init();
  }

  init() {
    // Initialiser les QCM si présents
    if (document.querySelector('.qcm-container')) {
      this.initQCM();
    }
    
    // Initialiser la navigation
    this.initNavigation();
  }

  /**
   * Initialise les QCM interactifs
   */
  initQCM() {
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
      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill"></div>
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
    
    if (question.type === 'choix-multiple') {
      optionsHTML = question.options.map((option, optionIndex) => \`
        <label class="option" data-question="\${index}" data-option="\${optionIndex}">
          <input type="radio" name="q\${index}" value="\${optionIndex}">
          <span>\${option}</span>
        </label>
      \`).join('');
    } else if (question.type === 'vrai-faux') {
      optionsHTML = \`
        <label class="option" data-question="\${index}" data-option="true">
          <input type="radio" name="q\${index}" value="true">
          <span>Vrai</span>
        </label>
        <label class="option" data-question="\${index}" data-option="false">
          <input type="radio" name="q\${index}" value="false">
          <span>Faux</span>
        </label>
      \`;
    }

    questionDiv.innerHTML = \`
      <div class="question-header">
        <div class="question-number">Question \${index + 1}</div>
      </div>
      <div class="question-text">\${question.question}</div>
      <div class="options">
        \${optionsHTML}
      </div>
    \`;

    return questionDiv;
  }

  /**
   * Crée la navigation du QCM
   */
  createQCMNavigation() {
    const nav = document.createElement('div');
    nav.className = 'qcm-navigation';
    
    nav.innerHTML = \`
      <button class="btn btn-primary" id="prev-question" onclick="course.previousQuestion()">
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

    if (progressFill) {
      progressFill.style.width = \`\${progress}%\`;
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
    if (confirm('Êtes-vous sûr de vouloir terminer le QCM ?')) {
      this.calculateScore();
      this.showResults();
    }
  }

  /**
   * Calcule le score
   */
  calculateScore() {
    let correct = 0;
    const total = this.qcmData.questions.length;

    this.qcmData.questions.forEach((question, index) => {
      const userAnswer = this.answers[index];
      let isCorrect = false;

      if (question.type === 'choix-multiple') {
        isCorrect = parseInt(userAnswer) === question.reponse_correcte;
      } else if (question.type === 'vrai-faux') {
        isCorrect = (userAnswer === 'true') === question.reponse_correcte;
      }

      if (isCorrect) {
        correct++;
      }
    });

    this.score = Math.round((correct / total) * 100);
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

    container.innerHTML = \`
      <div class="results-container">
        <h2>🎉 Résultats du QCM</h2>
        <div class="score-display \${scoreClass}">\${this.score}%</div>
        <p class="score-message">\${scoreMessage}</p>
        
        <div class="results-actions">
          <button class="btn btn-primary" onclick="location.reload()">
            Recommencer
          </button>
        </div>
      </div>
    \`;
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

    // Gestion des événements pour les options QCM
    document.addEventListener('change', (e) => {
      if (e.target.type === 'radio' && e.target.name.startsWith('q')) {
        const questionIndex = parseInt(e.target.name.substring(1));
        this.answers[questionIndex] = e.target.value;
        
        // Marquer l'option comme sélectionnée
        const option = e.target.closest('.option');
        if (option) {
          // Retirer la sélection des autres options
          option.parentNode.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
          });
          // Ajouter la sélection à l'option courante
          option.classList.add('selected');
        }
      }
    });
  }
}

// Initialiser l'application
let course;
document.addEventListener('DOMContentLoaded', () => {
  course = new InteractiveCourse();
});
`;

    fs.writeFileSync(path.join(this.outputDir, 'assets', 'js', 'scripts.js'), js);
  }

  /**
   * Génère l'index principal
   */
  async generateMainIndex() {
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
                    <li><a href="#evaluations">Évaluations</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <section class="hero-section">
                <div class="module-badge">Formation Complète</div>
                <h1 class="module-title">Supports de Cours CI/CD Interactifs</h1>
                <p class="module-description">Formation complète sur l'intégration et le déploiement continus avec QCM interactifs</p>
                <div class="module-meta">
                    <span class="duration">⏱️ Durée: 5 jours</span>
                    <span class="difficulty">📊 Niveau: Intermédiaire</span>
                </div>
            </section>

            <section id="evaluations" class="content-section">
                <h2>📋 QCM Interactifs</h2>
                <p>Testez vos connaissances avec nos QCM interactifs :</p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
                    <a href="evaluations/qcm-module-1-fondamentaux.html" class="btn btn-primary">Module 1 - Fondamentaux</a>
                    <a href="evaluations/qcm-module-2-ia-automatisation.html" class="btn btn-primary">Module 2 - IA</a>
                    <a href="evaluations/qcm-module-3-tests-fonctionnels.html" class="btn btn-primary">Module 3 - Tests</a>
                    <a href="evaluations/qcm-module-4-documentation.html" class="btn btn-primary">Module 4 - Documentation</a>
                </div>
            </section>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Formation CI/CD - Tous droits réservés</p>
        </div>
    </footer>

    <script src="assets/js/scripts.js"></script>
</body>
</html>`;

    fs.writeFileSync(path.join(this.outputDir, 'index.html'), html);
  }

  /**
   * Génère les QCM interactifs
   */
  async generateInteractiveQCM() {
    // Générer chaque QCM intermédiaire
    const qcmFiles = [
      'qcm-module-1-fondamentaux.json',
      'qcm-module-2-ia-automatisation.json',
      'qcm-module-3-tests-fonctionnels.json',
      'qcm-module-4-documentation.json'
    ];

    for (const qcmFile of qcmFiles) {
      await this.generateQCMHTML(qcmFile);
    }
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
                </ul>
            </nav>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <section class="hero-section">
                <div class="module-badge">QCM INTERACTIF</div>
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
        </div>
    </footer>

    <script src="../assets/js/scripts.js"></script>
</body>
</html>`;

    const outputFileName = qcmFile.replace('.json', '.html');
    fs.writeFileSync(path.join(this.outputDir, 'evaluations', outputFileName), html);
  }
}

// Exécution du générateur si appelé directement
if (require.main === module) {
  const generator = new HTMLGenerator();
  generator.generateAll().catch(console.error);
}

module.exports = HTMLGenerator;