# Ressources - Formation CI/CD

## 🛠️ Vue d'Ensemble des Ressources

Cette section centralise toutes les ressources techniques, templates, outils et médias nécessaires pour la formation CI/CD.

## 🗂️ Organisation des Ressources

### [📁 Templates](templates/README.md)
**Modèles réutilisables** pour accélérer la mise en œuvre

| Template | Description | Utilisation | Modules |
|----------|-------------|-------------|---------|
| **[GitHub Actions](templates/github-actions-templates.md)** | Workflows CI/CD prêts à l'emploi | Exercices 1.1, 1.3 | Module 1 |
| **[Docker](templates/docker-templates.md)** | Dockerfiles et docker-compose | Exercices 1.2, 2.x | Modules 1-2 |
| **[Tests](templates/test-templates.md)** | Structures de tests automatisés | Tous les exercices | Tous modules |
| **[Rapports](templates/report-templates.md)** | Templates Allure, HTML | Exercice 4.1 | Module 4 |
| **[Monitoring](templates/monitoring-templates.md)** | Configs Grafana/Prometheus | Exercice 4.2 | Module 4 |

### [🔧 Outils](outils/README.md)
**Guides d'installation et configuration**

| Outil | Guide | Prérequis | Modules |
|-------|-------|-----------|---------|
| **[GitHub Actions](outils/github-actions-setup.md)** | Configuration complète | Compte GitHub | Module 1 |
| **[Docker](outils/docker-setup.md)** | Installation multi-OS | Droits admin | Modules 1-2 |
| **[Testim](outils/testim-setup.md)** | Configuration IA | Compte Testim | Module 2 |
| **[Applitools](outils/applitools-setup.md)** | Tests visuels IA | API Key | Module 2 |
| **[Selenium](outils/selenium-setup.md)** | WebDriver config | Java/Python | Module 3 |
| **[Cypress](outils/cypress-setup.md)** | Installation Node.js | Node.js 16+ | Module 3 |
| **[JMeter](outils/jmeter-setup.md)** | Tests de performance | Java 8+ | Module 3 |
| **[OWASP ZAP](outils/owasp-zap-setup.md)** | Tests de sécurité | Java 11+ | Module 3 |
| **[Allure](outils/allure-setup.md)** | Reporting avancé | Java 8+ | Module 4 |
| **[Grafana](outils/grafana-setup.md)** | Dashboards monitoring | Docker | Module 4 |

### [🖼️ Images](images/README.md)
**Ressources visuelles et médias**

| Type | Contenu | Format | Utilisation |
|------|---------|--------|-------------|
| **[Diagrammes](images/diagrammes/README.md)** | Architectures CI/CD | SVG, PNG | Supports théoriques |
| **[Captures](images/captures/README.md)** | Screenshots outils | PNG, JPG | Exercices guidés |
| **[Schémas](images/schemas/README.md)** | Concepts explicatifs | SVG, PNG | Présentations |
| **[Logos](images/logos/README.md)** | Logos outils/technologies | SVG, PNG | Templates |

## 🎯 Navigation par Module

