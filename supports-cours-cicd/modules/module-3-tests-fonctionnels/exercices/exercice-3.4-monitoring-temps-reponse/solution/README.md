# Solution - Monitoring des Temps de Réponse

## Vue d'ensemble

Cette solution présente l'implémentation complète du système de monitoring des performances en temps réel pour l'API e-commerce.

## Architecture de Monitoring

```
monitoring-stack/
├── prometheus/
│   ├── prometheus.yml
│   ├── alert_rules.yml
│   └── targets/
├── grafana/
│   ├── dashboards/
│   ├── provisioning/
│   └── plugins/
├── alertmanager/
│   ├── alertmanager.yml
│   └── templates/
└── exporters/
    ├── node-exporter/
    ├── blackbox-exporter/
    └── custom-metrics/
```

## Métriques Implémentées

### Métriques Application (RED)
- **Rate** : Requêtes par seconde par endpoint
- **Errors** : Taux d'erreur par code de statut
- **Duration** : Temps de réponse (moyenne, médiane, 95e percentile)

### Métriques Système (USE)
- **Utilization** : CPU, mémoire, disque, réseau
- **Saturation** : Files d'attente, pool de connexions
- **Errors** : Erreurs système, timeouts

### Métriques Métier
- **Utilisateurs actifs** : Connexions simultanées
- **Commandes** : Taux de création, valeur moyenne
- **Produits** : Stock, vues, conversions
- **Revenus** : CA temps réel, panier moyen

## Dashboards Grafana

### Dashboard Principal - Vue d'Ensemble
- **Indicateurs clés** : Santé globale, trafic, erreurs
- **Graphiques temps réel** : Débit, latence, erreurs
- **Cartes de chaleur** : Distribution des temps de réponse
- **Alertes actives** : État des services critiques

### Dashboard Performance - Détails Techniques
- **Temps de réponse par endpoint** : Analyse détaillée
- **Ressources système** : CPU, mémoire, I/O
- **Base de données** : Requêtes lentes, connexions
- **Cache** : Hit ratio, évictions

### Dashboard Métier - KPIs
- **Utilisateurs** : Connexions, sessions, géolocalisation
- **Ventes** : Commandes, revenus, conversion
- **Produits** : Top ventes, stock critique
- **Performance métier** : Temps de checkout, abandon panier

## Système d'Alertes

### Alertes Critiques (P1)
- **API indisponible** : Uptime < 99%
- **Temps de réponse critique** : P95 > 10s
- **Taux d'erreur élevé** : > 5% sur 5 minutes
- **Ressources critiques** : CPU > 95%, Mémoire > 90%

### Alertes Importantes (P2)
- **Performance dégradée** : P95 > 5s
- **Taux d'erreur modéré** : > 2% sur 10 minutes
- **Ressources élevées** : CPU > 85%, Mémoire > 80%
- **Base de données lente** : Requêtes > 2s

### Alertes Informatives (P3)
- **Tendances négatives** : Dégradation sur 1h
- **Seuils préventifs** : CPU > 70%, Mémoire > 70%
- **Métriques métier** : Baisse conversion, stock faible

## Configuration Prometheus

### Règles d'Enregistrement
```yaml
groups:
  - name: api_performance
    interval: 30s
    rules:
      - record: api:request_rate
        expr: rate(http_requests_total[5m])
      
      - record: api:error_rate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
      
      - record: api:response_time_p95
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Règles d'Alerte
```yaml
groups:
  - name: api_alerts
    rules:
      - alert: APIHighErrorRate
        expr: api:error_rate > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
```

## Instrumentation Application

### Middleware Express.js
```javascript
const promClient = require('prom-client');

// Métriques personnalisées
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Middleware de métriques
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
      
    httpRequestDuration
      .labels(req.method, route)
      .observe(duration);
  });
  
  next();
});
```

### Métriques Métier
```javascript
// Compteurs métier
const ordersTotal = new promClient.Counter({
  name: 'orders_total',
  help: 'Total orders created',
  labelNames: ['status', 'payment_method']
});

