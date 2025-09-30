# 4. Outils et Bonnes Pratiques

## 🎯 Objectifs d'Apprentissage

À l'issue de cette section, vous serez capable de :
- Choisir les outils appropriés selon le contexte
- Appliquer les bonnes pratiques de l'industrie
- Configurer des environnements de test robustes
- Optimiser les workflows CI/CD

## 🛠️ Panorama des Outils de Test

### Frameworks de Test JavaScript

#### Jest
**Avantages :**
- Configuration zéro par défaut
- Mocking intégré puissant
- Snapshot testing
- Couverture de code native

**Configuration type :**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
  ]
};
```

**Exemple de test :**
```javascript
// user.test.js
import { createUser, validateEmail } from './user';

describe('User Management', () => {
  test('should create user with valid data', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };
    
    const user = createUser(userData);
    
    expect(user).toHaveProperty('id');
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
  });

  test('should validate email format', () => {
    expect(validateEmail('valid@email.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });
});
```

#### Mocha + Chai
**Avantages :**
- Flexibilité maximale
- Nombreux plugins disponibles
- Syntaxe expressive avec Chai

**Configuration :**
```javascript
// mocha.opts
--require @babel/register
--recursive
--timeout 5000
test/**/*.test.js
```

**Exemple de test :**
```javascript
import { expect } from 'chai';
import { calculateTotal } from './calculator';

describe('Calculator', () => {
  it('should calculate total with tax', () => {
    const result = calculateTotal(100, 0.2);
    expect(result).to.equal(120);
  });

  it('should handle edge cases', () => {
    expect(() => calculateTotal(-100, 0.2)).to.throw('Invalid amount');
  });
});
```

### Outils de Test E2E

#### Cypress
**Avantages :**
- Interface utilisateur intuitive
- Debugging en temps réel
- Screenshots et vidéos automatiques
- API moderne et simple

**Configuration :**
```javascript
// cypress.config.js
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000
  }
})
```

**Exemple de test :**
```javascript
// cypress/e2e/login.cy.js
describe('User Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login with valid credentials', () => {
    cy.get('[data-cy=email]').type('user@example.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=login-button]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy=welcome-message]').should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    cy.get('[data-cy=email]').type('invalid@example.com');
    cy.get('[data-cy=password]').type('wrongpassword');
    cy.get('[data-cy=login-button]').click();
    
    cy.get('[data-cy=error-message]')
      .should('be.visible')
      .and('contain', 'Invalid credentials');
  });
});
```

#### Playwright
**Avantages :**
- Support multi-navigateurs natif
- Parallélisation avancée
- API moderne avec async/await
- Capture de traces détaillées

**Configuration :**
```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

**Exemple de test :**
```javascript
// tests/login.spec.js
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid=email]', 'user@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');
    
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid=welcome]')).toBeVisible();
  });

  test('should handle login failure', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid=email]', 'invalid@example.com');
    await page.fill('[data-testid=password]', 'wrongpassword');
    await page.click('[data-testid=login-button]');
    
    await expect(page.locator('[data-testid=error]')).toContainText('Invalid credentials');
  });
});
```

#### Selenium WebDriver
**Avantages :**
- Standard de l'industrie
- Support de nombreux langages
- Écosystème mature
- Grid pour tests distribués

**Exemple avec Node.js :**
```javascript
// selenium-test.js
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('Selenium Tests', () => {
  let driver;

  beforeEach(async () => {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  afterEach(async () => {
    await driver.quit();
  });

  test('should perform login', async () => {
    await driver.get('http://localhost:3000/login');
    
    await driver.findElement(By.id('email')).sendKeys('user@example.com');
    await driver.findElement(By.id('password')).sendKeys('password123');
    await driver.findElement(By.id('login-button')).click();
    
    await driver.wait(until.urlContains('dashboard'), 10000);
    
    const welcomeElement = await driver.findElement(By.id('welcome'));
    const isDisplayed = await welcomeElement.isDisplayed();
    expect(isDisplayed).toBe(true);
  });
});
```

## 🔧 Outils d'Analyse et de Qualité

### ESLint - Analyse Statique

#### Configuration avancée
```javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'jsx-a11y',
    'import'
  ],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal'],
      'newlines-between': 'always'
    }]
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
```

### SonarQube - Qualité de Code

#### Configuration projet
```properties
# sonar-project.properties
sonar.projectKey=my-project
sonar.projectName=My Project
sonar.projectVersion=1.0
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.test.js,**/*.spec.js
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/*.test.js,**/*.spec.js,**/node_modules/**
```

#### Intégration CI/CD
```yaml
- name: SonarQube Scan
  uses: sonarqube-quality-gate-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

### Lighthouse - Performance Web

#### Configuration CI
```yaml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    configPath: './lighthouserc.json'
    uploadArtifacts: true
    temporaryPublicStorage: true
