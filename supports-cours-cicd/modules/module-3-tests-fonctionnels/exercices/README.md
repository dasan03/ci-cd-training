# Exercices Pratiques - Module 3

## Vue d'ensemble

Ce module contient 6 exercices pratiques couvrant les tests fonctionnels et non-fonctionnels :

1. **Tests UI avec Selenium et Cypress** - Automatisation des tests d'interface utilisateur
2. **Tests API avec Postman et RestAssured** - Validation des services web
3. **Simulation de charge avec JMeter** - Tests de performance et de montée en charge
4. **Monitoring des temps de réponse** - Surveillance et métriques de performance
5. **Scan de vulnérabilités avec OWASP ZAP** - Tests de sécurité automatisés
6. **Analyse des dépendances avec Snyk** - Détection de vulnérabilités dans les dépendances

## Prérequis Techniques

- Node.js 16+ et npm
- Java 11+ (pour RestAssured et JMeter)
- Docker et Docker Compose
- Git
- Navigateur Chrome/Firefox

## Installation des Outils

```bash
# Installation des dépendances Node.js
npm install -g @cypress/cli selenium-webdriver

# Installation de JMeter
wget https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.4.1.tgz
tar -xzf apache-jmeter-5.4.1.tgz

# Installation de Snyk CLI
npm install -g snyk

# Images Docker nécessaires
docker pull owasp/zap2docker-stable
docker pull selenium/standalone-chrome
```

## Structure des Exercices

Chaque exercice suit la même structure :
- `README.md` - Instructions détaillées
- `ressources/` - Code de base et fichiers de configuration
- `solution/` - Solution complète avec explications

## Durée Estimée

- **Exercice 3.1** : 45 minutes
- **Exercice 3.2** : 45 minutes  
- **Exercice 3.3** : 60 minutes
- **Exercice 3.4** : 30 minutes
- **Exercice 3.5** : 45 minutes
- **Exercice 3.6** : 30 minutes

**Total** : 4h15 (avec pauses et discussions)

## Ordre Recommandé

1. Commencer par les tests UI (3.1) pour établir les bases
2. Enchaîner avec les tests API (3.2) pour la complémentarité
3. Aborder les tests de performance (3.3 et 3.4) ensemble
4. Terminer par la sécurité (3.5 et 3.6) pour une approche complète