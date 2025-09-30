# Pipeline GitHub Actions - Workflow Détaillé

```mermaid
graph LR
    A[Push/PR] --> B[Checkout Code]
    B --> C[Setup Environment]
    C --> D[Install Dependencies]
    D --> E[Lint & Format]
    E --> F[Unit Tests]
    F --> G[Integration Tests]
    G --> H[Build Application]
    H --> I[Security Scan]
    I --> J[Docker Build]
    J --> K[Push to Registry]
    K --> L[Deploy to Staging]
    L --> M[E2E Tests]
    M --> N[Deploy to Production]
    
    F -->|Fail| O[Test Report]
    G -->|Fail| O
    I -->|Vulnerabilities| P[Security Report]
    M -->|Fail| Q[Rollback]
    
    style A fill:#f3e5f5
    style O fill:#ffebee
    style P fill:#fff3e0
    style Q fill:#ffebee
    style N fill:#e8f5e8
```

## Étapes du Pipeline

### Phase de Validation
1. **Checkout Code** : Récupération du code source
2. **Setup Environment** : Configuration de l'environnement (Node.js, Python, etc.)
3. **Install Dependencies** : Installation des dépendances
4. **Lint & Format** : Vérification du style de code

### Phase de Test
5. **Unit Tests** : Tests unitaires
6. **Integration Tests** : Tests d'intégration
7. **Security Scan** : Analyse de sécurité

### Phase de Build
8. **Build Application** : Compilation/Build de l'application
9. **Docker Build** : Création de l'image Docker
10. **Push to Registry** : Publication dans le registry

### Phase de Déploiement
11. **Deploy to Staging** : Déploiement en environnement de test
12. **E2E Tests** : Tests end-to-end
13. **Deploy to Production** : Déploiement en production