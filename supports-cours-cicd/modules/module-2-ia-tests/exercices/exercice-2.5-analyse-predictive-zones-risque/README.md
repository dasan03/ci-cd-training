# Exercice 2.5 - Analyse Prédictive des Zones à Risque

## Objectifs
- Implémenter un système d'analyse prédictive pour identifier les zones de code à risque
- Utiliser des métriques de code et l'historique Git pour prédire les bugs
- Créer des modèles de machine learning pour la prédiction de défauts
- Intégrer l'analyse prédictive dans le processus de développement

## Prérequis
- Connaissances de base en Python et Git
- Compréhension des métriques de qualité de code
- Notions de machine learning (optionnel)
- Familiarité avec les outils d'analyse statique

## Matériel Requis
- Python 3.8+
- Bibliothèques ML (scikit-learn, pandas)
- Outils d'analyse de code (SonarQube, pylint)
- Historique Git d'un projet
- Données de bugs historiques

## Durée Estimée
90 minutes

## Instructions

### Étape 1 : Configuration de l'environnement d'analyse

1. **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configurer les outils d'analyse**
   ```bash
   # Installation de SonarQube (via Docker)
   docker run -d --name sonarqube -p 9000:9000 sonarqube:latest
   
   # Installation des outils Python
   pip install pylint radon bandit
   ```

3. **Préparer le projet d'analyse**
   ```bash
   git clone https://github.com/example/sample-project.git
   cd sample-project
   ```

### Étape 2 : Collecte des métriques de code

1. **Extraire les métriques de complexité**
   ```bash
   python extract_code_metrics.py --project ./sample-project --output metrics.json
   ```

2. **Analyser l'historique Git**
   ```bash
   python analyze_git_history.py --repo ./sample-project --output git_metrics.json
   ```

3. **Examiner les données collectées**
   - Métriques de complexité cyclomatique
   - Nombre de lignes de code
   - Fréquence des modifications
   - Nombre de développeurs ayant modifié le fichier

### Étape 3 : Préparation des données d'entraînement

1. **Analyser le script de préparation**
   - Ouvrir `data_preparation.py`
   - Comprendre les features extraites
   - Examiner le labeling des données (buggy/non-buggy)

2. **Préparer le dataset**
   ```bash
   python data_preparation.py --metrics metrics.json --git-data git_metrics.json --bugs bugs.json --output training_data.csv
   ```

3. **Explorer les données**
   ```python
   import pandas as pd
   data = pd.read_csv('training_data.csv')
   print(data.describe())
   print(data['is_buggy'].value_counts())
   ```

### Étape 4 : Entraînement du modèle prédictif

1. **Analyser le modèle de prédiction**
   - Ouvrir `risk_predictor.py`
   - Comprendre les algorithmes utilisés
   - Examiner les features importantes

2. **Entraîner le modèle**
   ```bash
   python train_risk_model.py --data training_data.csv --output risk_model.pkl
   ```

3. **Évaluer les performances**
   ```bash
   python evaluate_model.py --model risk_model.pkl --test-data test_data.csv
   ```

### Étape 5 : Analyse prédictive en temps réel

1. **Analyser un nouveau commit**
   ```bash
   python analyze_commit.py --commit-hash abc123 --model risk_model.pkl
   ```

2. **Générer un rapport de risque**
   ```bash
   python generate_risk_report.py --project ./sample-project --model risk_model.pkl --output risk_report.html
   ```

3. **Examiner les résultats**
   - Fichiers classés par niveau de risque
   - Probabilités de présence de bugs
   - Recommandations d'actions

### Étape 6 : Intégration dans le workflow de développement

1. **Configurer l'analyse automatique des PR**
   ```yaml
   # .github/workflows/risk-analysis.yml
   name: Risk Analysis
   on:
     pull_request:
       types: [opened, synchronize]
   
   jobs:
     analyze-risk:
       runs-on: ubuntu-latest
       steps:
         - name: Analyze Risk
           run: python analyze_pr_risk.py --pr-number ${{ github.event.number }}
   ```