const revenueTotal = new promClient.Counter({
  name: 'revenue_total',
  help: 'Total revenue',
  labelNames: ['currency']
});

// Utilisation dans les routes
app.post('/api/orders', async (req, res) => {
  try {
    const order = await createOrder(req.body);
    
    // Incrémenter les métriques
    ordersTotal.labels('created', order.paymentMethod).inc();
    revenueTotal.labels(order.currency).inc(order.total);
    
    res.status(201).json(order);
  } catch (error) {
    ordersTotal.labels('failed', 'unknown').inc();
    res.status(500).json({ error: error.message });
  }
});
```

## Tests de Validation

### Tests de Charge avec Métriques
```bash
#!/bin/bash
# Lancer un test de charge et surveiller les métriques

echo "Starting load test with monitoring..."

# Démarrer JMeter en arrière-plan
jmeter -n -t load-test.jmx -l results.jtl &
JMETER_PID=$!

# Surveiller les métriques pendant le test
while kill -0 $JMETER_PID 2>/dev/null; do
  # Vérifier les métriques critiques
  ERROR_RATE=$(curl -s "http://localhost:9090/api/v1/query?query=api:error_rate" | jq -r '.data.result[0].value[1]')
  RESPONSE_TIME=$(curl -s "http://localhost:9090/api/v1/query?query=api:response_time_p95" | jq -r '.data.result[0].value[1]')
  
  echo "Error Rate: ${ERROR_RATE}%, Response Time P95: ${RESPONSE_TIME}s"
  
  # Arrêter le test si les seuils sont dépassés
  if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
    echo "Error rate threshold exceeded, stopping test"
    kill $JMETER_PID
    break
  fi
  
  sleep 10
done

echo "Load test completed"
```

### Validation des Alertes
```python
#!/usr/bin/env python3
import requests
import time
import json

def test_alerting_system():
    """Tester le système d'alertes en simulant des conditions d'alerte"""
    
    # Simuler une charge élevée
    print("Simulating high load...")
    for i in range(100):
        requests.get("http://localhost:3000/api/products")
    
    # Attendre que les alertes se déclenchent
    time.sleep(60)
    
    # Vérifier les alertes actives
    alerts_response = requests.get("http://localhost:9090/api/v1/alerts")
    alerts = alerts_response.json()
    
    active_alerts = [alert for alert in alerts['data']['alerts'] if alert['state'] == 'firing']
    
    print(f"Active alerts: {len(active_alerts)}")
    for alert in active_alerts:
        print(f"- {alert['labels']['alertname']}: {alert['annotations']['summary']}")
    
    return len(active_alerts) > 0

if __name__ == "__main__":
    success = test_alerting_system()
    print("✅ Alerting system working" if success else "❌ No alerts triggered")
```

## Optimisations Implémentées

### Performance Queries
- **Utilisation d'index** : Requêtes Prometheus optimisées
- **Agrégation** : Pré-calcul des métriques fréquentes
- **Rétention** : Politique de rétention adaptée (15j détaillé, 1an agrégé)

### Scalabilité
- **Sharding Prometheus** : Séparation par service
- **Federation** : Agrégation multi-clusters
- **Grafana HA** : Load balancer + base partagée

### Sécurité
- **Authentification** : LDAP/OAuth pour Grafana
- **Autorisation** : RBAC par équipe
- **Chiffrement** : TLS pour toutes les communications

## Métriques de Succès

### SLIs (Service Level Indicators)
- **Disponibilité** : 99.9% uptime
- **Latence** : P95 < 2s, P99 < 5s
- **Débit** : > 1000 req/min
- **Qualité** : Taux d'erreur < 0.1%

### SLOs (Service Level Objectives)
- **Disponibilité mensuelle** : 99.9%
- **Performance** : 95% des requêtes < 2s
- **Fiabilité** : 99.9% de succès

### Alertes Budget d'Erreur
- **Burn rate rapide** : Consommation > 10x normal
- **Burn rate lent** : Tendance sur 6h
- **Budget épuisé** : < 10% restant