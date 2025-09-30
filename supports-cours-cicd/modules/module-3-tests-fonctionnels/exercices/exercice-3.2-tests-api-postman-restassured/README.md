# Exercice 3.2 - Tests API avec Postman et RestAssured

## Objectifs

- Créer et organiser des collections de tests API avec Postman
- Implémenter des tests API automatisés avec RestAssured
- Valider les contrats d'API et les schémas de données
- Intégrer les tests API dans un pipeline CI/CD
- Comparer les approches Postman et RestAssured

## Contexte

Vous devez tester l'API REST d'une application e-commerce qui expose les endpoints suivants :
- Authentification (login/logout)
- Gestion des utilisateurs (CRUD)
- Catalogue de produits (recherche, filtrage)
- Gestion du panier
- Processus de commande

## Prérequis

- Postman installé
- Java 11+ et Maven
- Node.js (pour l'API de test)
- Docker (pour la base de données)

## Matériel Fourni

- API e-commerce de démonstration
- Documentation OpenAPI/Swagger
- Données de test et fixtures
- Configuration de base Postman et RestAssured

## Instructions

### Étape 1 : Démarrage de l'API de Test

```bash
# Cloner les ressources
cd ressources/

# Démarrer l'API et la base de données
docker-compose up -d

# Vérifier que l'API fonctionne
curl http://localhost:3000/api/health
```

L'API sera accessible sur `http://localhost:3000/api`
La documentation Swagger sur `http://localhost:3000/api-docs`

### Étape 2 : Tests avec Postman

#### 2.1 Configuration de l'Environnement

1. **Créer un environnement Postman**
```json
{
  "name": "E-commerce API Test",
  "values": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api",
      "enabled": true
    },
    {
      "key": "authToken",
      "value": "",
      "enabled": true
    },
    {
      "key": "userId",
      "value": "",
      "enabled": true
    }
  ]
}
```

2. **Créer une collection "E-commerce API Tests"**

#### 2.2 Tests d'Authentification

Créez les requêtes suivantes dans un dossier "Authentication" :

**POST /auth/register**
```javascript
// Pre-request Script
pm.environment.set("randomEmail", `test${Math.random().toString(36).substring(7)}@example.com`);

// Request Body
{
  "name": "Test User",
  "email": "{{randomEmail}}",
  "password": "password123"
}

// Tests
pm.test("User registration successful", function () {
    pm.response.to.have.status(201);
    
    const responseJson = pm.response.json();
    pm.expect(responseJson).to.have.property('id');
    pm.expect(responseJson).to.have.property('email');
    pm.expect(responseJson.email).to.eql(pm.environment.get('randomEmail'));
    
    // Sauvegarder l'ID utilisateur
    pm.environment.set('userId', responseJson.id);
});

pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

pm.test("Response has correct structure", function () {
    const schema = {
        type: "object",
        properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            createdAt: { type: "string" }
        },
        required: ["id", "name", "email", "createdAt"]
    };
    
    pm.expect(pm.response.json()).to.be.jsonSchema(schema);
});
```

**POST /auth/login**
```javascript
// Request Body
{
  "email": "{{randomEmail}}",
  "password": "password123"
}

// Tests
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    
    const responseJson = pm.response.json();
    pm.expect(responseJson).to.have.property('token');
    pm.expect(responseJson).to.have.property('user');
    
    // Sauvegarder le token pour les requêtes suivantes
    pm.environment.set('authToken', responseJson.token);
});

pm.test("Token is valid JWT", function () {
    const token = pm.response.json().token;
    const parts = token.split('.');
    pm.expect(parts).to.have.lengthOf(3);
});
```

#### 2.3 Tests des Produits

**GET /products**
```javascript
// Tests
pm.test("Products list retrieved", function () {
    pm.response.to.have.status(200);
    
    const products = pm.response.json();
    pm.expect(products).to.be.an('array');
    pm.expect(products.length).to.be.greaterThan(0);
});

pm.test("Each product has required fields", function () {
    const products = pm.response.json();
    
    products.forEach(product => {
        pm.expect(product).to.have.property('id');
        pm.expect(product).to.have.property('name');
        pm.expect(product).to.have.property('price');
        pm.expect(product).to.have.property('category');
        pm.expect(product.price).to.be.a('number');
        pm.expect(product.price).to.be.greaterThan(0);
    });
});

pm.test("Products are properly paginated", function () {
    const response = pm.response.json();
    
    if (response.pagination) {
        pm.expect(response.pagination).to.have.property('page');
        pm.expect(response.pagination).to.have.property('limit');
        pm.expect(response.pagination).to.have.property('total');
    }
});
```

**GET /products/search?q=laptop**
```javascript
// Tests
pm.test("Search returns relevant results", function () {
    pm.response.to.have.status(200);
    
    const products = pm.response.json();
    pm.expect(products).to.be.an('array');
    
    // Vérifier que les résultats contiennent le terme recherché
    products.forEach(product => {
        const searchTerm = 'laptop';
        const productText = (product.name + ' ' + product.description).toLowerCase();
        pm.expect(productText).to.include(searchTerm);
    });
});
```

#### 2.4 Tests du Panier (Authentifiés)

**POST /cart/items**
```javascript
// Headers
Authorization: Bearer {{authToken}}

// Request Body
{
  "productId": "{{productId}}",
  "quantity": 2
}

// Tests
pm.test("Item added to cart", function () {
    pm.response.to.have.status(201);
    
    const cartItem = pm.response.json();
    pm.expect(cartItem).to.have.property('id');
    pm.expect(cartItem).to.have.property('productId');
    pm.expect(cartItem).to.have.property('quantity');
    pm.expect(cartItem.quantity).to.eql(2);
});

pm.test("Unauthorized access blocked", function () {
    // Ce test sera dans une requête séparée sans token
    // pm.response.to.have.status(401);
});
```

#### 2.5 Tests de Workflow Complet

Créez un dossier "Complete Workflow" avec une séquence de tests :

1. Register user
2. Login
3. Get products
4. Add items to cart
5. Get cart
6. Create order
7. Get order details

### Étape 3 : Tests avec RestAssured

#### 3.1 Configuration du Projet Maven

```xml
<!-- pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>api-tests</artifactId>
    <version>1.0.0</version>
    
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <rest-assured.version>5.3.0</rest-assured.version>
        <junit.version>5.9.2</junit.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>io.rest-assured</groupId>
            <artifactId>rest-assured</artifactId>
            <version>${rest-assured.version}</version>
            <scope>test</scope>
        </dependency>
        
        <dependency>
            <groupId>io.rest-assured</groupId>
            <artifactId>json-schema-validator</artifactId>
            <version>${rest-assured.version}</version>
            <scope>test</scope>
        </dependency>
        
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${junit.version}</version>
            <scope>test</scope>
        </dependency>
        
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.14.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

#### 3.2 Configuration de Base

```java
// src/test/java/config/ApiTestConfig.java
package config;

import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.builder.ResponseSpecBuilder;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;
import io.restassured.specification.ResponseSpecification;
import org.junit.jupiter.api.BeforeAll;

public class ApiTestConfig {
    
    protected static RequestSpecification requestSpec;
    protected static ResponseSpecification responseSpec;
    
    @BeforeAll
    public static void setup() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = 3000;
        RestAssured.basePath = "/api";
        
        requestSpec = new RequestSpecBuilder()
            .setContentType(ContentType.JSON)
            .setAccept(ContentType.JSON)
            .build();
            
        responseSpec = new ResponseSpecBuilder()
            .expectContentType(ContentType.JSON)
            .build();
    }
}
```

#### 3.3 Modèles de Données

```java
// src/test/java/models/User.java
package models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class User {
    private String id;
    private String name;
    private String email;
    private String createdAt;
    
    // Constructeurs
    public User() {}
    
    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
    }
    
    // Getters et Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
