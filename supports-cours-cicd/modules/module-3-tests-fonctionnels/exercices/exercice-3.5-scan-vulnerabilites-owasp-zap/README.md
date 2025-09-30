# Exercice 3.5 - Scan de Vulnérabilités avec OWASP ZAP

## Objectifs

- Configurer et utiliser OWASP ZAP pour les tests de sécurité automatisés
- Implémenter des scans de vulnérabilités dans un pipeline CI/CD
- Analyser et interpréter les rapports de sécurité
- Configurer des tests de sécurité personnalisés
- Intégrer les tests de sécurité dans le processus de développement

## Contexte

Vous devez sécuriser l'API e-commerce en identifiant et corrigeant les vulnérabilités de sécurité. Les tests couvriront :
- Vulnérabilités OWASP Top 10
- Tests d'authentification et d'autorisation
- Injection SQL et XSS
- Configuration de sécurité
- Tests de session et de cookies

## Prérequis

- OWASP ZAP installé
- Docker et Docker Compose
- Application e-commerce démarrée
- Connaissances de base en sécurité web

## Matériel Fourni

- Configuration OWASP ZAP
- Scripts d'automatisation
- Rapports de sécurité templates
- Règles de scan personnalisées

## Instructions

### Étape 1 : Installation et Configuration d'OWASP ZAP

#### 1.1 Installation via Docker

```bash
# Télécharger l'image OWASP ZAP
docker pull owasp/zap2docker-stable

# Démarrer ZAP en mode daemon
docker run -d --name zap-daemon \
  -p 8090:8080 \
  -v $(pwd)/zap-reports:/zap/wrk \
  owasp/zap2docker-stable \
  zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true

# Vérifier que ZAP est démarré
curl http://localhost:8090/JSON/core/view/version/
```

#### 1.2 Configuration Docker Compose

Créez `docker-compose.security.yml` :

```yaml
version: '3.8'

services:
  zap:
    image: owasp/zap2docker-stable
    container_name: owasp-zap
    ports:
      - "8090:8080"
    volumes:
      - ./security/zap-config:/zap/config
      - ./security/zap-reports:/zap/wrk
      - ./security/zap-scripts:/zap/scripts
    command: >
      zap.sh -daemon 
      -host 0.0.0.0 
      -port 8080 
      -config api.addrs.addr.name=.* 
      -config api.addrs.addr.regex=true
      -config api.key=changeme123
    networks:
      - security-net

  zap-baseline:
    image: owasp/zap2docker-stable
    volumes:
      - ./security/zap-reports:/zap/wrk
    command: >
      zap-baseline.py 
      -t http://host.docker.internal:3000 
      -r baseline-report.html 
      -x baseline-report.xml
    depends_on:
      - zap
    networks:
      - security-net

networks:
  security-net:
    driver: bridge
```

### Étape 2 : Configuration des Tests de Base

#### 2.1 Script de Scan Automatisé

Créez `security/scripts/automated-scan.py` :

