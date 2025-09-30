# Module 1 - Fondamentaux CI/CD

## 📋 Informations Générales

- **Durée** : 4 heures
- **Niveau** : Débutant
- **Prérequis** : Bases du développement logiciel, notions de Git
- **Compétences** : C8, C17

## 🎯 Objectifs Pédagogiques

À l'issue de ce module, vous serez capable de :
- Comprendre les concepts fondamentaux CI/CD
- Différencier les tests manuels et automatisés
- Configurer un pipeline CI/CD de base
- Intégrer des tests automatisés dans un pipeline
- Utiliser GitHub Actions et Docker pour l'automatisation

## 📚 Table des Matières

### [📖 Support Théorique](support-theorique.md)

#### Section 1 : Introduction aux Concepts CI/CD (45 min)
- [1.1 Qu'est-ce que CI/CD ?](support-theorique.md#11-quest-ce-que-cicd)
- [1.2 Différences tests manuels vs automatisés](support-theorique.md#12-tests-manuels-vs-automatises)
- [1.3 Avantages de l'automatisation](support-theorique.md#13-avantages-automatisation)
- **[💻 Exercice associé](../../exercices/module-1/exercice-1-1.md)** : Premier pipeline CI/CD

#### Section 2 : Types et Catégories de Tests (45 min)
- [2.1 Tests unitaires, d'intégration, fonctionnels](support-theorique.md#21-types-de-tests)
- [2.2 Pyramide des tests](support-theorique.md#22-pyramide-des-tests)
- [2.3 Tests de régression](support-theorique.md#23-tests-regression)
- **[💻 Exercice associé](../../exercices/module-1/exercice-1-2.md)** : Configuration de tests automatisés

#### Section 3 : Intégration des Tests dans CI/CD (45 min)
- [3.1 Stratégies d'intégration](support-theorique.md#31-strategies-integration)
- [3.2 Tests en parallèle](support-theorique.md#32-tests-paralleles)
- [3.3 Gestion des échecs](support-theorique.md#33-gestion-echecs)
- **[💻 Exercice associé](../../exercices/module-1/exercice-1-3.md)** : Intégration de tests en parallèle

#### Section 4 : Outils et Bonnes Pratiques (45 min)
- [4.1 GitHub Actions](support-theorique.md#41-github-actions)
- [4.2 Jenkins](support-theorique.md#42-jenkins)
- [4.3 Docker pour les tests](support-theorique.md#43-docker-tests)
- [4.4 Bonnes pratiques](support-theorique.md#44-bonnes-pratiques)

### [💻 Exercices Pratiques](../../exercices/module-1/README.md)

| Exercice | Titre | Durée | Difficulté | Outils |
|----------|-------|-------|------------|--------|
| **[1.1](../../exercices/module-1/exercice-1-1.md)** | Premier pipeline CI/CD avec GitHub Actions | 30 min | 🟢 Débutant | GitHub Actions, Docker |
| **[1.2](../../exercices/module-1/exercice-1-2.md)** | Configuration de tests automatisés avec Docker | 30 min | 🟢 Débutant | Docker, PyTest |
| **[1.3](../../exercices/module-1/exercice-1-3.md)** | Intégration de tests en parallèle | 30 min | 🟡 Intermédiaire | GitHub Actions, Matrix |

### [✅ QCM Intermédiaire](../../evaluations/qcm-intermediaires/module-1-qcm.md)

- **8 questions** couvrant tous les concepts
- **Durée** : 15 minutes
- **Seuil de réussite** : 6/8 (75%)
- **Compétences évaluées** : C8, C17

#### Répartition des Questions
- Questions 1-2 : Concepts CI/CD
- Questions 3-4 : Types de tests
- Questions 5-6 : Intégration dans pipelines
- Questions 7-8 : Outils et bonnes pratiques

## 🔗 Liens Croisés

### Vers les Autres Modules
- **[Module 2](../module-2-ia-tests/README.md)** : Approfondissement avec l'IA
- **[Module 3](../module-3-tests-fonctionnels/README.md)** : Tests fonctionnels avancés
- **[Module 4](../module-4-documentation/README.md)** : Documentation des pipelines

### Vers les Ressources
- **[Templates GitHub Actions](../../ressources/templates/github-actions-templates.md)**
- **[Configuration Docker](../../ressources/outils/docker-setup.md)**
- **[Troubleshooting](../../ressources/troubleshooting.md#module-1)**

### Compétences Développées
- **[C8 - TDD](../../index.md#c8---test-driven-development-tdd)** : Sections 2.1, 2.2 + Exercices 1.2, 1.3
- **[C17 - Tests CI/CD](../../index.md#c17---tests-automatises-dans-cicd)** : Toutes les sections + Tous les exercices

## 📅 Planning Détaillé

### Matin (4h) - Jour 1

| Horaire | Activité | Durée | Type |
|---------|----------|-------|------|
| 09:00-09:45 | [Section 1 : Concepts CI/CD](support-theorique.md#section-1) | 45 min | 📖 Théorie |
| 09:45-10:15 | [Exercice 1.1 : Premier pipeline](../../exercices/module-1/exercice-1-1.md) | 30 min | 💻 Pratique |
| 10:15-10:30 | **Pause** | 15 min | ☕ |
| 10:30-11:15 | [Section 2 : Types de tests](support-theorique.md#section-2) | 45 min | 📖 Théorie |
| 11:15-11:45 | [Exercice 1.2 : Tests automatisés](../../exercices/module-1/exercice-1-2.md) | 30 min | 💻 Pratique |
| 11:45-12:30 | [Section 3 : Intégration tests](support-theorique.md#section-3) | 45 min | 📖 Théorie |
| 12:30-13:00 | [Exercice 1.3 : Tests parallèles](../../exercices/module-1/exercice-1-3.md) | 30 min | 💻 Pratique |
| 13:00-13:15 | [QCM Module 1](../../evaluations/qcm-intermediaires/module-1-qcm.md) | 15 min | ✅ Évaluation |

## 🛠️ Prérequis Techniques

### Logiciels Requis
- **Git** (version 2.30+)
- **Docker** (version 20.10+)
- **Éditeur de code** (VS Code recommandé)
- **Navigateur web** moderne

### Comptes Nécessaires
- **GitHub** (compte gratuit)
- **Docker Hub** (compte gratuit)

### Configuration
- **[Guide d'installation](../../ressources/outils/installation-guide.md#module-1)**
- **[Vérification environnement](../../ressources/outils/environment-check.md)**

## 📊 Évaluation et Validation

### Critères de Réussite
- ✅ Complétion des 3 exercices pratiques
- ✅ Score minimum 6/8 au QCM intermédiaire
- ✅ Démonstration d'un pipeline fonctionnel

### Indicateurs de Progression
- **Débutant** : Comprend les concepts, suit les exercices guidés
- **Intermédiaire** : Adapte les solutions, résout les problèmes mineurs
- **Avancé** : Propose des améliorations, aide les autres participants

## 🆘 Support et Aide

### Pendant le Module
- **Formateur** disponible en permanence
- **Documentation** complète fournie
- **Pair programming** encouragé

### Ressources d'Aide
- **[FAQ Module 1](../../ressources/faq-technique.md#module-1)**
- **[Troubleshooting](../../ressources/troubleshooting.md#module-1)**
- **[Glossaire](../../ressources/glossaire.md)**

---

## 🧭 Navigation

### Navigation Principale
- **[⬅️ Retour aux modules](../README.md)**
- **[🏠 Index général](../../index.md)**
- **[➡️ Module 2](../module-2-ia-tests/README.md)**

### Navigation Interne
- **[📖 Commencer la théorie](support-theorique.md)**
- **[💻 Voir les exercices](../../exercices/module-1/README.md)**
- **[✅ Passer le QCM](../../evaluations/qcm-intermediaires/module-1-qcm.md)**

### Outils Formateur
- **[📊 Tableau de bord](../../guides/guide-formateur.md#module-1)**
- **[🎯 Objectifs pédagogiques](../../guides/guide-formateur.md#objectifs-module-1)**
- **[⏱️ Gestion du temps](../../guides/guide-formateur.md#timing-module-1)**

*Dernière mise à jour : [Date] | Version : 1.0*