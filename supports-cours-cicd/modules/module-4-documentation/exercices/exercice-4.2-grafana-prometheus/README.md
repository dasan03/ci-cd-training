# Exercice 4.2 - Configuration de dashboards avec Grafana et Prometheus

## Objectifs

À l'issue de cet exercice, vous serez capable de :
- Configurer une stack Prometheus/Grafana avec Docker Compose
- Exposer des métriques de tests personnalisées avec Prometheus
- Créer des dashboards interactifs dans Grafana
- Configurer des alertes sur les métriques de tests
- Analyser les performances et la qualité des tests en temps réel

## Durée estimée
60 minutes

## Prérequis

- Docker et Docker Compose installés
- Node.js (version 16+) ou Python (version 3.8+)
- Navigateur web moderne
- Connaissances de base en métriques et monitoring

## Contexte

Votre équipe souhaite mettre en place un monitoring en temps réel des tests automatisés. L'objectif est de créer des dashboards qui permettent de suivre les performances, la stabilité et la qualité des tests, avec des alertes automatiques en cas de dégradation.

## Étape 1 : Configuration de la stack Prometheus/Grafana

### 1.1 Structure du projet

Créez la structure suivante :

```
grafana-prometheus-demo/
├── docker-compose.yml
├── prometheus/
│   ├── prometheus.yml
│   └── alert-rules.yml
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── prometheus.yml
│   │   └── dashboards/
│   │       ├── dashboard.yml
│   │       └── test-dashboard.json
├── test-app/
│   ├── package.json
│   ├── src/
│   │   └── metrics-server.js
│   └── tests/
│       └── load-test.js
└── alertmanager/
    └── alertmanager.yml
```

### 1.2 Configuration Docker Compose

Créez le fichier `docker-compose.yml` :

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/alert-rules.yml:/etc/prometheus/alert-rules.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
      - '--web.enable-remote-write-receiver'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring

  test-metrics:
    build: ./test-app
    container_name: test-metrics
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
    networks:
      - monitoring

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

### 1.3 Configuration Prometheus

Créez le fichier `prometheus/prometheus.yml` :

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert-rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'test-metrics'
    static_configs:
      - targets: ['test-metrics:8000']
    scrape_interval: 5s
    metrics_path: '/metrics'
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 15s

  - job_name: 'grafana'
    static_configs:
      - targets: ['grafana:3000']
    scrape_interval: 30s
