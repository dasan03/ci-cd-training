# Exercice 3.1 - Tests UI avec Selenium et Cypress

## Objectifs

- Configurer et utiliser Selenium WebDriver pour les tests UI
- Implémenter des tests avec Cypress pour une approche moderne
- Comparer les deux approches et leurs cas d'usage
- Intégrer les tests UI dans un pipeline CI/CD

## Contexte

Vous devez automatiser les tests d'une application e-commerce simple. L'application contient :
- Une page d'accueil avec liste de produits
- Un système d'authentification
- Un panier d'achat
- Un processus de commande

## Prérequis

- Node.js 16+
- Chrome/Firefox installé
- Docker (pour l'application de test)

## Matériel Fourni

- Application e-commerce de démonstration
- Configuration de base Selenium et Cypress
- Données de test

## Instructions

### Étape 1 : Démarrage de l'Application de Test

```bash
# Cloner les ressources
cd ressources/

# Démarrer l'application
docker-compose up -d

# Vérifier que l'application fonctionne
curl http://localhost:3000
```

L'application sera accessible sur `http://localhost:3000`

### Étape 2 : Configuration de Selenium

1. **Installer les dépendances Selenium**
```bash
npm install selenium-webdriver chromedriver
```

2. **Créer la configuration de base**
```javascript
// tests/selenium/config.js
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const createDriver = () => {
  const options = new chrome.Options();
  options.addArguments('--headless'); // Pour CI/CD
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  
  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
};

module.exports = { createDriver };
```

3. **Implémenter le test de connexion**
```javascript
// tests/selenium/login.test.js
const { createDriver } = require('./config');
const { By, until } = require('selenium-webdriver');

describe('Login Tests - Selenium', () => {
  let driver;
  
  beforeEach(async () => {
    driver = createDriver();
    await driver.get('http://localhost:3000');
  });
  
  afterEach(async () => {
    await driver.quit();
  });
  
  it('should login successfully with valid credentials', async () => {
    // TODO: Implémenter le test de connexion
    // 1. Cliquer sur le bouton "Se connecter"
    // 2. Saisir email et mot de passe
    // 3. Valider la connexion
    // 4. Vérifier la redirection vers le dashboard
  });
  
  it('should show error with invalid credentials', async () => {
    // TODO: Implémenter le test d'erreur de connexion
  });
});
```

### Étape 3 : Configuration de Cypress

1. **Installer Cypress**
```bash
npm install cypress --save-dev
npx cypress open
```

2. **Configuration Cypress**
```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // Configuration des événements
    },
  },
});
```

3. **Implémenter le test de parcours d'achat**
```javascript
// cypress/e2e/shopping-flow.cy.js
describe('Shopping Flow - Cypress', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  
  it('should complete full shopping journey', () => {
    // TODO: Implémenter le parcours complet
    // 1. Parcourir les produits
    // 2. Ajouter des articles au panier
    // 3. Se connecter
    // 4. Finaliser la commande
    // 5. Vérifier la confirmation
  });
  
  it('should handle empty cart scenario', () => {
    // TODO: Tester le comportement avec panier vide
  });
});
```

### Étape 4 : Page Object Model

Implémentez le pattern Page Object Model pour les deux frameworks :

**Selenium Page Objects**
```javascript
// tests/selenium/pages/LoginPage.js
class LoginPage {
  constructor(driver) {
    this.driver = driver;
  }
  
  async navigateToLogin() {
    // TODO: Implémenter la navigation
  }
  
  async login(email, password) {
    // TODO: Implémenter la méthode de connexion
  }
  
  async getErrorMessage() {
    // TODO: Récupérer le message d'erreur
  }
}

module.exports = LoginPage;
```

**Cypress Page Objects**
```javascript
// cypress/support/pages/ProductPage.js
class ProductPage {
  visit() {
    cy.visit('/products');
  }
  
  addToCart(productId) {
    // TODO: Implémenter l'ajout au panier
  }
  
  getCartItemCount() {
    // TODO: Récupérer le nombre d'articles
  }
}

export default ProductPage;
```

### Étape 5 : Tests Cross-Browser

1. **Configuration multi-navigateurs pour Selenium**
```javascript
// tests/selenium/cross-browser.test.js
const browsers = ['chrome', 'firefox'];

browsers.forEach(browser => {
  describe(`Cross-browser tests - ${browser}`, () => {
    // TODO: Implémenter les tests pour chaque navigateur
  });
});
```

2. **Configuration Cypress pour différents viewports**
```javascript
// cypress/e2e/responsive.cy.js
const viewports = [
  { width: 320, height: 568 }, // Mobile
  { width: 768, height: 1024 }, // Tablet
  { width: 1920, height: 1080 } // Desktop
];

viewports.forEach(viewport => {
  describe(`Responsive tests - ${viewport.width}x${viewport.height}`, () => {
    beforeEach(() => {
      cy.viewport(viewport.width, viewport.height);
    });
    
    // TODO: Tests responsifs
  });
});
```

### Étape 6 : Intégration CI/CD

Créez les configurations pour l'intégration continue :

```yaml
# .github/workflows/ui-tests.yml
name: UI Tests

on: [push, pull_request]

jobs:
  selenium-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Start Application
      run: |
        docker-compose up -d
        sleep 30
        
    - name: Run Selenium Tests
      run: |
        npm install
        npm run test:selenium
        
    - name: Upload Screenshots
      uses: actions/upload-artifact@v2
      if: failure()
      with:
        name: selenium-screenshots
        path: screenshots/
        
  cypress-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Cypress Tests
      uses: cypress-io/github-action@v4
      with:
        start: docker-compose up -d
        wait-on: 'http://localhost:3000'
        record: true
      env:
        CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

## Résultat Attendu

À la fin de cet exercice, vous devriez avoir :

1. **Tests Selenium fonctionnels** couvrant :
   - Authentification (succès/échec)
   - Navigation dans l'application
   - Interactions avec les formulaires

2. **Tests Cypress complets** incluant :
   - Parcours utilisateur end-to-end
   - Tests responsifs
   - Gestion des états d'erreur

3. **Page Object Models** pour les deux frameworks

4. **Configuration CI/CD** avec :
   - Exécution automatique des tests
   - Capture d'écrans en cas d'échec
   - Rapports de test

5. **Comparaison documentée** des deux approches

## Critères de Validation

- [ ] Tests Selenium s'exécutent sans erreur
- [ ] Tests Cypress passent avec succès
- [ ] Page Objects implémentés correctement
- [ ] Tests cross-browser fonctionnels
- [ ] Pipeline CI/CD configuré
- [ ] Documentation des différences Selenium/Cypress

## Points Clés à Retenir

- **Selenium** : Mature, multi-langages, support étendu des navigateurs
- **Cypress** : Moderne, debugging facile, exécution rapide
- **Page Object Model** : Maintenance facilitée, réutilisabilité
- **CI/CD** : Automatisation complète, feedback rapide

## Ressources Complémentaires

- [Documentation Selenium WebDriver](https://selenium-python.readthedocs.io/)
- [Guide Cypress](https://docs.cypress.io/)
- [Bonnes pratiques Page Object Model](https://martinfowler.com/bliki/PageObject.html)