```

```java
// src/test/java/models/Product.java
package models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Product {
    private String id;
    private String name;
    private String description;
    private Double price;
    private String category;
    private Integer stock;
    
    // Constructeurs, getters et setters...
}
```

#### 3.4 Tests d'Authentification

```java
// src/test/java/tests/AuthenticationTest.java
package tests;

import config.ApiTestConfig;
import models.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;

import static io.restassured.RestAssured.*;
import static io.restassured.matcher.RestAssuredMatchers.*;
import static org.hamcrest.Matchers.*;

public class AuthenticationTest extends ApiTestConfig {
    
    private String testEmail;
    private String testPassword = "password123";
    
    @BeforeEach
    void generateTestData() {
        testEmail = "test" + System.currentTimeMillis() + "@example.com";
    }
    
    @Test
    @DisplayName("User registration should succeed with valid data")
    void testUserRegistration() {
        User newUser = new User("Test User", testEmail, testPassword);
        
        User createdUser = given()
            .spec(requestSpec)
            .body(newUser)
        .when()
            .post("/auth/register")
        .then()
            .spec(responseSpec)
            .statusCode(201)
            .body("id", notNullValue())
            .body("name", equalTo("Test User"))
            .body("email", equalTo(testEmail))
            .body("createdAt", notNullValue())
            .time(lessThan(2000L))
        .extract()
            .as(User.class);
            
        // Assertions supplémentaires
        assertThat(createdUser.getId(), is(notNullValue()));
        assertThat(createdUser.getEmail(), equalTo(testEmail));
    }
    
