# Exercice 2.2 - Tests Visuels Automatisés avec Applitools

## Objectifs
- Configurer Applitools Eyes pour les tests visuels automatisés
- Implémenter des tests de régression visuelle
- Analyser les résultats et gérer les baselines visuelles
- Intégrer Applitools dans un pipeline CI/CD

## Prérequis
- Connaissances de base en Selenium WebDriver
- Compte Applitools (version d'essai disponible)
- Node.js et npm installés
- Navigateur Chrome ou Firefox

## Matériel Requis
- Applitools Eyes SDK
- Selenium WebDriver
- Application web de démonstration
- Clé API Applitools

## Durée Estimée
45 minutes

## Instructions

### Étape 1 : Configuration de l'environnement Applitools

1. **Créer un compte Applitools**
   ```bash
   # Visitez https://applitools.com/users/register
   # Récupérez votre clé API depuis le dashboard
   ```

2. **Installer les dépendances**
   ```bash
   npm install @applitools/eyes-selenium selenium-webdriver
   ```

3. **Configurer les variables d'environnement**
   ```bash
   export APPLITOOLS_API_KEY="votre-cle-api"
   ```

### Étape 2 : Création du premier test visuel

1. **Créer le test de base**
   - Ouvrir le fichier `tests/visual-regression.test.js`
   - Implémenter la capture d'écran de référence
   - Configurer les paramètres de comparaison

2. **Exécuter le test initial**
   ```bash
   npm run test:visual
   ```

### Étape 3 : Tests de régression visuelle

1. **Modifier l'interface utilisateur**
   - Changer la couleur d'un bouton
   - Modifier la taille d'un élément
   - Ajouter un nouvel élément

2. **Relancer les tests**
   - Observer les différences détectées
   - Analyser le rapport Applitools

### Étape 4 : Gestion des baselines

1. **Accepter ou rejeter les changements**
   - Utiliser l'interface Applitools pour valider
   - Comprendre l'impact des modifications

2. **Configurer les règles de matching**
   - Définir les zones à ignorer
   - Ajuster la sensibilité de détection

### Étape 5 : Intégration CI/CD

1. **Configurer GitHub Actions**
   - Ajouter les secrets pour la clé API
   - Intégrer les tests visuels dans le workflow

2. **Analyser les résultats en continu**
   - Configurer les notifications
   - Gérer les échecs de tests visuels

## Résultat Attendu

À la fin de cet exercice, vous devriez avoir :
- Un environnement Applitools fonctionnel
- Des tests visuels automatisés opérationnels
- Une compréhension de la gestion des baselines visuelles
- Une intégration CI/CD avec tests visuels

## Points Clés à Retenir

- **Baseline Management** : La gestion des références visuelles est cruciale
- **Sensibilité** : Ajuster la détection selon les besoins métier
- **Performance** : Les tests visuels peuvent être plus lents que les tests unitaires
- **Maintenance** : Les baselines doivent être mises à jour régulièrement

## Ressources Complémentaires

- [Documentation Applitools Eyes](https://applitools.com/docs/)
- [Bonnes pratiques tests visuels](https://applitools.com/blog/visual-testing-best-practices/)
- [Intégration CI/CD](https://applitools.com/docs/topics/integrations/ci-cd-integration.html)