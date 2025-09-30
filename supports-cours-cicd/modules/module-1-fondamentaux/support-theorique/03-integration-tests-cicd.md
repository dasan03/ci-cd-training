# 3. Intégration des Tests dans le Cycle CI/CD

## 🎯 Objectifs d'Apprentissage

À l'issue de cette section, vous serez capable de :
- Intégrer différents types de tests dans un pipeline CI/CD
- Configurer l'exécution parallèle des tests
- Mettre en place des gates de qualité
- Optimiser les temps d'exécution des tests

## 🔄 Stratégie d'Intégration des Tests

### Placement des Tests dans le Pipeline

```mermaid
graph TD
    A[Code Commit] --> B[Build]
    B --> C[Tests Unitaires]
    C --> D[Tests d'Intégration]
    D --> E[Analyse Statique]
    E --> F[Build Artefacts]
    F --> G[Déploiement Staging]
    G --> H[Tests E2E]
    H --> I[Tests de Performance]
    I --> J[Tests de Sécurité]
    J --> K[Déploiement Production]
    
    C --> L[Fail Fast]
    D --> L
    H --> M[Rollback si échec]
    I --> M
    J --> M
```

### Principe du "Fail Fast"

#### Concept
Arrêter le pipeline dès qu'un test échoue pour économiser du temps et des ressources.

#### Implémentation
```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run unit tests
        run: npm test
        # Si les tests unitaires échouent, le pipeline s'arrête ici
  
  integration-tests:
    needs: unit-tests  # Ne s'exécute que si unit-tests réussit
    runs-on: ubuntu-latest
    steps:
      - name: Run integration tests
        run: npm run test:integration
```

## 🧪 Configuration des Tests par Type

### Tests Unitaires

#### Caractéristiques
- **Exécution** : Première étape après le build
- **Durée** : Très rapide (< 5 minutes)
- **Parallélisation** : Fortement recommandée
- **Couverture** : Objectif 80%+

#### Configuration GitHub Actions
```yaml
unit-tests:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      node-version: [16, 18, 20]
  steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm test -- --coverage --maxWorkers=4
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
```

### Tests d'Intégration

#### Configuration avec Services
```yaml
integration-tests:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:13
      env:
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: testdb
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
    
    redis:
      image: redis:6
      options: >-
        --health-cmd "redis-cli ping"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  
  steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run database migrations
      run: npm run db:migrate
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb
        REDIS_URL: redis://localhost:6379
```

### Tests End-to-End

#### Configuration avec Cypress
```yaml
e2e-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Start application
      run: npm start &
      
    - name: Wait for application
      run: npx wait-on http://localhost:3000
    
    - name: Run Cypress tests
      uses: cypress-io/github-action@v5
      with:
        start: npm start
        wait-on: 'http://localhost:3000'
        wait-on-timeout: 120
        browser: chrome
        record: true
      env:
        CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## ⚡ Optimisation des Performances

### Parallélisation des Tests

#### Tests Unitaires en Parallèle
```yaml
unit-tests:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      shard: [1, 2, 3, 4]
  steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests shard ${{ matrix.shard }}
      run: npm test -- --shard=${{ matrix.shard }}/4
```

#### Tests E2E en Parallèle
```yaml
e2e-tests:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      containers: [1, 2, 3, 4]
  steps:
    - uses: actions/checkout@v3
    - name: Run Cypress tests
      uses: cypress-io/github-action@v5
      with:
        start: npm start
        wait-on: 'http://localhost:3000'
        record: true
        parallel: true
        group: 'Actions example'
      env:
        CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

### Cache et Optimisations

#### Cache des Dépendances
```yaml
- name: Cache Node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

- name: Install dependencies
  run: npm ci --prefer-offline --no-audit
```

#### Cache des Builds
```yaml
- name: Cache build output
  uses: actions/cache@v3
  with:
    path: |
      dist/
      .next/cache
    key: ${{ runner.os }}-build-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-build-
```

## 🚪 Gates de Qualité

### Couverture de Code

#### Configuration avec Jest
```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html']
};
```

#### Intégration dans le Pipeline
```yaml
- name: Run tests with coverage
  run: npm test -- --coverage
  
- name: Check coverage threshold
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage $COVERAGE% is below threshold of 80%"
      exit 1
    fi
```

### Analyse Statique

