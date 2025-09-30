# Schémas Explicatifs - Monitoring et Alerting

## 1. Architecture de Monitoring Complète

```mermaid
graph TB
    subgraph "Applications"
        A1[Frontend React]
        A2[Backend API]
        A3[Base de Données]
        A4[Services Externes]
    end
    
    subgraph "Collecte"
        B1[Logs Aggregator<br/>Fluentd/Logstash]
        B2[Metrics Collector<br/>Prometheus]
        B3[Traces Collector<br/>Jaeger]
    end
    
    subgraph "Stockage"
        C1[Elasticsearch<br/>Logs]
        C2[Prometheus DB<br/>Metrics]
        C3[Jaeger DB<br/>Traces]
    end
    
    subgraph "Visualisation"
        D1[Grafana<br/>Dashboards]
        D2[Kibana<br/>Log Analysis]
        D3[Jaeger UI<br/>Tracing]
    end
    
    subgraph "Alerting"
        E1[AlertManager]
        E2[PagerDuty]
        E3[Slack/Email]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    
    A1 --> B2
    A2 --> B2
    A3 --> B2
    
    A2 --> B3
    
    B1 --> C1
    B2 --> C2
    B3 --> C3
    
    C1 --> D2
    C2 --> D1
    C3 --> D3
    
    D1 --> E1
    E1 --> E2
    E1 --> E3
    
    style B1 fill:#e3f2fd
    style D1 fill:#e8f5e8
    style E1 fill:#fff3e0
```

---

## 2. Niveaux d'Alerting

```mermaid
graph TD
    A[Métriques Collectées] --> B{Évaluation des Seuils}
    
    B --> C[INFO<br/>Informatif]
    B --> D[WARNING<br/>Attention]
    B --> E[CRITICAL<br/>Critique]
    B --> F[EMERGENCY<br/>Urgence]
    
    C --> G[Log Seulement]
    D --> H[Notification Équipe<br/>Heures Ouvrées]
    E --> I[Alerte Immédiate<br/>24/7]
    F --> J[Escalade Automatique<br/>Management]
    
    subgraph "Exemples"
        K[CPU > 70%<br/>Disk > 80%]
        L[CPU > 85%<br/>Erreurs > 5%]
        M[Service Down<br/>DB Inaccessible]
        N[Sécurité Compromise<br/>Perte de Données]
    end
    
    D -.-> K
    E -.-> L
    F -.-> M
    F -.-> N
    
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#ffcdd2
    style F fill:#d32f2f
    style F color:#ffffff
```

---

## 3. Cycle de Vie d'une Alerte

```mermaid
graph LR
    A[Seuil Dépassé] --> B[Alerte Générée]
    B --> C[Notification Envoyée]
    C --> D[Accusé de Réception]
    
    D --> E{Problème Résolu?}
    E -->|❌ Non| F[Escalade]
    E -->|✅ Oui| G[Alerte Fermée]
    
    F --> H[Notification Manager]
    H --> I[Investigation Approfondie]
    I --> J{Résolution?}
    
    J -->|✅ Oui| G
    J -->|❌ Non| K[Incident Majeur]
    
    G --> L[Post-Mortem]
    K --> M[Gestion de Crise]
    M --> L
    
    L --> N[Amélioration Processus]
    
    style A fill:#fff3e0
    style F fill:#ffcdd2
    style G fill:#e8f5e8
    style K fill:#d32f2f
    style K color:#ffffff
    style N fill:#e3f2fd
```

### Bonnes Pratiques
- **Seuils Adaptés** : Éviter les fausses alertes
- **Escalade Claire** : Processus défini
- **Documentation** : Runbooks pour chaque alerte
- **Amélioration Continue** : Analyse post-incident