```python
#!/usr/bin/env python3

import time
import requests
import json
import sys
from zapv2 import ZAPv2

class ZAPSecurityScanner:
    def __init__(self, zap_url='http://localhost:8090', api_key='changeme123'):
        self.zap = ZAPv2(proxies={'http': zap_url, 'https': zap_url}, apikey=api_key)
        self.target_url = 'http://host.docker.internal:3000'
        
    def wait_for_zap(self, timeout=300):
        """Attendre que ZAP soit prêt"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                version = self.zap.core.version
                print(f"ZAP is ready. Version: {version}")
                return True
            except:
                print("Waiting for ZAP to start...")
                time.sleep(5)
        return False
        
    def configure_authentication(self):
        """Configurer l'authentification pour les tests"""
        # Créer un contexte pour l'application
        context_name = "EcommerceApp"
        context_id = self.zap.context.new_context(context_name)
        
        # Inclure l'URL dans le contexte
        self.zap.context.include_in_context(context_name, f"{self.target_url}.*")
        
        # Configurer l'authentification par formulaire
        login_url = f"{self.target_url}/api/auth/login"
        self.zap.authentication.set_authentication_method(
            contextid=context_id,
            authmethodname='formBasedAuthentication',
            authmethodconfigparams=f'loginUrl={login_url}&loginRequestData=email%3Dtest%40example.com%26password%3Dpassword123'
        )
        
        # Créer un utilisateur de test
        user_id = self.zap.users.new_user(context_id, "testuser")
        self.zap.users.set_authentication_credentials(
            context_id, user_id, 
            "email=test@example.com&password=password123"
        )
        self.zap.users.set_user_enabled(context_id, user_id, True)
        
        return context_id, user_id
        
    def spider_scan(self):
        """Effectuer un scan spider pour découvrir les URLs"""
        print("Starting spider scan...")
        
        # Démarrer le spider
        scan_id = self.zap.spider.scan(self.target_url)
        
        # Attendre la fin du scan
        while int(self.zap.spider.status(scan_id)) < 100:
            print(f"Spider progress: {self.zap.spider.status(scan_id)}%")
            time.sleep(2)
            
        print("Spider scan completed")
        
        # Afficher les URLs découvertes
        urls = self.zap.spider.results(scan_id)
        print(f"Found {len(urls)} URLs:")
        for url in urls[:10]:  # Afficher les 10 premières
            print(f"  - {url}")
            
        return urls
        
    def active_scan(self, context_id=None, user_id=None):
        """Effectuer un scan actif pour détecter les vulnérabilités"""
        print("Starting active scan...")
        
        # Configurer les politiques de scan
        self.configure_scan_policy()
        
        # Démarrer le scan actif
        if context_id and user_id:
            scan_id = self.zap.ascan.scan_as_user(
                self.target_url, context_id, user_id, recurse=True
            )
        else:
            scan_id = self.zap.ascan.scan(self.target_url)
        
        # Attendre la fin du scan
        while int(self.zap.ascan.status(scan_id)) < 100:
            print(f"Active scan progress: {self.zap.ascan.status(scan_id)}%")
            time.sleep(10)
            
        print("Active scan completed")
        return scan_id
        
    def configure_scan_policy(self):
        """Configurer les politiques de scan"""
        # Créer une politique personnalisée
        policy_name = "EcommerceScanPolicy"
        
        # Activer les règles importantes
        important_rules = [
            '40012',  # Cross Site Scripting (Reflected)
            '40014',  # Cross Site Scripting (Persistent)
            '40018',  # SQL Injection
            '40019',  # SQL Injection - MySQL
            '40020',  # SQL Injection - Hypersonic SQL
            '40021',  # SQL Injection - Oracle
            '40022',  # SQL Injection - PostgreSQL
            '90019',  # Server Side Code Injection
            '90020',  # Remote OS Command Injection
            '10202',  # Absence of Anti-CSRF Tokens
            '10010',  # Cookie No HttpOnly Flag
            '10011',  # Cookie Without Secure Flag
        ]
        
        for rule_id in important_rules:
            try:
                self.zap.ascan.set_scanner_alert_threshold(rule_id, 'LOW')
                self.zap.ascan.enable_scanners(rule_id)
            except:
                print(f"Could not configure rule {rule_id}")
                
    def passive_scan_wait(self):
        """Attendre la fin du scan passif"""
        print("Waiting for passive scan to complete...")
        
        while int(self.zap.pscan.records_to_scan) > 0:
            print(f"Passive scan queue: {self.zap.pscan.records_to_scan}")
            time.sleep(2)
            
        print("Passive scan completed")
        
    def generate_reports(self):
        """Générer les rapports de sécurité"""
        print("Generating security reports...")
        
        # Rapport HTML
        html_report = self.zap.core.htmlreport()
        with open('/zap/wrk/security-report.html', 'w') as f:
            f.write(html_report)
            
        # Rapport XML
        xml_report = self.zap.core.xmlreport()
        with open('/zap/wrk/security-report.xml', 'w') as f:
            f.write(xml_report)
            
        # Rapport JSON
        json_report = self.zap.core.jsonreport()
        with open('/zap/wrk/security-report.json', 'w') as f:
            f.write(json_report)
            
        # Résumé des alertes
        alerts = self.zap.core.alerts()
        self.generate_summary_report(alerts)
        
        print("Reports generated successfully")
        
    def generate_summary_report(self, alerts):
        """Générer un rapport de résumé"""
        summary = {
            'total_alerts': len(alerts),
            'high_risk': len([a for a in alerts if a['risk'] == 'High']),
            'medium_risk': len([a for a in alerts if a['risk'] == 'Medium']),
            'low_risk': len([a for a in alerts if a['risk'] == 'Low']),
            'info_risk': len([a for a in alerts if a['risk'] == 'Informational']),
            'alerts_by_type': {}
        }
        
        # Grouper par type d'alerte
        for alert in alerts:
            alert_name = alert['alert']
            if alert_name not in summary['alerts_by_type']:
                summary['alerts_by_type'][alert_name] = {
                    'count': 0,
                    'risk': alert['risk'],
                    'confidence': alert['confidence']
                }
            summary['alerts_by_type'][alert_name]['count'] += 1
            
        # Sauvegarder le résumé
        with open('/zap/wrk/security-summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
            
        # Afficher le résumé
        print("\n=== SECURITY SCAN SUMMARY ===")
        print(f"Total alerts: {summary['total_alerts']}")
        print(f"High risk: {summary['high_risk']}")
        print(f"Medium risk: {summary['medium_risk']}")
        print(f"Low risk: {summary['low_risk']}")
        print(f"Informational: {summary['info_risk']}")
        
        if summary['high_risk'] > 0:
            print("\n⚠️  HIGH RISK VULNERABILITIES FOUND!")
            return False
        elif summary['medium_risk'] > 5:
            print("\n⚠️  TOO MANY MEDIUM RISK VULNERABILITIES!")
            return False
        else:
            print("\n✅ Security scan passed")
            return True
            
    def run_full_scan(self):
        """Exécuter un scan complet"""
        if not self.wait_for_zap():
            print("Failed to connect to ZAP")
            return False
            
        try:
            # Configuration de l'authentification
            context_id, user_id = self.configure_authentication()
            
            # Spider scan
            self.spider_scan()
            
            # Attendre le scan passif
            self.passive_scan_wait()
            
            # Scan actif
            self.active_scan(context_id, user_id)
            
            # Générer les rapports
            success = self.generate_reports()
            
            return success
            
        except Exception as e:
            print(f"Error during scan: {e}")
            return False

if __name__ == "__main__":
    scanner = ZAPSecurityScanner()
    success = scanner.run_full_scan()
    sys.exit(0 if success else 1)
```

