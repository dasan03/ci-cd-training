# Solution - Scan de Vulnérabilités avec OWASP ZAP

## Vue d'ensemble

Cette solution présente l'implémentation complète des tests de sécurité automatisés pour l'API e-commerce en utilisant OWASP ZAP.

## Architecture de Sécurité

```
security-testing/
├── zap-config/
│   ├── policies/
│   ├── scripts/
│   └── contexts/
├── automated-scans/
│   ├── baseline/
│   ├── full-scan/
│   └── api-scan/
├── custom-tests/
│   ├── authentication/
│   ├── injection/
│   └── business-logic/
└── reports/
    ├── html/
    ├── json/
    └── sarif/
```

## Types de Scans Implémentés

### 1. Baseline Scan (Passif)
- **Durée** : 5-10 minutes
- **Couverture** : Vulnérabilités évidentes
- **Faux positifs** : Faibles
- **Usage** : CI/CD quotidien

### 2. Full Scan (Actif)
- **Durée** : 30-60 minutes
- **Couverture** : OWASP Top 10 complet
- **Faux positifs** : Modérés
- **Usage** : Releases, nightly

### 3. API Scan (Spécialisé)
- **Durée** : 15-30 minutes
- **Couverture** : Spécifique aux APIs REST
- **Faux positifs** : Faibles
- **Usage** : Tests d'API

## Vulnérabilités Détectées et Corrigées

### Injection SQL
**Vulnérabilité trouvée** :
```sql
-- Endpoint vulnérable : /api/products/search?q=
-- Payload : ' OR '1'='1' --
-- Impact : Accès non autorisé aux données
```

**Correction implémentée** :
```javascript
// Avant (vulnérable)
const query = `SELECT * FROM products WHERE name LIKE '%${searchTerm}%'`;

// Après (sécurisé)
const query = 'SELECT * FROM products WHERE name LIKE ?';
const results = await db.query(query, [`%${searchTerm}%`]);
```

### Cross-Site Scripting (XSS)
**Vulnérabilité trouvée** :
```javascript
// Endpoint vulnérable : /api/user/profile
// Payload : <script>alert('XSS')</script>
// Impact : Exécution de code côté client
```

**Correction implémentée** :
```javascript
const validator = require('validator');
const xss = require('xss');

// Validation et échappement
app.post('/api/user/profile', (req, res) => {
  const name = validator.escape(req.body.name);
  const cleanName = xss(name);
  // Traitement sécurisé...
});
```

### Authentification Faible
**Vulnérabilité trouvée** :
- Pas de limitation des tentatives de connexion
- Tokens JWT sans expiration
- Mots de passe faibles acceptés

**Corrections implémentées** :
```javascript
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Limitation des tentatives
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Too many login attempts'
});

// Validation mot de passe fort
const passwordSchema = {
  minLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};

// JWT avec expiration
const token = jwt.sign(payload, secret, { expiresIn: '1h' });
```

## Configuration ZAP Personnalisée

### Politique de Scan E-commerce
```xml
<?xml version="1.0" encoding="UTF-8"?>
<policy>
    <name>E-commerce Security Policy</name>
    
    <!-- Tests d'injection prioritaires -->
    <scanner id="40018" level="HIGH" strength="HIGH" />  <!-- SQL Injection -->
    <scanner id="40019" level="HIGH" strength="HIGH" />  <!-- SQL Injection MySQL -->
    <scanner id="40012" level="HIGH" strength="HIGH" />  <!-- XSS Reflected -->
    <scanner id="40014" level="HIGH" strength="HIGH" />  <!-- XSS Persistent -->
    
    <!-- Tests d'authentification -->
    <scanner id="10202" level="MEDIUM" strength="MEDIUM" /> <!-- Anti-CSRF -->
    <scanner id="10010" level="HIGH" strength="HIGH" />     <!-- Cookie HttpOnly -->
    <scanner id="10011" level="HIGH" strength="HIGH" />     <!-- Cookie Secure -->
    
    <!-- Tests spécifiques e-commerce -->
    <scanner id="90019" level="HIGH" strength="MEDIUM" />   <!-- Server Side Injection -->
    <scanner id="90020" level="HIGH" strength="MEDIUM" />   <!-- Remote Command Injection -->
</policy>
```