### Module 1 - Fondamentaux CI/CD
**Ressources nécessaires** :
- **[GitHub Actions Templates](templates/github-actions-templates.md#basic-pipeline)**
- **[Docker Setup](outils/docker-setup.md)**
- **[Diagrammes CI/CD](images/diagrammes/cicd-basics.md)**

**Liens directs** :
- [Template Pipeline Basic](templates/github-actions-templates.md#pipeline-basic)
- [Docker pour Tests](templates/docker-templates.md#test-containers)
- [Captures GitHub Actions](images/captures/github-actions/)

### Module 2 - IA et Automatisation des Tests
**Ressources nécessaires** :
- **[Testim Configuration](outils/testim-setup.md)**
- **[Applitools Setup](outils/applitools-setup.md)**
- **[Templates ML](templates/ml-templates.md)**

**Liens directs** :
- [Scripts Python IA](templates/test-templates.md#ia-scripts)
- [Configs Testim](outils/testim-setup.md#configuration)
- [Exemples Applitools](templates/applitools-examples.md)

### Module 3 - Tests Fonctionnels et Non-Fonctionnels
**Ressources nécessaires** :
- **[Selenium WebDriver](outils/selenium-setup.md)**
- **[JMeter Configuration](outils/jmeter-setup.md)**
- **[OWASP ZAP Setup](outils/owasp-zap-setup.md)**

**Liens directs** :
- [Templates Selenium](templates/test-templates.md#selenium)
- [Scripts JMeter](templates/jmeter-templates.md)
- [Configs OWASP ZAP](templates/security-templates.md#owasp-zap)

### Module 4 - Documentation et Monitoring
**Ressources nécessaires** :
- **[Allure Configuration](outils/allure-setup.md)**
- **[Grafana/Prometheus](outils/grafana-setup.md)**
- **[Templates Rapports](templates/report-templates.md)**

**Liens directs** :
- [Configs Allure](templates/report-templates.md#allure)
- [Dashboards Grafana](templates/monitoring-templates.md#grafana)
- [Métriques Prometheus](templates/monitoring-templates.md#prometheus)

## 🛠️ Navigation par Outil

### Plateformes CI/CD
- **GitHub Actions** : [Setup](outils/github-actions-setup.md) | [Templates](templates/github-actions-templates.md) | [Captures](images/captures/github-actions/)
- **Jenkins** : [Setup](outils/jenkins-setup.md) | [Pipelines](templates/jenkins-templates.md)
- **GitLab CI** : [Setup](outils/gitlab-ci-setup.md) | [Templates](templates/gitlab-ci-templates.md)

### Conteneurisation
- **Docker** : [Installation](outils/docker-setup.md) | [Dockerfiles](templates/docker-templates.md) | [Compose](templates/docker-compose-templates.md)
- **Kubernetes** : [Setup](outils/kubernetes-setup.md) | [Manifests](templates/k8s-templates.md)

### Tests Automatisés
- **Selenium** : [WebDriver](outils/selenium-setup.md) | [Scripts](templates/test-templates.md#selenium) | [Grid](outils/selenium-grid-setup.md)
- **Cypress** : [Installation](outils/cypress-setup.md) | [Tests](templates/test-templates.md#cypress) | [Config](templates/cypress-config.md)
- **Playwright** : [Setup](outils/playwright-setup.md) | [Scripts](templates/playwright-templates.md)

### Tests avec IA
- **Testim** : [Configuration](outils/testim-setup.md) | [Exemples](templates/testim-examples.md)
- **Applitools** : [Setup](outils/applitools-setup.md) | [Visual Tests](templates/applitools-templates.md)
- **Mabl** : [Configuration](outils/mabl-setup.md) | [Intégration](templates/mabl-integration.md)

### Performance et Charge
- **JMeter** : [Installation](outils/jmeter-setup.md) | [Plans de test](templates/jmeter-templates.md) | [Plugins](outils/jmeter-plugins.md)
- **Gatling** : [Setup](outils/gatling-setup.md) | [Scenarios](templates/gatling-templates.md)
- **K6** : [Installation](outils/k6-setup.md) | [Scripts](templates/k6-templates.md)

### Sécurité
- **OWASP ZAP** : [Installation](outils/owasp-zap-setup.md) | [Scans](templates/security-templates.md#zap) | [API](outils/zap-api.md)
- **Snyk** : [Setup](outils/snyk-setup.md) | [Intégration](templates/snyk-integration.md)
- **Burp Suite** : [Configuration](outils/burp-setup.md) | [Extensions](outils/burp-extensions.md)

### Monitoring et Reporting
- **Allure** : [Installation](outils/allure-setup.md) | [Reports](templates/report-templates.md#allure) | [Plugins](outils/allure-plugins.md)
- **Grafana** : [Setup](outils/grafana-setup.md) | [Dashboards](templates/monitoring-templates.md#grafana) | [Datasources](outils/grafana-datasources.md)
- **Prometheus** : [Installation](outils/prometheus-setup.md) | [Métriques](templates/monitoring-templates.md#prometheus) | [Alerting](outils/prometheus-alerting.md)

## 📋 Guides Transversaux

### [Installation Complète](outils/installation-guide.md)
**Guide pas-à-pas** pour configurer l'environnement complet

1. **[Prérequis système](outils/installation-guide.md#prerequis)**
2. **[Outils de base](outils/installation-guide.md#outils-base)**
3. **[Outils par module](outils/installation-guide.md#par-module)**
4. **[Vérification](outils/installation-guide.md#verification)**

### [Troubleshooting](troubleshooting.md)
**Solutions aux problèmes courants**

- **[Problèmes d'installation](troubleshooting.md#installation)**
- **[Erreurs de configuration](troubleshooting.md#configuration)**
- **[Problèmes réseau](troubleshooting.md#reseau)**
- **[Compatibilité OS](troubleshooting.md#compatibilite)**

### [FAQ Technique](faq-technique.md)
**Questions fréquentes** organisées par thème

- **[Installation et configuration](faq-technique.md#installation)**
- **[Exercices pratiques](faq-technique.md#exercices)**
- **[Outils spécifiques](faq-technique.md#outils)**
- **[Intégrations](faq-technique.md#integrations)**

## 📚 Documentation de Référence

### [Glossaire](glossaire.md)
**Définitions** de tous les termes techniques utilisés

### [Bibliographie](bibliographie.md)
**Sources et références** pour approfondir

### [Liens Utiles](liens-utiles.md)
**Ressources externes** recommandées

## 🔧 Outils de Développement

### Environnements de Développement
- **[VS Code Setup](outils/vscode-setup.md)** - Configuration optimale
- **[IntelliJ IDEA](outils/intellij-setup.md)** - Pour Java/Kotlin
- **[PyCharm](outils/pycharm-setup.md)** - Pour Python

### Gestionnaires de Versions
- **[Git Configuration](outils/git-setup.md)** - Configuration avancée
- **[GitHub CLI](outils/github-cli-setup.md)** - Ligne de commande
- **[GitLab Runner](outils/gitlab-runner-setup.md)** - Exécuteur local

### Langages et Frameworks
- **[Node.js](outils/nodejs-setup.md)** - JavaScript/TypeScript
- **[Python](outils/python-setup.md)** - Environnements virtuels
- **[Java](outils/java-setup.md)** - JDK et Maven/Gradle

## 📊 Matrices de Compatibilité

### [Compatibilité OS](outils/compatibility-matrix.md#os)
Support des outils par système d'exploitation

### [Versions Supportées](outils/compatibility-matrix.md#versions)
Versions minimales et recommandées

### [Intégrations](outils/compatibility-matrix.md#integrations)
Compatibilité entre outils

## 🆘 Support et Maintenance

### Mise à Jour des Ressources
- **Fréquence** : Trimestrielle
- **Versioning** : Sémantique (v1.0.0)
- **Changelog** : [CHANGELOG.md](CHANGELOG.md)

### Contribution
- **[Guide de contribution](CONTRIBUTING.md)**
- **[Standards de qualité](QUALITY_STANDARDS.md)**
- **[Process de validation](VALIDATION_PROCESS.md)**

---

## 🧭 Navigation

### Navigation Principale
- **[⬅️ Retour à l'index](../index.md)**
- **[📚 Voir les modules](../modules/README.md)**
- **[💻 Voir les exercices](../exercices/README.md)**

### Ressources par Type
- **[📁 Templates](templates/README.md)**
- **[🔧 Outils](outils/README.md)**
- **[🖼️ Images](images/README.md)**

### Guides Pratiques
- **[🚀 Installation complète](outils/installation-guide.md)**
- **[🔧 Troubleshooting](troubleshooting.md)**
- **[❓ FAQ Technique](faq-technique.md)**

### Outils Formateur
- **[📊 Gestion des ressources](../guides/guide-formateur.md#ressources)**
- **[⚙️ Configuration environnements](../guides/guide-formateur.md#environnements)**
- **[🔄 Mise à jour des outils](../guides/guide-formateur.md#mises-a-jour)**

*Ressources mises à jour automatiquement*