#### 2.2 Configuration des Tests Spécifiques

Créez `security/zap-config/policies/ecommerce-policy.policy` :

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<configuration>
    <policy>
        <name>E-commerce Security Policy</name>
        <desc>Custom security policy for e-commerce applications</desc>
        <scanner>
            <level>MEDIUM</level>
            <strength>MEDIUM</strength>
        </scanner>
        
        <!-- SQL Injection Tests -->
        <pluginid id="40018">
            <level>HIGH</level>
            <strength>HIGH</strength>
        </pluginid>
        
        <!-- XSS Tests -->
        <pluginid id="40012">
            <level>HIGH</level>
            <strength>HIGH</strength>
        </pluginid>
        
        <!-- Authentication Tests -->
        <pluginid id="10202">
            <level>MEDIUM</level>
            <strength>MEDIUM</strength>
        </pluginid>
        
        <!-- Session Management -->
        <pluginid id="10010">
            <level>HIGH</level>
            <strength>HIGH</strength>
        </pluginid>
        
        <!-- HTTPS Configuration -->
        <pluginid id="10011">
            <level>HIGH</level>
            <strength>HIGH</strength>
        </pluginid>
    </policy>
</configuration>
```

### Étape 3 : Tests de Sécurité Spécialisés

#### 3.1 Tests d'Authentification

Créez `security/scripts/auth-tests.py` :

```python
#!/usr/bin/env python3

import requests
import json
import time