### Contexte d'Authentification
```python
# Configuration du contexte ZAP pour l'authentification
def setup_authentication_context(zap):
    context_name = "EcommerceApp"
    context_id = zap.context.new_context(context_name)
    
    # Inclure les URLs de l'application
    zap.context.include_in_context(context_name, "http://localhost:3000.*")
    
    # Configuration de l'authentification par formulaire
    login_url = "http://localhost:3000/api/auth/login"
    auth_config = f"loginUrl={login_url}&loginRequestData=email%3Dtest%40example.com%26password%3Dpassword123"
    
    zap.authentication.set_authentication_method(
        contextid=context_id,
        authmethodname='formBasedAuthentication',
        authmethodconfigparams=auth_config
    )
    
    # Créer un utilisateur de test
    user_id = zap.users.new_user(context_id, "testuser")
    zap.users.set_authentication_credentials(
        context_id, user_id, 
        "email=test@example.com&password=password123"
    )
    
    return context_id, user_id
```

## Tests Personnalisés

### Test de Logique Métier
```python
def test_business_logic_vulnerabilities():
    """Tester les vulnérabilités de logique métier spécifiques à l'e-commerce"""
    
    vulnerabilities = []
    
    # Test 1: Manipulation du prix
    try:
        response = requests.post("http://localhost:3000/api/cart/items", json={
            "productId": "product-1",
            "quantity": 1,
            "price": 0.01  # Prix manipulé
        }, headers=auth_headers)
        
        if response.status_code == 201:
            vulnerabilities.append({
                "type": "Price Manipulation",
                "severity": "High",
                "description": "Client can manipulate product prices"
            })
    except:
        pass
    
    # Test 2: Quantité négative
    try:
        response = requests.post("http://localhost:3000/api/cart/items", json={
            "productId": "product-1",
            "quantity": -10  # Quantité négative
        }, headers=auth_headers)
        
        if response.status_code == 201:
            vulnerabilities.append({
                "type": "Negative Quantity",
                "severity": "Medium",
                "description": "Negative quantities accepted"
            })
    except:
        pass
    
    # Test 3: Accès aux commandes d'autres utilisateurs
    try:
        # Créer une commande avec l'utilisateur A
        order_response = requests.post("http://localhost:3000/api/orders", 
                                     json={"items": [{"productId": "product-1", "quantity": 1}]},
                                     headers=auth_headers_user_a)
        order_id = order_response.json()["id"]
        
        # Tenter d'accéder avec l'utilisateur B
        access_response = requests.get(f"http://localhost:3000/api/orders/{order_id}",
                                     headers=auth_headers_user_b)
        
        if access_response.status_code == 200:
            vulnerabilities.append({
                "type": "Insecure Direct Object Reference",
                "severity": "High",
                "description": "Users can access other users' orders"
            })
    except:
        pass
    
    return vulnerabilities
```

### Test de Session Management
```python
def test_session_management():
    """Tester la gestion des sessions"""
    
    issues = []
    
    # Test 1: Session fixation
    # Obtenir un token avant connexion
    pre_login_response = requests.get("http://localhost:3000/api/session")
    pre_login_token = pre_login_response.cookies.get('sessionId')
    
    # Se connecter
    login_response = requests.post("http://localhost:3000/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    }, cookies={'sessionId': pre_login_token})
    
    post_login_token = login_response.cookies.get('sessionId')
    
    if pre_login_token == post_login_token:
        issues.append({
            "type": "Session Fixation",
            "severity": "Medium",
            "description": "Session ID not regenerated after login"
        })
    
    # Test 2: Session timeout
    # Attendre et tester si la session expire
    time.sleep(3600)  # 1 heure
    
    protected_response = requests.get("http://localhost:3000/api/user/profile",
                                    cookies={'sessionId': post_login_token})
    
    if protected_response.status_code == 200:
        issues.append({
            "type": "No Session Timeout",
            "severity": "Medium",
            "description": "Sessions do not expire"
        })
    
    return issues
```

## Intégration CI/CD

