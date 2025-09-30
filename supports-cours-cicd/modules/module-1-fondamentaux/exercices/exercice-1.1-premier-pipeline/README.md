# Exercice 1.1 - Premier Pipeline CI/CD avec GitHub Actions

## 🎯 Objectifs d'Apprentissage

À l'issue de cet exercice, vous serez capable de :
- Créer et configurer un workflow GitHub Actions
- Intégrer des tests unitaires dans un pipeline CI/CD
- Gérer les artefacts de build et les rapports de test
- Comprendre les concepts de base des actions et jobs

## ⏱️ Durée Estimée
90 minutes

## 📋 Prérequis

### Outils Requis
- Compte GitHub avec accès aux GitHub Actions
- Git installé localement
- Node.js 18+ avec npm
- IDE (VS Code recommandé)

### Connaissances
- Bases de Git (clone, commit, push)
- Notions de JavaScript/Node.js
- Compréhension des tests unitaires

## 🎬 Contexte de l'Exercice

Vous êtes développeur dans une startup qui développe une API de gestion de tâches. L'équipe souhaite mettre en place un processus d'intégration continue pour automatiser les tests et la validation du code à chaque modification.

Votre mission : configurer le premier pipeline CI/CD de l'équipe avec GitHub Actions.

## 📁 Structure du Projet

```
todo-api/
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── app.js
│   ├── routes/
│   │   └── tasks.js
│   └── models/
│       └── task.js
├── tests/
│   ├── app.test.js
│   └── tasks.test.js
├── package.json
├── .gitignore
└── README.md
```

## 🚀 Étapes de Réalisation

### Étape 1 : Préparation du Projet

#### 1.1 Cloner le Projet de Base

```bash
# Cloner le repository template
git clone https://github.com/votre-username/todo-api-template.git
cd todo-api-template

# Installer les dépendances
npm install
```

#### 1.2 Explorer la Structure

Examinez les fichiers fournis :

**package.json** - Configuration du projet
```json
{
  "name": "todo-api",
  "version": "1.0.0",
  "description": "API de gestion de tâches",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/ tests/",
    "lint:fix": "eslint src/ tests/ --fix"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "eslint": "^8.42.0"
  }
}
```

#### 1.3 Tester Localement

```bash
# Lancer les tests
npm test

# Vérifier le linting
npm run lint

# Démarrer l'application
npm start
```

**Point de Validation ✅** : Tous les tests passent et l'application démarre sans erreur.

### Étape 2 : Configuration du Workflow GitHub Actions

#### 2.1 Créer le Fichier de Workflow

Créez le fichier `.github/workflows/ci.yml` :

```yaml
name: CI Pipeline

# Déclencheurs du workflow
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

# Variables d'environnement globales
env:
  NODE_VERSION: '18'

jobs:
  # Job de test et validation
  test:
    name: Tests et Validation
    runs-on: ubuntu-latest
    
    steps:
      # Récupération du code source
      - name: Checkout code
        uses: actions/checkout@v4
      
      # Configuration de Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      # Installation des dépendances
      - name: Install dependencies
        run: npm ci
      
      # Vérification du code avec ESLint
      - name: Run linting
        run: npm run lint
      
      # Exécution des tests unitaires
      - name: Run unit tests
        run: npm run test:coverage
      
      # Upload du rapport de couverture
      - name: Upload coverage reports
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 30
```

#### 2.2 Comprendre la Configuration

**Déclencheurs (`on`)** :
- `push` : À chaque push sur main ou develop
- `pull_request` : À chaque PR vers main

**Job `test`** :
- S'exécute sur Ubuntu latest
- Utilise Node.js 18 avec cache npm
- Exécute linting puis tests avec couverture
- Sauvegarde les rapports de couverture

### Étape 3 : Premier Commit et Test

#### 3.1 Commit Initial

```bash
# Ajouter tous les fichiers
git add .

# Commit avec message descriptif
git commit -m "feat: setup initial project with CI pipeline

- Add basic Express API structure
- Configure Jest for testing
- Setup ESLint for code quality
- Add GitHub Actions CI workflow"

# Push vers GitHub
git push origin main
```

#### 3.2 Observer l'Exécution

1. Allez sur GitHub dans l'onglet **Actions**
2. Observez l'exécution du workflow
3. Cliquez sur le job pour voir les détails de chaque étape

**Point de Validation ✅** : Le workflow s'exécute avec succès et tous les tests passent.

### Étape 4 : Amélioration du Pipeline

#### 4.1 Ajouter une Matrice de Test