#### SonarQube Integration
```yaml
- name: SonarQube Scan
  uses: sonarqube-quality-gate-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  with:
    scanMetadataReportFile: target/sonar/report-task.txt

- name: Quality Gate check
  id: sonarqube-quality-gate-check
  uses: sonarqube-quality-gate-action@master
  timeout-minutes: 5
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

#### ESLint avec Annotations
```yaml
- name: Run ESLint
  run: npx eslint . --format @microsoft/eslint-formatter-sarif --output-file eslint-results.sarif
  continue-on-error: true

- name: Upload analysis results to GitHub
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: eslint-results.sarif
    wait-for-processing: true
```

## 🔍 Tests de Sécurité

### Scan des Dépendances

#### npm audit
```yaml
- name: Security audit
  run: |
    npm audit --audit-level high
    npm audit --json > audit-results.json
    
- name: Upload audit results
  uses: actions/upload-artifact@v3
  with:
    name: security-audit
    path: audit-results.json
```

#### Snyk Integration
```yaml
- name: Run Snyk to check for vulnerabilities
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=high
```

### SAST (Static Application Security Testing)

#### CodeQL Analysis
```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v2
  with:
    languages: javascript

- name: Autobuild
  uses: github/codeql-action/autobuild@v2

- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v2
```

## 📊 Reporting et Notifications

### Test Results Reporting

#### Jest JUnit Reporter
```yaml
- name: Run tests with JUnit output
  run: npm test -- --reporters=default --reporters=jest-junit
  env:
    JEST_JUNIT_OUTPUT_DIR: ./test-results
    JEST_JUNIT_OUTPUT_NAME: junit.xml

- name: Publish test results
  uses: dorny/test-reporter@v1
  if: always()
  with:
    name: Jest Tests
    path: test-results/junit.xml
    reporter: jest-junit
```

#### Allure Reports
```yaml
- name: Generate Allure Report
  uses: simple-elf/allure-report-action@master
  if: always()
  with:
    allure_results: allure-results
    allure_history: allure-history

- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  if: always()
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: allure-history
```

### Notifications

#### Slack Integration
```yaml
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    channel: '#ci-cd'
    text: 'Pipeline failed for ${{ github.repository }}'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

#### Email Notifications
```yaml
- name: Send email on failure
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.MAIL_USERNAME }}
    password: ${{ secrets.MAIL_PASSWORD }}
    subject: 'CI/CD Pipeline Failed'
    to: team@company.com
    from: ci-cd@company.com
    body: |
      Pipeline failed for repository: ${{ github.repository }}
      Commit: ${{ github.sha }}
      Author: ${{ github.actor }}
```

## 🎯 Stratégies de Test par Environnement

### Environnement de Développement
```yaml
dev-tests:
  if: github.ref == 'refs/heads/develop'
  runs-on: ubuntu-latest
  steps:
    - name: Fast feedback tests
      run: |
        npm run test:unit
        npm run lint
        npm run type-check
```

### Environnement de Staging
```yaml
staging-tests:
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - name: Comprehensive testing
      run: |
        npm run test:unit
        npm run test:integration
        npm run test:e2e
        npm run test:performance
```

### Environnement de Production
```yaml
production-tests:
  runs-on: ubuntu-latest
  steps:
    - name: Smoke tests
      run: npm run test:smoke
    
    - name: Health checks
      run: |
        curl -f https://api.example.com/health
        npm run test:api-health
```

## 🛠️ Outils d'Intégration Avancés

### Docker pour les Tests

#### Multi-stage Dockerfile
```dockerfile
# Test stage
FROM node:18-alpine AS test
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm test
RUN npm run test:integration

# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose pour Tests
```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      target: test
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgres://user:pass@postgres:5432/testdb
      - REDIS_URL=redis://redis:6379
    command: npm test

  postgres:
    image: postgres:13
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: testdb

  redis:
    image: redis:6-alpine
```

## 🎓 Points Clés à Retenir

1. **Stratégie de placement** : Tests rapides en premier, tests lents en dernier
2. **Parallélisation** : Optimiser les temps d'exécution
3. **Gates de qualité** : Bloquer les déploiements si critères non respectés
4. **Feedback rapide** : Notifier immédiatement les développeurs
5. **Monitoring continu** : Surveiller les métriques de test

---

**Section précédente :** [Pipeline CI/CD de base](02-pipeline-cicd-base.md)  
**Prochaine section :** [Outils et bonnes pratiques](04-outils-bonnes-pratiques.md)

**Compétences travaillées :** C8, C17  
**Durée estimée :** 150 minutes