2. **Créer des alertes automatiques**
   ```python
   # Configuration des seuils d'alerte
   RISK_THRESHOLDS = {
       'high': 0.8,      # Risque élevé > 80%
       'medium': 0.5,    # Risque moyen > 50%
       'low': 0.2        # Risque faible > 20%
   }
   ```

### Étape 7 : Visualisation et reporting

1. **Créer des dashboards interactifs**
   ```bash
   python create_dashboard.py --data risk_analysis.json --output dashboard.html
   ```

2. **Générer des rapports périodiques**
   ```bash
   python generate_weekly_report.py --project ./sample-project --output weekly_risk_report.pdf
   ```

3. **Configurer les notifications**
   - Slack pour les risques élevés
   - Email pour les rapports hebdomadaires
   - Intégration avec Jira pour le suivi

### Étape 8 : Amélioration continue du modèle

1. **Collecter les feedbacks**
   ```bash
   python collect_feedback.py --period last-month --output feedback.json
   ```

2. **Réentraîner le modèle**
   ```bash
   python retrain_model.py --feedback feedback.json --model risk_model.pkl --output updated_model.pkl
   ```

3. **Valider les améliorations**
   ```bash
   python validate_improvements.py --old-model risk_model.pkl --new-model updated_model.pkl
   ```

## Résultat Attendu

À la fin de cet exercice, vous devriez avoir :
- Un système d'analyse prédictive des risques fonctionnel
- Un modèle ML capable de prédire les zones de code problématiques
- Une intégration dans le workflow de développement
- Des dashboards et rapports automatisés

## Métriques de Performance du Modèle

### Métriques Principales
- **Précision** : 85%+ pour les prédictions de risque élevé
- **Rappel** : 75%+ pour la détection des vrais positifs
- **F1-Score** : 80%+ pour l'équilibre précision/rappel
- **AUC-ROC** : 0.85+ pour la capacité de discrimination

### Métriques Métier
- **Réduction des bugs** : 30%+ de bugs évités grâce aux prédictions
- **Temps de détection** : Réduction de 50% du temps de détection des problèmes
- **ROI** : Retour sur investissement positif en 6 mois

## Features Importantes du Modèle

### Métriques de Code
```python
CODE_METRICS = {
    'cyclomatic_complexity': 'Complexité cyclomatique',
    'lines_of_code': 'Nombre de lignes',
    'number_of_methods': 'Nombre de méthodes',
    'depth_of_inheritance': 'Profondeur d\'héritage',
    'coupling_between_objects': 'Couplage entre objets'
}
```

### Métriques Git
```python
GIT_METRICS = {
    'commit_frequency': 'Fréquence des commits',
    'number_of_authors': 'Nombre d\'auteurs',
    'lines_added': 'Lignes ajoutées',
    'lines_deleted': 'Lignes supprimées',
    'file_age': 'Âge du fichier'
}
```

## Exemple de Rapport de Risque

```
=== RAPPORT D'ANALYSE PRÉDICTIVE ===
Date: 2024-01-15
Projet: sample-project

FICHIERS À RISQUE ÉLEVÉ (>80%):
1. src/payment/processor.py - 92% de risque
   - Complexité: 15 (élevée)
   - Modifié 23 fois ce mois
   - 4 développeurs différents
   
2. src/auth/validator.py - 87% de risque
   - 450 lignes de code
   - Dernière modification: bugs critiques
   - Couplage élevé avec 8 modules

RECOMMANDATIONS:
- Refactoring prioritaire pour processor.py
- Tests supplémentaires pour validator.py
- Code review obligatoire pour ces fichiers
```

## Points Clés à Retenir

- **Données historiques** : La qualité des prédictions dépend de l'historique disponible
- **Features engineering** : Le choix des métriques est crucial pour la performance
- **Feedback loop** : Le modèle doit être mis à jour avec les retours terrain
- **Intégration workflow** : L'adoption dépend de l'intégration dans les outils existants

## Ressources Complémentaires

- [Software Defect Prediction Research](https://ieeexplore.ieee.org/document/software-defect-prediction)
- [Code Metrics and Quality](https://docs.sonarqube.org/latest/user-guide/metric-definitions/)
- [Git Mining for Software Analytics](https://github.com/ishepard/pydriller)
- [Machine Learning for Software Engineering](https://ml4se.github.io/)