    @Test
    @DisplayName("User login should return valid token")
    void testUserLogin() {
        // D'abord créer un utilisateur
        given()
            .spec(requestSpec)
            .body(new User("Test User", testEmail, testPassword))
        .when()
            .post("/auth/register")
        .then()
            .statusCode(201);
            
        // Ensuite se connecter
        String token = given()
            .spec(requestSpec)
            .body(Map.of(
                "email", testEmail,
                "password", testPassword
            ))
        .when()
            .post("/auth/login")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("token", notNullValue())
            .body("user.email", equalTo(testEmail))
        .extract()
            .path("token");
            
        // Vérifier que le token est un JWT valide
        assertThat(token.split("\\."), hasSize(3));
    }
    
    @Test
    @DisplayName("Login should fail with invalid credentials")
    void testInvalidLogin() {
        given()
            .spec(requestSpec)
            .body(Map.of(
                "email", "invalid@example.com",
                "password", "wrongpassword"
            ))
        .when()
            .post("/auth/login")
        .then()
            .statusCode(401)
            .body("error", containsString("Invalid credentials"));
    }
    
    @Test
    @DisplayName("Registration should fail with duplicate email")
    void testDuplicateEmailRegistration() {
        User user = new User("Test User", testEmail, testPassword);
        
        // Première inscription
        given()
            .spec(requestSpec)
            .body(user)
        .when()
            .post("/auth/register")
        .then()
            .statusCode(201);
            
        // Deuxième inscription avec le même email
        given()
            .spec(requestSpec)
            .body(user)
        .when()
            .post("/auth/register")
        .then()
            .statusCode(409)
            .body("error", containsString("Email already exists"));
    }
}
```

#### 3.5 Tests des Produits avec Validation de Schéma

```java
// src/test/java/tests/ProductTest.java
package tests;

import config.ApiTestConfig;
import models.Product;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static io.restassured.RestAssured.*;
import static io.restassured.module.jsv.JsonSchemaValidator.*;
import static org.hamcrest.Matchers.*;

public class ProductTest extends ApiTestConfig {
    
    @Test
    @DisplayName("Get all products should return valid product list")
    void testGetAllProducts() {
        Product[] products = given()
            .spec(requestSpec)
        .when()
            .get("/products")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("", hasSize(greaterThan(0)))
            .body("[0].id", notNullValue())
            .body("[0].name", notNullValue())
            .body("[0].price", greaterThan(0f))
        .extract()
            .as(Product[].class);
            
        // Vérifications supplémentaires
        assertThat(products.length, greaterThan(0));
        
        for (Product product : products) {
            assertThat(product.getId(), is(notNullValue()));
            assertThat(product.getName(), is(not(emptyString())));
            assertThat(product.getPrice(), greaterThan(0.0));
        }
    }
    
    @Test
    @DisplayName("Product search should return filtered results")
    void testProductSearch() {
        given()
            .spec(requestSpec)
            .queryParam("q", "laptop")
        .when()
            .get("/products/search")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("", hasSize(greaterThan(0)))
            .body("findAll { it.name.toLowerCase().contains('laptop') }", 
                  hasSize(greaterThan(0)));
    }
    
    @Test
    @DisplayName("Get product by ID should return correct product")
    void testGetProductById() {
        // D'abord récupérer un ID de produit existant
        String productId = given()
            .spec(requestSpec)
        .when()
            .get("/products")
        .then()
            .statusCode(200)
        .extract()
            .path("[0].id");
            
        // Ensuite récupérer ce produit spécifique
        given()
            .spec(requestSpec)
            .pathParam("id", productId)
        .when()
            .get("/products/{id}")
        .then()
            .spec(responseSpec)
            .statusCode(200)
            .body("id", equalTo(productId))
            .body(matchesJsonSchemaInClasspath("schemas/product-schema.json"));
    }
    
