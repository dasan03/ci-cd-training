
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
    
    controls.innerHTML = `
      <div class="qcm-info">
        <h3>${this.qcmData.titre}</h3>
        <p>Durée: ${this.qcmData.duree_minutes} minutes</p>
      </div>
      <div class="qcm-progress">
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
        <div class="progress-text" id="progress-text">Question 1 sur ${this.qcmData.questions.length}</div>
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

    questionDiv.innerHTML = `
      <div class="question-header">
        <div class="question-number">Question ${index + 1}</div>
        <div class="question-type">${question.type}</div>
      </div>
      <div class="question-text">${question.question}</div>
      <div class="options">
        ${optionsHTML}
      </div>
      <div class="explanation" id="explanation-${index}">
        <h4>💡 Explication</h4>
        <p>${question.explication}</p>
      </div>
    `;

    return questionDiv;
  }

  /**
   * Crée les options pour les questions à choix multiples
   */
  createMultipleChoiceOptions(question, questionIndex) {
    return question.options.map((option, optionIndex) => `
      <label class="option" data-question="${questionIndex}" data-option="${optionIndex}">
        <input type="radio" name="q${questionIndex}" value="${optionIndex}">
        <span>${option}</span>
      </label>
    `).join('');
  }

  /**
   * Crée les options pour les questions vrai/faux
   */
  createTrueFalseOptions(question, questionIndex) {
    return `
      <label class="option" data-question="${questionIndex}" data-option="true">
        <input type="radio" name="q${questionIndex}" value="true">
        <span>Vrai</span>
      </label>
      <label class="option" data-question="${questionIndex}" data-option="false">
        <input type="radio" name="q${questionIndex}" value="false">
        <span>Faux</span>
      </label>
    `;
  }

  /**
   * Crée les options pour les questions d'association
   */
  createAssociationOptions(question, questionIndex) {
    return `
      <div class="association-container">
        <div class="association-column">
          <h4>Éléments à associer</h4>
          ${question.elements_gauche.map((element, index) => `
            <div class="association-item" data-question="${questionIndex}" data-left="${index}">
              ${element}
            </div>
          `).join('')}
        </div>
        <div class="association-column">
          <h4>Correspondances</h4>
          ${question.elements_droite.map((element, index) => `
            <div class="association-item" data-question="${questionIndex}" data-right="${index}">
              ${element}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Crée la navigation du QCM
   */
  createQCMNavigation() {
    const nav = document.createElement('div');
    nav.className = 'qcm-navigation';
    
    nav.innerHTML = `
      <button class="btn btn-secondary" id="prev-question" onclick="course.previousQuestion()">
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
    const progressText = document.getElementById('progress-text');

    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    if (progressText) {
      progressText.textContent = `Question ${this.currentQuestion + 1} sur ${this.qcmData.questions.length}`;
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
        return `
          <div class="competence-item">
            <div class="competence-score ${percentage >= 70 ? 'good' : 'needs-improvement'}">
              ${percentage}%
            </div>
            <div class="competence-name">Compétence ${competence}</div>
          </div>
        `;
      }).join('');

    container.innerHTML = `
      <div class="results-container">
        <h2>🎉 Résultats du QCM</h2>
        <div class="score-display ${scoreClass}">${this.score}%</div>
        <p class="score-message">${scoreMessage}</p>
        
        <div class="competence-breakdown">
          <h3>Détail par compétence</h3>
          ${competenceBreakdown}
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
    `;
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
      resultDiv.innerHTML = `
        <div class="alert alert-success">
          <strong>✅ Exercice réussi !</strong>
          <p>Félicitations, vous avez correctement complété cet exercice.</p>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `
        <div class="alert alert-error">
          <strong>❌ Exercice incomplet</strong>
          <p>Veuillez vérifier vos réponses et compléter tous les champs requis.</p>
        </div>
      `;
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
    const questionCard = document.getElementById(`question-${questionIndex}`);
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
      document.querySelectorAll(`[data-question="${questionIndex}"][data-left]`).forEach(el => {
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
      document.querySelector(`[data-question="${questionIndex}"][data-left="${this.selectedLeft}"]`).classList.add('matched');
      
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
  const explanation = document.getElementById(`explanation-${questionIndex}`);
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