class AuthenticationTester:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
        self.session = requests.Session()
        
    def test_weak_passwords(self):
        """Tester les mots de passe faibles"""
        weak_passwords = [
            'password', '123456', 'admin', 'test', 'qwerty',
            'password123', 'admin123', '12345678'
        ]
        
        results = []
        
        for password in weak_passwords:
            try:
                response = self.session.post(f"{self.base_url}/auth/register", json={
                    'name': 'Test User',
                    'email': f'test_{password}@example.com',
                    'password': password
                })
                
                if response.status_code == 201:
                    results.append({
                        'password': password,
                        'accepted': True,
                        'vulnerability': 'Weak password accepted'
                    })
                else:
                    results.append({
                        'password': password,
                        'accepted': False,
                        'message': 'Password rejected (good)'
                    })
                    
            except Exception as e:
                results.append({
                    'password': password,
                    'error': str(e)
                })
                
        return results
        
    def test_brute_force_protection(self):
        """Tester la protection contre les attaques par force brute"""
        login_url = f"{self.base_url}/auth/login"
        
        # Tenter plusieurs connexions échouées
        failed_attempts = []
        
        for i in range(10):
            try:
                response = self.session.post(login_url, json={
                    'email': 'test@example.com',
                    'password': f'wrongpassword{i}'
                })
                
                failed_attempts.append({
                    'attempt': i + 1,
                    'status_code': response.status_code,
                    'response_time': response.elapsed.total_seconds()
                })
                
                # Vérifier si un délai est imposé
                if response.status_code == 429:  # Too Many Requests
                    return {
                        'protected': True,
                        'attempts_before_block': i + 1,
                        'message': 'Brute force protection active'
                    }
                    
            except Exception as e:
                failed_attempts.append({
                    'attempt': i + 1,
                    'error': str(e)
                })
                
        return {
            'protected': False,
            'attempts': failed_attempts,
            'vulnerability': 'No brute force protection detected'
        }
        
    def test_session_management(self):
        """Tester la gestion des sessions"""
        # Se connecter pour obtenir un token
        login_response = self.session.post(f"{self.base_url}/auth/login", json={
            'email': 'test@example.com',
            'password': 'password123'
        })
        
        if login_response.status_code != 200:
            return {'error': 'Could not login for session test'}
            
        token = login_response.json().get('token')
        headers = {'Authorization': f'Bearer {token}'}
        
        results = {}
        
        # Test 1: Vérifier l'expiration du token
        # (Simuler en attendant ou en modifiant le token)
        
        # Test 2: Tester avec un token modifié
        modified_token = token[:-5] + 'XXXXX'
        modified_headers = {'Authorization': f'Bearer {modified_token}'}
        
        protected_response = self.session.get(
            f"{self.base_url}/cart", 
            headers=modified_headers
        )
        
        results['token_validation'] = {
            'modified_token_rejected': protected_response.status_code == 401,
            'status_code': protected_response.status_code
        }
        
        # Test 3: Tester l'accès sans token
        no_token_response = self.session.get(f"{self.base_url}/cart")
        
        results['authorization_required'] = {
            'no_token_rejected': no_token_response.status_code == 401,
            'status_code': no_token_response.status_code
        }
        
        return results
        
    def run_all_tests(self):
        """Exécuter tous les tests d'authentification"""
        print("Running authentication security tests...")
        
        results = {
            'weak_passwords': self.test_weak_passwords(),
            'brute_force_protection': self.test_brute_force_protection(),
            'session_management': self.test_session_management()
        }
        
        # Sauvegarder les résultats
        with open('/zap/wrk/auth-test-results.json', 'w') as f:
            json.dump(results, f, indent=2)
            
        return results

if __name__ == "__main__":
    tester = AuthenticationTester()
    results = tester.run_all_tests()
    print(json.dumps(results, indent=2))
```

#### 3.2 Tests d'Injection

Créez `security/scripts/injection-tests.py` :

```python
#!/usr/bin/env python3

import requests
import json
import urllib.parse

