# Solution - Exercice 3.1 : Tests UI avec Selenium et Cypress

## Vue d'ensemble de la Solution

Cette solution présente une implémentation complète des tests UI avec Selenium WebDriver et Cypress, démontrant les bonnes pratiques et les différences entre les deux approches.

## Architecture de la Solution

```
tests/
├── selenium/
│   ├── config.js              # Configuration Selenium
│   ├── pages/                 # Page Object Models
│   │   ├── LoginPage.js
│   │   ├── ProductPage.js
│   │   └── CartPage.js
│   └── specs/                 # Tests Selenium
│       ├── login.test.js
│       ├── shopping.test.js
│       └── cross-browser.test.js
├── cypress/
│   ├── e2e/                   # Tests Cypress
│   │   ├── login.cy.js
│   │   ├── shopping-flow.cy.js
│   │   └── responsive.cy.js
│   ├── support/
│   │   ├── pages/             # Page Objects Cypress
│   │   ├── commands.js        # Commandes personnalisées
│   │   └── e2e.js
│   └── fixtures/              # Données de test
└── utils/
    └── test-data.js           # Générateur de données
```

## Implémentation Selenium

### Configuration Selenium Avancée

```javascript
// tests/selenium/config.js
const { Builder, Capabilities } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

class DriverFactory {
  static createDriver(browserName = 'chrome', headless = true) {
    let driver;
    
    switch (browserName.toLowerCase()) {
      case 'chrome':
        const chromeOptions = new chrome.Options();
        if (headless) {
          chromeOptions.addArguments('--headless');
        }
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--window-size=1920,1080');
        
        driver = new Builder()
          .forBrowser('chrome')
          .setChromeOptions(chromeOptions)
          .build();
        break;
        
      case 'firefox':
        const firefoxOptions = new firefox.Options();
        if (headless) {
          firefoxOptions.addArguments('--headless');
        }
        firefoxOptions.addArguments('--width=1920');
        firefoxOptions.addArguments('--height=1080');
        
        driver = new Builder()
          .forBrowser('firefox')
          .setFirefoxOptions(firefoxOptions)
          .build();
        break;
        
      default:
        throw new Error(`Browser ${browserName} not supported`);
    }
    
    // Configuration des timeouts
    driver.manage().setTimeouts({
      implicit: 10000,
      pageLoad: 30000,
      script: 30000
    });
    
    return driver;
  }
  
  static async createRemoteDriver(browserName, hubUrl = 'http://localhost:4444/wd/hub') {
    const capabilities = new Capabilities();
    capabilities.set('browserName', browserName);
    capabilities.set('platformName', 'linux');
    
    const driver = new Builder()
      .withCapabilities(capabilities)
      .usingServer(hubUrl)
      .build();
      
    return driver;
  }
}

module.exports = { DriverFactory };
```

### Page Object Model - Selenium

```javascript
// tests/selenium/pages/LoginPage.js
const { By, until } = require('selenium-webdriver');

class LoginPage {
  constructor(driver) {
    this.driver = driver;
    
    // Sélecteurs
    this.selectors = {
      loginButton: By.css('[data-testid="login-button"]'),
      emailInput: By.css('[data-testid="email-input"]'),
      passwordInput: By.css('[data-testid="password-input"]'),
      submitButton: By.css('[data-testid="submit-button"]'),
      errorMessage: By.css('[data-testid="error-message"]'),
      userMenu: By.css('[data-testid="user-menu"]')
    };
  }
  
  async navigateToLogin() {
    await this.driver.get('http://localhost:3000');
    const loginButton = await this.driver.findElement(this.selectors.loginButton);
    await loginButton.click();
    
    // Attendre que la page de connexion soit chargée
    await this.driver.wait(
      until.elementLocated(this.selectors.emailInput),
      10000
    );
  }
  
  async login(email, password) {
    await this.driver.findElement(this.selectors.emailInput).sendKeys(email);
    await this.driver.findElement(this.selectors.passwordInput).sendKeys(password);
    await this.driver.findElement(this.selectors.submitButton).click();
  }
  
  async waitForLoginSuccess() {
    await this.driver.wait(
      until.elementLocated(this.selectors.userMenu),
      10000
    );
  }
  
  async getErrorMessage() {
    try {
      const errorElement = await this.driver.wait(
        until.elementLocated(this.selectors.errorMessage),
        5000
      );
      return await errorElement.getText();
    } catch (error) {
      return null;
    }
  }
  
  async isLoggedIn() {
    try {
      await this.driver.findElement(this.selectors.userMenu);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = LoginPage;
```

