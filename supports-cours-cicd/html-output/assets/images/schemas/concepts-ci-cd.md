# Schémas Explicatifs - Concepts CI/CD

## 1. Différence CI vs CD

```mermaid
graph LR
    subgraph "Continuous Integration (CI)"
        A[Code Commit] --> B[Build]
        B --> C[Tests Automatisés]
        C --> D[Merge to Main]
    end
    
    subgraph "Continuous Deployment (CD)"
        D --> E[Deploy to Staging]
        E --> F[Tests d'Acceptation]
        F --> G[Deploy to Production]
    end
    
    style A fill:#e3f2fd
    style D fill:#fff3e0
    style G fill:#e8f5e8
```

### Explication
- **CI** : Intégration fréquente du code avec validation automatique
- **CD** : Déploiement automatique après validation CI

---

## 2. Types de Tests dans le Pipeline

```mermaid
graph TD
    A[Code Source] --> B{Tests Unitaires}
    B -->|✅ Pass| C{Tests d'Intégration}
    B -->|❌ Fail| D[Feedback Développeur]
    
    C -->|✅ Pass| E{Tests de Performance}
    C -->|❌ Fail| D
    
    E -->|✅ Pass| F{Tests de Sécurité}
    E -->|❌ Fail| D
    
    F -->|✅ Pass| G{Tests E2E}
    F -->|❌ Fail| D
    
    G -->|✅ Pass| H[Déploiement]
    G -->|❌ Fail| D
    
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style E fill:#f3e5f5
    style F fill:#ffebee
    style G fill:#e1f5fe
    style H fill:#e8f5e8
```

### Progression des Tests
1. **Unitaires** : Rapides, isolés
2. **Intégration** : Composants ensemble
3. **Performance** : Charge et stress
4. **Sécurité** : Vulnérabilités
5. **E2E** : Parcours utilisateur complet

---

## 3. Feedback Loop dans CI/CD

```mermaid
graph TB
    A[Développeur] -->|1. Push Code| B[Repository]
    B -->|2. Trigger| C[Pipeline CI/CD]
    C -->|3. Execute| D[Tests & Build]
    
    D -->|4a. Success| E[Deploy]
    D -->|4b. Failure| F[Notification]
    
    E -->|5. Monitor| G[Production]
    F -->|6. Fix| A
    G -->|7. Metrics| H[Feedback]
    H -->|8. Improve| A
    
    style A fill:#e3f2fd
    style F fill:#ffebee
    style E fill:#e8f5e8
    style H fill:#fff3e0
```

### Boucle de Feedback
- **Rapide** : Notification immédiate des échecs
- **Continue** : Monitoring permanent en production
- **Amélioration** : Optimisation basée sur les métriques