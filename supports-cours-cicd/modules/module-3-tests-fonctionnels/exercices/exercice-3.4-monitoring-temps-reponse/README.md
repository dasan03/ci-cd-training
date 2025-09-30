# Exercice 3.4 - Monitoring des Temps de Réponse

## Objectifs

- Configurer un système de monitoring des performances en temps réel
- Implémenter des métriques personnalisées dans l'application
- Créer des dashboards avec Grafana et Prometheus
- Configurer des alertes automatiques sur les seuils de performance
- Analyser les tendances de performance et identifier les régressions

## Contexte

Vous devez mettre en place un système de monitoring complet pour surveiller les performances de l'API e-commerce en temps réel. Le système doit capturer :
- Temps de réponse par endpoint
- Débit (requêtes/seconde)
- Taux d'erreur
- Utilisation des ressources système
- Métriques métier (commandes, utilisateurs actifs)

## Prérequis

- Docker et Docker Compose
- Application e-commerce démarrée
- Connaissances de base en Prometheus et Grafana
- Node.js (pour l'instrumentation)

## Matériel Fourni

- Configuration Docker Compose pour la stack monitoring
- Dashboards Grafana pré-configurés
- Règles d'alerting Prometheus
- Code d'instrumentation d'exemple

## Instructions

### Étape 1 : Configuration de la Stack Monitoring

#### 1.1 Docker Compose pour Monitoring

Créez un fichier `docker-compose.monitoring.yml` :

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.40.0
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:9.2.0
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    networks:
      - monitoring
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:v1.4.0
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

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.45.0
    container_name: cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:v0.25.0
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager:/etc/alertmanager
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:

networks:
  monitoring:
    driver: bridge
```

#### 1.2 Configuration Prometheus

Créez `monitoring/prometheus/prometheus.yml` :

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'ecommerce-api'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'blackbox'
    static_configs:
      - targets:
        - http://host.docker.internal:3000/api/health
        - http://host.docker.internal:3000/api/products
    metrics_path: /probe
    params:
      module: [http_2xx]
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

### Étape 2 : Instrumentation de l'Application

#### 2.1 Installation des Dépendances

```bash
npm install prom-client express-prometheus-middleware response-time
```

#### 2.2 Middleware de Métriques

Créez `src/middleware/metrics.js` :

```javascript
const promClient = require('prom-client');
const responseTime = require('response-time');

// Créer un registre pour les métriques
const register = new promClient.Registry();

// Métriques par défaut (CPU, mémoire, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'ecommerce_api_',
});

// Compteur de requêtes HTTP
const httpRequestsTotal = new promClient.Counter({
  name: 'ecommerce_api_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Histogramme des temps de réponse
const httpRequestDuration = new promClient.Histogram({
  name: 'ecommerce_api_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

// Gauge pour les utilisateurs actifs
const activeUsers = new promClient.Gauge({
  name: 'ecommerce_api_active_users',
  help: 'Number of active users',
  registers: [register]
});

// Compteur de commandes
const ordersTotal = new promClient.Counter({
  name: 'ecommerce_api_orders_total',
  help: 'Total number of orders',
  labelNames: ['status'],
  registers: [register]
});

// Gauge pour les produits en stock
const productsInStock = new promClient.Gauge({
  name: 'ecommerce_api_products_in_stock',
  help: 'Number of products in stock',
  labelNames: ['category'],
  registers: [register]
});

// Middleware pour capturer les métriques HTTP
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
      
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
  });
  
  next();
};

// Middleware de temps de réponse
const responseTimeMiddleware = responseTime((req, res, time) => {
  const route = req.route ? req.route.path : req.path;
  httpRequestDuration
    .labels(req.method, route, res.statusCode)
    .observe(time / 1000);
});

// Fonction pour mettre à jour les métriques métier
const updateBusinessMetrics = async () => {
  try {
    // Simuler la récupération des données métier
    const activeUserCount = await getActiveUserCount();
    const stockByCategory = await getStockByCategory();
    
    activeUsers.set(activeUserCount);
    
    // Mettre à jour le stock par catégorie
    Object.entries(stockByCategory).forEach(([category, count]) => {
      productsInStock.labels(category).set(count);
    });
    
  } catch (error) {
    console.error('Error updating business metrics:', error);
  }
};

// Mettre à jour les métriques métier toutes les 30 secondes
setInterval(updateBusinessMetrics, 30000);

// Endpoint pour exposer les métriques
const metricsEndpoint = (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
};

// Fonctions utilitaires (à implémenter selon votre base de données)
async function getActiveUserCount() {
  // Retourner le nombre d'utilisateurs actifs dans les dernières 5 minutes
  return Math.floor(Math.random() * 100) + 50; // Simulation
}

async function getStockByCategory() {
  // Retourner le stock par catégorie
  return {
    'Electronics': Math.floor(Math.random() * 1000) + 100,
    'Clothing': Math.floor(Math.random() * 500) + 50,
    'Books': Math.floor(Math.random() * 200) + 20,
    'Home': Math.floor(Math.random() * 300) + 30
  };
}

module.exports = {
  metricsMiddleware,
  responseTimeMiddleware,
  metricsEndpoint,
  ordersTotal,
  activeUsers,
  productsInStock,
  register
};
```

#### 2.3 Intégration dans l'Application

Modifiez `src/app.js` :

```javascript
const express = require('express');
const {
  metricsMiddleware,
  responseTimeMiddleware,
  metricsEndpoint,
  ordersTotal
} = require('./middleware/metrics');

const app = express();

// Middleware de métriques (avant les autres middlewares)
app.use(responseTimeMiddleware);
app.use(metricsMiddleware);

// Middleware standard
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint pour les métriques Prometheus
app.get('/metrics', metricsEndpoint);

// Endpoint de santé avec métriques
app.get('/api/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };
  
  res.status(200).json(healthCheck);
});

