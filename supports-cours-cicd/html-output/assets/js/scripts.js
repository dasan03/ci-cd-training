
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
    
    controls.innerHTML = `
      <div class="qcm-info">
        <h3>${this.qcmData.titre}</h3>
        <p>Durée: ${this.qcmData.duree_minutes} minutes</p>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill"></div>
      </div>
      <div class="qcm-timer">
        <span id="timer">${this.qcmData.duree_minutes}:00</span>
      </div>
    `;

    return controls;
  }

  /**
   * Crée un élément de question
   */
  createQuestionElement(question, index) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-card';
    questionDiv.id = `question-${index}`;
    questionDiv.style.display = index === 0 ? 'block' : 'none';

    let optionsHTML = '';
    
    if (question.type === 'choix-multiple') {
      optionsHTML = question.options.map((option, optionIndex) => `
        <label class="option" data-question="${index}" data-option="${optionIndex}">
          <input type="radio" name="q${index}" value="${optionIndex}">
          <span>${option}</span>
        </label>
      `).join('');
    } else if (question.type === 'vrai-faux') {
      optionsHTML = `
        <label class="option" data-question="${index}" data-option="true">
          <input type="radio" name="q${index}" value="true">
          <span>Vrai</span>
        </label>
        <label class="option" data-question="${index}" data-option="false">
          <input type="radio" name="q${index}" value="false">
          <span>Faux</span>
        </label>
      `;
    }

    questionDiv.innerHTML = `
      <div class="question-header">
        <div class="question-number">Question ${index + 1}</div>
      </div>
      <div class="question-text">${question.question}</div>
      <div class="options">
        ${optionsHTML}
      </div>
    `;

    return questionDiv;
  }

  /**
   * Crée la navigation du QCM
   */
  createQCMNavigation() {
    const nav = document.createElement('div');
    nav.className = 'qcm-navigation';
    
    nav.innerHTML = `
      <button class="btn btn-primary" id="prev-question" onclick="course.previousQuestion()">
        ← Précédent
      </button>
      <button class="btn btn-primary" id="next-question" onclick="course.nextQuestion()">
        Suivant →
      </button>
      <button class="btn btn-success" id="submit-qcm" onclick="course.submitQCM()" style="display: none;">
        Terminer le QCM
      </button>
    `;

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
    const currentCard = document.getElementById(`question-${index}`);
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
      progressFill.style.width = `${progress}%`;
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

    container.innerHTML = `
      <div class="results-container">
        <h2>🎉 Résultats du QCM</h2>
        <div class="score-display ${scoreClass}">${this.score}%</div>
        <p class="score-message">${scoreMessage}</p>
        
        <div class="results-actions">
          <button class="btn btn-primary" onclick="location.reload()">
            Recommencer
          </button>
        </div>
      </div>
    `;
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
