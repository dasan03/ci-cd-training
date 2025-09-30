# 3. Tests de Sécurité Automatisés

## 3.1 Principes de Sécurité dans les Tests

### Importance des Tests de Sécurité

Les tests de sécurité automatisés sont essentiels pour :
- Détecter les vulnérabilités tôt dans le cycle de développement
- Réduire les coûts de correction des failles
- Assurer la conformité aux standards de sécurité
- Protéger les données sensibles et la réputation

### Types de Tests de Sécurité

**Tests Statiques (SAST)**
- Analyse du code source
- Détection de patterns dangereux
- Vérification des bonnes pratiques
- Outils : SonarQube, Checkmarx, Veracode

**Tests Dynamiques (DAST)**
- Analyse de l'application en fonctionnement
- Tests de pénétration automatisés
- Scan des vulnérabilités web
- Outils : OWASP ZAP, Burp Suite, Nessus

**Tests Interactifs (IAST)**
- Combinaison SAST + DAST
- Analyse en temps réel
- Contexte d'exécution précis
- Outils : Contrast Security, Checkmarx IAST

### OWASP Top 10 - Vulnérabilités Critiques

1. **Injection** - SQL, NoSQL, OS, LDAP
2. **Broken Authentication** - Gestion des sessions
3. **Sensitive Data Exposure** - Chiffrement insuffisant
4. **XML External Entities (XXE)** - Parseurs XML vulnérables
5. **Broken Access Control** - Contrôles d'autorisation
6. **Security Misconfiguration** - Configuration par défaut
7. **Cross-Site Scripting (XSS)** - Injection de scripts
8. **Insecure Deserialization** - Désérialisation non sécurisée
9. **Using Components with Known Vulnerabilities** - Dépendances
10. **Insufficient Logging & Monitoring** - Surveillance inadéquate

## 3.2 Scan de Vulnérabilités avec OWASP ZAP

### Présentation d'OWASP ZAP

OWASP Zed Attack Proxy (ZAP) est un outil de test de sécurité :
- Scanner de vulnérabilités web gratuit
- Interface graphique et API
- Proxy intercepteur
- Extensible via add-ons

### Architecture ZAP

```
Browser → ZAP Proxy → Web Application
           ↓
    Vulnerability Scanner
           ↓
        Reports
```

### Installation et Configuration

**Installation Docker**
```bash
# Télécharger l'image ZAP
docker pull owasp/zap2docker-stable

# Lancer ZAP en mode daemon
docker run -u zap -p 8080:8080 -i owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 8080
```

**Configuration de Base**
```bash
# Configuration du proxy
export ZAP_PROXY=http://localhost:8080

# API Key pour l'authentification
export ZAP_API_KEY=your-api-key-here
```

### Scan Automatisé avec ZAP

**Script de Scan Basique**
```bash
#!/bin/bash

TARGET_URL="http://localhost:3000"
ZAP_API="http://localhost:8080"

# Démarrer le spider pour découvrir les URLs
curl "$ZAP_API/JSON/spider/action/scan/?url=$TARGET_URL"

# Attendre la fin du spider
while [ $(curl -s "$ZAP_API/JSON/spider/view/status/" | jq -r '.status') != "100" ]; do
  echo "Spider en cours..."
  sleep 5
done

# Lancer le scan actif
curl "$ZAP_API/JSON/ascan/action/scan/?url=$TARGET_URL"

# Attendre la fin du scan
while [ $(curl -s "$ZAP_API/JSON/ascan/view/status/" | jq -r '.status') != "100" ]; do
  echo "Scan actif en cours..."
  sleep 10
done

# Générer le rapport
curl "$ZAP_API/OTHER/core/other/htmlreport/" > security-report.html
```

### Intégration dans les Tests

**Test Selenium + ZAP**
```javascript
const { Builder, By } = require('selenium-webdriver');
const proxy = require('selenium-webdriver/proxy');

describe('Security Tests', () => {
  let driver;
  
  beforeAll(async () => {
    // Configuration du proxy ZAP
    const zapProxy = proxy.manual({
      http: 'localhost:8080',
      https: 'localhost:8080'
    });
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setProxy(zapProxy)
      .build();
  });
  
  it('should perform authenticated scan', async () => {
    // Navigation authentifiée
    await driver.get('http://localhost:3000/login');
    await driver.findElement(By.id('username')).sendKeys('testuser');
    await driver.findElement(By.id('password')).sendKeys('password');
    await driver.findElement(By.css('button[type="submit"]')).click();
    
    // Navigation dans l'application
    await driver.get('http://localhost:3000/dashboard');
    await driver.get('http://localhost:3000/profile');
    await driver.get('http://localhost:3000/settings');
    
    // ZAP enregistre automatiquement toutes les requêtes
  });
});
```

