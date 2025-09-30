# 1. Tests Fonctionnels Automatisés

## 1.1 Introduction aux Tests Fonctionnels

### Définition et Objectifs

Les tests fonctionnels vérifient que l'application fonctionne conformément aux spécifications métier. Ils valident :
- Les fonctionnalités utilisateur
- Les flux de navigation
- L'intégration entre composants
- La conformité aux exigences

### Types de Tests Fonctionnels

**Tests d'Interface Utilisateur (UI)**
- Validation des éléments visuels
- Vérification des interactions utilisateur
- Tests de navigation et de workflow

**Tests d'API**
- Validation des endpoints REST/GraphQL
- Vérification des contrats d'interface
- Tests d'intégration entre services

**Tests End-to-End (E2E)**
- Simulation de parcours utilisateur complets
- Validation des flux métier critiques
- Tests cross-browser et cross-platform

## 1.2 Tests UI avec Selenium

### Présentation de Selenium

Selenium est une suite d'outils pour l'automatisation des navigateurs web :
- **Selenium WebDriver** : API pour contrôler les navigateurs
- **Selenium Grid** : Exécution distribuée des tests
- **Selenium IDE** : Enregistrement et lecture de tests

### Architecture Selenium WebDriver

```
Test Script → WebDriver API → Browser Driver → Browser
```

### Avantages de Selenium
- Support multi-navigateurs (Chrome, Firefox, Safari, Edge)
- Langages multiples (Java, Python, C#, JavaScript)
- Intégration CI/CD native
- Communauté active et écosystème riche

### Exemple de Test Selenium (JavaScript)

```javascript
const { Builder, By, until } = require('selenium-webdriver');

describe('Login Test', () => {
  let driver;

  beforeEach(async () => {
    driver = await new Builder().forBrowser('chrome').build();
  });

  afterEach(async () => {
    await driver.quit();
  });

  it('should login successfully', async () => {
    await driver.get('http://localhost:3000/login');
    
    await driver.findElement(By.id('username')).sendKeys('testuser');
    await driver.findElement(By.id('password')).sendKeys('password123');
    await driver.findElement(By.css('button[type="submit"]')).click();
    
    await driver.wait(until.urlContains('/dashboard'), 5000);
    
    const title = await driver.getTitle();
    expect(title).toContain('Dashboard');
  });
});
```

## 1.3 Tests UI avec Cypress

### Présentation de Cypress

Cypress est un framework de test moderne conçu pour les applications web :
- Exécution dans le navigateur
- Debugging en temps réel
- Captures d'écran et vidéos automatiques
- API intuitive et moderne

### Architecture Cypress

```
Test Runner → Cypress App → Browser (même origine)
```

### Avantages de Cypress
- Configuration minimale
- Debugging interactif
- Tests rapides et fiables
- Mocking et stubbing intégrés
- Time-travel debugging

### Exemple de Test Cypress

```javascript
describe('E-commerce Checkout', () => {
  beforeEach(() => {
    cy.visit('/products');
  });

  it('should complete purchase flow', () => {
    // Ajouter un produit au panier
    cy.get('[data-testid="product-1"]').click();
    cy.get('[data-testid="add-to-cart"]').click();
    
    // Aller au panier
    cy.get('[data-testid="cart-icon"]').click();
    cy.url().should('include', '/cart');
    
    // Procéder au checkout
    cy.get('[data-testid="checkout-btn"]').click();
    
    // Remplir les informations
    cy.get('#email').type('user@example.com');
    cy.get('#address').type('123 Test Street');
    cy.get('#payment-method').select('credit-card');
    
    // Confirmer la commande
    cy.get('[data-testid="confirm-order"]').click();
    
    // Vérifier la confirmation
    cy.contains('Order confirmed').should('be.visible');
    cy.url().should('include', '/order-confirmation');
  });
});
```

## 1.4 Tests API avec Postman

### Présentation de Postman

Postman est une plateforme complète pour le développement et test d'API :
- Interface graphique intuitive
- Collections et environnements
- Tests automatisés avec scripts
- Monitoring et documentation

### Fonctionnalités Clés
- **Collections** : Organisation des requêtes
- **Environments** : Gestion des variables
- **Tests Scripts** : Validation automatisée
- **Newman** : Exécution en ligne de commande

### Exemple de Test Postman

```javascript
// Test de création d'utilisateur
pm.test("User creation successful", function () {
    pm.response.to.have.status(201);
    
    const responseJson = pm.response.json();
    pm.expect(responseJson).to.have.property('id');
    pm.expect(responseJson.email).to.eql(pm.environment.get('user_email'));
    
    // Sauvegarder l'ID pour les tests suivants
    pm.environment.set('user_id', responseJson.id);
});

pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

## 1.5 Tests API avec RestAssured

### Présentation de RestAssured

RestAssured est une bibliothèque Java pour tester les services REST :
- Syntaxe fluide et expressive
- Validation JSON/XML intégrée
- Support OAuth et authentification
- Intégration JUnit/TestNG

### Avantages de RestAssured
- API intuitive (Given-When-Then)
- Validation de schéma automatique
- Gestion des cookies et sessions
- Logging détaillé des requêtes/réponses

### Exemple de Test RestAssured

```java
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class UserApiTest {
    
    @Test
    public void testCreateUser() {
        given()
            .contentType("application/json")
            .body("{ \"name\": \"John Doe\", \"email\": \"john@example.com\" }")
        .when()
            .post("/api/users")
        .then()
            .statusCode(201)
            .body("name", equalTo("John Doe"))
            .body("email", equalTo("john@example.com"))
            .body("id", notNullValue())
            .time(lessThan(2000L));
    }
    
    @Test
    public void testGetUserById() {
        int userId = createTestUser();
        
        given()
            .pathParam("id", userId)
        .when()
            .get("/api/users/{id}")
        .then()
            .statusCode(200)
            .body("id", equalTo(userId))
            .body("name", notNullValue())
            .body("email", matchesPattern(".*@.*\\..*"));
    }
}
```

## 1.6 Stratégies de Test et Bonnes Pratiques

### Pyramide des Tests

```
    E2E Tests (Peu)
   ↗              ↖
Integration Tests (Quelques)
↗                        ↖
Unit Tests (Beaucoup)
```

### Bonnes Pratiques

**Organisation des Tests**
- Structure claire et cohérente
- Nommage descriptif des tests
- Groupement par fonctionnalité
- Isolation des tests

**Données de Test**
- Utilisation de fixtures
- Nettoyage après chaque test
- Données anonymisées
- Environnements dédiés

**Maintenance**
- Page Object Model pour UI
- Factorisation du code commun
- Gestion des sélecteurs robustes
- Documentation des tests

### Intégration CI/CD

**Configuration Pipeline**
```yaml
test-functional:
  stage: test
  script:
    - npm install
    - npm run test:api
    - npm run test:ui:headless
  artifacts:
    reports:
      junit: test-results.xml
    paths:
      - screenshots/
      - videos/
```

**Parallélisation**
- Exécution simultanée des tests
- Distribution sur plusieurs agents
- Optimisation des temps d'exécution
- Gestion des ressources partagées