// Routes de l'API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));

// Middleware pour capturer les commandes
app.use('/api/orders', (req, res, next) => {
  if (req.method === 'POST') {
    res.on('finish', () => {
      if (res.statusCode === 201) {
        ordersTotal.labels('created').inc();
      } else {
        ordersTotal.labels('failed').inc();
      }
    });
  }
  next();
});

module.exports = app;
```

### Étape 3 : Configuration des Dashboards Grafana

#### 3.1 Provisioning des Dashboards

Créez `monitoring/grafana/provisioning/dashboards/dashboard.yml` :

```yaml
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
```

#### 3.2 Dashboard Principal

Créez `monitoring/grafana/dashboards/ecommerce-api-dashboard.json` :

```json
{
  "dashboard": {
    "id": null,
    "title": "E-commerce API Performance",
    "tags": ["ecommerce", "api", "performance"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(ecommerce_api_http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "min": 0
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Response Time (95th percentile)",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(ecommerce_api_http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "min": 0,
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 1},
                {"color": "red", "value": 2}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(ecommerce_api_http_requests_total{status_code=~\"5..\"}[5m]) / rate(ecommerce_api_http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 1},
                {"color": "red", "value": 5}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0}
      },
      {
        "id": 4,
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "ecommerce_api_active_users",
            "legendFormat": "Active Users"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "min": 0
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0}
      },
      {
        "id": 5,
        "title": "Response Time by Endpoint",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(ecommerce_api_http_request_duration_seconds_bucket[5m])) by (route)",
            "legendFormat": "{{route}} - 50th"
          },
          {
            "expr": "histogram_quantile(0.95, rate(ecommerce_api_http_request_duration_seconds_bucket[5m])) by (route)",
            "legendFormat": "{{route}} - 95th"
          }
        ],
        "yAxes": [
          {
            "label": "Response Time (seconds)",
            "min": 0
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 6,
        "title": "Request Volume by Endpoint",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ecommerce_api_http_requests_total[5m]) by (route)",
            "legendFormat": "{{route}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests per second",
            "min": 0
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      },
      {
        "id": 7,
        "title": "Orders Created",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ecommerce_api_orders_total{status=\"created\"}[5m])",
            "legendFormat": "Orders/sec"
          }
        ],
        "yAxes": [
          {
            "label": "Orders per second",
            "min": 0
          }
        ],
        "gridPos": {"h": 8, "w": 8, "x": 0, "y": 16}
      },
      {
        "id": 8,
        "title": "Products in Stock by Category",
        "type": "piechart",
        "targets": [
          {
            "expr": "ecommerce_api_products_in_stock",
            "legendFormat": "{{category}}"
          }
        ],
        "gridPos": {"h": 8, "w": 8, "x": 8, "y": 16}
      },
      {
        "id": 9,
        "title": "System Resources",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ecommerce_api_process_cpu_user_seconds_total[5m]) * 100",
            "legendFormat": "CPU Usage %"
          },
          {
            "expr": "ecommerce_api_process_resident_memory_bytes / 1024 / 1024",
            "legendFormat": "Memory Usage (MB)"
          }
        ],
        "yAxes": [
          {
            "label": "Usage",
            "min": 0
          }
        ],
        "gridPos": {"h": 8, "w": 8, "x": 16, "y": 16}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