### Tests Selenium Complets

```javascript
// tests/selenium/specs/login.test.js
const { DriverFactory } = require('../config');
const LoginPage = require('../pages/LoginPage');
const { testUsers } = require('../../utils/test-data');

describe('Login Tests - Selenium', () => {
  let driver;
  let loginPage;
  
  beforeAll(async () => {
    driver = DriverFactory.createDriver('chrome', true);
    loginPage = new LoginPage(driver);
  });
  
  afterAll(async () => {
    await driver.quit();
  });
  
  beforeEach(async () => {
    await loginPage.navigateToLogin();
  });
  
  describe('Successful Login', () => {
    it('should login with valid credentials', async () => {
      const user = testUsers.validUser;
      
      await loginPage.login(user.email, user.password);
      await loginPage.waitForLoginSuccess();
      
      const isLoggedIn = await loginPage.isLoggedIn();
      expect(isLoggedIn).toBe(true);
      
      // Vérifier l'URL après connexion
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('/dashboard');
    });
  });
  
  describe('Failed Login', () => {
    it('should show error with invalid email', async () => {
      await loginPage.login('invalid@email.com', 'password123');
      
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toContain('Invalid credentials');
    });
    
    it('should show error with empty fields', async () => {
      await loginPage.login('', '');
      
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toContain('Email and password are required');
    });
  });
  
  describe('UI Validation', () => {
    it('should have proper form validation', async () => {
      // Test de validation côté client
      const emailInput = await driver.findElement(loginPage.selectors.emailInput);
      const validationMessage = await emailInput.getAttribute('validationMessage');
      
      await loginPage.login('invalid-email', 'password');
      expect(validationMessage).toBeTruthy();
    });
  });
});
```

## Implémentation Cypress

### Configuration Cypress Avancée

```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Configuration des timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    // Configuration des captures
    video: true,
    screenshotOnRunFailure: true,
    
    // Configuration des tests
    testIsolation: true,
    
    setupNodeEvents(on, config) {
      // Gestion des tâches personnalisées
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        // Nettoyage de la base de données
        clearDatabase() {
          // Implémentation du nettoyage
          return null;
        }
      });
      
      // Configuration des variables d'environnement
      config.env = {
        ...config.env,
        apiUrl: 'http://localhost:3000/api',
        testUser: {
          email: 'test@example.com',
          password: 'password123'
        }
      };
      
      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
});
```

### Commandes Personnalisées Cypress

```javascript
// cypress/support/commands.js
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  
  if (email) {
    cy.get('[data-testid="email-input"]').type(email);
  }
  
  if (password) {
    cy.get('[data-testid="password-input"]').type(password);
  }
  
  cy.get('[data-testid="submit-button"]').click();
});

Cypress.Commands.add('loginAsTestUser', () => {
  const user = Cypress.env('testUser');
  cy.login(user.email, user.password);
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('addProductToCart', (productId) => {
  cy.get(`[data-testid="product-${productId}"]`).within(() => {
    cy.get('[data-testid="add-to-cart"]').click();
  });
  
  // Vérifier que le produit a été ajouté
  cy.get('[data-testid="cart-count"]').should('contain', '1');
});

Cypress.Commands.add('clearCart', () => {
  cy.get('[data-testid="cart-icon"]').click();
  cy.get('[data-testid="clear-cart"]').click();
  cy.get('[data-testid="cart-count"]').should('contain', '0');
});

// Commande pour les API calls
Cypress.Commands.add('apiLogin', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password }
  }).then((response) => {
    window.localStorage.setItem('authToken', response.body.token);
  });
});
```

### Page Objects Cypress

```javascript
// cypress/support/pages/ShoppingPage.js
class ShoppingPage {
  visit() {
    cy.visit('/products');
  }
  
  searchProduct(productName) {
    cy.get('[data-testid="search-input"]').type(productName);
    cy.get('[data-testid="search-button"]').click();
  }
  
  filterByCategory(category) {
    cy.get('[data-testid="category-filter"]').select(category);
  }
  
  addProductToCart(productIndex = 0) {
    cy.get('[data-testid^="product-"]').eq(productIndex).within(() => {
      cy.get('[data-testid="product-name"]').invoke('text').as('productName');
      cy.get('[data-testid="add-to-cart"]').click();
    });
    
    // Vérifier la notification
    cy.get('[data-testid="notification"]')
      .should('be.visible')
      .and('contain', 'Product added to cart');
  }
  
  goToCart() {
    cy.get('[data-testid="cart-icon"]').click();
    cy.url().should('include', '/cart');
  }
  
  getCartItemCount() {
    return cy.get('[data-testid="cart-count"]').invoke('text');
  }
  
  proceedToCheckout() {
    cy.get('[data-testid="checkout-button"]').click();
    cy.url().should('include', '/checkout');
  }
}

export default ShoppingPage;
```