class InjectionTester:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
        self.session = requests.Session()
        
    def get_auth_token(self):
        """Obtenir un token d'authentification"""
        response = self.session.post(f"{self.base_url}/auth/login", json={
            'email': 'test@example.com',
            'password': 'password123'
        })
        
        if response.status_code == 200:
            return response.json().get('token')
        return None
        
    def test_sql_injection(self):
        """Tester les injections SQL"""
        sql_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --",
            "admin'--",
            "admin' #",
            "admin'/*",
            "' or 1=1#",
            "' or 1=1--",
            "' or 1=1/*",
            "') or '1'='1--",
            "') or ('1'='1--"
        ]
        
        results = []
        
        # Test sur l'endpoint de connexion
        for payload in sql_payloads:
            try:
                response = self.session.post(f"{self.base_url}/auth/login", json={
                    'email': payload,
                    'password': 'test'
                })
                
                # Analyser la réponse pour détecter des signes d'injection
                is_vulnerable = (
                    response.status_code == 200 or
                    'syntax error' in response.text.lower() or
                    'mysql' in response.text.lower() or
                    'postgresql' in response.text.lower() or
                    'sqlite' in response.text.lower()
                )
                
                results.append({
                    'payload': payload,
                    'status_code': response.status_code,
                    'vulnerable': is_vulnerable,
                    'response_length': len(response.text)
                })
                
            except Exception as e:
                results.append({
                    'payload': payload,
                    'error': str(e)
                })
                
        # Test sur l'endpoint de recherche de produits
        for payload in sql_payloads:
            try:
                encoded_payload = urllib.parse.quote(payload)
                response = self.session.get(f"{self.base_url}/products/search?q={encoded_payload}")
                
                is_vulnerable = (
                    'syntax error' in response.text.lower() or
                    'mysql' in response.text.lower() or
                    'postgresql' in response.text.lower() or
                    response.status_code == 500
                )
                
                results.append({
                    'endpoint': 'search',
                    'payload': payload,
                    'status_code': response.status_code,
                    'vulnerable': is_vulnerable
                })
                
            except Exception as e:
                results.append({
                    'endpoint': 'search',
                    'payload': payload,
                    'error': str(e)
                })
                
        return results
        
    def test_xss_injection(self):
        """Tester les injections XSS"""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "';alert('XSS');//",
            "<iframe src=javascript:alert('XSS')></iframe>",
            "<body onload=alert('XSS')>",
            "<input onfocus=alert('XSS') autofocus>",
            "<select onfocus=alert('XSS') autofocus>",
            "<textarea onfocus=alert('XSS') autofocus>"
        ]
        
        results = []
        token = self.get_auth_token()
        headers = {'Authorization': f'Bearer {token}'} if token else {}
        
        # Test sur les champs de profil utilisateur
        for payload in xss_payloads:
            try:
                # Test sur le nom d'utilisateur
                response = self.session.put(f"{self.base_url}/user/profile", 
                    json={'name': payload}, 
                    headers=headers
                )
                
                # Vérifier si le payload est reflété sans échappement
                is_vulnerable = (
                    payload in response.text and
                    '&lt;' not in response.text and
                    '&gt;' not in response.text
                )
                
                results.append({
                    'field': 'name',
                    'payload': payload,
                    'status_code': response.status_code,
                    'vulnerable': is_vulnerable,
                    'reflected': payload in response.text
                })
                
            except Exception as e:
                results.append({
                    'field': 'name',
                    'payload': payload,
                    'error': str(e)
                })
                
        # Test sur les commentaires de produits
        for payload in xss_payloads:
            try:
                response = self.session.post(f"{self.base_url}/products/1/comments", 
                    json={'comment': payload}, 
                    headers=headers
                )
                
                is_vulnerable = (
                    response.status_code == 201 and
                    payload in response.text and
                    '&lt;' not in response.text
                )
                
                results.append({
                    'field': 'comment',
                    'payload': payload,
                    'status_code': response.status_code,
                    'vulnerable': is_vulnerable
                })
                
            except Exception as e:
                results.append({
                    'field': 'comment',
                    'payload': payload,
                    'error': str(e)
                })
                
        return results
        
    def test_command_injection(self):
        """Tester les injections de commandes"""
        command_payloads = [
            "; ls -la",
            "| whoami",
            "&& cat /etc/passwd",
            "; cat /etc/hosts",
            "| id",
            "&& pwd",
            "; uname -a",
            "| ps aux",
            "&& env",
            "; netstat -an"
        ]
        
        results = []
        
        # Test sur les endpoints qui pourraient exécuter des commandes
        # (par exemple, génération de rapports, export de données)
        
        for payload in command_payloads:
            try:
                # Test sur un endpoint de génération de rapport
                response = self.session.get(f"{self.base_url}/reports/export?format={payload}")
                
                # Rechercher des signes d'exécution de commande
                command_indicators = [
                    'root:', 'bin:', 'daemon:', '/bin/', '/usr/',
                    'uid=', 'gid=', 'groups=',
                    'total ', 'drwx', '-rw-'
                ]
                
                is_vulnerable = any(indicator in response.text for indicator in command_indicators)
                
                results.append({
                    'payload': payload,
                    'status_code': response.status_code,
                    'vulnerable': is_vulnerable,
                    'response_length': len(response.text)
                })
                
            except Exception as e:
                results.append({
                    'payload': payload,
                    'error': str(e)
                })
                
        return results
        
    def run_all_tests(self):
        """Exécuter tous les tests d'injection"""
        print("Running injection security tests...")
        
        results = {
            'sql_injection': self.test_sql_injection(),
            'xss_injection': self.test_xss_injection(),
            'command_injection': self.test_command_injection()
        }
        
        # Analyser les résultats
        vulnerabilities_found = []
        
        for test_type, test_results in results.items():
            for result in test_results:
                if result.get('vulnerable', False):
                    vulnerabilities_found.append({
                        'type': test_type,
                        'payload': result.get('payload'),
                        'field': result.get('field'),
                        'endpoint': result.get('endpoint')
                    })
                    
        results['summary'] = {
            'total_vulnerabilities': len(vulnerabilities_found),
            'vulnerabilities': vulnerabilities_found
        }
        
        # Sauvegarder les résultats
        with open('/zap/wrk/injection-test-results.json', 'w') as f:
            json.dump(results, f, indent=2)
            
        return results