### Étape 4 : Configuration des Alertes

#### 4.1 Règles d'Alerte Prometheus

Créez `monitoring/prometheus/alert_rules.yml` :

```yaml
groups:
  - name: ecommerce-api-alerts
    rules:
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(ecommerce_api_http_request_duration_seconds_bucket[5m])) > 2
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s for more than 2 minutes"

      - alert: HighErrorRate
        expr: rate(ecommerce_api_http_requests_total{status_code=~"5.."}[5m]) / rate(ecommerce_api_http_requests_total[5m]) * 100 > 5
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% for more than 1 minute"

      - alert: LowRequestRate
        expr: rate(ecommerce_api_http_requests_total[5m]) < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low request rate detected"
          description: "Request rate is {{ $value }} req/s for more than 5 minutes"

      - alert: APIDown
        expr: up{job="ecommerce-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API is down"
          description: "E-commerce API has been down for more than 1 minute"

      - alert: HighMemoryUsage
        expr: ecommerce_api_process_resident_memory_bytes / 1024 / 1024 > 500
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}MB for more than 5 minutes"

      - alert: LowStockAlert
        expr: ecommerce_api_products_in_stock < 10
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Low stock alert"
          description: "{{ $labels.category }} category has only {{ $value }} products in stock"
```

#### 4.2 Configuration Alertmanager

Créez `monitoring/alertmanager/alertmanager.yml` :

```yaml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@ecommerce.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://localhost:5001/webhook'

  - name: 'critical-alerts'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts-critical'
        title: 'Critical Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
    email_configs:
      - to: 'ops-team@ecommerce.com'
        subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
        body: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'warning-alerts'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts-warning'
        title: 'Warning: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

### Étape 5 : Tests et Validation

#### 5.1 Script de Test de Charge

Créez `scripts/load-test.js` :

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const CONCURRENT_USERS = 50;
const TEST_DURATION = 60000; // 1 minute

async function simulateUser() {
  try {
    // Authentification
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Navigation dans les produits
    await axios.get(`${API_BASE}/products`);
    
    // Recherche de produits
    await axios.get(`${API_BASE}/products/search?q=laptop`);
    
    // Ajout au panier
    await axios.post(`${API_BASE}/cart/items`, {
      productId: 'product-1',
      quantity: 1
    }, { headers });
    
    // Consultation du panier
    await axios.get(`${API_BASE}/cart`, { headers });
    
    console.log('User simulation completed successfully');
  } catch (error) {
    console.error('User simulation failed:', error.message);
  }
}

async function runLoadTest() {
  console.log(`Starting load test with ${CONCURRENT_USERS} concurrent users for ${TEST_DURATION/1000} seconds`);
  
  const startTime = Date.now();
  const promises = [];
  
  // Lancer les utilisateurs simultanés
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    promises.push(
      (async () => {
        while (Date.now() - startTime < TEST_DURATION) {
          await simulateUser();
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        }
      })()
    );
  }
  
  await Promise.all(promises);
  console.log('Load test completed');
}

runLoadTest().catch(console.error);
```

#### 5.2 Validation des Métriques