```

## Étape 2 : Application de test avec métriques

### 2.1 Configuration Node.js

Créez le fichier `test-app/package.json` :

```json
{
  "name": "test-metrics-app",
  "version": "1.0.0",
  "description": "Application de test avec métriques Prometheus",
  "main": "src/metrics-server.js",
  "scripts": {
    "start": "node src/metrics-server.js",
    "test": "node tests/load-test.js",
    "dev": "nodemon src/metrics-server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "prom-client": "^14.2.0",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

### 2.2 Serveur de métriques

Créez le fichier `test-app/src/metrics-server.js` :

```javascript
const express = require('express');
const client = require('prom-client');

const app = express();
const port = process.env.PORT || 8000;

// Création du registre Prometheus
const register = new client.Registry();

// Métriques par défaut (CPU, mémoire, etc.)
client.collectDefaultMetrics({ register });

// Métriques personnalisées pour les tests
const testCounter = new client.Counter({
  name: 'tests_total',
  help: 'Total number of tests executed',
  labelNames: ['status', 'suite', 'environment', 'test_type'],
  registers: [register]
});

const testDuration = new client.Histogram({
  name: 'test_duration_seconds',
  help: 'Time spent executing tests',
  labelNames: ['test_name', 'suite', 'test_type'],
  buckets: [0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0],
  registers: [register]
});

const activeTests = new client.Gauge({
  name: 'active_tests_count',
  help: 'Number of currently running tests',
  registers: [register]
});

const testQueueSize = new client.Gauge({
  name: 'test_queue_size',
  help: 'Number of tests waiting to be executed',
  registers: [register]
});

const testCoverage = new client.Gauge({
  name: 'test_coverage_percent',
  help: 'Code coverage percentage',
  labelNames: ['type'],
  registers: [register]
});

const testFlakiness = new client.Gauge({
  name: 'test_flakiness_rate',
  help: 'Test flakiness rate percentage',
  labelNames: ['suite'],
  registers: [register]
});

const buildInfo = new client.Gauge({
  name: 'build_info',
  help: 'Build information',
  labelNames: ['version', 'commit', 'branch'],
  registers: [register]
});

// Simulation de données de build
buildInfo.set({
  version: process.env.BUILD_VERSION || '1.0.0',
  commit: process.env.GIT_COMMIT || 'abc123',
  branch: process.env.GIT_BRANCH || 'main'
}, 1);

// Classe pour simuler l'exécution de tests
class TestSimulator {
  constructor() {
    this.testSuites = ['unit', 'integration', 'e2e', 'performance'];
    this.testTypes = ['smoke', 'regression', 'api', 'ui'];
    this.environments = ['dev', 'staging', 'prod'];
    this.isRunning = false;
  }

  startSimulation() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Simulation continue de tests
    setInterval(() => {
      this.simulateTestExecution();
    }, 2000);

    // Mise à jour des métriques de couverture
    setInterval(() => {
      this.updateCoverageMetrics();
    }, 30000);

    // Mise à jour de la flakiness
    setInterval(() => {
      this.updateFlakinessMetrics();
    }, 60000);

    console.log('🧪 Simulation de tests démarrée');
  }

  simulateTestExecution() {
    const suite = this.getRandomElement(this.testSuites);
    const testType = this.getRandomElement(this.testTypes);
    const environment = this.getRandomElement(this.environments);
    const testName = `test_${Math.floor(Math.random() * 100)}`;

    // Simulation du temps d'exécution
    const executionTime = this.generateExecutionTime(suite);
    
    // Simulation du résultat
    const status = this.generateTestResult(suite);

    // Mise à jour des métriques
    activeTests.inc();
    testQueueSize.set(Math.floor(Math.random() * 20));

    setTimeout(() => {
      testCounter.labels(status, suite, environment, testType).inc();
      testDuration.labels(testName, suite, testType).observe(executionTime);
      activeTests.dec();
    }, executionTime * 1000);
  }

  generateExecutionTime(suite) {
    const baseTimes = {
      'unit': 0.5,
      'integration': 2.0,
      'e2e': 8.0,
      'performance': 30.0
    };
    
    const baseTime = baseTimes[suite] || 1.0;
    return baseTime + (Math.random() * baseTime * 0.5);
  }

  generateTestResult(suite) {
    const failureRates = {
      'unit': 0.05,
      'integration': 0.10,
      'e2e': 0.15,
      'performance': 0.20
    };

    const failureRate = failureRates[suite] || 0.10;
    const random = Math.random();

    if (random < failureRate * 0.3) return 'skipped';
    if (random < failureRate) return 'failed';
    return 'passed';
  }

  updateCoverageMetrics() {
    testCoverage.set({ type: 'line' }, 85 + Math.random() * 10);
    testCoverage.set({ type: 'branch' }, 80 + Math.random() * 15);
    testCoverage.set({ type: 'function' }, 90 + Math.random() * 8);
  }

  updateFlakinessMetrics() {
    this.testSuites.forEach(suite => {
      const flakiness = Math.random() * 5; // 0-5% flakiness
      testFlakiness.set({ suite }, flakiness);
    });
  }

  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// Routes API
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/test-stats', (req, res) => {
  res.json({
    activeTests: activeTests.get(),
    queueSize: testQueueSize.get(),
    timestamp: new Date().toISOString()
  });
});

// Endpoint pour déclencher des tests manuellement
app.post('/api/trigger-test', (req, res) => {
  const { suite = 'unit', count = 1 } = req.body;
  
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      simulator.simulateTestExecution();
    }, i * 100);
  }
  
  res.json({
    message: `Triggered ${count} tests for suite ${suite}`,
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur
const simulator = new TestSimulator();

app.listen(port, () => {
  console.log(`🚀 Serveur de métriques démarré sur le port ${port}`);
  console.log(`📊 Métriques disponibles sur http://localhost:${port}/metrics`);
  console.log(`🏥 Health check sur http://localhost:${port}/health`);
  
  simulator.startSimulation();
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  process.exit(0);
});
```

### 2.3 Dockerfile pour l'application

Créez le fichier `test-app/Dockerfile` :

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

EXPOSE 8000

USER node

CMD ["npm", "start"]
```

## Étape 3 : Configuration Grafana

### 3.1 Source de données Prometheus

Créez le fichier `grafana/provisioning/datasources/prometheus.yml` :

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: "5s"
      queryTimeout: "60s"
      httpMethod: "POST"
```

### 3.2 Configuration des dashboards

Créez le fichier `grafana/provisioning/dashboards/dashboard.yml` :

```yaml
apiVersion: 1