```

#### Configuration Lighthouse
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "startServerCommand": "npm start",
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["warn", {"minScore": 0.9}],
        "categories:seo": ["warn", {"minScore": 0.9}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

## 📊 Monitoring et Observabilité

### Prometheus + Grafana

#### Métriques applicatives
```javascript
// metrics.js
import client from 'prom-client';

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const recordHttpRequest = (method, route, statusCode, duration) => {
  httpRequestsTotal.inc({ method, route, status_code: statusCode });
  httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
};
```

#### Dashboard Grafana
```json
{
  "dashboard": {
    "title": "Application Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

### ELK Stack - Logs

#### Configuration Logstash
```ruby
# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][logtype] == "application" {
    json {
      source => "message"
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    mutate {
      remove_field => [ "message" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "application-logs-%{+YYYY.MM.dd}"
  }
}
```

## 🏗️ Infrastructure as Code

### Docker pour les Tests

#### Multi-stage optimisé
```dockerfile
# Dockerfile.test
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS dev-deps
RUN npm ci

FROM dev-deps AS test
COPY . .
RUN npm run lint
RUN npm run test:unit
RUN npm run test:integration

FROM base AS production
COPY --from=test /app/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose pour développement
```yaml
# docker-compose.test.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.test
      target: test
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgres://test:test@postgres:5432/testdb
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./coverage:/app/coverage

  postgres:
    image: postgres:13-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: testdb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:6-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Kubernetes pour les Tests

#### Job de test
```yaml
# test-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: app-tests
spec:
  template:
    spec:
      containers:
      - name: test-runner
        image: myapp:test
        command: ["npm", "run", "test:ci"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
      restartPolicy: Never
  backoffLimit: 3
```

## 🎯 Bonnes Pratiques Avancées

### Test Data Management

#### Factory Pattern
```javascript
// factories/userFactory.js
import { faker } from '@faker-js/faker';

export const createUser = (overrides = {}) => ({
  id: faker.datatype.uuid(),
  name: faker.name.fullName(),
  email: faker.internet.email(),
  createdAt: faker.date.recent(),
  ...overrides
});

export const createUsers = (count = 5, overrides = {}) => 
  Array.from({ length: count }, () => createUser(overrides));
```

#### Database Seeding
```javascript
// seeds/testData.js
import { createUser } from '../factories/userFactory';
import { User } from '../models/User';

export const seedTestData = async () => {
  // Clean existing data
  await User.deleteMany({});
  
  // Create test users
  const users = createUsers(10);
  await User.insertMany(users);
  
  return { users };
};
```

### Page Object Model

#### Page Object
```javascript
// pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = '[data-testid=email]';
    this.passwordInput = '[data-testid=password]';
    this.loginButton = '[data-testid=login-button]';
    this.errorMessage = '[data-testid=error-message]';
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.page.fill(this.emailInput, email);
    await this.page.fill(this.passwordInput, password);
    await this.page.click(this.loginButton);
  }

  async getErrorMessage() {
    return await this.page.textContent(this.errorMessage);
  }

  async isErrorVisible() {
    return await this.page.isVisible(this.errorMessage);
  }
}
```

#### Utilisation dans les tests
```javascript
// tests/login.spec.js
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Tests', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should login with valid credentials', async () => {
    await loginPage.login('user@example.com', 'password123');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show error with invalid credentials', async () => {
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    expect(await loginPage.isErrorVisible()).toBe(true);
    expect(await loginPage.getErrorMessage()).toContain('Invalid credentials');
  });
});
```

### Test Environment Management

#### Configuration par environnement
```javascript
// config/test.js
const config = {
  development: {
    database: {
      host: 'localhost',
      port: 5432,
      name: 'myapp_dev'
    },
    redis: {
      host: 'localhost',
      port: 6379
    }
  },
  test: {
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      name: 'myapp_test'
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    }
  },
  ci: {
    database: {
      host: 'postgres',
      port: 5432,
      name: 'testdb'
    },
    redis: {
      host: 'redis',
      port: 6379
    }
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

## 🎓 Points Clés à Retenir

1. **Choix d'outils** : Adapter selon le contexte et les besoins
2. **Configuration** : Investir dans une configuration robuste
3. **Maintenance** : Prévoir la maintenance des tests et outils
4. **Monitoring** : Surveiller les performances et la qualité
5. **Évolution** : Rester à jour avec les nouvelles pratiques

---

**Section précédente :** [Intégration des tests dans CI/CD](03-integration-tests-cicd.md)  
**Module suivant :** [Module 2 - IA et Automatisation des Tests](../../module-2-ia-tests/README.md)

**Compétences travaillées :** C8, C17  
**Durée estimée :** 120 minutes