```bash
#!/bin/bash
# validate-metrics.sh

echo "=== Validation des Métriques ==="

# Vérifier que l'endpoint /metrics fonctionne
echo "1. Test de l'endpoint /metrics..."
curl -s http://localhost:3000/metrics | head -10

# Vérifier que Prometheus collecte les métriques
echo "2. Test de la collecte Prometheus..."
curl -s "http://localhost:9090/api/v1/query?query=up{job='ecommerce-api'}" | jq '.data.result[0].value[1]'

# Vérifier les métriques de temps de réponse
echo "3. Test des métriques de temps de réponse..."
curl -s "http://localhost:9090/api/v1/query?query=rate(ecommerce_api_http_request_duration_seconds_sum[5m])" | jq '.data.result'

# Vérifier les alertes actives
echo "4. Test des alertes..."
curl -s "http://localhost:9090/api/v1/alerts" | jq '.data.alerts | length'

echo "Validation terminée"
```

### Étape 6 : Intégration CI/CD

#### 6.1 Pipeline de Monitoring

```yaml
# .github/workflows/monitoring-validation.yml
name: Monitoring Validation

on:
  push:
    branches: [main]
    paths:
      - 'monitoring/**'
      - 'src/middleware/metrics.js'

jobs:
  validate-monitoring:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Start Monitoring Stack
      run: |
        docker-compose -f docker-compose.monitoring.yml up -d
        sleep 60
        
    - name: Start Application
      run: |
        docker-compose up -d app
        sleep 30
        
    - name: Validate Metrics Endpoint
      run: |
        curl -f http://localhost:3000/metrics
        
    - name: Run Load Test
      run: |
        npm install axios
        node scripts/load-test.js &
        LOAD_TEST_PID=$!
        sleep 30
        kill $LOAD_TEST_PID
        
    - name: Validate Prometheus Metrics
      run: |
        # Vérifier que les métriques sont collectées
        METRICS_COUNT=$(curl -s "http://localhost:9090/api/v1/query?query=ecommerce_api_http_requests_total" | jq '.data.result | length')
        if [ "$METRICS_COUNT" -eq "0" ]; then
          echo "No metrics found in Prometheus"
          exit 1
        fi
        
    - name: Validate Grafana Dashboards
      run: |
        # Vérifier que Grafana est accessible
        curl -f http://localhost:3001/api/health
        
        # Vérifier que les dashboards sont chargés
        DASHBOARD_COUNT=$(curl -s -u admin:admin123 "http://localhost:3001/api/search" | jq '. | length')
        if [ "$DASHBOARD_COUNT" -eq "0" ]; then
          echo "No dashboards found in Grafana"
          exit 1
        fi
        
    - name: Test Alerting
      run: |
        # Simuler une condition d'alerte (arrêter l'API)
        docker-compose stop app
        sleep 120
        
        # Vérifier que l'alerte est déclenchée
        ALERTS_COUNT=$(curl -s "http://localhost:9090/api/v1/alerts?active=true" | jq '.data.alerts | length')
        if [ "$ALERTS_COUNT" -eq "0" ]; then
          echo "No alerts triggered"
          exit 1
        fi
        
    - name: Cleanup
      if: always()
      run: |
        docker-compose -f docker-compose.monitoring.yml down
        docker-compose down
```

## Résultat Attendu

À la fin de cet exercice, vous devriez avoir :

1. **Stack de monitoring complète** avec :
   - Prometheus pour la collecte de métriques
   - Grafana pour la visualisation
   - Alertmanager pour les notifications

2. **Application instrumentée** incluant :
   - Métriques HTTP (temps de réponse, débit, erreurs)
   - Métriques système (CPU, mémoire)
   - Métriques métier (commandes, stock)

3. **Dashboards Grafana** présentant :
   - Vue d'ensemble des performances
   - Détails par endpoint
   - Métriques métier

4. **Système d'alertes** avec :
   - Règles de détection automatique
   - Notifications multi-canaux
   - Escalade selon la sévérité

## Critères de Validation

- [ ] Stack de monitoring déployée et fonctionnelle
- [ ] Métriques collectées et visibles dans Prometheus
- [ ] Dashboards Grafana opérationnels
- [ ] Alertes configurées et testées
- [ ] Pipeline CI/CD de validation
- [ ] Documentation des seuils et procédures

## Points Clés à Retenir

- **Métriques RED** : Rate, Errors, Duration
- **Observabilité** : Logs, métriques, traces
- **Alertes intelligentes** : Éviter le bruit, se concentrer sur l'impact
- **Dashboards orientés métier** : Pas seulement technique
- **Automatisation** : Monitoring as Code