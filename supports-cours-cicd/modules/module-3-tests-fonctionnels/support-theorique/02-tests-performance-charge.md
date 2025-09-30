# 2. Tests de Performance et de Charge

## 2.1 Concepts de Performance et Métriques Clés

### Définitions Essentielles

**Tests de Performance**
- Évaluation des performances sous conditions normales
- Mesure des temps de réponse et du débit
- Identification des goulots d'étranglement

**Tests de Charge**
- Validation sous charge utilisateur attendue
- Vérification de la stabilité système
- Mesure de la dégradation des performances

**Tests de Stress**
- Évaluation au-delà des limites normales
- Identification du point de rupture
- Test de récupération après incident

### Métriques Clés de Performance

**Temps de Réponse**
- Temps moyen, médian, 95e percentile
- Temps de première réponse (TTFB)
- Temps de chargement complet

**Débit (Throughput)**
- Requêtes par seconde (RPS)
- Transactions par seconde (TPS)
- Bande passante utilisée

**Utilisation des Ressources**
- CPU, mémoire, disque, réseau
- Connexions base de données
- Files d'attente et pools de threads

**Métriques Utilisateur**
- Taux d'erreur
- Taux d'abandon
- Satisfaction utilisateur (Apdex)

## 2.2 Tests de Charge avec JMeter

### Présentation d'Apache JMeter

JMeter est un outil open-source pour les tests de performance :
- Interface graphique intuitive
- Support multi-protocoles (HTTP, JDBC, JMS, etc.)
- Extensibilité via plugins
- Rapports détaillés

### Architecture JMeter

```
Test Plan
├── Thread Groups (Utilisateurs virtuels)
├── Samplers (Requêtes)
├── Listeners (Collecte de résultats)
├── Timers (Délais)
└── Assertions (Validations)
```

### Configuration d'un Test de Charge

**1. Plan de Test Basique**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2">
  <hashTree>
    <TestPlan testname="API Load Test">
      <elementProp name="TestPlan.arguments" elementType="Arguments"/>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup testname="Users">
        <stringProp name="ThreadGroup.num_threads">100</stringProp>
        <stringProp name="ThreadGroup.ramp_time">60</stringProp>
        <stringProp name="ThreadGroup.duration">300</stringProp>
      </ThreadGroup>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

**2. Exemple de Requête HTTP**

```
HTTP Request Sampler:
- Server: api.example.com
- Port: 443
- Protocol: https
- Method: POST
- Path: /api/users
- Body: {"name": "Test User", "email": "test@example.com"}
```

### Stratégies de Montée en Charge

**Montée Progressive**
```
Utilisateurs: 0 → 50 → 100 → 150 → 200
Durée: 0min → 15min → 30min → 45min → 60min
```

**Test de Pic**
```
Utilisateurs: 10 → 500 → 10
Durée: 0min → 5min → 10min
```

**Test de Stabilité**
```
Utilisateurs: 100 (constant)
Durée: 2 heures
```

## 2.3 Monitoring des Temps de Réponse

### Outils de Monitoring

**Application Performance Monitoring (APM)**
- New Relic, Datadog, AppDynamics
- Monitoring en temps réel
- Alertes automatiques
- Analyse des traces

**Monitoring Infrastructure**
- Prometheus + Grafana
- Métriques système et application
- Dashboards personnalisés
- Historique des performances

### Configuration Prometheus

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api-server'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

### Métriques Applicatives

```javascript
// Exemple Node.js avec Prometheus
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
});
```

## 2.4 Analyse et Interprétation des Résultats

### Lecture des Rapports JMeter

**Métriques Principales**
- **Average** : Temps de réponse moyen
- **Median** : 50e percentile
- **90% Line** : 90e percentile
- **95% Line** : 95e percentile
- **99% Line** : 99e percentile
- **Min/Max** : Temps minimum et maximum
- **Error %** : Pourcentage d'erreurs
- **Throughput** : Débit (req/sec)

### Identification des Problèmes

**Temps de Réponse Élevés**
```
Causes possibles:
- Requêtes base de données lentes
- Goulots d'étranglement réseau
- Traitement CPU intensif
- Manque de mise en cache
```

**Taux d'Erreur Élevé**
```
Types d'erreurs:
- 5xx: Erreurs serveur
- 4xx: Erreurs client
- Timeouts: Dépassement de délai
- Connexions refusées
```

### Optimisations Courantes

**Base de Données**
- Indexation appropriée
- Optimisation des requêtes
- Pool de connexions
- Cache de requêtes

**Application**
- Mise en cache (Redis, Memcached)
- Optimisation des algorithmes
- Lazy loading
- Compression des réponses

**Infrastructure**
- Load balancing
- CDN pour les assets statiques
- Scaling horizontal/vertical
- Optimisation réseau

## 2.5 Intégration dans le Pipeline CI/CD

### Tests de Performance Automatisés

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  performance-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup JMeter
      run: |
        wget https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.4.1.tgz
        tar -xzf apache-jmeter-5.4.1.tgz
        
    - name: Run Performance Tests
      run: |
        ./apache-jmeter-5.4.1/bin/jmeter -n -t tests/load-test.jmx -l results.jtl
        
    - name: Generate Report
      run: |
        ./apache-jmeter-5.4.1/bin/jmeter -g results.jtl -o report/
        
    - name: Upload Results
      uses: actions/upload-artifact@v2
      with:
        name: performance-report
        path: report/
```

### Critères de Validation

**Seuils de Performance**
```yaml
performance_thresholds:
  response_time_95th: 2000ms
  error_rate: 1%
  throughput_min: 100rps
  cpu_usage_max: 80%
  memory_usage_max: 85%
```

**Alertes et Notifications**
- Échec si seuils dépassés
- Notifications Slack/Teams
- Blocage du déploiement
- Rapport automatique aux équipes

### Bonnes Pratiques

**Environnement de Test**
- Isolation des tests de performance
- Données représentatives
- Configuration similaire à la production
- Nettoyage entre les tests

**Stratégie de Test**
- Tests réguliers (nightly builds)
- Tests sur les features critiques
- Comparaison avec baseline
- Tests de régression performance