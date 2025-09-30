# Exercice 4.1 - Génération de rapports avec Allure Report

## Objectifs

À l'issue de cet exercice, vous serez capable de :
- Configurer Allure Report dans un projet de test JavaScript
- Instrumenter vos tests avec des annotations Allure avancées
- Générer des rapports visuels interactifs
- Intégrer Allure dans un pipeline CI/CD avec GitHub Actions
- Analyser et interpréter les rapports générés

## Durée estimée
45 minutes

## Prérequis

- Node.js (version 16+)
- npm ou yarn
- Git
- Navigateur web moderne
- Compte GitHub (pour la partie CI/CD)

## Contexte

Vous travaillez sur une application de gestion de tâches et vous devez mettre en place un système de reporting avancé pour vos tests automatisés. L'équipe souhaite avoir des rapports visuels détaillés avec historique, catégorisation des échecs, et intégration dans le pipeline CI/CD.

## Étape 1 : Configuration initiale du projet

### 1.1 Initialisation du projet

```bash
# Créer le répertoire de travail
mkdir allure-reporting-demo
cd allure-reporting-demo

# Initialiser le projet Node.js
npm init -y

# Installer les dépendances de test
npm install --save-dev jest @jest/globals

# Installer Allure
npm install --save-dev allure-commandline allure-jest
npm install -g allure-commandline
```

### 1.2 Configuration de Jest avec Allure

Créez le fichier `jest.config.js` :

```javascript
module.exports = {
  testEnvironment: 'node',
  reporters: [
    'default',
    ['allure-jest', {
      outputDir: 'allure-results',
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
    }]
  ],
  setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
```

Créez le fichier `test-setup.js` :

```javascript
const { registerAllureReporter } = require('allure-jest/dist/setup');
registerAllureReporter();
```

## Étape 2 : Création de l'application de test

### 2.1 Code source de l'application

Créez le fichier `src/taskManager.js` :

```javascript
class TaskManager {
  constructor() {
    this.tasks = [];
    this.nextId = 1;
  }

  addTask(title, description = '', priority = 'medium') {
    if (!title || title.trim() === '') {
      throw new Error('Task title is required');
    }

    if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
      throw new Error('Invalid priority level');
    }

    const task = {
      id: this.nextId++,
      title: title.trim(),
      description: description.trim(),
      priority,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.push(task);
    return task;
  }

  getTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }
    return task;
  }

  updateTask(id, updates) {
    const task = this.getTask(id);
    
    if (updates.title !== undefined) {
      if (!updates.title || updates.title.trim() === '') {
        throw new Error('Task title cannot be empty');
      }
      task.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      task.description = updates.description.trim();
    }

    if (updates.priority !== undefined) {
      if (!['low', 'medium', 'high', 'critical'].includes(updates.priority)) {
        throw new Error('Invalid priority level');
      }
      task.priority = updates.priority;
    }

    if (updates.completed !== undefined) {
      task.completed = Boolean(updates.completed);
    }

    task.updatedAt = new Date();
    return task;
  }

  deleteTask(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Task with id ${id} not found`);
    }
    return this.tasks.splice(index, 1)[0];
  }

  getTasks(filter = {}) {
    let filteredTasks = [...this.tasks];

    if (filter.completed !== undefined) {
      filteredTasks = filteredTasks.filter(t => t.completed === filter.completed);
    }

    if (filter.priority) {
      filteredTasks = filteredTasks.filter(t => t.priority === filter.priority);
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredTasks = filteredTasks.filter(t => 
        t.title.toLowerCase().includes(searchTerm) ||
        t.description.toLowerCase().includes(searchTerm)
      );
    }

    return filteredTasks;
  }

  getTaskStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const byPriority = this.tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      completed,
      pending: total - completed,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      byPriority
    };
  }
}

module.exports = TaskManager;
```

## Étape 3 : Tests instrumentés avec Allure

### 3.1 Tests de base avec annotations Allure

Créez le fichier `__tests__/taskManager.test.js` :

```javascript
const TaskManager = require('../src/taskManager');
const allure = require('allure-js-commons');

