# Exercice 3.6 - Analyse des Dépendances avec Snyk

## Objectifs

- Configurer et utiliser Snyk pour l'analyse des vulnérabilités de dépendances
- Implémenter la surveillance continue des dépendances dans un pipeline CI/CD
- Analyser et corriger les vulnérabilités de sécurité dans les dépendances
- Configurer des politiques de sécurité pour les dépendances
- Automatiser les mises à jour de sécurité

## Contexte

Vous devez sécuriser l'application e-commerce en identifiant et corrigeant les vulnérabilités dans les dépendances tierces. L'analyse couvrira :
- Vulnérabilités connues dans les packages npm
- Licences des dépendances
- Dépendances obsolètes ou non maintenues
- Recommandations de mise à jour
- Surveillance continue des nouvelles vulnérabilités

## Prérequis

- Compte Snyk (gratuit pour les projets open source)
- Node.js et npm
- Application e-commerce avec package.json
- CLI Snyk installé
- Accès aux tokens d'API Snyk

## Matériel Fourni

- Configuration Snyk
- Scripts d'automatisation
- Politiques de sécurité
- Templates de rapports

## Instructions

### Étape 1 : Installation et Configuration de Snyk

#### 1.1 Installation du CLI Snyk

```bash
# Installation globale
npm install -g snyk

# Ou via npx (recommandé pour CI/CD)
npx snyk --version

# Authentification
snyk auth

# Vérifier l'authentification
snyk whoami
```

#### 1.2 Configuration du Projet

```bash
# Initialiser Snyk dans le projet
cd votre-projet-ecommerce
snyk monitor

# Créer un fichier de configuration
cat > .snyk << 'EOF'
# Snyk (https://snyk.io) policy file
version: v1.0.0
ignore: {}
patch: {}
EOF
```

#### 1.3 Configuration des Variables d'Environnement

```bash
# Créer un fichier .env.snyk
cat > .env.snyk << 'EOF'
SNYK_TOKEN=your_snyk_token_here
SNYK_ORG=your_organization_id
SNYK_PROJECT_NAME=ecommerce-api
EOF

# Charger les variables
source .env.snyk
```

### Étape 2 : Analyse des Vulnérabilités

#### 2.1 Scan Initial des Dépendances

```bash
# Scan des vulnérabilités
snyk test

# Scan avec rapport détaillé
snyk test --json > vulnerability-report.json

# Scan avec seuil de sévérité
snyk test --severity-threshold=high

# Scan avec rapport HTML
snyk test --json | snyk-to-html -o vulnerability-report.html
```

#### 2.2 Script d'Analyse Automatisée

