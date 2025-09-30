# Exercice 2.3 - Détection d'Anomalies dans les Logs avec IA

## Objectifs
- Implémenter un système de détection d'anomalies dans les logs applicatifs
- Utiliser des algorithmes de machine learning pour identifier les patterns anormaux
- Configurer des alertes automatiques basées sur l'IA
- Intégrer la détection d'anomalies dans un pipeline CI/CD

## Prérequis
- Connaissances de base en Python
- Compréhension des logs applicatifs
- Notions de base en machine learning (optionnel)
- Docker installé

## Matériel Requis
- Python 3.8+
- Bibliothèques ML (scikit-learn, pandas, numpy)
- Elasticsearch et Kibana (via Docker)
- Générateur de logs de démonstration

## Durée Estimée
60 minutes

## Instructions

### Étape 1 : Configuration de l'environnement

1. **Démarrer l'infrastructure de logs**
   ```bash
   docker-compose up -d elasticsearch kibana
   ```

2. **Installer les dépendances Python**
   ```bash
   pip install -r requirements.txt
   ```

3. **Vérifier la connectivité**
   ```bash
   python scripts/check_connection.py
   ```

### Étape 2 : Génération de logs de test

1. **Démarrer le générateur de logs**
   ```bash
   python log_generator.py --duration 300 --anomaly-rate 0.05
   ```

2. **Observer les logs générés**
   - Logs normaux : requêtes HTTP standards
   - Anomalies : erreurs 500, temps de réponse élevés, patterns suspects

### Étape 3 : Implémentation du détecteur d'anomalies

1. **Analyser le script de détection**
   - Ouvrir `anomaly_detector.py`
   - Comprendre les features extraites des logs
   - Examiner l'algorithme Isolation Forest

2. **Configurer les paramètres de détection**
   ```python
   # Ajuster la sensibilité
   contamination_rate = 0.1  # 10% d'anomalies attendues
   
   # Définir les features importantes
   features = ['response_time', 'status_code', 'request_size', 'hour_of_day']
   ```

### Étape 4 : Entraînement du modèle

1. **Collecter les données d'entraînement**
   ```bash
   python collect_training_data.py --days 7
   ```

2. **Entraîner le modèle**
   ```bash
   python train_model.py --input training_data.json --output model.pkl
   ```

3. **Évaluer les performances**
   ```bash
   python evaluate_model.py --model model.pkl --test-data test_logs.json
   ```

### Étape 5 : Détection en temps réel

1. **Démarrer le détecteur en temps réel**
   ```bash
   python real_time_detector.py --model model.pkl --threshold 0.8
   ```

2. **Observer les alertes**
   - Anomalies détectées en temps réel
   - Scores de confiance
   - Contexte des anomalies

### Étape 6 : Intégration avec le monitoring

1. **Configurer les alertes Slack/Email**
   ```python
   # Configuration dans config.yaml
   alerts:
     slack:
       webhook_url: "https://hooks.slack.com/..."
       channel: "#alerts"
     email:
       smtp_server: "smtp.gmail.com"
       recipients: ["admin@company.com"]
   ```

2. **Créer des dashboards Kibana**
   - Importer les visualisations prédéfinies
   - Configurer les alertes basées sur les scores d'anomalie

### Étape 7 : Tests d'intégration CI/CD

1. **Ajouter les tests au pipeline**
   ```yaml
   # .github/workflows/anomaly-detection.yml
   - name: Test Anomaly Detection
     run: |
       python -m pytest tests/test_anomaly_detection.py
       python scripts/validate_model_performance.py
   ```

2. **Configurer le déploiement automatique**
   - Déployer le modèle mis à jour
   - Valider les performances en production

## Résultat Attendu

À la fin de cet exercice, vous devriez avoir :
- Un système de détection d'anomalies fonctionnel
- Un modèle ML entraîné sur vos données de logs
- Des alertes automatiques configurées
- Une intégration CI/CD pour le monitoring intelligent

## Métriques de Performance

- **Précision** : Pourcentage d'anomalies réelles parmi celles détectées
- **Rappel** : Pourcentage d'anomalies détectées parmi toutes les anomalies
- **Temps de détection** : Délai entre l'occurrence et la détection
- **Faux positifs** : Nombre d'alertes incorrectes par jour

## Points Clés à Retenir

- **Qualité des données** : La performance dépend de la qualité des logs d'entraînement
- **Réentraînement** : Le modèle doit être mis à jour régulièrement
- **Seuils adaptatifs** : Les seuils doivent s'adapter aux patterns métier
- **Contexte métier** : L'IA doit être complétée par l'expertise humaine

## Ressources Complémentaires

- [Isolation Forest Algorithm](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html)
- [ELK Stack Documentation](https://www.elastic.co/guide/)
- [Anomaly Detection Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/analytics-lens/anomaly-detection.html)