describe('TaskManager', () => {
  let taskManager;

  beforeEach(() => {
    allure.step('Initialize TaskManager', () => {
      taskManager = new TaskManager();
    });
  });

  describe('Task Creation', () => {
    allure.feature('Task Management');
    allure.story('Task Creation');

    test('should create a task with valid data', async () => {
      allure.description('Test de création d\'une tâche avec des données valides');
      allure.owner('Team QA');
      allure.tag('smoke', 'task-creation', 'positive');
      allure.severity('critical');
      allure.link('https://jira.company.com/REQ-001', 'Requirement');

      await allure.step('Create task with valid data', () => {
        const task = taskManager.addTask('Test Task', 'Test Description', 'high');
        
        allure.attachment('Created Task', JSON.stringify(task, null, 2), 'application/json');
        
        expect(task).toMatchObject({
          id: 1,
          title: 'Test Task',
          description: 'Test Description',
          priority: 'high',
          completed: false
        });
        expect(task.createdAt).toBeInstanceOf(Date);
        expect(task.updatedAt).toBeInstanceOf(Date);
      });
    });

    test('should fail when creating task without title', async () => {
      allure.description('Test de validation : création d\'une tâche sans titre');
      allure.owner('Team QA');
      allure.tag('validation', 'negative', 'error-handling');
      allure.severity('normal');

      await allure.step('Attempt to create task without title', () => {
        expect(() => {
          taskManager.addTask('');
        }).toThrow('Task title is required');
      });
    });

    test('should fail with invalid priority', async () => {
      allure.description('Test de validation : priorité invalide');
      allure.owner('Team QA');
      allure.tag('validation', 'negative', 'priority');
      allure.severity('normal');

      await allure.step('Attempt to create task with invalid priority', () => {
        expect(() => {
          taskManager.addTask('Test Task', 'Description', 'invalid');
        }).toThrow('Invalid priority level');
      });
    });
  });

  describe('Task Retrieval', () => {
    allure.feature('Task Management');
    allure.story('Task Retrieval');

    beforeEach(async () => {
      await allure.step('Setup test data', () => {
        taskManager.addTask('Task 1', 'Description 1', 'high');
        taskManager.addTask('Task 2', 'Description 2', 'medium');
        taskManager.addTask('Task 3', 'Description 3', 'low');
      });
    });

    test('should retrieve existing task by id', async () => {
      allure.description('Test de récupération d\'une tâche existante par ID');
      allure.owner('Team QA');
      allure.tag('retrieval', 'positive');
      allure.severity('critical');

      await allure.step('Retrieve task by ID', () => {
        const task = taskManager.getTask(1);
        
        allure.attachment('Retrieved Task', JSON.stringify(task, null, 2), 'application/json');
        
        expect(task.id).toBe(1);
        expect(task.title).toBe('Task 1');
      });
    });

    test('should fail when retrieving non-existent task', async () => {
      allure.description('Test d\'erreur : récupération d\'une tâche inexistante');
      allure.owner('Team QA');
      allure.tag('retrieval', 'negative', 'error-handling');
      allure.severity('normal');

      await allure.step('Attempt to retrieve non-existent task', () => {
        expect(() => {
          taskManager.getTask(999);
        }).toThrow('Task with id 999 not found');
      });
    });
  });

  describe('Task Filtering', () => {
    allure.feature('Task Management');
    allure.story('Task Filtering');

    beforeEach(async () => {
      await allure.step('Setup test data with various states', () => {
        const task1 = taskManager.addTask('Urgent Task', 'High priority task', 'high');
        const task2 = taskManager.addTask('Normal Task', 'Medium priority task', 'medium');
        const task3 = taskManager.addTask('Low Task', 'Low priority task', 'low');
        
        // Mark some tasks as completed
        taskManager.updateTask(task1.id, { completed: true });
        
        allure.attachment('Test Data Setup', JSON.stringify({
          totalTasks: 3,
          completedTasks: 1,
          pendingTasks: 2
        }, null, 2), 'application/json');
      });
    });

    test('should filter tasks by completion status', async () => {
      allure.description('Test de filtrage des tâches par statut de completion');
      allure.owner('Team QA');
      allure.tag('filtering', 'completion-status');
      allure.severity('normal');

      await allure.step('Filter completed tasks', () => {
        const completedTasks = taskManager.getTasks({ completed: true });
        expect(completedTasks).toHaveLength(1);
        expect(completedTasks[0].completed).toBe(true);
      });

      await allure.step('Filter pending tasks', () => {
        const pendingTasks = taskManager.getTasks({ completed: false });
        expect(pendingTasks).toHaveLength(2);
        expect(pendingTasks.every(t => !t.completed)).toBe(true);
      });
    });

    test('should filter tasks by priority', async () => {
      allure.description('Test de filtrage des tâches par priorité');
      allure.owner('Team QA');
      allure.tag('filtering', 'priority');
      allure.severity('normal');

      await allure.step('Filter high priority tasks', () => {
        const highPriorityTasks = taskManager.getTasks({ priority: 'high' });
        expect(highPriorityTasks).toHaveLength(1);
        expect(highPriorityTasks[0].priority).toBe('high');
      });
    });

    test('should search tasks by text', async () => {
      allure.description('Test de recherche de tâches par texte');
      allure.owner('Team QA');
      allure.tag('filtering', 'search', 'text-search');
      allure.severity('normal');

      await allure.step('Search tasks by title', () => {
        const searchResults = taskManager.getTasks({ search: 'urgent' });
        expect(searchResults).toHaveLength(1);
        expect(searchResults[0].title.toLowerCase()).toContain('urgent');
      });
    });
  });

  describe('Task Statistics', () => {
    allure.feature('Task Management');
    allure.story('Task Statistics');

    test('should calculate task statistics correctly', async () => {
      allure.description('Test de calcul des statistiques des tâches');
      allure.owner('Team QA');
      allure.tag('statistics', 'metrics');
      allure.severity('normal');

      await allure.step('Create test data', () => {
        taskManager.addTask('Task 1', 'Description', 'high');
        taskManager.addTask('Task 2', 'Description', 'medium');
        taskManager.addTask('Task 3', 'Description', 'high');
        
        // Complete one task
        taskManager.updateTask(1, { completed: true });
      });

      await allure.step('Calculate and verify statistics', () => {
        const stats = taskManager.getTaskStats();
        
        allure.attachment('Task Statistics', JSON.stringify(stats, null, 2), 'application/json');
        
        expect(stats.total).toBe(3);
        expect(stats.completed).toBe(1);
        expect(stats.pending).toBe(2);
        expect(stats.completionRate).toBeCloseTo(33.33, 2);
        expect(stats.byPriority.high).toBe(2);
        expect(stats.byPriority.medium).toBe(1);
      });
    });
  });
});
```

### 3.2 Tests avec simulation d'échecs

Créez le fichier `__tests__/taskManager.flaky.test.js` :

```javascript
const TaskManager = require('../src/taskManager');
const allure = require('allure-js-commons');