Créez `security/scripts/snyk-analysis.js` :

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SnykAnalyzer {
    constructor() {
        this.reportsDir = 'security/snyk-reports';
        this.ensureReportsDir();
    }

    ensureReportsDir() {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    async runVulnerabilityTest() {
        console.log('🔍 Running Snyk vulnerability test...');
        
        try {
            // Test des vulnérabilités avec sortie JSON
            const result = execSync('snyk test --json', { 
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            const vulnerabilities = JSON.parse(result);
            
            // Sauvegarder le rapport complet
            fs.writeFileSync(
                path.join(this.reportsDir, 'vulnerabilities.json'),
                JSON.stringify(vulnerabilities, null, 2)
            );
            
            return this.analyzeVulnerabilities(vulnerabilities);
            
        } catch (error) {
            // Snyk retourne un code d'erreur si des vulnérabilités sont trouvées
            if (error.stdout) {
                const vulnerabilities = JSON.parse(error.stdout);
                
                fs.writeFileSync(
                    path.join(this.reportsDir, 'vulnerabilities.json'),
                    JSON.stringify(vulnerabilities, null, 2)
                );
                
                return this.analyzeVulnerabilities(vulnerabilities);
            }
            throw error;
        }
    }

    analyzeVulnerabilities(data) {
        const analysis = {
            totalVulnerabilities: 0,
            severityBreakdown: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            },
            vulnerablePackages: new Set(),
            patchableVulnerabilities: 0,
            upgradableVulnerabilities: 0,
            topVulnerabilities: []
        };

        if (data.vulnerabilities) {
            analysis.totalVulnerabilities = data.vulnerabilities.length;
            
            data.vulnerabilities.forEach(vuln => {
                // Compter par sévérité
                const severity = vuln.severity.toLowerCase();
                if (analysis.severityBreakdown[severity] !== undefined) {
                    analysis.severityBreakdown[severity]++;
                }
                
                // Packages vulnérables
                analysis.vulnerablePackages.add(vuln.packageName);
                
                // Solutions disponibles
                if (vuln.isUpgradable) {
                    analysis.upgradableVulnerabilities++;
                }
                if (vuln.isPatchable) {
                    analysis.patchableVulnerabilities++;
                }
                
                // Top vulnérabilités (critiques et hautes)
                if (['critical', 'high'].includes(severity)) {
                    analysis.topVulnerabilities.push({
                        id: vuln.id,
                        title: vuln.title,
                        package: vuln.packageName,
                        version: vuln.version,
                        severity: vuln.severity,
                        cvssScore: vuln.cvssScore,
                        isUpgradable: vuln.isUpgradable,
                        isPatchable: vuln.isPatchable
                    });
                }
            });
        }

        analysis.vulnerablePackages = Array.from(analysis.vulnerablePackages);
        
        // Trier les top vulnérabilités par score CVSS
        analysis.topVulnerabilities.sort((a, b) => (b.cvssScore || 0) - (a.cvssScore || 0));
        
        return analysis;
    }

    async runLicenseCheck() {
        console.log('📄 Running license compliance check...');
        
        try {
            const result = execSync('snyk test --json --print-deps', { 
                encoding: 'utf8' 
            });
            
            const data = JSON.parse(result);
            const licenseAnalysis = this.analyzeLicenses(data);
            
            fs.writeFileSync(
                path.join(this.reportsDir, 'licenses.json'),
                JSON.stringify(licenseAnalysis, null, 2)
            );
            
            return licenseAnalysis;
            
        } catch (error) {
            console.error('License check failed:', error.message);
            return { error: error.message };
        }
    }

    analyzeLicenses(data) {
        const analysis = {
            totalPackages: 0,
            licenseBreakdown: {},
            problematicLicenses: [],
            unknownLicenses: []
        };

        // Licences problématiques communes
        const problematicLicensePatterns = [
            /GPL/i,
            /AGPL/i,
            /LGPL/i,
            /CPAL/i,
            /OSL/i
        ];

        if (data.dependencies) {
            const packages = this.flattenDependencies(data.dependencies);
            analysis.totalPackages = packages.length;
            
            packages.forEach(pkg => {
                const license = pkg.license || 'Unknown';
                
                // Compter les licences
                analysis.licenseBreakdown[license] = 
                    (analysis.licenseBreakdown[license] || 0) + 1;
                
                // Vérifier les licences problématiques
                const isProblematic = problematicLicensePatterns.some(
                    pattern => pattern.test(license)
                );
                
                if (isProblematic) {
                    analysis.problematicLicenses.push({
                        package: pkg.name,
                        version: pkg.version,
                        license: license
                    });
                }
                
                // Licences inconnues
                if (license === 'Unknown' || license === '') {
                    analysis.unknownLicenses.push({
                        package: pkg.name,
                        version: pkg.version
                    });
                }
            });
        }

        return analysis;
    }

    flattenDependencies(deps, result = []) {
        Object.values(deps).forEach(dep => {
            result.push(dep);
            if (dep.dependencies) {
                this.flattenDependencies(dep.dependencies, result);
            }
        });
        return result;
    }

    async generateFixAdvice() {
        console.log('🔧 Generating fix advice...');
        
        try {
            // Obtenir les conseils de correction
            const result = execSync('snyk test --json', { 
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            return { fixes: [] };
            
        } catch (error) {
            if (error.stdout) {
                const data = JSON.parse(error.stdout);
                return this.analyzeFixOptions(data);
            }
            throw error;
        }
    }

    analyzeFixOptions(data) {
        const fixes = {
            upgrades: [],
            patches: [],
            manual: []
        };

        if (data.vulnerabilities) {
            data.vulnerabilities.forEach(vuln => {
                if (vuln.isUpgradable && vuln.upgradePath) {
                    fixes.upgrades.push({
                        package: vuln.packageName,
                        currentVersion: vuln.version,
                        fixedIn: vuln.upgradePath[vuln.upgradePath.length - 1],
                        vulnerability: vuln.title,
                        severity: vuln.severity
                    });
                } else if (vuln.isPatchable) {
                    fixes.patches.push({
                        package: vuln.packageName,
                        version: vuln.version,
                        vulnerability: vuln.title,
                        severity: vuln.severity
                    });
                } else {
                    fixes.manual.push({
                        package: vuln.packageName,
                        version: vuln.version,
                        vulnerability: vuln.title,
                        severity: vuln.severity,
                        recommendation: 'Manual review required'
                    });
                }
            });
        }

        return fixes;
    }

    async monitorProject() {
        console.log('📊 Setting up continuous monitoring...');
        
        try {
            const result = execSync('snyk monitor --json', { 
                encoding: 'utf8' 
            });
            
            const monitorData = JSON.parse(result);
            
            fs.writeFileSync(
                path.join(this.reportsDir, 'monitor.json'),
                JSON.stringify(monitorData, null, 2)
            );
            
            return monitorData;
            
        } catch (error) {
            console.error('Monitoring setup failed:', error.message);
            return { error: error.message };
        }
    }

    generateSummaryReport(vulnerabilityAnalysis, licenseAnalysis, fixAdvice) {
        const summary = {
            timestamp: new Date().toISOString(),
            security: {
                totalVulnerabilities: vulnerabilityAnalysis.totalVulnerabilities,
                criticalVulnerabilities: vulnerabilityAnalysis.severityBreakdown.critical,
                highVulnerabilities: vulnerabilityAnalysis.severityBreakdown.high,
                vulnerablePackages: vulnerabilityAnalysis.vulnerablePackages.length,
                fixableVulnerabilities: vulnerabilityAnalysis.upgradableVulnerabilities + vulnerabilityAnalysis.patchableVulnerabilities
            },
            compliance: {
                totalPackages: licenseAnalysis.totalPackages || 0,
                problematicLicenses: licenseAnalysis.problematicLicenses?.length || 0,
                unknownLicenses: licenseAnalysis.unknownLicenses?.length || 0
            },
            recommendations: {
                upgrades: fixAdvice.upgrades?.length || 0,
                patches: fixAdvice.patches?.length || 0,
                manualReview: fixAdvice.manual?.length || 0
            }
        };

        // Déterminer le statut global
        if (summary.security.criticalVulnerabilities > 0) {
            summary.status = 'CRITICAL';
            summary.message = 'Critical vulnerabilities found - immediate action required';
        } else if (summary.security.highVulnerabilities > 5) {
            summary.status = 'HIGH_RISK';
            summary.message = 'Multiple high-severity vulnerabilities found';
        } else if (summary.security.totalVulnerabilities > 0) {
            summary.status = 'MEDIUM_RISK';
            summary.message = 'Some vulnerabilities found - review recommended';
        } else {
            summary.status = 'SECURE';
            summary.message = 'No known vulnerabilities detected';
        }

        fs.writeFileSync(
            path.join(this.reportsDir, 'summary.json'),
            JSON.stringify(summary, null, 2)
        );

        return summary;
    }

    printSummary(summary) {
        console.log('\n' + '='.repeat(50));
        console.log('📋 DEPENDENCY SECURITY SUMMARY');
        console.log('='.repeat(50));
        
        console.log(`Status: ${summary.status}`);
        console.log(`Message: ${summary.message}`);
        console.log('');
        
        console.log('🔒 Security:');
        console.log(`  Total Vulnerabilities: ${summary.security.totalVulnerabilities}`);
        console.log(`  Critical: ${summary.security.criticalVulnerabilities}`);
        console.log(`  High: ${summary.security.highVulnerabilities}`);
        console.log(`  Vulnerable Packages: ${summary.security.vulnerablePackages}`);
        console.log(`  Fixable: ${summary.security.fixableVulnerabilities}`);
        console.log('');
        
        console.log('📄 Compliance:');
        console.log(`  Total Packages: ${summary.compliance.totalPackages}`);
        console.log(`  Problematic Licenses: ${summary.compliance.problematicLicenses}`);
        console.log(`  Unknown Licenses: ${summary.compliance.unknownLicenses}`);
        console.log('');
        
        console.log('🔧 Recommendations:');
        console.log(`  Available Upgrades: ${summary.recommendations.upgrades}`);
        console.log(`  Available Patches: ${summary.recommendations.patches}`);
        console.log(`  Manual Review Required: ${summary.recommendations.manualReview}`);
        
        console.log('='.repeat(50));
    }

    async runFullAnalysis() {
        try {
            console.log('🚀 Starting comprehensive dependency analysis...\n');
            
            // Analyse des vulnérabilités
            const vulnerabilityAnalysis = await this.runVulnerabilityTest();
            
            // Analyse des licences
            const licenseAnalysis = await this.runLicenseCheck();
            
            // Conseils de correction
            const fixAdvice = await this.generateFixAdvice();
            
            // Configuration du monitoring
            await this.monitorProject();
            
            // Génération du rapport de synthèse
            const summary = this.generateSummaryReport(
                vulnerabilityAnalysis, 
                licenseAnalysis, 
                fixAdvice
            );
            
            this.printSummary(summary);
            
            // Retourner le code de sortie approprié
            return summary.status === 'CRITICAL' ? 1 : 0;
            
        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            return 1;
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const analyzer = new SnykAnalyzer();
    analyzer.runFullAnalysis().then(exitCode => {
        process.exit(exitCode);
    });
}

module.exports = SnykAnalyzer;
```

### Étape 3 : Configuration des Politiques de Sécurité

#### 3.1 Fichier de Politique Snyk

Créez `.snyk` :

```yaml
# Snyk (https://snyk.io) policy file
version: v1.0.0

# Ignorer certaines vulnérabilités (temporairement)
ignore:
  # Exemple: ignorer une vulnérabilité spécifique
  # SNYK-JS-LODASH-567746:
  #   - '*':
  #       reason: 'No fix available, low impact'
  #       expires: '2024-12-31T23:59:59.999Z'

# Patches à appliquer
patch: {}

# Seuils de sévérité
language-settings:
  javascript:
    # Échouer le build pour les vulnérabilités critiques et hautes
    fail-on: 'high'
    # Ignorer les vulnérabilités de développement
    dev: false
```

#### 3.2 Configuration des Seuils

Créez `security/snyk-config/thresholds.json` :

```json
{
  "security": {
    "critical": {
      "max": 0,
      "action": "fail"
    },
    "high": {
      "max": 2,
      "action": "warn"
    },
    "medium": {
      "max": 10,
      "action": "warn"
    },
    "low": {
      "max": 50,
      "action": "info"
    }
  },
  "compliance": {
    "problematic_licenses": {
      "max": 0,
      "action": "fail"
    },
    "unknown_licenses": {
      "max": 5,
      "action": "warn"
    }
  },
  "age": {
    "outdated_packages": {
      "max_age_months": 24,
      "action": "warn"
    }
  }
}
```

### Étape 4 : Automatisation des Corrections

#### 4.1 Script de Correction Automatique

Créez `security/scripts/auto-fix.js` :

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

class SnykAutoFixer {
    constructor() {
        this.dryRun = process.argv.includes('--dry-run');
        this.interactive = process.argv.includes('--interactive');
    }

    async runAutoFix() {
        console.log('🔧 Starting automatic vulnerability fixes...');
        
        if (this.dryRun) {
            console.log('🔍 DRY RUN MODE - No changes will be made');
        }

        try {
            // Obtenir la liste des vulnérabilités fixables
            const fixableVulns = await this.getFixableVulnerabilities();
            
            if (fixableVulns.length === 0) {
                console.log('✅ No fixable vulnerabilities found');
                return;
            }

            console.log(`Found ${fixableVulns.length} fixable vulnerabilities`);
            
            // Appliquer les corrections
            for (const vuln of fixableVulns) {
                await this.applyFix(vuln);
            }
            
            // Vérifier les résultats
            await this.verifyFixes();
            
        } catch (error) {
            console.error('❌ Auto-fix failed:', error.message);
            process.exit(1);
        }
    }

    async getFixableVulnerabilities() {
        try {
            const result = execSync('snyk test --json', { 
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe']
            });
            return [];
        } catch (error) {
            if (error.stdout) {
                const data = JSON.parse(error.stdout);
                return this.extractFixableVulns(data);
            }
            throw error;
        }
    }

    extractFixableVulns(data) {
        const fixable = [];
        
        if (data.vulnerabilities) {
            data.vulnerabilities.forEach(vuln => {
                if (vuln.isUpgradable || vuln.isPatchable) {
                    fixable.push({
                        id: vuln.id,
                        package: vuln.packageName,
                        currentVersion: vuln.version,
                        severity: vuln.severity,
                        isUpgradable: vuln.isUpgradable,
                        isPatchable: vuln.isPatchable,
                        upgradePath: vuln.upgradePath,
                        title: vuln.title
                    });
                }
            });
        }
        
        // Trier par sévérité (critique en premier)
        const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
        fixable.sort((a, b) => {
            return severityOrder[a.severity.toLowerCase()] - severityOrder[b.severity.toLowerCase()];
        });
        
        return fixable;
    }

    async applyFix(vuln) {
        console.log(`\n🔧 Fixing ${vuln.package} (${vuln.severity}): ${vuln.title}`);
        
        if (this.interactive) {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            const answer = await new Promise(resolve => {
                readline.question(`Apply fix for ${vuln.package}? (y/N): `, resolve);
            });
            
            readline.close();
            
            if (answer.toLowerCase() !== 'y') {
                console.log('⏭️  Skipped');
                return;
            }
        }

        try {
            if (vuln.isUpgradable) {
                await this.applyUpgrade(vuln);
            } else if (vuln.isPatchable) {
                await this.applyPatch(vuln);
            }
        } catch (error) {
            console.error(`❌ Failed to fix ${vuln.package}:`, error.message);
        }
    }

    async applyUpgrade(vuln) {
        console.log(`  📦 Upgrading ${vuln.package}...`);
        
        if (this.dryRun) {
            console.log(`  🔍 Would upgrade to: ${vuln.upgradePath[vuln.upgradePath.length - 1]}`);
            return;
        }

        try {
            // Utiliser npm update ou yarn upgrade selon le gestionnaire de paquets
            const packageManager = fs.existsSync('yarn.lock') ? 'yarn' : 'npm';
            
            if (packageManager === 'yarn') {
                execSync(`yarn upgrade ${vuln.package}`, { stdio: 'inherit' });
            } else {
                execSync(`npm update ${vuln.package}`, { stdio: 'inherit' });
            }
            
            console.log(`  ✅ Successfully upgraded ${vuln.package}`);
            
        } catch (error) {
            console.error(`  ❌ Failed to upgrade ${vuln.package}:`, error.message);
        }
    }

    async applyPatch(vuln) {
        console.log(`  🩹 Applying patch for ${vuln.package}...`);
        
        if (this.dryRun) {
            console.log(`  🔍 Would apply Snyk patch for vulnerability ${vuln.id}`);
            return;
        }

        try {
            execSync(`snyk protect`, { stdio: 'inherit' });
            console.log(`  ✅ Successfully patched ${vuln.package}`);
            
        } catch (error) {
            console.error(`  ❌ Failed to patch ${vuln.package}:`, error.message);
        }
    }

    async verifyFixes() {
        console.log('\n🔍 Verifying fixes...');
        
        try {
            execSync('snyk test', { stdio: 'inherit' });
            console.log('✅ All vulnerabilities have been fixed!');
            
        } catch (error) {
            console.log('⚠️  Some vulnerabilities remain. Run snyk test for details.');
        }
    }
}

// Exécution
const fixer = new SnykAutoFixer();
fixer.runAutoFix();
```

### Étape 5 : Intégration CI/CD

#### 5.1 GitHub Actions Workflow

Créez `.github/workflows/dependency-security.yml` :

```yaml
name: Dependency Security

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'  # Tous les lundis à 6h du matin

jobs:
  snyk-security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high --fail-on=upgradable
        command: test
    
    - name: Run comprehensive Snyk analysis
      run: |
        npm install -g snyk
        node security/scripts/snyk-analysis.js
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
    
    - name: Upload Snyk results to GitHub Code Scanning
      uses: github/codeql-action/upload-sarif@v2
      if: always()
      with:
        sarif_file: snyk.sarif
    
    - name: Monitor project with Snyk
      if: github.ref == 'refs/heads/main'
      run: snyk monitor
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
    
    - name: Upload security reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: snyk-reports
        path: security/snyk-reports/
    
    - name: Comment PR with security results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          
          try {
            const summaryPath = 'security/snyk-reports/summary.json';
            if (fs.existsSync(summaryPath)) {
              const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
              
              const statusEmoji = {
                'SECURE': '✅',
                'MEDIUM_RISK': '⚠️',
                'HIGH_RISK': '🚨',
                'CRITICAL': '🔴'
              };
              
              const comment = `## ${statusEmoji[summary.status]} Dependency Security Report
              
              **Status:** ${summary.status}
              **Message:** ${summary.message}
              
              ### 🔒 Security Summary
              | Severity | Count |
              |----------|-------|
              | Critical | ${summary.security.criticalVulnerabilities} |
              | High | ${summary.security.highVulnerabilities} |
              | Total | ${summary.security.totalVulnerabilities} |
              
              **Vulnerable Packages:** ${summary.security.vulnerablePackages}
              **Fixable Vulnerabilities:** ${summary.security.fixableVulnerabilities}
              
              ### 📄 License Compliance
              - **Total Packages:** ${summary.compliance.totalPackages}
              - **Problematic Licenses:** ${summary.compliance.problematicLicenses}
              - **Unknown Licenses:** ${summary.compliance.unknownLicenses}
              
              ### 🔧 Recommendations
              - **Available Upgrades:** ${summary.recommendations.upgrades}
              - **Available Patches:** ${summary.recommendations.patches}
              - **Manual Review Required:** ${summary.recommendations.manualReview}
              
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

  auto-fix:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    
    steps:
    - uses: actions/checkout@v3
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run auto-fix
      run: |
        npm install -g snyk
        node security/scripts/auto-fix.js --dry-run
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
    
    - name: Create Pull Request for fixes
      if: success()
      uses: peter-evans/create-pull-request@v4
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        commit-message: 'fix: auto-fix security vulnerabilities'
        title: '🔒 Auto-fix security vulnerabilities'
        body: |
          This PR contains automatic fixes for security vulnerabilities detected by Snyk.
          
          ## Changes
          - Updated vulnerable dependencies to secure versions
          - Applied security patches where available
          
          ## Verification
          Please review the changes and run tests before merging.
        branch: security/auto-fix
        delete-branch: true
```

#### 5.2 Script de Validation Locale

Créez `security/scripts/validate-dependencies.sh` :

```bash
#!/bin/bash

set -e

echo "🔒 Starting dependency security validation..."

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que Snyk est installé
if ! command -v snyk &> /dev/null; then
    echo "Installing Snyk CLI..."
    npm install -g snyk
fi

# Vérifier l'authentification Snyk
if ! snyk whoami &> /dev/null; then
    echo -e "${RED}❌ Snyk authentication required${NC}"
    echo "Please run: snyk auth"
    exit 1
fi

# Créer le dossier de rapports
mkdir -p security/snyk-reports

echo -e "${YELLOW}🔍 Running vulnerability scan...${NC}"

# Test des vulnérabilités
if snyk test --json > security/snyk-reports/vulnerabilities.json 2>/dev/null; then
    echo -e "${GREEN}✅ No vulnerabilities found${NC}"
    VULN_EXIT_CODE=0
else
    VULN_EXIT_CODE=$?
    echo -e "${YELLOW}⚠️  Vulnerabilities detected${NC}"
fi

# Analyse des licences
echo -e "${YELLOW}📄 Checking license compliance...${NC}"
snyk test --print-deps --json > security/snyk-reports/dependencies.json 2>/dev/null || true

# Exécuter l'analyse complète
echo -e "${YELLOW}📊 Running comprehensive analysis...${NC}"
node security/scripts/snyk-analysis.js

# Lire le résumé
if [ -f "security/snyk-reports/summary.json" ]; then
    SUMMARY=$(cat security/snyk-reports/summary.json)
    STATUS=$(echo "$SUMMARY" | jq -r '.status')
    
    case $STATUS in
        "SECURE")
            echo -e "${GREEN}✅ All dependencies are secure${NC}"
            exit 0
            ;;
        "MEDIUM_RISK")
            echo -e "${YELLOW}⚠️  Medium risk vulnerabilities found${NC}"
            exit 0
            ;;
        "HIGH_RISK")
            echo -e "${YELLOW}🚨 High risk vulnerabilities found${NC}"
            exit 1
            ;;
        "CRITICAL")
            echo -e "${RED}🔴 Critical vulnerabilities found${NC}"
            exit 1
            ;;
        *)
            echo -e "${RED}❌ Unknown status: $STATUS${NC}"
            exit 1
            ;;
    esac
else
    echo -e "${RED}❌ Could not generate security summary${NC}"
    exit 1
fi
```

### Étape 6 : Monitoring Continu

#### 6.1 Configuration du Monitoring Snyk

Créez `security/scripts/setup-monitoring.js` :

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

class SnykMonitoring {
    constructor() {
        this.projectName = process.env.SNYK_PROJECT_NAME || 'ecommerce-api';
        this.orgId = process.env.SNYK_ORG;
    }

    async setupMonitoring() {
        console.log('📊 Setting up Snyk monitoring...');
        
        try {
            // Configurer le monitoring du projet
            const monitorResult = execSync('snyk monitor --json', { 
                encoding: 'utf8' 
            });
            
            const monitorData = JSON.parse(monitorResult);
            console.log(`✅ Project monitored: ${monitorData.uri}`);
            
            // Configurer les notifications
            await this.setupNotifications();
            
            // Configurer les politiques
            await this.setupPolicies();
            
            return monitorData;
            
        } catch (error) {
            console.error('❌ Failed to setup monitoring:', error.message);
            throw error;
        }
    }

    async setupNotifications() {
        console.log('🔔 Configuring notifications...');
        
        // Les notifications sont généralement configurées via l'interface web Snyk
        // Mais on peut documenter la configuration recommandée
        
        const notificationConfig = {
            email: {
                enabled: true,
                frequency: 'weekly',
                severity: ['high', 'critical']
            },
            slack: {
                enabled: true,
                webhook: process.env.SLACK_WEBHOOK_URL,
                channels: ['#security', '#dev-alerts']
            },
            webhooks: {
                enabled: true,
                endpoints: [
                    {
                        url: process.env.SECURITY_WEBHOOK_URL,
                        events: ['new-vulnerability', 'fixed-vulnerability']
                    }
                ]
            }
        };
        
        fs.writeFileSync(
            'security/snyk-config/notifications.json',
            JSON.stringify(notificationConfig, null, 2)
        );
        
        console.log('📝 Notification configuration saved');
    }

    async setupPolicies() {
        console.log('📋 Setting up security policies...');
        
        const policies = {
            vulnerability: {
                autofix: {
                    enabled: true,
                    severity: ['critical', 'high'],
                    types: ['upgrade', 'patch']
                },
                ignore: {
                    maxAge: '30 days',
                    requireReason: true,
                    requireExpiry: true
                }
            },
            license: {
                allowed: [
                    'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause',
                    'ISC', 'CC0-1.0', 'Unlicense'
                ],
                forbidden: [
                    'GPL-2.0', 'GPL-3.0', 'AGPL-1.0', 'AGPL-3.0',
                    'LGPL-2.0', 'LGPL-2.1', 'LGPL-3.0'
                ]
            },
            dependencies: {
                maxAge: '2 years',
                requireMaintenance: true,
                minimumDownloads: 1000
            }
        };
        
        fs.writeFileSync(
            'security/snyk-config/policies.json',
            JSON.stringify(policies, null, 2)
        );
        
        console.log('📝 Security policies configured');
    }

    async generateDashboard() {
        console.log('📈 Generating security dashboard...');
        
        try {
            // Obtenir les données du projet
            const projectData = await this.getProjectData();
            
            // Générer le dashboard HTML
            const dashboardHtml = this.createDashboardHtml(projectData);
            
            fs.writeFileSync(
                'security/snyk-reports/dashboard.html',
                dashboardHtml
            );
            
            console.log('✅ Dashboard generated: security/snyk-reports/dashboard.html');
            
        } catch (error) {
            console.error('❌ Failed to generate dashboard:', error.message);
        }
    }

    async getProjectData() {
        // Simuler les données du projet (normalement récupérées via l'API Snyk)
        return {
            name: this.projectName,
            vulnerabilities: {
                critical: 0,
                high: 2,
                medium: 5,
                low: 8
            },
            dependencies: {
                total: 150,
                outdated: 12,
                vulnerable: 7
            },
            licenses: {
                compliant: 145,
                problematic: 3,
                unknown: 2
            },
            lastScan: new Date().toISOString()
        };
    }

    createDashboardHtml(data) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Dashboard - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .metric { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .critical { color: #d73a49; }
        .high { color: #f66a0a; }
        .medium { color: #ffd33d; }
        .low { color: #28a745; }
        .header { text-align: center; margin-bottom: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Security Dashboard</h1>
        <h2>${data.name}</h2>
        <p>Last updated: ${new Date(data.lastScan).toLocaleString()}</p>
    </div>
    
    <div class="dashboard">
        <div class="card">
            <h3>🚨 Vulnerabilities</h3>
            <div class="metric critical">${data.vulnerabilities.critical}</div>
            <p>Critical</p>
            <div class="metric high">${data.vulnerabilities.high}</div>
            <p>High</p>
            <div class="metric medium">${data.vulnerabilities.medium}</div>
            <p>Medium</p>
            <div class="metric low">${data.vulnerabilities.low}</div>
            <p>Low</p>
        </div>
        
        <div class="card">
            <h3>📦 Dependencies</h3>
            <div class="metric">${data.dependencies.total}</div>
            <p>Total Dependencies</p>
            <div class="metric medium">${data.dependencies.outdated}</div>
            <p>Outdated</p>
            <div class="metric high">${data.dependencies.vulnerable}</div>
            <p>Vulnerable</p>
        </div>
        
        <div class="card">
            <h3>📄 Licenses</h3>
            <div class="metric low">${data.licenses.compliant}</div>
            <p>Compliant</p>
            <div class="metric high">${data.licenses.problematic}</div>
            <p>Problematic</p>
            <div class="metric medium">${data.licenses.unknown}</div>
            <p>Unknown</p>
        </div>
    </div>
</body>
</html>`;
    }
}

