# Solution - Exercice 1.2 : Configuration de tests automatisés avec Docker

## Vue d'ensemble de la solution

Cette solution démontre comment configurer un environnement de test complet avec Docker, incluant :
- Conteneurisation de l'application de test
- Configuration d'une base de données MongoDB en conteneur
- Séparation des tests unitaires et d'intégration
- Intégration dans un pipeline CI/CD GitHub Actions

## Structure de la solution

```
ressources/
├── src/                          # Code source de l'application
├── tests/
│   ├── setup.js                  # Configuration globale des tests
│   ├── unit/                     # Tests unitaires (avec MongoDB Memory Server)
│   └── integration/              # Tests d'intégration (avec MongoDB réel)
├── scripts/
│   └── init-mongo.js            # Script d'initialisation MongoDB
├── Dockerfile.test              # Image Docker pour les tests
├── docker-compose.test.yml      # Orchestration des services de test
└── package.json                 # Dépendances et scripts
```

## Étapes de la solution

### Étape 1 : Dockerfile.test

Le Dockerfile optimisé pour les tests :

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Installation des dépendances en premier (cache Docker)
COPY package*.json ./
RUN npm ci --only=production && npm ci --only=dev

# Copie du code source
COPY . .

# Sécurité : utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
CMD ["npm", "test"]
```

**Points clés :**
- Utilisation d'Alpine Linux pour une image légère
- Installation des dépendances avant la copie du code (optimisation cache)
- Utilisateur non-root pour la sécurité
- Port exposé pour les tests d'intégration

### Étape 2 : Docker Compose pour les tests

Configuration multi-services avec `docker-compose.test.yml` :

```yaml
version: '3.8'

services:
  mongodb-test:
    image: mongo:6.0-alpine
    environment:
      MONGO_INITDB_DATABASE: todoapp_test
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  app-unit-tests:
    build:
      dockerfile: Dockerfile.test
    environment:
      NODE_ENV: test
      TEST_TYPE: unit
    command: npm run test -- --testPathPattern=unit

  app-integration-tests:
    environment:
      MONGODB_URI: mongodb://mongodb-test:27017/todoapp_test
    command: npm run test:integration
    depends_on:
      mongodb-test:
        condition: service_healthy
```

**Points clés :**
- Services séparés pour différents types de tests
- Health check pour MongoDB
- Variables d'environnement spécifiques
- Dépendances entre services

### Étape 3 : Configuration des tests

Le fichier `tests/setup.js` gère deux environnements :

```javascript
// Tests unitaires : MongoDB Memory Server
if (process.env.TEST_TYPE !== 'integration') {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
} else {
  // Tests d'intégration : MongoDB réel
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp_test';
  await mongoose.connect(mongoUri);
}
```

**Avantages :**
- Tests unitaires rapides et isolés
- Tests d'intégration avec vraie base de données
- Configuration flexible selon l'environnement

### Étape 4 : Scripts package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:docker": "docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=unit"
  }
}
```

### Étape 5 : Intégration GitHub Actions

Workflow `.github/workflows/test-docker.yml` :

```yaml
name: Tests avec Docker

on: [push, pull_request]

jobs:
  test-docker:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Construire et tester avec Docker Compose
      run: |
        cd supports-cours-cicd/modules/module-1-fondamentaux/exercices/exercice-1.2-tests-docker/ressources
        docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
    
    - name: Nettoyer les conteneurs
      if: always()
      run: |
        cd supports-cours-cicd/modules/module-1-fondamentaux/exercices/exercice-1.2-tests-docker/ressources
        docker-compose -f docker-compose.test.yml down -v
```

## Commandes d'exécution

### Tests locaux
```bash
# Tests unitaires seulement
npm run test:unit

# Tests d'intégration seulement  
npm run test:integration

# Tous les tests avec Docker
npm run test:docker

# Tests unitaires en conteneur
docker-compose -f docker-compose.test.yml up app-unit-tests

# Tests d'intégration en conteneur
docker-compose -f docker-compose.test.yml up app-integration-tests
```

### Débogage
```bash
# Logs des conteneurs
docker-compose -f docker-compose.test.yml logs

# Accès au conteneur MongoDB
docker-compose -f docker-compose.test.yml exec mongodb-test mongosh todoapp_test

# Inspection des volumes
docker volume ls
docker volume inspect exercice-12-tests-docker_mongodb_test_data
```

## Résultats attendus

### Tests unitaires
- Exécution rapide (< 10 secondes)
- Isolation complète
- Pas de dépendances externes

### Tests d'intégration
- Exécution avec vraie base de données
- Tests de bout en bout
- Validation des interactions

### Pipeline CI/CD
- Exécution automatique sur push/PR
- Environnement reproductible
- Nettoyage automatique des ressources

## Bonnes pratiques démontrées

1. **Séparation des préoccupations** : Tests unitaires vs intégration
2. **Optimisation Docker** : Cache des layers, images légères
3. **Sécurité** : Utilisateurs non-root, variables d'environnement
4. **Monitoring** : Health checks, logs structurés
5. **Nettoyage** : Volumes temporaires, cleanup automatique

## Métriques de performance

- **Temps de build** : ~30 secondes (première fois), ~5 secondes (cache)
- **Temps d'exécution tests unitaires** : ~8 secondes
- **Temps d'exécution tests intégration** : ~15 secondes
- **Consommation mémoire** : ~200MB (app + MongoDB)

Cette solution fournit une base solide pour l'intégration de Docker dans les pipelines de test, garantissant la reproductibilité et la fiabilité des tests dans tous les environnements.