### Tests Cypress Complets

```javascript
// cypress/e2e/shopping-flow.cy.js
import ShoppingPage from '../support/pages/ShoppingPage';

describe('E-commerce Shopping Flow', () => {
  const shoppingPage = new ShoppingPage();
  
  beforeEach(() => {
    // Nettoyage avant chaque test
    cy.task('clearDatabase');
    cy.clearCookies();
    cy.clearLocalStorage();
  });
  
  describe('Product Browsing', () => {
    it('should display products correctly', () => {
      shoppingPage.visit();
      
      // Vérifier que les produits sont affichés
      cy.get('[data-testid^="product-"]').should('have.length.greaterThan', 0);
      
      // Vérifier les éléments de chaque produit
      cy.get('[data-testid^="product-"]').first().within(() => {
        cy.get('[data-testid="product-name"]').should('be.visible');
        cy.get('[data-testid="product-price"]').should('be.visible');
        cy.get('[data-testid="product-image"]').should('be.visible');
        cy.get('[data-testid="add-to-cart"]').should('be.visible');
      });
    });
    
    it('should filter products by category', () => {
      shoppingPage.visit();
      shoppingPage.filterByCategory('Electronics');
      
      // Vérifier que seuls les produits électroniques sont affichés
      cy.get('[data-testid^="product-"]').each(($product) => {
        cy.wrap($product).within(() => {
          cy.get('[data-testid="product-category"]')
            .should('contain', 'Electronics');
        });
      });
    });
  });
  
  describe('Shopping Cart', () => {
    it('should add products to cart', () => {
      shoppingPage.visit();
      
      // Ajouter plusieurs produits
      shoppingPage.addProductToCart(0);
      shoppingPage.addProductToCart(1);
      
      // Vérifier le compteur du panier
      shoppingPage.getCartItemCount().should('eq', '2');
      
      // Aller au panier et vérifier le contenu
      shoppingPage.goToCart();
      cy.get('[data-testid="cart-item"]').should('have.length', 2);
    });
    
    it('should update cart quantities', () => {
      shoppingPage.visit();
      shoppingPage.addProductToCart(0);
      shoppingPage.goToCart();
      
      // Augmenter la quantité
      cy.get('[data-testid="quantity-increase"]').click();
      cy.get('[data-testid="item-quantity"]').should('contain', '2');
      
      // Vérifier que le total est mis à jour
      cy.get('[data-testid="cart-total"]').should('not.contain', '0');
    });
  });
  
  describe('Checkout Process', () => {
    beforeEach(() => {
      // Se connecter avant le checkout
      cy.loginAsTestUser();
      shoppingPage.visit();
      shoppingPage.addProductToCart(0);
      shoppingPage.goToCart();
    });
    
    it('should complete checkout successfully', () => {
      shoppingPage.proceedToCheckout();
      
      // Remplir les informations de livraison
      cy.get('[data-testid="shipping-address"]').type('123 Test Street');
      cy.get('[data-testid="shipping-city"]').type('Test City');
      cy.get('[data-testid="shipping-zip"]').type('12345');
      
      // Sélectionner le mode de paiement
      cy.get('[data-testid="payment-method"]').select('credit-card');
      cy.get('[data-testid="card-number"]').type('4111111111111111');
      cy.get('[data-testid="card-expiry"]').type('12/25');
      cy.get('[data-testid="card-cvv"]').type('123');
      
      // Finaliser la commande
      cy.get('[data-testid="place-order"]').click();
      
      // Vérifier la confirmation
      cy.url().should('include', '/order-confirmation');
      cy.get('[data-testid="order-success"]')
        .should('be.visible')
        .and('contain', 'Order placed successfully');
      
      // Vérifier que le panier est vide
      cy.get('[data-testid="cart-count"]').should('contain', '0');
    });
    
    it('should validate required fields', () => {
      shoppingPage.proceedToCheckout();
      
      // Essayer de valider sans remplir les champs
      cy.get('[data-testid="place-order"]').click();
      
      // Vérifier les messages d'erreur
      cy.get('[data-testid="address-error"]')
        .should('be.visible')
        .and('contain', 'Address is required');
      
      cy.get('[data-testid="payment-error"]')
        .should('be.visible')
        .and('contain', 'Payment method is required');
    });
  });
  
  describe('Responsive Design', () => {
    const viewports = [
      { width: 375, height: 667, device: 'iPhone' },
      { width: 768, height: 1024, device: 'iPad' },
      { width: 1920, height: 1080, device: 'Desktop' }
    ];
    
    viewports.forEach(viewport => {
      it(`should work correctly on ${viewport.device}`, () => {
        cy.viewport(viewport.width, viewport.height);
        shoppingPage.visit();
        
        // Tests spécifiques au viewport
        if (viewport.width < 768) {
          // Mobile: menu hamburger
          cy.get('[data-testid="mobile-menu"]').should('be.visible');
        } else {
          // Desktop/Tablet: menu normal
          cy.get('[data-testid="desktop-menu"]').should('be.visible');
        }
        
        // Fonctionnalités de base
        shoppingPage.addProductToCart(0);
        shoppingPage.goToCart();
        cy.get('[data-testid="cart-item"]').should('have.length', 1);
      });
    });
  });
});
```