// Exécution
if (require.main === module) {
    const monitoring = new SnykMonitoring();
    monitoring.setupMonitoring()
        .then(() => monitoring.generateDashboard())
        .then(() => console.log('✅ Monitoring setup complete'))
        .catch(error => {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        });
}

module.exports = SnykMonitoring;
```

## Résultat Attendu

À la fin de cet exercice, vous devriez avoir :

1. **Configuration Snyk complète** avec :
   - CLI configuré et authentifié
   - Politiques de sécurité définies
   - Monitoring continu activé

2. **Analyse automatisée des dépendances** incluant :
   - Détection des vulnérabilités
   - Analyse des licences
   - Recommandations de correction

3. **Système de correction automatique** avec :
   - Mise à jour des dépendances vulnérables
   - Application de patches de sécurité
   - Validation des corrections

4. **Intégration CI/CD** avec :
   - Scans automatiques sur chaque commit
   - Rapports de sécurité détaillés
   - Pull requests automatiques pour les corrections

## Critères de Validation

- [ ] Snyk CLI configuré et fonctionnel
- [ ] Analyse des vulnérabilités automatisée
- [ ] Politiques de sécurité implémentées
- [ ] Corrections automatiques testées
- [ ] Pipeline CI/CD configuré
- [ ] Dashboard de monitoring accessible

## Points Clés à Retenir

- **Sécurité proactive** : Détecter les vulnérabilités avant la production
- **Automatisation** : Intégrer les contrôles dans le workflow de développement
- **Monitoring continu** : Surveiller les nouvelles vulnérabilités
- **Correction rapide** : Automatiser les mises à jour de sécurité
- **Conformité** : Respecter les politiques de licences

## Ressources Complémentaires

- [Documentation Snyk](https://docs.snyk.io/)
- [Guide des vulnérabilités npm](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)