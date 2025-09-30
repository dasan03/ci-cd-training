# Exercices Pratiques - Module 1 : Fondamentaux CI/CD

## Vue d'Ensemble

Ce module contient 3 exercices pratiques progressifs qui permettent d'appliquer concrètement les concepts théoriques abordés dans le Module 1. Chaque exercice est conçu pour renforcer les compétences C8 (Réaliser des tests d'intégration) et C17 (Automatiser les tests).

## Structure des Exercices

### 🎯 Progression Pédagogique

Les exercices suivent une progression logique :
1. **Exercice 1.1** : Découverte et configuration de base
2. **Exercice 1.2** : Approfondissement avec containerisation
3. **Exercice 1.3** : Optimisation et bonnes pratiques

### 📋 Format Standard

Chaque exercice comprend :
- **Objectifs d'apprentissage** clairs et mesurables
- **Prérequis techniques** et connaissances nécessaires
- **Énoncé détaillé** avec contexte professionnel
- **Instructions étape par étape** avec captures d'écran
- **Fichiers de ressources** et templates fournis
- **Solution complète** avec explications
- **Points de validation** pour auto-évaluation
- **Extensions possibles** pour aller plus loin

## Liste des Exercices

### [Exercice 1.1 - Premier Pipeline CI/CD avec GitHub Actions](exercice-1.1-premier-pipeline/README.md)
**Durée :** 90 minutes  
**Niveau :** Débutant  
**Objectif :** Créer son premier workflow GitHub Actions avec build et tests unitaires

**Compétences travaillées :**
- Configuration de workflows automatisés
- Intégration de tests unitaires dans CI/CD
- Gestion des artefacts de build

---

### [Exercice 1.2 - Configuration de Tests Automatisés avec Docker](exercice-1.2-tests-docker/README.md)
**Durée :** 120 minutes  
**Niveau :** Intermédiaire  
**Objectif :** Mettre en place un environnement de test containerisé avec services

**Compétences travaillées :**
- Containerisation des environnements de test
- Configuration de services de test (base de données, cache)
- Tests d'intégration avec dépendances externes

---

### [Exercice 1.3 - Intégration de Tests en Parallèle](exercice-1.3-tests-paralleles/README.md)
**Durée :** 90 minutes  
**Niveau :** Intermédiaire/Avancé  
**Objectif :** Optimiser les temps d'exécution avec la parallélisation des tests

**Compétences travaillées :**
- Optimisation des pipelines CI/CD
- Parallélisation des tests
- Monitoring et métriques de performance

## Prérequis Généraux

### Outils Requis
- **Git** : Version 2.30+
- **Node.js** : Version 18+ avec npm
- **Docker Desktop** : Version 4.0+
- **Compte GitHub** : Avec accès aux GitHub Actions
- **IDE** : VS Code recommandé avec extensions Git et Docker

### Connaissances Préalables
- Bases de Git (clone, commit, push, pull)
- Notions de ligne de commande
- Concepts de base du développement web
- Compréhension des concepts HTTP/REST

### Configuration de l'Environnement
Avant de commencer les exercices, suivez le [Guide de Configuration](../../../ressources/outils/outils-requis.md) pour préparer votre environnement de développement.

## Évaluation et Validation

### Critères de Réussite
Chaque exercice inclut des **points de validation** permettant de vérifier :
- ✅ Configuration correcte des outils
- ✅ Fonctionnement des workflows CI/CD
- ✅ Exécution réussie des tests
- ✅ Respect des bonnes pratiques

### Auto-Évaluation
Des **questions de réflexion** sont proposées à la fin de chaque exercice pour :
- Analyser les résultats obtenus
- Identifier les points d'amélioration
- Réfléchir aux applications en contexte professionnel

### Support et Aide
- **Solutions détaillées** disponibles pour chaque exercice
- **FAQ** avec problèmes courants et résolutions
- **Ressources complémentaires** pour approfondir

## Ressources Communes

### Templates et Fichiers de Base
- Configuration GitHub Actions de base
- Dockerfile multi-stage pour tests
- Scripts de configuration d'environnement
- Exemples d'applications de test

### Documentation de Référence
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Jest Testing Framework](https://jestjs.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Planning Suggéré

### Session de 4 heures (demi-journée)
```
09:00-09:15  | Présentation des exercices et setup
09:15-10:45  | Exercice 1.1 - Premier pipeline
10:45-11:00  | Pause
11:00-13:00  | Exercice 1.2 - Tests avec Docker
13:00-14:00  | Déjeuner
14:00-15:30  | Exercice 1.3 - Tests en parallèle
15:30-16:00  | Débriefing et questions
```

### Session de 6 heures (journée complète)
```
09:00-09:30  | Présentation et setup environnement
09:30-11:00  | Exercice 1.1 - Premier pipeline
11:00-11:15  | Pause
11:15-13:15  | Exercice 1.2 - Tests avec Docker
13:15-14:15  | Déjeuner
14:15-15:45  | Exercice 1.3 - Tests en parallèle
15:45-16:00  | Pause
16:00-17:00  | Débriefing et extensions
```

## Extensions et Approfondissements

### Pour Aller Plus Loin
- Intégration avec SonarQube pour l'analyse de qualité
- Configuration de notifications Slack/Teams
- Déploiement automatique sur des environnements cloud
- Mise en place de tests de sécurité avec Snyk

### Projets Personnels
Les apprenants sont encouragés à :
- Appliquer les concepts sur leurs propres projets
- Adapter les configurations à leur stack technique
- Partager leurs expériences et difficultés rencontrées

---

**Compétences ECF :** C8, C17  
**Durée totale :** 300 minutes (5 heures)  
**Format :** Travaux pratiques individuels avec support formateur