providers:
  - name: 'Test Dashboards'
    orgId: 1
    folder: 'Tests'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
```

### 3.3 Dashboard principal

Créez le fichier `grafana/provisioning/dashboards/test-dashboard.json` :

```json
{
  "dashboard": {
    "id": null,
    "title": "Test Execution Dashboard",
    "tags": ["testing", "ci-cd", "quality"],
    "timezone": "browser",
    "refresh": "5s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "Test Success Rate",
        "type": "stat",
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0},
        "targets": [
          {
            "expr": "rate(tests_total{status=\"passed\"}[5m]) / rate(tests_total[5m]) * 100",
            "legendFormat": "Success Rate",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 80},
                {"color": "green", "value": 95}
              ]
            },
            "mappings": [],
            "custom": {
              "displayMode": "basic"
            }
          }
        },
        "options": {
          "reduceOptions": {
            "values": false,
            "calcs": ["lastNotNull"],
            "fields": ""
          },
          "orientation": "auto",
          "textMode": "auto",
          "colorMode": "background",
          "graphMode": "area",
          "justifyMode": "auto"
        }
      },
      {
        "id": 2,
        "title": "Active Tests",
        "type": "stat",
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0},
        "targets": [
          {
            "expr": "active_tests_count",
            "legendFormat": "Active Tests",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 10},
                {"color": "red", "value": 20}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "Test Queue Size",
        "type": "stat",
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0},
        "targets": [
          {
            "expr": "test_queue_size",
            "legendFormat": "Queue Size",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 5},
                {"color": "red", "value": 15}
              ]
            }
          }
        }
      },
      {
        "id": 4,
        "title": "Test Coverage",
        "type": "stat",
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0},
        "targets": [
          {
            "expr": "test_coverage_percent{type=\"line\"}",
            "legendFormat": "Line Coverage",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 70},
                {"color": "green", "value": 85}
              ]
            }
          }
        }
      },
      {
        "id": 5,
        "title": "Test Execution Rate",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
        "targets": [
          {
            "expr": "rate(tests_total[1m])",
            "legendFormat": "Tests/sec ({{status}})",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "linear",
              "fillOpacity": 10,
              "gradientMode": "none",
              "showPoints": "never",
              "pointSize": 5,
              "stacking": {"mode": "none", "group": "A"},
              "axisPlacement": "auto",
              "axisLabel": "",
              "scaleDistribution": {"type": "linear"}
            }
          }
        }
      },
      {
        "id": 6,
        "title": "Test Duration Percentiles",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8},
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(test_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile",
            "refId": "A"
          },
          {
            "expr": "histogram_quantile(0.50, rate(test_duration_seconds_bucket[5m]))",
            "legendFormat": "Median",
            "refId": "B"
          },
          {
            "expr": "histogram_quantile(0.99, rate(test_duration_seconds_bucket[5m]))",
            "legendFormat": "99th percentile",
            "refId": "C"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "linear",
              "fillOpacity": 0,
              "gradientMode": "none"
            }
          }
        }
      },
      {
        "id": 7,
        "title": "Tests by Suite",
        "type": "piechart",
        "gridPos": {"h": 8, "w": 8, "x": 0, "y": 16},
        "targets": [
          {
            "expr": "sum by (suite) (rate(tests_total[5m]))",
            "legendFormat": "{{suite}}",
            "refId": "A"
          }
        ],
        "options": {
          "reduceOptions": {
            "values": false,
            "calcs": ["lastNotNull"],
            "fields": ""
          },
          "pieType": "pie",
          "tooltip": {"mode": "single"},
          "legend": {
            "displayMode": "visible",
            "placement": "right"
          }
        }
      },
      {
        "id": 8,
        "title": "Test Results Distribution",
        "type": "piechart",
        "gridPos": {"h": 8, "w": 8, "x": 8, "y": 16},
        "targets": [
          {
            "expr": "sum by (status) (rate(tests_total[5m]))",
            "legendFormat": "{{status}}",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "custom": {
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "vis": false
              }
            },
            "mappings": [],
            "color": {
              "mode": "palette-classic"
            }
          },
          "overrides": [
            {
              "matcher": {"id": "byName", "options": "passed"},
              "properties": [{"id": "color", "value": {"mode": "fixed", "fixedColor": "green"}}]
            },
            {
              "matcher": {"id": "byName", "options": "failed"},
              "properties": [{"id": "color", "value": {"mode": "fixed", "fixedColor": "red"}}]
            },
            {
              "matcher": {"id": "byName", "options": "skipped"},
              "properties": [{"id": "color", "value": {"mode": "fixed", "fixedColor": "yellow"}}]
            }
          ]
        }
      },
      {
        "id": 9,
        "title": "Test Flakiness by Suite",
        "type": "bargauge",
        "gridPos": {"h": 8, "w": 8, "x": 16, "y": 16},
        "targets": [
          {
            "expr": "test_flakiness_rate",
            "legendFormat": "{{suite}}",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 10,
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 2},
                {"color": "red", "value": 5}
              ]
            }
          }
        },
        "options": {
          "orientation": "horizontal",
          "displayMode": "gradient"
        }
      }
    ]
  }
}
```

## Étape 4 : Configuration des alertes

### 4.1 Règles d'alerte Prometheus

Créez le fichier `prometheus/alert-rules.yml` :

```yaml
groups:
- name: test-alerts
  rules:
  - alert: HighTestFailureRate
    expr: rate(tests_total{status="failed"}[5m]) / rate(tests_total[5m]) > 0.1
    for: 2m
    labels:
      severity: warning
      team: qa
    annotations:
      summary: "High test failure rate detected"
      description: "Test failure rate is {{ $value | humanizePercentage }} over the last 5 minutes"
      runbook_url: "https://wiki.company.com/runbooks/high-test-failure-rate"

  - alert: SlowTestExecution
    expr: histogram_quantile(0.95, rate(test_duration_seconds_bucket[5m])) > 60
    for: 5m
    labels:
      severity: warning
      team: qa
    annotations:
      summary: "Tests are running slowly"
      description: "95th percentile test execution time is {{ $value }}s"

  - alert: TestSuiteDown
    expr: up{job="test-metrics"} == 0
    for: 1m
    labels:
      severity: critical
      team: devops
    annotations:
      summary: "Test suite monitoring is down"
      description: "The test metrics service is not responding"

  - alert: HighTestFlakiness
    expr: test_flakiness_rate > 5
    for: 10m
    labels:
      severity: warning
      team: qa
    annotations:
      summary: "High test flakiness detected"
      description: "Test suite {{ $labels.suite }} has {{ $value }}% flakiness rate"

  - alert: LowTestCoverage
    expr: test_coverage_percent{type="line"} < 70
    for: 5m
    labels:
      severity: warning
      team: dev
    annotations:
      summary: "Low test coverage detected"
      description: "Line coverage is {{ $value }}%, below the 70% threshold"

  - alert: TestQueueBacklog
    expr: test_queue_size > 20
    for: 3m
    labels:
      severity: warning
      team: devops
    annotations:
      summary: "Test queue backlog detected"
      description: "{{ $value }} tests are waiting in the queue"