## 3.3 Analyse des Dépendances avec Snyk

### Présentation de Snyk

Snyk est une plateforme de sécurité pour les développeurs :
- Scan des dépendances open source
- Détection des vulnérabilités connues
- Suggestions de correction automatiques
- Intégration CI/CD native

### Types de Scans Snyk

**Snyk Open Source**
- Vulnérabilités dans les dépendances
- Licences problématiques
- Suggestions de mise à jour

**Snyk Code**
- Analyse statique du code
- Détection de failles de sécurité
- Recommandations de correction

**Snyk Container**
- Scan des images Docker
- Vulnérabilités du système de base
- Optimisation des images

**Snyk Infrastructure as Code**
- Scan des fichiers Terraform, Kubernetes
- Détection de mauvaises configurations
- Bonnes pratiques de sécurité

### Installation et Utilisation

**Installation CLI**
```bash
# Installation via npm
npm install -g snyk

# Authentification
snyk auth

# Scan du projet
snyk test

# Scan avec rapport JSON
snyk test --json > security-report.json
```

### Intégration dans le Pipeline

**GitHub Actions avec Snyk**
```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
        
    - name: Upload result to GitHub Code Scanning
      uses: github/codeql-action/upload-sarif@v1
      with:
        sarif_file: snyk.sarif
```

### Configuration Avancée

**Fichier .snyk**
```yaml
# Ignorer certaines vulnérabilités temporairement
ignore:
  SNYK-JS-LODASH-567746:
    - '*':
        reason: 'Pas de fix disponible, risque acceptable'
        expires: '2024-12-31T23:59:59.999Z'

# Patches automatiques
patches:
  SNYK-JS-MINIMIST-559764:
    - tap > nyc > minimist:
        patched: '2021-03-15T10:00:00.000Z'

# Exclusions de chemins
exclude:
  global:
    - test/**
    - docs/**
```

## 3.4 Intégration dans le Pipeline CI/CD

### Pipeline de Sécurité Complet

```yaml
# .github/workflows/security.yml
name: Security Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  dependency-scan:
    name: Dependency Vulnerability Scan
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Snyk Dependency Scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=medium
        
  code-scan:
    name: Static Code Analysis
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: SonarCloud Scan
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        
  dynamic-scan:
    name: Dynamic Security Testing
    runs-on: ubuntu-latest
    needs: [dependency-scan, code-scan]
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Start Application
      run: |
        docker-compose up -d
        sleep 30
        
    - name: OWASP ZAP Scan
      uses: zaproxy/action-full-scan@v0.4.0
      with:
        target: 'http://localhost:3000'
        rules_file_name: '.zap/rules.tsv'
        cmd_options: '-a'
        
    - name: Stop Application
      run: docker-compose down
```

### Gestion des Résultats

**Seuils de Sécurité**
```yaml
security_thresholds:
  critical_vulnerabilities: 0
  high_vulnerabilities: 2
  medium_vulnerabilities: 10
  low_vulnerabilities: 50
  
quality_gates:
  block_deployment_on_critical: true
  require_approval_on_high: true
  notify_team_on_medium: true
```

**Rapports et Notifications**
```javascript
// Exemple de notification Slack
const sendSecurityAlert = async (vulnerabilities) => {
  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
  
  if (criticalCount > 0 || highCount > 5) {
    await slack.chat.postMessage({
      channel: '#security-alerts',
      text: `🚨 Vulnérabilités détectées: ${criticalCount} critiques, ${highCount} élevées`,
      attachments: [{
        color: 'danger',
        fields: vulnerabilities.slice(0, 5).map(v => ({
          title: v.title,
          value: `Sévérité: ${v.severity}\nCVE: ${v.cve}`,
          short: true
        }))
      }]
    });
  }
};
```

## 3.5 Bonnes Pratiques de Sécurité

### Shift-Left Security

**Intégration Précoce**
- Tests de sécurité dès le développement
- Formation des développeurs
- Outils intégrés dans l'IDE
- Revues de code sécurisées

**Automatisation Complète**
- Scans à chaque commit
- Validation des pull requests
- Déploiement conditionnel
- Monitoring continu

### Gestion des Secrets

**Bonnes Pratiques**
```yaml
# Mauvais - secrets en dur
database_url: "postgresql://user:password@localhost/db"

# Bon - utilisation de variables d'environnement
database_url: "${DATABASE_URL}"
```

**Outils de Gestion**
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault
- Kubernetes Secrets

### Monitoring et Réponse

**Détection d'Intrusion**
- Logs d'accès anormaux
- Tentatives d'authentification
- Patterns d'attaque connus
- Alertes en temps réel

**Plan de Réponse**
1. Détection automatique
2. Isolation des systèmes
3. Analyse forensique
4. Correction et patch
5. Post-mortem et amélioration