if __name__ == "__main__":
    tester = InjectionTester()
    results = tester.run_all_tests()
    print(json.dumps(results['summary'], indent=2))
```

### Étape 4 : Intégration CI/CD

#### 4.1 Pipeline GitHub Actions

Créez `.github/workflows/security-scan.yml` :

```yaml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Tous les lundis à 2h du matin

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ecommerce_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Start application
      run: |
        npm run build
        npm start &
        sleep 30
        curl --retry 10 --retry-delay 5 http://localhost:3000/api/health
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ecommerce_test
    
    - name: Start OWASP ZAP
      run: |
        docker run -d --name zap \
          --network host \
          -v ${{ github.workspace }}/security/zap-reports:/zap/wrk \
          owasp/zap2docker-stable \
          zap.sh -daemon -host 0.0.0.0 -port 8090 \
          -config api.addrs.addr.name=.* \
          -config api.addrs.addr.regex=true \
          -config api.key=changeme123
        
        # Attendre que ZAP soit prêt
        sleep 30
        curl --retry 10 --retry-delay 5 http://localhost:8090/JSON/core/view/version/
    
    - name: Run baseline security scan
      run: |
        docker run --rm \
          --network host \
          -v ${{ github.workspace }}/security/zap-reports:/zap/wrk \
          owasp/zap2docker-stable \
          zap-baseline.py \
          -t http://localhost:3000 \
          -r baseline-report.html \
          -x baseline-report.xml \
          -J baseline-report.json \
          -a
    
    - name: Run custom security tests
      run: |
        # Installer les dépendances Python
        pip install requests python-owasp-zap-v2.4
        
        # Exécuter les tests personnalisés
        python security/scripts/automated-scan.py
        python security/scripts/auth-tests.py
        python security/scripts/injection-tests.py
    
    - name: Run full ZAP scan
      run: |
        docker run --rm \
          --network host \
          -v ${{ github.workspace }}/security/zap-reports:/zap/wrk \
          -v ${{ github.workspace }}/security/zap-config:/zap/config \
          owasp/zap2docker-stable \
          zap-full-scan.py \
          -t http://localhost:3000 \
          -r full-scan-report.html \
          -x full-scan-report.xml \
          -J full-scan-report.json \
          -z "-configfile /zap/config/policies/ecommerce-policy.policy"
    
    - name: Analyze security results
      run: |
        # Analyser les résultats et définir les seuils
        python << 'EOF'
        import json
        import sys
        
        # Charger les résultats du scan
        try:
            with open('security/zap-reports/baseline-report.json', 'r') as f:
                baseline_results = json.load(f)
        except:
            print("Could not load baseline results")
            sys.exit(1)
        
        # Compter les vulnérabilités par niveau de risque
        high_risk = len([alert for alert in baseline_results.get('site', [{}])[0].get('alerts', []) if alert.get('riskdesc', '').startswith('High')])
        medium_risk = len([alert for alert in baseline_results.get('site', [{}])[0].get('alerts', []) if alert.get('riskdesc', '').startswith('Medium')])
        
        print(f"High risk vulnerabilities: {high_risk}")
        print(f"Medium risk vulnerabilities: {medium_risk}")
        
        # Définir les seuils d'échec
        if high_risk > 0:
            print("❌ SECURITY SCAN FAILED: High risk vulnerabilities found!")
            sys.exit(1)
        elif medium_risk > 5:
            print("❌ SECURITY SCAN FAILED: Too many medium risk vulnerabilities!")
            sys.exit(1)
        else:
            print("✅ Security scan passed")
            sys.exit(0)
        EOF
    
    - name: Upload security reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: security-reports
        path: |
          security/zap-reports/
          
    - name: Comment PR with security results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          
          try {
            const summaryPath = 'security/zap-reports/security-summary.json';
            if (fs.existsSync(summaryPath)) {
              const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
              
              const comment = `## 🔒 Security Scan Results
              
              | Risk Level | Count |
              |------------|-------|
              | High | ${summary.high_risk} |
              | Medium | ${summary.medium_risk} |
              | Low | ${summary.low_risk} |
              | Info | ${summary.info_risk} |
              
              **Total Alerts:** ${summary.total_alerts}
              
              ${summary.high_risk > 0 ? '❌ **Action Required:** High risk vulnerabilities found!' : '✅ No high risk vulnerabilities detected'}
              
              [View detailed report](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})`;
              
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }
          } catch (error) {
            console.log('Could not post security summary:', error);
          }
    
    - name: Notify security team
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        text: '🚨 Security vulnerabilities detected in ${{ github.repository }}!'
        webhook_url: ${{ secrets.SECURITY_SLACK_WEBHOOK }}

  dependency-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high --fail-on=upgradable
        
    - name: Upload Snyk results
      uses: github/codeql-action/upload-sarif@v2
      if: always()
      with:
        sarif_file: snyk.sarif