describe('TaskManager - Flaky Tests (for demonstration)', () => {
  let taskManager;

  beforeEach(() => {
    taskManager = new TaskManager();
  });

  test('flaky test - sometimes passes, sometimes fails', async () => {
    allure.description('Test instable pour démonstration des rapports d\'échec');
    allure.owner('Team QA');
    allure.tag('flaky', 'demonstration');
    allure.severity('minor');
    allure.issue('https://jira.company.com/BUG-123', 'Known Flaky Test');

    await allure.step('Create task', () => {
      taskManager.addTask('Flaky Task', 'This test is intentionally flaky');
    });

    await allure.step('Simulate flaky behavior', () => {
      const shouldPass = Math.random() > 0.3; // 70% chance of passing
      
      if (!shouldPass) {
        allure.attachment('Failure Context', JSON.stringify({
          reason: 'Simulated network timeout',
          timestamp: new Date().toISOString(),
          randomValue: Math.random()
        }, null, 2), 'application/json');
        
        throw new Error('Simulated network timeout - this is expected to fail sometimes');
      }
      
      expect(true).toBe(true);
    });
  });

  test('test with environment dependency', async () => {
    allure.description('Test dépendant de l\'environnement');
    allure.owner('Team QA');
    allure.tag('environment', 'external-dependency');
    allure.severity('normal');

    await allure.step('Check environment', () => {
      const isCI = process.env.CI === 'true';
      
      allure.attachment('Environment Info', JSON.stringify({
        NODE_ENV: process.env.NODE_ENV,
        CI: process.env.CI,
        platform: process.platform,
        nodeVersion: process.version
      }, null, 2), 'application/json');
      
      if (isCI) {
        // This test might behave differently in CI
        expect(taskManager.getTasks()).toEqual([]);
      } else {
        expect(taskManager.getTasks()).toEqual([]);
      }
    });
  });
});
```

## Étape 4 : Configuration des catégories d'échecs

Créez le fichier `categories.json` :

```json
[
  {
    "name": "Ignored tests",
    "matchedStatuses": ["skipped"]
  },
  {
    "name": "Infrastructure problems",
    "matchedStatuses": ["broken", "failed"],
    "messageRegex": ".*timeout.*|.*connection.*|.*network.*|.*ECONNREFUSED.*"
  },
  {
    "name": "Outdated tests",
    "matchedStatuses": ["broken"],
    "traceRegex": ".*NoSuchElementException.*|.*ElementNotFound.*"
  },
  {
    "name": "Flaky tests",
    "matchedStatuses": ["failed", "broken"],
    "messageRegex": ".*flaky.*|.*intermittent.*|.*random.*"
  },
  {
    "name": "Product defects",
    "matchedStatuses": ["failed"]
  }
]
```

## Étape 5 : Scripts de génération de rapports

### 5.1 Mise à jour du package.json

Ajoutez les scripts suivants dans votre `package.json` :

```json
{
  "scripts": {
    "test": "jest",
    "test:allure": "jest --reporters=default --reporters=allure-jest",
    "allure:generate": "allure generate allure-results --clean -o allure-report",
    "allure:open": "allure open allure-report",
    "allure:serve": "allure serve allure-results",
    "test:report": "npm run test:allure && npm run allure:generate && npm run allure:open",
    "test:ci": "jest --ci --coverage --reporters=default --reporters=allure-jest"
  }
}
```

### 5.2 Script de génération automatique

Créez le fichier `generate-report.sh` :

```bash
#!/bin/bash