```

### 4.2 Configuration AlertManager

Créez le fichier `alertmanager/alertmanager.yml` :

```yaml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@company.com'
  smtp_auth_username: 'alerts@company.com'
  smtp_auth_password: 'password'

route:
  group_by: ['alertname', 'team']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
  - match:
      team: qa
    receiver: 'qa-team'
  - match:
      team: devops
    receiver: 'devops-team'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://localhost:5001/webhook'
    send_resolved: true

- name: 'critical-alerts'
  email_configs:
  - to: 'oncall@company.com'
    subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts-critical'
    title: 'Critical Test Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

- name: 'qa-team'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#qa-alerts'
    title: 'QA Test Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

- name: 'devops-team'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#devops-alerts'
    title: 'DevOps Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

inhibit_rules:
- source_match:
    severity: 'critical'
  target_match:
    severity: 'warning'
  equal: ['alertname', 'team']
```

## Étape 5 : Démarrage et test de la stack

### 5.1 Démarrage des services

```bash
# Démarrage de tous les services
docker-compose up -d

# Vérification du statut
docker-compose ps

# Consultation des logs
docker-compose logs -f test-metrics
```

### 5.2 Vérification des services

1. **Prometheus** : http://localhost:9090
   - Vérifiez les targets dans Status > Targets
   - Testez quelques requêtes PromQL

2. **Grafana** : http://localhost:3000 (admin/admin123)
   - Vérifiez la source de données Prometheus
   - Explorez le dashboard de tests

3. **AlertManager** : http://localhost:9093
   - Vérifiez la configuration
   - Consultez les alertes actives

4. **Métriques de test** : http://localhost:8000/metrics
   - Vérifiez que les métriques sont exposées

## Étape 6 : Personnalisation et analyse

### 6.1 Création d'un dashboard personnalisé

Dans Grafana, créez un nouveau dashboard avec :

1. **Panel de métriques système** :
   - CPU et mémoire du serveur de tests
   - Utilisation disque

2. **Panel de performance** :
   - Temps de réponse par endpoint
   - Throughput des tests

3. **Panel de qualité** :
   - Évolution de la couverture de code
   - Tendance des échecs par jour

### 6.2 Configuration d'alertes personnalisées

Ajoutez des alertes pour :
- Dégradation de performance (> 20% d'augmentation du temps d'exécution)
- Baisse de couverture de code (< seuil défini)
- Augmentation du taux d'échec sur une période

### 6.3 Requêtes PromQL utiles

```promql
# Taux de réussite par environnement
sum(rate(tests_total{status="passed"}[5m])) by (environment) / 
sum(rate(tests_total[5m])) by (environment) * 100

