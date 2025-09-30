# Exercice 2.4 - Génération de Cas de Test avec Modèles NLP

## Objectifs
- Utiliser des modèles de traitement du langage naturel pour générer des cas de test
- Automatiser la création de scénarios de test à partir de spécifications
- Implémenter un pipeline de génération de tests basé sur l'IA
- Évaluer la qualité et la pertinence des tests générés

## Prérequis
- Connaissances de base en Python
- Compréhension des spécifications fonctionnelles
- Notions de base en NLP (optionnel)
- Familiarité avec les frameworks de test

## Matériel Requis
- Python 3.8+
- Transformers (Hugging Face)
- OpenAI API (optionnel)
- Spécifications d'exemple
- Framework de test (pytest)

## Durée Estimée
75 minutes

## Instructions

### Étape 1 : Configuration de l'environnement NLP

1. **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configurer les modèles**
   ```bash
   python setup_models.py --download-models
   ```

3. **Tester la configuration**
   ```bash
   python test_nlp_setup.py
   ```

### Étape 2 : Analyse des spécifications

1. **Examiner les spécifications d'exemple**
   - Ouvrir `specifications/user-management.md`
   - Analyser la structure des user stories
   - Identifier les critères d'acceptation

2. **Comprendre le format de sortie**
   ```python
   # Format attendu pour les tests générés
   {
       "test_name": "test_user_creation_valid_data",
       "description": "Vérifie la création d'utilisateur avec données valides",
       "preconditions": ["Base de données accessible", "API démarrée"],
       "steps": [
           {"action": "POST /api/users", "data": {...}},
           {"action": "Vérifier status 201"},
           {"action": "Vérifier présence ID utilisateur"}
       ],
       "expected_result": "Utilisateur créé avec succès",
       "test_data": {...}
   }
   ```

### Étape 3 : Implémentation du générateur de tests

1. **Analyser le générateur principal**
   - Ouvrir `test_generator.py`
   - Comprendre le pipeline de traitement
   - Examiner les prompts utilisés

2. **Configurer les paramètres de génération**
   ```python
   # Configuration dans config.yaml
   generation:
     model: "gpt-3.5-turbo"  # ou "microsoft/DialoGPT-medium"
     max_tokens: 1000
     temperature: 0.7
     test_types: ["positive", "negative", "edge_case"]
   ```

### Étape 4 : Génération de tests à partir de user stories

1. **Générer des tests pour une user story simple**
   ```bash
   python generate_tests.py --input "specifications/user-login.md" --output "generated_tests/"
   ```

2. **Examiner les tests générés**
   - Vérifier la cohérence avec les spécifications
   - Analyser la couverture des cas de test
   - Évaluer la qualité du code généré

### Étape 5 : Amélioration avec des prompts spécialisés

1. **Utiliser des prompts pour différents types de tests**
   ```python
   # Prompt pour tests de sécurité
   security_prompt = """
   Génère des cas de test de sécurité pour cette fonctionnalité:
   - Tests d'injection SQL
   - Tests d'authentification
   - Tests d'autorisation
   - Tests de validation des entrées
   """
   
   # Prompt pour tests de performance
   performance_prompt = """
   Génère des cas de test de performance:
   - Tests de charge
   - Tests de stress
   - Tests de temps de réponse
   """
   ```

2. **Générer des tests spécialisés**
   ```bash
   python generate_tests.py --input specs.md --type security --output security_tests/
   python generate_tests.py --input specs.md --type performance --output perf_tests/
   ```

### Étape 6 : Validation et raffinement

1. **Exécuter les tests générés**
   ```bash
   cd generated_tests/
   pytest test_user_management.py -v
   ```

2. **Analyser les résultats**
   - Tests qui passent/échouent
   - Qualité du code généré
   - Pertinence des assertions

3. **Raffiner le générateur**
   - Ajuster les prompts
   - Améliorer la post-processing
   - Ajouter des validations

### Étape 7 : Intégration dans le workflow de développement

1. **Créer un script d'intégration**
   ```bash
   # generate_tests_from_pr.py
   # Génère automatiquement des tests lors des PR
   python generate_tests_from_pr.py --pr-number 123
   ```

2. **Configurer GitHub Actions**
   ```yaml
   name: Auto Generate Tests
   on:
     pull_request:
       paths: ['specifications/**']
   
   jobs:
     generate-tests:
       runs-on: ubuntu-latest
       steps:
         - name: Generate Tests from Specs
           run: python generate_tests_from_pr.py
   ```

### Étape 8 : Évaluation de la qualité

1. **Métriques de qualité**
   ```python
   # Évaluer les tests générés
   python evaluate_generated_tests.py --tests generated_tests/ --metrics all
   ```

2. **Métriques analysées**
   - Couverture des spécifications
   - Diversité des cas de test
   - Qualité syntaxique du code
   - Pertinence des assertions

## Résultat Attendu

À la fin de cet exercice, vous devriez avoir :
- Un générateur de tests basé sur l'IA fonctionnel
- Des tests automatiquement générés à partir de spécifications
- Une compréhension des limites et avantages de l'approche
- Une intégration dans le workflow de développement

## Métriques de Performance

- **Couverture** : Pourcentage des exigences couvertes par les tests générés
- **Précision** : Pourcentage de tests générés qui sont syntaxiquement corrects
- **Pertinence** : Pourcentage de tests qui testent effectivement les bonnes fonctionnalités
- **Temps de génération** : Temps nécessaire pour générer une suite de tests

## Exemples de Tests Générés

### Test Positif
```python
def test_create_user_with_valid_data():
    """Test la création d'un utilisateur avec des données valides"""
    user_data = {
        "username": "john_doe",
        "email": "john@example.com",
        "password": "SecurePass123!"
    }
    response = client.post("/api/users", json=user_data)
    assert response.status_code == 201
    assert "id" in response.json()
    assert response.json()["username"] == user_data["username"]
```

### Test Négatif
```python
def test_create_user_with_invalid_email():
    """Test la création d'un utilisateur avec un email invalide"""
    user_data = {
        "username": "john_doe",
        "email": "invalid-email",
        "password": "SecurePass123!"
    }
    response = client.post("/api/users", json=user_data)
    assert response.status_code == 400
    assert "email" in response.json()["errors"]
```

## Points Clés à Retenir

- **Qualité des prompts** : La qualité des tests dépend fortement des prompts utilisés
- **Post-processing** : Les tests générés nécessitent souvent des ajustements
- **Validation humaine** : L'IA complète mais ne remplace pas l'expertise humaine
- **Évolution continue** : Les modèles et prompts doivent évoluer avec l'expérience

## Ressources Complémentaires

- [Hugging Face Transformers](https://huggingface.co/docs/transformers/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [Test Generation Research Papers](https://arxiv.org/search/?query=automated+test+generation)