echo "🧪 Exécution des tests avec génération Allure..."

# Nettoyage des anciens résultats
rm -rf allure-results allure-report

# Exécution des tests
npm run test:allure

# Copie des catégories
cp categories.json allure-results/

# Génération du rapport
echo "📊 Génération du rapport Allure..."
allure generate allure-results --clean -o allure-report

# Ouverture du rapport
echo "🌐 Ouverture du rapport..."
allure open allure-report
```

Rendez le script exécutable :
```bash
chmod +x generate-report.sh
```

## Étape 6 : Intégration CI/CD avec GitHub Actions

### 6.1 Configuration GitHub Actions

Créez le fichier `.github/workflows/test-report.yml` :

```yaml
name: Test and Generate Allure Report

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm run test:ci
      continue-on-error: true
      
    - name: Copy categories
      run: cp categories.json allure-results/ || true
      
    - name: Get Allure history
      uses: actions/checkout@v3
      if: always()
      continue-on-error: true
      with:
        ref: gh-pages
        path: gh-pages
        
    - name: Allure Report action
      uses: simple-elf/allure-report-action@master
      if: always()
      id: allure-report
      with:
        allure_results: allure-results
        allure_history: allure-history
        keep_reports: 20
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: always()
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: allure-history
        
    - name: Comment PR with report link
      uses: actions/github-script@v6
      if: github.event_name == 'pull_request' && always()
      with:
        script: |
          const reportUrl = `https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}`;
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: `📊 **Allure Report** is ready! [View Report](${reportUrl})`
          });
```

### 6.2 Configuration pour les environnements

Créez le fichier `allure.properties` :

```properties
allure.results.directory=allure-results
allure.link.issue.pattern=https://jira.company.com/browse/{}
allure.link.tms.pattern=https://testmanagement.company.com/test/{}
```

## Étape 7 : Exécution et analyse

### 7.1 Exécution des tests

```bash
# Exécution simple
npm test

# Exécution avec génération Allure
npm run test:allure

# Génération et ouverture du rapport
npm run test:report
```

### 7.2 Analyse du rapport

Une fois le rapport ouvert, explorez les sections suivantes :

1. **Overview** : Vue d'ensemble des résultats
2. **Categories** : Catégorisation des échecs
3. **Suites** : Organisation par suites de tests
4. **Graphs** : Graphiques de répartition
5. **Timeline** : Chronologie d'exécution
6. **Behaviors** : Organisation par features/stories
7. **Packages** : Organisation par packages

## Questions d'analyse

1. **Interprétation des métriques** :
   - Quel est le taux de réussite global ?
   - Quels sont les tests les plus lents ?
   - Y a-t-il des patterns dans les échecs ?

2. **Catégorisation** :
   - Comment les échecs sont-ils catégorisés ?
   - Quels types d'échecs sont les plus fréquents ?

3. **Tendances** :
   - Comment évolue la qualité dans le temps ?
   - Y a-t-il des régressions identifiables ?

## Livrables attendus

1. **Projet configuré** avec Allure Report
2. **Tests instrumentés** avec annotations complètes
3. **Rapport généré** et analysé
4. **Pipeline CI/CD** fonctionnel
5. **Document d'analyse** des résultats (optionnel)

## Ressources complémentaires

- [Documentation Allure](https://docs.qameta.io/allure/)
- [Allure Jest Adapter](https://github.com/allure-framework/allure-js/tree/master/packages/allure-jest)
- [GitHub Actions pour Allure](https://github.com/simple-elf/allure-report-action)

## Dépannage

### Problèmes courants

1. **Allure command not found** :
   ```bash
   npm install -g allure-commandline
   ```

2. **Rapport vide** :
   - Vérifiez que les tests génèrent des résultats dans `allure-results/`
   - Assurez-vous que la configuration Jest est correcte

3. **Erreurs de génération** :
   - Vérifiez les permissions sur les dossiers
   - Nettoyez les anciens résultats : `rm -rf allure-results allure-report`

4. **GitHub Pages non accessible** :
   - Vérifiez que GitHub Pages est activé dans les paramètres du repository
   - Assurez-vous que la branche `gh-pages` existe