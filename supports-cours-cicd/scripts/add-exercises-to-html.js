#!/usr/bin/env node

/**
 * Script pour ajouter les exercices interactifs aux supports HTML
 */

const fs = require('fs');
const path = require('path');

class ExerciseGenerator {
  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.outputDir = path.join(this.baseDir, 'html-output');
  }

  /**
   * Génère les exercices interactifs
   */
  async generateExercises() {
    console.log('🔧 Génération des exercices interactifs...');
    
    try {
      // Générer les exercices pour chaque module
      const modules = ['module-1', 'module-2', 'module-3', 'module-4'];
      
      for (const module of modules) {
        await this.generateModuleExercises(module);
      }
      
      // Mettre à jour l'index principal
      await this.updateMainIndex();
      
      console.log('✅ Exercices générés avec succès!');
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération des exercices:', error);
      throw error;
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
    <style>
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
      
      .form-group textarea {
        width: 100%;
        min-height: 100px;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-size: 1rem;
        font-family: 'Courier New', monospace;
        resize: vertical;
      }
      
      .difficulty-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 1rem;
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
      
      .exercise-result {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 8px;
        display: none;
      }
      
      .exercise-result.success {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid var(--success-color);
        color: var(--success-color);
      }
      
      .exercise-result.error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid var(--error-color);
        color: var(--error-color);
      }
      
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
    </style>
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
                <div class="alert alert-info">
                    <strong>💡 Instructions :</strong>
                    Complétez les exercices ci-dessous en saisissant votre code ou vos réponses dans les zones prévues. 
                    Cliquez sur "Valider" pour vérifier votre travail.
                </div>
                
                <h2>🔧 Liste des Exercices</h2>
                ${this.generateExercisesList(exercisesData)}
            </section>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Formation CI/CD - Tous droits réservés</p>
        </div>
    </footer>

    <script src="../assets/js/scripts.js"></script>
    <script>
      // JavaScript pour la validation des exercices
      function validateExercise(exerciseId) {
        const form = document.querySelector(\`[data-exercise-id="\${exerciseId}"]\`);
        const resultDiv = form.querySelector('.exercise-result');
        const codeInput = form.querySelector('textarea[name="code"]');
        const resultInput = form.querySelector('textarea[name="result"]');
        
        // Validation basique : vérifier que les champs sont remplis
        const isValid = codeInput.value.trim() !== '' && resultInput.value.trim() !== '';
        
        resultDiv.style.display = 'block';
        resultDiv.className = 'exercise-result ' + (isValid ? 'success' : 'error');
        
        if (isValid) {
          resultDiv.innerHTML = '<strong>✅ Exercice validé !</strong><br>Félicitations, vous avez complété cet exercice.';
        } else {
          resultDiv.innerHTML = '<strong>❌ Exercice incomplet</strong><br>Veuillez compléter tous les champs requis.';
        }
      }
      
      // Sauvegarde automatique dans le localStorage
      document.addEventListener('input', (e) => {
        if (e.target.tagName === 'TEXTAREA') {
          const exerciseId = e.target.closest('[data-exercise-id]').dataset.exerciseId;
          const fieldName = e.target.name;
          localStorage.setItem(\`exercise_\${exerciseId}_\${fieldName}\`, e.target.value);
        }
      });
      
      // Restauration des données sauvegardées
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-exercise-id]').forEach(form => {
          const exerciseId = form.dataset.exerciseId;
          form.querySelectorAll('textarea').forEach(textarea => {
            const fieldName = textarea.name;
            const savedValue = localStorage.getItem(\`exercise_\${exerciseId}_\${fieldName}\`);
            if (savedValue) {
              textarea.value = savedValue;
            }
          });
        });
      });
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(this.outputDir, 'exercices', `${moduleId}.html`), html);
  }

  /**
   * Obtient les exercices pour un module donné
   */
  getExercisesForModule(moduleId) {
    const exercisesData = {
      'module-1': [
        {
          id: 'ex-1-1',
          title: 'Premier pipeline CI/CD avec GitHub Actions',
          duration: '30 min',
          difficulty: 'Débutant',
          objective: 'Créer votre premier pipeline CI/CD automatisé',
          description: 'Configurez un workflow GitHub Actions pour automatiser les tests et le déploiement',
          instructions: [
            'Créez un fichier .github/workflows/ci.yml',
            'Configurez les étapes de build et test',
            'Ajoutez le déploiement automatique',
            'Testez votre pipeline'
          ]
        },
        {
          id: 'ex-1-2', 
          title: 'Configuration de tests automatisés avec Docker',
          duration: '45 min',
          difficulty: 'Intermédiaire',
          objective: 'Intégrer Docker dans votre pipeline de tests',
          description: 'Utilisez Docker pour créer un environnement de test reproductible',
          instructions: [
            'Créez un Dockerfile pour votre application',
            'Configurez docker-compose pour les tests',
            'Intégrez Docker dans votre pipeline CI',
            'Vérifiez l\'isolation des tests'
          ]
        },
        {
          id: 'ex-1-3',
          title: 'Intégration de tests en parallèle',
          duration: '40 min', 
          difficulty: 'Intermédiaire',
          objective: 'Optimiser les temps d\'exécution avec la parallélisation',
          description: 'Configurez l\'exécution parallèle des tests pour améliorer les performances',
          instructions: [
            'Analysez votre suite de tests actuelle',
            'Identifiez les tests parallélisables',
            'Configurez la matrice de tests',
            'Mesurez l\'amélioration des performances'
          ]
        }
      ],
      'module-2': [
        {
          id: 'ex-2-1',
          title: 'Configuration et utilisation de Testim',
          duration: '60 min',
          difficulty: 'Intermédiaire',
          objective: 'Découvrir les tests automatisés avec IA',
          description: 'Configurez Testim pour créer des tests intelligents et auto-réparants',
          instructions: [
            'Créez un compte Testim',
            'Installez l\'extension Chrome',
            'Enregistrez votre premier test',
            'Configurez l\'auto-healing'
          ]
        },
        {
          id: 'ex-2-2',
          title: 'Tests visuels automatisés avec Applitools',
          duration: '50 min',
          difficulty: 'Intermédiaire',
          objective: 'Implémenter des tests visuels avec IA',
          description: 'Utilisez Applitools pour détecter automatiquement les régressions visuelles',
          instructions: [
            'Configurez Applitools Eyes',
            'Intégrez les tests visuels',
            'Analysez les résultats',
            'Configurez les baselines'
          ]
        }
      ],
      'module-3': [
        {
          id: 'ex-3-1',
          title: 'Tests UI avec Selenium et Cypress',
          duration: '60 min',
          difficulty: 'Intermédiaire',
          objective: 'Maîtriser les tests d\'interface utilisateur',
          description: 'Créez des tests automatisés d\'interface avec Selenium et Cypress',
          instructions: [
            'Installez Selenium WebDriver',
            'Créez vos premiers tests Selenium',
            'Installez et configurez Cypress',
            'Comparez les deux approches'
          ]
        },
        {
          id: 'ex-3-2',
          title: 'Tests API avec Postman et RestAssured',
          duration: '45 min',
          difficulty: 'Intermédiaire',
          objective: 'Automatiser les tests d\'API',
          description: 'Testez vos APIs avec Postman et RestAssured pour garantir leur fiabilité',
          instructions: [
            'Créez une collection Postman',
            'Écrivez des tests avec RestAssured',
            'Automatisez l\'exécution',
            'Générez des rapports'
          ]
        }
      ],
      'module-4': [
        {
          id: 'ex-4-1',
          title: 'Génération de rapports avec Allure Report',
          duration: '40 min',
          difficulty: 'Intermédiaire',
          objective: 'Créer des rapports de tests détaillés',
          description: 'Générez des rapports de tests visuels et informatifs avec Allure',
          instructions: [
            'Installez Allure Framework',
            'Configurez les annotations',
            'Générez votre premier rapport',
            'Personnalisez l\'affichage'
          ]
        },
        {
          id: 'ex-4-2',
          title: 'Configuration de dashboards avec Grafana et Prometheus',
          duration: '60 min',
          difficulty: 'Avancé',
          objective: 'Surveiller les métriques en temps réel',
          description: 'Créez des tableaux de bord pour monitorer vos tests et applications',
          instructions: [
            'Installez Prometheus et Grafana',
            'Configurez les métriques',
            'Créez des dashboards',
            'Configurez les alertes'
          ]
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
          <div class="difficulty-badge difficulty-${exercise.difficulty.toLowerCase()}">${exercise.difficulty}</div>
          
          <p><strong>🎯 Objectif:</strong> ${exercise.objective}</p>
          <p>${exercise.description}</p>
          
          <h4>📋 Instructions:</h4>
          <ol>
            ${exercise.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
          </ol>
          
          <div class="exercise-form" data-exercise-id="${exercise.id}">
            <h4>💻 Zone de Travail</h4>
            <div class="form-group">
              <label for="${exercise.id}-code">Code/Configuration:</label>
              <textarea id="${exercise.id}-code" name="code" placeholder="Saisissez votre code ou configuration ici..." required></textarea>
            </div>
            <div class="form-group">
              <label for="${exercise.id}-result">Résultat obtenu:</label>
              <textarea id="${exercise.id}-result" name="result" placeholder="Décrivez le résultat obtenu, les erreurs rencontrées, etc." required></textarea>
            </div>
            <div class="form-group">
              <label for="${exercise.id}-notes">Notes personnelles (optionnel):</label>
              <textarea id="${exercise.id}-notes" name="notes" placeholder="Vos observations, apprentissages, questions..."></textarea>
            </div>
            <button type="button" class="btn btn-primary" onclick="validateExercise('${exercise.id}')">
              ✅ Valider l'exercice
            </button>
            <div class="exercise-result"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Met à jour l'index principal pour inclure les exercices
   */
  async updateMainIndex() {
    const indexPath = path.join(this.outputDir, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Ajouter la section exercices après les évaluations
    const exercisesSection = `
            <section id="exercices" class="content-section">
                <h2>🔧 Exercices Pratiques</h2>
                <p>Mettez en pratique vos connaissances avec nos exercices interactifs :</p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
                    <a href="exercices/module-1.html" class="btn btn-success">Module 1 - Exercices</a>
                    <a href="exercices/module-2.html" class="btn btn-success">Module 2 - Exercices</a>
                    <a href="exercices/module-3.html" class="btn btn-success">Module 3 - Exercices</a>
                    <a href="exercices/module-4.html" class="btn btn-success">Module 4 - Exercices</a>
                </div>
            </section>`;
    
    // Insérer la section exercices avant la fermeture du main
    indexContent = indexContent.replace(
      '</div>\n    </main>',
      exercisesSection + '\n        </div>\n    </main>'
    );
    
    // Mettre à jour la navigation
    indexContent = indexContent.replace(
      '<li><a href="#evaluations">Évaluations</a></li>',
      '<li><a href="#evaluations">Évaluations</a></li>\n                    <li><a href="#exercices">Exercices</a></li>'
    );
    
    fs.writeFileSync(indexPath, indexContent);
  }
}

// Exécution du générateur si appelé directement
if (require.main === module) {
  const generator = new ExerciseGenerator();
  generator.generateExercises().catch(console.error);
}

module.exports = ExerciseGenerator;