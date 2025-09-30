# Exercice 3.3 - Simulation de Charge avec JMeter

## Objectifs

- Configurer et utiliser Apache JMeter pour les tests de charge
- Créer des scénarios de test réalistes avec montée en charge progressive
- Analyser les résultats de performance et identifier les goulots d'étranglement
- Intégrer les tests de charge dans un pipeline CI/CD
- Optimiser les performances basées sur les résultats

## Contexte

Vous devez valider les performances de l'API e-commerce sous différentes charges :
- Charge normale (100 utilisateurs simultanés)
- Pic de trafic (500 utilisateurs)
- Test de stabilité (charge constante sur 30 minutes)
- Test de stress (montée jusqu'au point de rupture)

## Prérequis

- Apache JMeter 5.4+
- Java 11+
- Application e-commerce démarrée
- Accès aux métriques système (optionnel)

## Matériel Fourni

- Plans de test JMeter de base
- Scripts de données de test
- Configuration de monitoring
- Templates de rapports

## Instructions

### Étape 1 : Installation et Configuration de JMeter

```bash
# Télécharger JMeter
wget https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.4.1.tgz
tar -xzf apache-jmeter-5.4.1.tgz
cd apache-jmeter-5.4.1

# Démarrer JMeter en mode GUI (pour développement)
./bin/jmeter

# Ou en mode ligne de commande (pour CI/CD)
./bin/jmeter -n -t test-plan.jmx -l results.jtl
```

### Étape 2 : Création du Plan de Test de Base

#### 2.1 Structure du Plan de Test

Créez un nouveau plan de test avec la structure suivante :

```
Test Plan: E-commerce Load Test
├── User Defined Variables
├── HTTP Request Defaults
├── HTTP Header Manager
├── Thread Group: Normal Load
│   ├── CSV Data Set Config
│   ├── Login Request
│   ├── Browse Products
│   ├── Add to Cart
│   ├── Checkout Process
│   └── Logout
├── Thread Group: Spike Load
├── Listeners
│   ├── View Results Tree
│   ├── Aggregate Report
│   ├── Response Time Graph
│   └── Backend Listener (InfluxDB)
└── Assertions
```

#### 2.2 Configuration des Variables Globales

```xml
<!-- User Defined Variables -->
<elementProp name="TestPlan.arguments" elementType="Arguments">
  <collectionProp name="Arguments.arguments">
    <elementProp name="SERVER_NAME" elementType="Argument">
      <stringProp name="Argument.name">SERVER_NAME</stringProp>
      <stringProp name="Argument.value">localhost</stringProp>
    </elementProp>
    <elementProp name="SERVER_PORT" elementType="Argument">
      <stringProp name="Argument.name">SERVER_PORT</stringProp>
      <stringProp name="Argument.value">3000</stringProp>
    </elementProp>
    <elementProp name="API_PATH" elementType="Argument">
      <stringProp name="Argument.name">API_PATH</stringProp>
      <stringProp name="Argument.value">/api</stringProp>
    </elementProp>
  </collectionProp>
</elementProp>
```

#### 2.3 Configuration HTTP par Défaut

```xml
<!-- HTTP Request Defaults -->
<ConfigTestElement testname="HTTP Request Defaults">
  <elementProp name="HTTPsampler.Arguments" elementType="Arguments"/>
  <stringProp name="HTTPSampler.domain">${SERVER_NAME}</stringProp>
  <stringProp name="HTTPSampler.port">${SERVER_PORT}</stringProp>
  <stringProp name="HTTPSampler.protocol">http</stringProp>
  <stringProp name="HTTPSampler.path">${API_PATH}</stringProp>
  <stringProp name="HTTPSampler.implementation">HttpClient4</stringProp>
</ConfigTestElement>
```

### Étape 3 : Scénario de Test Utilisateur Réaliste

#### 3.1 Données de Test CSV

Créez un fichier `users.csv` :
```csv
username,password,email
user1,password123,user1@example.com
user2,password123,user2@example.com
user3,password123,user3@example.com
user4,password123,user4@example.com
user5,password123,user5@example.com
```

#### 3.2 Configuration CSV Data Set

```xml
<!-- CSV Data Set Config -->
<CSVDataSet testname="User Data">
  <stringProp name="filename">users.csv</stringProp>
  <stringProp name="fileEncoding">UTF-8</stringProp>
  <stringProp name="variableNames">username,password,email</stringProp>
  <boolProp name="ignoreFirstLine">true</boolProp>
  <stringProp name="delimiter">,</stringProp>
  <boolProp name="quotedData">false</boolProp>
  <boolProp name="recycle">true</boolProp>
  <boolProp name="stopThread">false</boolProp>
  <stringProp name="shareMode">shareMode.all</stringProp>
</CSVDataSet>
```

#### 3.3 Séquence de Requêtes Utilisateur

**1. Connexion Utilisateur**
```xml
<!-- Login Request -->
<HTTPSamplerProxy testname="User Login">
  <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
    <collectionProp name="Arguments.arguments">
      <elementProp name="" elementType="HTTPArgument">
        <boolProp name="HTTPArgument.always_encode">false</boolProp>
        <stringProp name="Argument.value">{"email":"${email}","password":"${password}"}</stringProp>
        <stringProp name="Argument.metadata">=</stringProp>
      </elementProp>
    </collectionProp>
  </elementProp>
  <stringProp name="HTTPSampler.method">POST</stringProp>
  <stringProp name="HTTPSampler.path">/auth/login</stringProp>
  <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
</HTTPSamplerProxy>

<!-- JSON Extractor pour récupérer le token -->
<JSONPostProcessor testname="Extract Auth Token">
  <stringProp name="JSONPostProcessor.referenceNames">authToken</stringProp>
  <stringProp name="JSONPostProcessor.jsonPathExpressions">$.token</stringProp>
  <stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
</JSONPostProcessor>
```

**2. Navigation dans les Produits**
```xml
<!-- Browse Products -->
<HTTPSamplerProxy testname="Get Products">
  <stringProp name="HTTPSampler.method">GET</stringProp>
  <stringProp name="HTTPSampler.path">/products</stringProp>
</HTTPSamplerProxy>

<!-- Random Product Selection -->
<BeanShellPostProcessor testname="Select Random Product">
  <stringProp name="BeanShellPostProcessor.query">
    import org.json.JSONArray;
    import org.json.JSONObject;
    
    String response = prev.getResponseDataAsString();
    JSONArray products = new JSONArray(response);
    
    if (products.length() > 0) {
        int randomIndex = (int)(Math.random() * products.length());
        JSONObject selectedProduct = products.getJSONObject(randomIndex);
        vars.put("selectedProductId", selectedProduct.getString("id"));
        vars.put("selectedProductName", selectedProduct.getString("name"));
    }
  </stringProp>
</BeanShellPostProcessor>
```

**3. Ajout au Panier**
```xml
<!-- Add to Cart -->
<HTTPSamplerProxy testname="Add Product to Cart">
  <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
    <collectionProp name="Arguments.arguments">
      <elementProp name="" elementType="HTTPArgument">
        <stringProp name="Argument.value">{"productId":"${selectedProductId}","quantity":${__Random(1,3)}}</stringProp>
      </elementProp>
    </collectionProp>
  </elementProp>
  <stringProp name="HTTPSampler.method">POST</stringProp>
  <stringProp name="HTTPSampler.path">/cart/items</stringProp>
  <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
</HTTPSamplerProxy>

<!-- Header Manager pour l'authentification -->
<HeaderManager testname="Auth Header">
  <collectionProp name="HeaderManager.headers">
    <elementProp name="" elementType="Header">
      <stringProp name="Header.name">Authorization</stringProp>
      <stringProp name="Header.value">Bearer ${authToken}</stringProp>
    </elementProp>
    <elementProp name="" elementType="Header">
      <stringProp name="Header.name">Content-Type</stringProp>
      <stringProp name="Header.value">application/json</stringProp>
    </elementProp>
  </collectionProp>
</HeaderManager>
```

### Étape 4 : Configuration des Groupes de Threads

#### 4.1 Test de Charge Normale

```xml
<!-- Normal Load Thread Group -->
<ThreadGroup testname="Normal Load - 100 Users">
  <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
  <elementProp name="ThreadGroup.main_controller" elementType="LoopController">
    <boolProp name="LoopController.continue_forever">false</boolProp>
    <stringProp name="LoopController.loops">5</stringProp>
  </elementProp>
  <stringProp name="ThreadGroup.num_threads">100</stringProp>
  <stringProp name="ThreadGroup.ramp_time">300</stringProp> <!-- 5 minutes -->
  <stringProp name="ThreadGroup.duration">1800</stringProp> <!-- 30 minutes -->
  <boolProp name="ThreadGroup.scheduler">true</boolProp>
</ThreadGroup>
```

#### 4.2 Test de Pic de Charge

```xml
<!-- Spike Load Thread Group -->
<ThreadGroup testname="Spike Load - 500 Users">
  <stringProp name="ThreadGroup.num_threads">500</stringProp>
  <stringProp name="ThreadGroup.ramp_time">60</stringProp> <!-- 1 minute -->
  <stringProp name="ThreadGroup.duration">600</stringProp> <!-- 10 minutes -->
  <boolProp name="ThreadGroup.scheduler">true</boolProp>
</ThreadGroup>
```

#### 4.3 Test de Stress Progressif

```xml
<!-- Stepping Thread Group (Plugin requis) -->
<kg.apc.jmeter.threads.SteppingThreadGroup testname="Stress Test">
  <stringProp name="Threads initial delay">0</stringProp>
  <stringProp name="Start users count">10</stringProp>
  <stringProp name="Start users count burst">0</stringProp>
  <stringProp name="Start users period">30</stringProp>
  <stringProp name="Stop users count">10</stringProp>
  <stringProp name="Stop users period">30</stringProp>
  <stringProp name="flighttime">300</stringProp>
  <stringProp name="rampUp">10</stringProp>
</kg.apc.jmeter.threads.SteppingThreadGroup>
```

### Étape 5 : Assertions et Validations

#### 5.1 Assertions de Réponse

```xml
<!-- Response Assertion -->
<ResponseAssertion testname="Success Response">
  <collectionProp name="Asserion.test_strings">
    <stringProp name="200">200</stringProp>
  </collectionProp>
  <stringProp name="Assertion.custom_message">HTTP Status should be 200</stringProp>
  <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
  <boolProp name="Assertion.assume_success">false</boolProp>
  <intProp name="Assertion.test_type">1</intProp>
</ResponseAssertion>

<!-- JSON Assertion -->
<JSONPathAssertion testname="Valid JSON Response">
  <stringProp name="JSON_PATH">$</stringProp>
  <stringProp name="EXPECTED_VALUE"></stringProp>
  <boolProp name="JSONVALIDATION">true</boolProp>
  <boolProp name="EXPECT_NULL">false</boolProp>
  <boolProp name="INVERT">false</boolProp>
  <boolProp name="ISREGEX">false</boolProp>
</JSONPathAssertion>
```

#### 5.2 Assertions de Performance

```xml
<!-- Duration Assertion -->
<DurationAssertion testname="Response Time < 2s">
  <stringProp name="DurationAssertion.duration">2000</stringProp>
</DurationAssertion>

<!-- Size Assertion -->
<SizeAssertion testname="Response Size Check">
  <stringProp name="Assertion.test_field">SizeAssertion.response_network_size</stringProp>
  <stringProp name="SizeAssertion.size">1000</stringProp>
  <intProp name="SizeAssertion.operator">1</intProp> <!-- Greater than -->
</SizeAssertion>
```

### Étape 6 : Monitoring et Rapports

#### 6.1 Configuration des Listeners

```xml
<!-- Aggregate Report -->
<ResultCollector testname="Aggregate Report">
  <boolProp name="ResultCollector.error_logging">false</boolProp>
  <objProp>
    <name>saveConfig</name>
    <value class="SampleSaveConfiguration">
      <time>true</time>
      <latency>true</latency>
      <timestamp>true</timestamp>
      <success>true</success>
      <label>true</label>
      <code>true</code>
      <message>true</message>
      <threadName>true</threadName>
      <dataType>true</dataType>
      <encoding>false</encoding>
      <assertions>true</assertions>
      <subresults>true</subresults>
      <responseData>false</responseData>
      <samplerData>false</samplerData>
      <xml>false</xml>
      <fieldNames>true</fieldNames>
      <responseHeaders>false</responseHeaders>
      <requestHeaders>false</requestHeaders>
      <responseDataOnError>false</responseDataOnError>
      <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
      <assertionsResultsToSave>0</assertionsResultsToSave>
      <bytes>true</bytes>
      <sentBytes>true</sentBytes>
      <url>true</url>
      <threadCounts>true</threadCounts>
      <idleTime>true</idleTime>
      <connectTime>true</connectTime>
    </value>
  </objProp>
  <stringProp name="filename">results/aggregate-report.jtl</stringProp>
</ResultCollector>
```

#### 6.2 Backend Listener pour InfluxDB

```xml
<!-- Backend Listener -->
<BackendListener testname="Backend Listener">
  <elementProp name="arguments" elementType="Arguments">
    <collectionProp name="Arguments.arguments">
      <elementProp name="influxdbMetricsSender" elementType="Argument">
        <stringProp name="Argument.name">influxdbMetricsSender</stringProp>
        <stringProp name="Argument.value">org.apache.jmeter.visualizers.backend.influxdb.HttpMetricsSender</stringProp>
      </elementProp>
      <elementProp name="influxdbUrl" elementType="Argument">
        <stringProp name="Argument.name">influxdbUrl</stringProp>
        <stringProp name="Argument.value">http://localhost:8086/write?db=jmeter</stringProp>
      </elementProp>
      <elementProp name="application" elementType="Argument">
        <stringProp name="Argument.name">application</stringProp>
        <stringProp name="Argument.value">ecommerce-api</stringProp>
      </elementProp>
      <elementProp name="measurement" elementType="Argument">
        <stringProp name="Argument.name">measurement</stringProp>
        <stringProp name="Argument.value">jmeter</stringProp>
      </elementProp>
    </collectionProp>
  </elementProp>
  <stringProp name="classname">org.apache.jmeter.visualizers.backend.influxdb.InfluxdbBackendListenerClient</stringProp>
</BackendListener>
```

### Étape 7 : Exécution et Analyse

#### 7.1 Exécution en Mode CLI

```bash
# Test de charge normale
./bin/jmeter -n -t load-test-normal.jmx -l results/normal-load.jtl -e -o results/normal-load-report/

# Test de pic de charge
./bin/jmeter -n -t load-test-spike.jmx -l results/spike-load.jtl -e -o results/spike-load-report/

# Test de stress
./bin/jmeter -n -t stress-test.jmx -l results/stress-test.jtl -e -o results/stress-test-report/
```

#### 7.2 Génération de Rapports HTML

```bash
# Génération de rapport à partir des résultats existants
./bin/jmeter -g results/normal-load.jtl -o results/html-report/

# Avec template personnalisé
./bin/jmeter -g results/normal-load.jtl -o results/html-report/ -f
```

#### 7.3 Script d'Analyse Automatique

```bash
#!/bin/bash
# analyze-results.sh

RESULTS_DIR="results"
REPORT_DIR="reports"

# Créer les dossiers si nécessaire
mkdir -p $REPORT_DIR

# Analyser les résultats
echo "=== Analyse des Résultats de Performance ==="

# Extraire les métriques clés
echo "Temps de réponse moyen:"
awk -F',' 'NR>1 {sum+=$2; count++} END {print sum/count " ms"}' $RESULTS_DIR/normal-load.jtl

echo "Taux d'erreur:"
awk -F',' 'NR>1 {total++; if($8=="false") errors++} END {print (errors/total)*100 "%"}' $RESULTS_DIR/normal-load.jtl

echo "Débit (requêtes/sec):"
awk -F',' 'NR>1 {print $1}' $RESULTS_DIR/normal-load.jtl | sort -n | awk '
BEGIN {start=0; end=0}
{if(start==0) start=$1; end=$1; count++}
END {duration=(end-start)/1000; print count/duration " req/sec"}'

# Identifier les requêtes les plus lentes
echo "Top 10 des requêtes les plus lentes:"
awk -F',' 'NR>1 {print $2 "," $3}' $RESULTS_DIR/normal-load.jtl | sort -nr | head -10
```

### Étape 8 : Intégration CI/CD

#### 8.1 Pipeline GitHub Actions

```yaml
# .github/workflows/performance-tests.yml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Tous les jours à 2h du matin
  workflow_dispatch:
    inputs:
      test_type:
        description: 'Type de test'
        required: true
        default: 'normal'
        type: choice
        options:
        - normal
        - spike
        - stress

jobs:
  performance-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        distribution: 'temurin'
    
    - name: Download JMeter
      run: |
        wget https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.4.1.tgz
        tar -xzf apache-jmeter-5.4.1.tgz
        
    - name: Start Application
      run: |
        docker-compose up -d
        sleep 60
        curl --retry 10 --retry-delay 5 http://localhost:3000/api/health
        
    - name: Run Performance Tests
      run: |
        TEST_TYPE=${{ github.event.inputs.test_type || 'normal' }}
        ./apache-jmeter-5.4.1/bin/jmeter -n \
          -t jmeter/load-test-${TEST_TYPE}.jmx \
          -l results/${TEST_TYPE}-results.jtl \
          -e -o results/${TEST_TYPE}-report/ \
          -Jthreads=100 \
          -Jrampup=300 \
          -Jduration=1800
          
    - name: Analyze Results
      run: |
        chmod +x scripts/analyze-results.sh
        ./scripts/analyze-results.sh > results/analysis.txt
        
    - name: Check Performance Thresholds
      run: |
        # Vérifier que le temps de réponse moyen < 2s
        AVG_RESPONSE=$(awk -F',' 'NR>1 {sum+=$2; count++} END {print sum/count}' results/*-results.jtl)
        if (( $(echo "$AVG_RESPONSE > 2000" | bc -l) )); then
          echo "Performance threshold exceeded: ${AVG_RESPONSE}ms > 2000ms"
          exit 1
        fi
        
        # Vérifier que le taux d'erreur < 1%
        ERROR_RATE=$(awk -F',' 'NR>1 {total++; if($8=="false") errors++} END {print (errors/total)*100}' results/*-results.jtl)
        if (( $(echo "$ERROR_RATE > 1" | bc -l) )); then
          echo "Error rate threshold exceeded: ${ERROR_RATE}% > 1%"
          exit 1
        fi
        
    - name: Upload Results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: performance-results-${{ github.event.inputs.test_type || 'normal' }}
        path: |
          results/
          
    - name: Notify Teams
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        text: 'Performance tests failed! Check the results.'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

#### 8.2 Configuration Docker pour Tests

```dockerfile
# Dockerfile.jmeter
FROM openjdk:11-jre-slim

ENV JMETER_VERSION=5.4.1
ENV JMETER_HOME=/opt/apache-jmeter-${JMETER_VERSION}
ENV PATH=${JMETER_HOME}/bin:${PATH}

RUN apt-get update && \
    apt-get install -y wget && \
    wget https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz && \
    tar -xzf apache-jmeter-${JMETER_VERSION}.tgz -C /opt && \
    rm apache-jmeter-${JMETER_VERSION}.tgz && \
    apt-get remove -y wget && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /tests
COPY jmeter/ ./

ENTRYPOINT ["jmeter"]
```

## Résultat Attendu

À la fin de cet exercice, vous devriez avoir :

1. **Plans de test JMeter complets** pour :
   - Charge normale (100 utilisateurs)
   - Pic de trafic (500 utilisateurs)
   - Test de stabilité (30 minutes)
   - Test de stress progressif

2. **Scénarios utilisateur réalistes** incluant :
   - Authentification
   - Navigation produits
   - Ajout au panier
   - Processus de commande

3. **Système de monitoring** avec :
   - Métriques en temps réel
   - Rapports HTML détaillés
   - Alertes sur seuils

4. **Intégration CI/CD** avec :
   - Exécution automatique
   - Validation des seuils
   - Notifications d'échec

## Critères de Validation

- [ ] Plans de test JMeter fonctionnels
- [ ] Scénarios utilisateur complets
- [ ] Rapports de performance générés
- [ ] Seuils de performance définis et validés
- [ ] Pipeline CI/CD configuré
- [ ] Analyse des résultats documentée

## Points Clés à Retenir

- **Réalisme des tests** : Scénarios proches de l'usage réel
- **Montée en charge progressive** : Éviter les pics artificiels
- **Monitoring continu** : Surveillance pendant les tests
- **Seuils de performance** : Critères objectifs de validation
- **Automatisation** : Intégration dans le cycle de développement