    @Test
    @DisplayName("Get non-existent product should return 404")
    void testGetNonExistentProduct() {
        given()
            .spec(requestSpec)
            .pathParam("id", "non-existent-id")
        .when()
            .get("/products/{id}")
        .then()
            .statusCode(404)
            .body("error", containsString("Product not found"));
    }
}
```

### Étape 4 : Validation de Schémas JSON

Créez des schémas JSON pour valider la structure des réponses :

```json
// src/test/resources/schemas/product-schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-zA-Z0-9-]+$"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "description": {
      "type": "string",
      "maxLength": 500
    },
    "price": {
      "type": "number",
      "minimum": 0
    },
    "category": {
      "type": "string",
      "enum": ["Electronics", "Clothing", "Books", "Home"]
    },
    "stock": {
      "type": "integer",
      "minimum": 0
    }
  },
  "required": ["id", "name", "price", "category"],
  "additionalProperties": false
}
```

### Étape 5 : Tests de Performance API

```java
// src/test/java/tests/PerformanceTest.java
package tests;

import config.ApiTestConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class PerformanceTest extends ApiTestConfig {
    
    @Test
    @DisplayName("API endpoints should respond within acceptable time")
    void testResponseTimes() {
        // Test de temps de réponse pour différents endpoints
        given()
            .spec(requestSpec)
        .when()
            .get("/products")
        .then()
            .statusCode(200)
            .time(lessThan(1000L)); // Moins d'1 seconde
            
        given()
            .spec(requestSpec)
        .when()
            .get("/health")
        .then()
            .statusCode(200)
            .time(lessThan(100L)); // Moins de 100ms
    }
    
    @Test
    @DisplayName("API should handle concurrent requests")
    void testConcurrentRequests() {
        // Test de charge simple avec RestAssured
        IntStream.range(0, 10)
            .parallel()
            .forEach(i -> {
                given()
                    .spec(requestSpec)
                .when()
                    .get("/products")
                .then()
                    .statusCode(200)
                    .time(lessThan(2000L));
            });
    }
}
```

### Étape 6 : Intégration CI/CD

```yaml
# .github/workflows/api-tests.yml
name: API Tests

on: [push, pull_request]

jobs:
  postman-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Start API
      run: |
        cd ressources
        docker-compose up -d
        sleep 30
        
    - name: Run Postman Tests
      uses: matt-ball/newman-action@master
      with:
        collection: postman/E-commerce-API-Tests.postman_collection.json
        environment: postman/Test-Environment.postman_environment.json
        reporters: '["cli", "json", "htmlextra"]'
        
    - name: Upload Postman Results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: postman-results
        path: newman/
        
  restassured-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        distribution: 'temurin'
        
    - name: Start API
      run: |
        cd ressources
        docker-compose up -d
        sleep 30
        
    - name: Run RestAssured Tests
      run: |
        cd restassured-tests
        mvn clean test
        
    - name: Upload Test Results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: restassured-results
        path: |
          restassured-tests/target/surefire-reports/
          restassured-tests/target/site/
```

## Résultat Attendu

À la fin de cet exercice, vous devriez avoir :

1. **Collection Postman complète** avec :
   - Tests d'authentification
   - Tests CRUD pour tous les endpoints
   - Validation des schémas de réponse
   - Tests de workflow end-to-end

2. **Suite de tests RestAssured** incluant :
   - Tests unitaires pour chaque endpoint
   - Validation de schémas JSON
   - Tests de performance basiques
   - Gestion des erreurs

3. **Intégration CI/CD** avec :
   - Exécution automatique des tests
   - Rapports détaillés
   - Validation des contrats d'API

## Critères de Validation

- [ ] Collection Postman exécutable sans erreur
- [ ] Tests RestAssured passent avec succès
- [ ] Validation des schémas JSON implémentée
- [ ] Tests de performance basiques fonctionnels
- [ ] Pipeline CI/CD configuré
- [ ] Documentation des différences Postman/RestAssured

## Points Clés à Retenir

- **Postman** : Interface graphique, collaboration facile, tests rapides
- **RestAssured** : Intégration Java, tests robustes, CI/CD natif
- **Validation de schémas** : Contrats d'API fiables
- **Tests de performance** : Détection précoce des problèmes