```

#### 4.2 Script de Validation Locale

Créez `security/scripts/validate-security.sh` :

```bash
#!/bin/bash

set -e

echo "🔒 Starting local security validation..."

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Créer les dossiers nécessaires
mkdir -p security/zap-reports

# Fonction pour vérifier si un service est en cours d'exécution
check_service() {
    local url=$1
    local service_name=$2
    
    echo "Checking $service_name..."
    if curl -s -f "$url" > /dev/null; then
        echo -e "${GREEN}✅ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not accessible${NC}"
        return 1
    fi
}

# Vérifier que l'application est en cours d'exécution
if ! check_service "http://localhost:3000/api/health" "E-commerce API"; then
    echo "Please start the application first: npm start"
    exit 1
fi

# Démarrer OWASP ZAP si nécessaire
if ! check_service "http://localhost:8090/JSON/core/view/version/" "OWASP ZAP"; then
    echo "Starting OWASP ZAP..."
    docker run -d --name zap-security-test \
        -p 8090:8080 \
        -v $(pwd)/security/zap-reports:/zap/wrk \
        owasp/zap2docker-stable \
        zap.sh -daemon -host 0.0.0.0 -port 8080 \
        -config api.addrs.addr.name=.* \
        -config api.addrs.addr.regex=true \
        -config api.key=changeme123
    
    # Attendre que ZAP soit prêt
    echo "Waiting for ZAP to start..."
    for i in {1..30}; do
        if check_service "http://localhost:8090/JSON/core/view/version/" "OWASP ZAP"; then
            break
        fi
        sleep 2
    done
fi

# Exécuter le scan de base
echo -e "${YELLOW}🔍 Running baseline security scan...${NC}"
docker run --rm \
    --network host \
    -v $(pwd)/security/zap-reports:/zap/wrk \
    owasp/zap2docker-stable \
    zap-baseline.py \
    -t http://localhost:3000 \
    -r baseline-report.html \
    -x baseline-report.xml \
    -J baseline-report.json \
    -a || echo "Baseline scan completed with findings"

# Exécuter les tests personnalisés
echo -e "${YELLOW}🧪 Running custom security tests...${NC}"

# Installer les dépendances Python si nécessaire
if ! python3 -c "import zapv2" 2>/dev/null; then
    echo "Installing Python dependencies..."
    pip3 install python-owasp-zap-v2.4 requests
fi

# Exécuter les tests d'authentification
echo "Running authentication tests..."
python3 security/scripts/auth-tests.py

# Exécuter les tests d'injection
echo "Running injection tests..."
python3 security/scripts/injection-tests.py

# Analyser les résultats
echo -e "${YELLOW}📊 Analyzing results...${NC}"

python3 << 'EOF'
import json
import os