## Comparaison Selenium vs Cypress

### Avantages et Inconvénients

| Aspect | Selenium | Cypress |
|--------|----------|---------|
| **Setup** | Configuration complexe | Setup simple |
| **Debugging** | Difficile | Excellent (time-travel) |
| **Vitesse** | Plus lent | Rapide |
| **Navigateurs** | Tous les navigateurs | Chrome/Firefox/Edge |
| **Langages** | Multi-langages | JavaScript uniquement |
| **Parallélisation** | Native | Payant (Dashboard) |
| **Communauté** | Très large | Croissante |

### Cas d'Usage Recommandés

**Utilisez Selenium quand :**
- Support multi-navigateurs requis
- Équipe multi-langages
- Tests cross-platform étendus
- Budget limité pour outils

**Utilisez Cypress quand :**
- Développement JavaScript/TypeScript
- Debugging fréquent nécessaire
- Tests rapides prioritaires
- Équipe débutante en tests

## Intégration CI/CD Complète

```yaml
# .github/workflows/ui-tests-complete.yml
name: Complete UI Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      cache-key: ${{ steps.cache-key.outputs.key }}
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Generate cache key
      id: cache-key
      run: echo "key=${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}" >> $GITHUB_OUTPUT
    
    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: ~/.npm
        key: ${{ steps.cache-key.outputs.key }}
        restore-keys: |
          ${{ runner.os }}-node-
  
  selenium-tests:
    needs: setup
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Start test environment
      run: |
        docker-compose up -d
        sleep 30
        curl --retry 10 --retry-delay 5 http://localhost:3000
    
    - name: Run Selenium tests
      run: npm run test:selenium -- --browser=${{ matrix.browser }}
      env:
        BROWSER: ${{ matrix.browser }}
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: selenium-results-${{ matrix.browser }}
        path: |
          test-results/
          screenshots/
    
    - name: Cleanup
      if: always()
      run: docker-compose down
  
  cypress-tests:
    needs: setup
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Cypress Tests
      uses: cypress-io/github-action@v5
      with:
        build: npm run build
        start: docker-compose up -d
        wait-on: 'http://localhost:3000'
        wait-on-timeout: 120
        browser: chrome
        record: true
        parallel: true
      env:
        CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Upload Cypress artifacts
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: cypress-screenshots
        path: cypress/screenshots
  
  performance-tests:
    needs: [selenium-tests, cypress-tests]
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Lighthouse CI
      uses: treosh/lighthouse-ci-action@v9
      with:
        configPath: './lighthouserc.json'
        uploadArtifacts: true
        temporaryPublicStorage: true
```

## Métriques et Rapports

### Configuration des Rapports

```javascript
// jest.config.js pour Selenium
module.exports = {
  testEnvironment: 'node',
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-results',
      filename: 'selenium-report.html',
      expand: true
    }],
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'selenium-results.xml'
    }]
  ],
  collectCoverage: false,
  testTimeout: 60000
};
```

Cette solution complète démontre l'implémentation professionnelle des tests UI avec les deux frameworks, incluant les bonnes pratiques, l'intégration CI/CD et la comparaison détaillée des approches.