Modifiez le workflow pour tester sur plusieurs versions de Node.js :

```yaml
  test:
    name: Tests et Validation
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      # ... reste des étapes
```

#### 4.2 Ajouter un Job de Build

Ajoutez un job séparé pour le build :

```yaml
  build:
    name: Build Application
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: |
          echo "Building application..."
          # Ici vous pourriez avoir des étapes de build réelles
          mkdir -p dist
          cp -r src/* dist/
          echo "Build completed successfully"
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: dist/
          retention-days: 7
```

### Étape 5 : Gestion des Échecs et Notifications

#### 5.1 Ajouter des Conditions d'Échec

```yaml
      - name: Run unit tests
        run: npm run test:coverage
        
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          echo "Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "❌ Coverage $COVERAGE% is below threshold of 80%"
            exit 1
          fi
          echo "✅ Coverage $COVERAGE% meets threshold"
```

#### 5.2 Ajouter des Badges de Statut

Ajoutez dans votre README.md :

```markdown
# Todo API

![CI Status](https://github.com/votre-username/todo-api/workflows/CI%20Pipeline/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-85%25-green)

API de gestion de tâches avec pipeline CI/CD automatisé.
```

### Étape 6 : Test avec Pull Request

#### 6.1 Créer une Branche de Feature

```bash
# Créer une nouvelle branche
git checkout -b feature/add-task-validation

# Modifier un fichier de test pour simuler un changement
# Par exemple, ajouter un test dans tests/tasks.test.js
```

#### 6.2 Créer une Pull Request

```bash
# Commit et push de la branche
git add .
git commit -m "feat: add task validation tests"
git push origin feature/add-task-validation
```

Créez une PR sur GitHub et observez :
- L'exécution automatique du workflow
- Les checks de validation sur la PR
- Les rapports de couverture

**Point de Validation ✅** : La PR déclenche automatiquement le pipeline et affiche les résultats.

## 📊 Points de Validation

### Validation Technique
- [ ] Le workflow GitHub Actions s'exécute sans erreur
- [ ] Tous les tests unitaires passent
- [ ] Le linting ne remonte aucune erreur
- [ ] Les artefacts de build sont générés
- [ ] Les rapports de couverture sont disponibles

### Validation Fonctionnelle
- [ ] Le pipeline se déclenche sur push et PR
- [ ] Les échecs de test bloquent le pipeline
- [ ] Les badges de statut sont fonctionnels
- [ ] Les notifications d'échec sont visibles

### Validation des Bonnes Pratiques
- [ ] Messages de commit descriptifs
- [ ] Structure de workflow claire et commentée
- [ ] Gestion appropriée des secrets (si applicable)
- [ ] Documentation à jour

## 🤔 Questions de Réflexion

1. **Analyse des Résultats**
   - Combien de temps prend l'exécution complète du pipeline ?
   - Quelles étapes prennent le plus de temps ?
   - Comment pourriez-vous optimiser les performances ?

2. **Amélioration Continue**
   - Quels autres types de tests pourriez-vous ajouter ?
   - Comment intégreriez-vous des outils d'analyse de sécurité ?
   - Quelles notifications supplémentaires seraient utiles ?

3. **Application Professionnelle**
   - Comment adapteriez-vous ce pipeline à votre contexte professionnel ?
   - Quelles contraintes spécifiques devriez-vous considérer ?
   - Comment géreriez-vous les déploiements vers différents environnements ?

## 🚀 Extensions Possibles

### Extension 1 : Intégration SonarQube
Ajoutez l'analyse de qualité de code avec SonarCloud :

```yaml
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### Extension 2 : Tests de Sécurité
Intégrez un scan de vulnérabilités :

```yaml
      - name: Security audit
        run: npm audit --audit-level high
        
      - name: Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Extension 3 : Notifications Slack
Ajoutez des notifications d'équipe :

```yaml
      - name: Notify Slack on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          channel: '#ci-cd'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## 📚 Ressources Complémentaires

### Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

### Outils et Actions Utiles
- [actions/checkout](https://github.com/actions/checkout)
- [actions/setup-node](https://github.com/actions/setup-node)
- [actions/upload-artifact](https://github.com/actions/upload-artifact)

### Bonnes Pratiques
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [CI/CD Best Practices](https://docs.github.com/en/actions/guides/about-continuous-integration)

---

**Prochaine étape :** [Exercice 1.2 - Configuration de Tests Automatisés avec Docker](../exercice-1.2-tests-docker/README.md)

**Compétences travaillées :** C8, C17  
**Durée :** 90 minutes  
**Niveau :** Débutant