def analyze_results():
    reports_dir = 'security/zap-reports'
    
    # Analyser le rapport de base
    baseline_file = os.path.join(reports_dir, 'baseline-report.json')
    if os.path.exists(baseline_file):
        with open(baseline_file, 'r') as f:
            baseline = json.load(f)
            
        alerts = baseline.get('site', [{}])[0].get('alerts', [])
        
        high_risk = len([a for a in alerts if a.get('riskdesc', '').startswith('High')])
        medium_risk = len([a for a in alerts if a.get('riskdesc', '').startswith('Medium')])
        low_risk = len([a for a in alerts if a.get('riskdesc', '').startswith('Low')])
        info_risk = len([a for a in alerts if a.get('riskdesc', '').startswith('Informational')])
        
        print(f"\n📋 SECURITY SCAN SUMMARY")
        print(f"{'='*40}")
        print(f"High Risk:    {high_risk}")
        print(f"Medium Risk:  {medium_risk}")
        print(f"Low Risk:     {low_risk}")
        print(f"Info:         {info_risk}")
        print(f"Total:        {len(alerts)}")
        
        if high_risk > 0:
            print(f"\n❌ HIGH RISK VULNERABILITIES FOUND!")
            for alert in alerts:
                if alert.get('riskdesc', '').startswith('High'):
                    print(f"  - {alert.get('name', 'Unknown')}: {alert.get('desc', 'No description')}")
            return False
        elif medium_risk > 5:
            print(f"\n⚠️  TOO MANY MEDIUM RISK VULNERABILITIES!")
            return False
        else:
            print(f"\n✅ Security scan passed")
            return True
    else:
        print("❌ No baseline report found")
        return False

# Analyser les tests d'authentification
auth_file = 'security/zap-reports/auth-test-results.json'
if os.path.exists(auth_file):
    with open(auth_file, 'r') as f:
        auth_results = json.load(f)
    
    print(f"\n🔐 AUTHENTICATION TEST RESULTS")
    print(f"{'='*40}")
    
    # Vérifier les mots de passe faibles
    weak_passwords = auth_results.get('weak_passwords', [])
    accepted_weak = [p for p in weak_passwords if p.get('accepted', False)]
    
    if accepted_weak:
        print(f"❌ Weak passwords accepted: {len(accepted_weak)}")
        for pwd in accepted_weak:
            print(f"  - {pwd['password']}")
    else:
        print(f"✅ Weak password protection: OK")
    
    # Vérifier la protection contre la force brute
    brute_force = auth_results.get('brute_force_protection', {})
    if brute_force.get('protected', False):
        print(f"✅ Brute force protection: OK")
    else:
        print(f"❌ No brute force protection detected")

success = analyze_results()
exit(0 if success else 1)
EOF

ANALYSIS_RESULT=$?

# Nettoyer
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
docker stop zap-security-test 2>/dev/null || true
docker rm zap-security-test 2>/dev/null || true

# Afficher les résultats finaux
if [ $ANALYSIS_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Security validation passed!${NC}"
    echo "Reports available in: security/zap-reports/"
else
    echo -e "${RED}❌ Security validation failed!${NC}"
    echo "Please review the security reports and fix the vulnerabilities."
    exit 1
fi
```

## Résultat Attendu

À la fin de cet exercice, vous devriez avoir :

1. **Configuration OWASP ZAP complète** avec :
   - Scan automatisé configuré
   - Politiques de sécurité personnalisées
   - Tests d'authentification et d'autorisation

2. **Tests de sécurité spécialisés** incluant :
   - Tests d'injection SQL et XSS
   - Tests d'authentification
   - Tests de gestion de session
   - Tests de configuration

3. **Rapports de sécurité détaillés** avec :
   - Analyse des vulnérabilités par niveau de risque
   - Recommandations de correction
   - Métriques de sécurité

4. **Intégration CI/CD** avec :
   - Scans automatiques sur chaque commit
   - Seuils de sécurité configurables
   - Notifications d'alerte

## Critères de Validation

- [ ] OWASP ZAP configuré et fonctionnel
- [ ] Scans de sécurité automatisés
- [ ] Tests personnalisés implémentés
- [ ] Rapports générés et analysés
- [ ] Pipeline CI/CD configuré
- [ ] Seuils de sécurité définis et respectés

## Points Clés à Retenir

- **Sécurité par conception** : Intégrer les tests dès le développement
- **OWASP Top 10** : Couvrir les vulnérabilités les plus critiques
- **Automatisation** : Tests de sécurité dans chaque pipeline
- **Seuils de qualité** : Définir des critères objectifs
- **Formation équipe** : Sensibiliser aux bonnes pratiques de sécurité

## Ressources Complémentaires

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Guide de sécurité des API](https://owasp.org/www-project-api-security/)