# Tests les plus lents
topk(10, histogram_quantile(0.95, 
  sum(rate(test_duration_seconds_bucket[5m])) by (test_name, le)
))

# Évolution du nombre de tests par jour
increase(tests_total[1d])

# Détection d'anomalies dans les temps d'exécution
test_duration_seconds > on() group_left() (
  avg_over_time(test_duration_seconds[1h]) + 
  2 * stddev_over_time(test_duration_seconds[1h])
)
```

## Étape 7 : Intégration avec CI/CD

### 7.1 Script de déploiement

Créez le fichier `deploy-monitoring.sh` :

```bash
#!/bin/bash

echo "🚀 Déploiement de la stack de monitoring..."

# Vérification des prérequis
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Arrêt des services existants
echo "🛑 Arrêt des services existants..."
docker-compose down

# Nettoyage des volumes (optionnel)
read -p "Voulez-vous nettoyer les données existantes ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose down -v
    echo "🧹 Données nettoyées"
fi

# Construction et démarrage
echo "🏗️ Construction et démarrage des services..."
docker-compose up -d --build

# Attente que les services soient prêts
echo "⏳ Attente des services..."
sleep 30

# Vérification de la santé des services
echo "🏥 Vérification de la santé des services..."

services=("prometheus:9090" "grafana:3000" "test-metrics:8000")
for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -f "http://localhost:$port/health" &>/dev/null || 
       curl -f "http://localhost:$port" &>/dev/null; then
        echo "✅ $name est opérationnel"
    else
        echo "❌ $name n'est pas accessible"
    fi
done

echo "🌐 Services disponibles :"
echo "📊 Grafana: http://localhost:3000 (admin/admin123)"
echo "🔍 Prometheus: http://localhost:9090"
echo "🚨 AlertManager: http://localhost:9093"
echo "📈 Métriques: http://localhost:8000/metrics"

echo "✨ Déploiement terminé !"
```

## Questions d'analyse

1. **Métriques de performance** :
   - Quels sont les tests les plus lents ?
   - Y a-t-il des patterns dans les temps d'exécution ?
   - Comment évolue la performance dans le temps ?

2. **Qualité des tests** :
   - Quel est le taux de réussite par suite de tests ?
   - Quels sont les tests les plus instables ?
   - Comment évolue la couverture de code ?

3. **Alerting** :
   - Quelles alertes sont les plus fréquentes ?
   - Y a-t-il des faux positifs à éliminer ?
   - Les seuils d'alerte sont-ils appropriés ?

## Livrables attendus

1. **Stack complète** Prometheus/Grafana fonctionnelle
2. **Dashboards personnalisés** avec métriques pertinentes
3. **Alertes configurées** avec notifications
4. **Documentation** des métriques et seuils
5. **Analyse** des résultats et recommandations

## Ressources complémentaires

- [Documentation Prometheus](https://prometheus.io/docs/)
- [Documentation Grafana](https://grafana.com/docs/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboard Examples](https://grafana.com/grafana/dashboards/)

## Dépannage

### Problèmes courants

1. **Services non accessibles** :
   ```bash
   docker-compose logs [service-name]
   docker-compose ps
   ```

2. **Métriques non collectées** :
   - Vérifiez la configuration Prometheus
   - Contrôlez les targets dans l'interface Prometheus

3. **Dashboards vides** :
   - Vérifiez la source de données dans Grafana
   - Testez les requêtes PromQL manuellement

4. **Alertes non déclenchées** :
   - Vérifiez les règles d'alerte
   - Contrôlez la configuration AlertManager