### Pipeline GitHub Actions
```yaml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Weekly full scan

jobs:
  security-baseline:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Start Application
      run: |
        docker-compose up -d
        sleep 30
    
    - name: ZAP Baseline Scan
      uses: zaproxy/action-baseline@v0.7.0
      with:
        target: 'http://localhost:3000'
        rules_file_name: '.zap/rules.tsv'
        cmd_options: '-a'
    
    - name: Upload ZAP Results
      uses: actions/upload-artifact@v3
      with:
        name: zap-baseline-report
        path: report_html.html

  security-full-scan:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
    - uses: actions/checkout@v3
    
    - name: Start Application
      run: |
        docker-compose up -d
        sleep 30
    
    - name: ZAP Full Scan
      uses: zaproxy/action-full-scan@v0.4.0
      with:
        target: 'http://localhost:3000'
        rules_file_name: '.zap/rules.tsv'
        cmd_options: '-a'
    
    - name: Create Security Issue
      if: failure()
      uses: actions/github-script@v6
      with:
        script: |
          github.rest.issues.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: '🚨 Security vulnerabilities detected',
            body: 'ZAP full scan detected security vulnerabilities. Please review the scan results.',
            labels: ['security', 'bug']
          });
```

### Seuils de Sécurité
```python
# Configuration des seuils d'acceptation
SECURITY_THRESHOLDS = {
    'critical': 0,      # Aucune vulnérabilité critique acceptée
    'high': 2,          # Maximum 2 vulnérabilités hautes
    'medium': 10,       # Maximum 10 vulnérabilités moyennes
    'low': 50,          # Maximum 50 vulnérabilités faibles
    'info': 100         # Maximum 100 informations
}

def evaluate_scan_results(scan_results):
    """Évaluer les résultats du scan selon les seuils"""
    
    severity_counts = {
        'critical': 0,
        'high': 0,
        'medium': 0,
        'low': 0,
        'info': 0
    }
    
    # Compter les vulnérabilités par sévérité
    for alert in scan_results.get('alerts', []):
        severity = alert.get('risk', '').lower()
        if severity in severity_counts:
            severity_counts[severity] += 1
    
    # Vérifier les seuils
    failures = []
    for severity, count in severity_counts.items():
        threshold = SECURITY_THRESHOLDS[severity]
        if count > threshold:
            failures.append(f"{severity.title()}: {count} > {threshold}")
    
    if failures:
        print(f"❌ Security scan failed: {', '.join(failures)}")
        return False
    else:
        print("✅ Security scan passed all thresholds")
        return True
```

## Rapports et Métriques

### Dashboard de Sécurité
- **Tendances des vulnérabilités** : Évolution dans le temps
- **Couverture des tests** : Endpoints testés vs total
- **Temps de correction** : MTTR par type de vulnérabilité
- **Score de sécurité** : Métrique globale

### Métriques Clés
- **Vulnérabilités critiques** : 0 (objectif)
- **Temps de scan baseline** : < 10 minutes
- **Temps de scan complet** : < 60 minutes
- **Faux positifs** : < 5%
- **Couverture** : > 95% des endpoints

### Rapports Automatisés
- **Rapport exécutif** : Synthèse pour le management
- **Rapport technique** : Détails pour les développeurs
- **Rapport de conformité** : Pour les audits
- **Tendances** : Évolution mensuelle

## Bonnes Pratiques Implémentées

### Sécurité par Conception
1. **Validation des entrées** : Toutes les données utilisateur
2. **Principe du moindre privilège** : Accès minimal nécessaire
3. **Défense en profondeur** : Multiples couches de sécurité
4. **Fail secure** : Échec sécurisé par défaut

### Processus de Correction
1. **Triage** : Classification par impact et exploitabilité
2. **Priorisation** : Correction selon la criticité
3. **Validation** : Tests de non-régression
4. **Documentation** : Mise à jour des procédures

### Formation Équipe
1. **Sensibilisation** : OWASP Top 10, bonnes pratiques
2. **Code review** : Focus sécurité
3. **Threat modeling** : Analyse des menaces
4. **Incident response** : Procédures d'urgence