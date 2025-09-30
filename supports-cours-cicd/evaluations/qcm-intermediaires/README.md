# QCM Intermédiaires

Ce dossier contient les QCM intermédiaires pour chaque module de la formation CI/CD.

## Structure des QCM

Chaque QCM est défini dans un fichier JSON suivant le format standardisé défini dans `ressources/templates/template-qcm.json`.

### QCM Disponibles

- **Module 1 - Fondamentaux CI/CD** : `qcm-module-1-fondamentaux.json`
  - 8 questions couvrant les concepts de base CI/CD
  - Durée : 20 minutes
  - Compétences évaluées : C8, C17
  - Seuil de réussite : 70%

- **Module 2 - IA et Automatisation des Tests** : 
  - `qcm-module-2-ia-automatisation.json` (10 questions, 20 minutes, C8, C17, C19)
  - `qcm-module-2-ml-optimisation.json` (10 questions, 20 minutes, C8, C17, C19)

- **Module 3 - Tests Fonctionnels et Non-Fonctionnels** : `qcm-module-3-tests-fonctionnels.json`
  - 12 questions couvrant les tests fonctionnels, de performance et de sécurité
  - Durée : 25 minutes
  - Compétences évaluées : C17, C18
  - Outils couverts : Selenium, Cypress, JMeter, OWASP ZAP, Postman, RestAssured, Snyk
  - Seuil de réussite : 70%

## Format des Questions

### Types de Questions Supportés

1. **Choix Multiple** (`choix-multiple`)
   - Une seule réponse correcte parmi plusieurs options
   - Format : array d'options avec index de la réponse correcte

2. **Vrai/Faux** (`vrai-faux`)
   - Question binaire avec réponse booléenne
   - Format : `true` ou `false`

3. **Association** (`association`)
   - Relier des éléments de deux listes
   - Format : array d'associations [index_gauche, index_droite]

### Niveaux de Difficulté

- **Facile** : Concepts de base, définitions simples (1 point)
- **Moyen** : Application des concepts, comparaisons (1,5 points)
- **Difficile** : Analyse, synthèse, cas complexes (2 points)

## Utilisation

### Pour les Formateurs

1. **Préparation** : Réviser les questions et explications avant la session
2. **Administration** : Utiliser le format interactif HTML ou imprimer en PDF
3. **Correction** : Les explications détaillées sont fournies pour chaque question
4. **Analyse** : Utiliser les métriques par compétence pour identifier les points faibles

### Pour les Apprenants

1. **Timing** : Respecter la durée indiquée (généralement 15-20 minutes)
2. **Navigation** : Possibilité de revenir sur les questions précédentes
3. **Validation** : Vérifier toutes les réponses avant validation finale
4. **Feedback** : Consulter les explications après correction

## Mapping des Compétences

### C8 - Réaliser des tests d'intégration
- Questions sur les pipelines CI/CD
- Configuration des workflows
- Stratégies de déploiement

### C17 - Automatiser les tests
- Types de tests automatisés
- Outils de test (Selenium, Cypress, Postman, RestAssured)
- Bonnes pratiques d'automatisation
- Test Data Management

### C18 - Réaliser des tests de performance
- Tests de charge, stress et pic
- Outils de performance (JMeter)
- Métriques de performance
- Tests de sécurité (OWASP ZAP, Snyk)
- Environnements de test cloud

### C19 - Utiliser l'IA pour optimiser les tests
- Automatisation avec IA
- Génération de tests avec NLP
- Outils IA-powered (Testim, Applitools, Mabl)

## Génération des Formats

Les QCM peuvent être générés dans différents formats :

- **HTML Interactif** : Pour utilisation en ligne avec correction automatique
- **PDF** : Pour impression et utilisation hors ligne
- **Markdown** : Pour intégration dans d'autres supports

Voir le dossier `ressources/templates/` pour les templates de génération.