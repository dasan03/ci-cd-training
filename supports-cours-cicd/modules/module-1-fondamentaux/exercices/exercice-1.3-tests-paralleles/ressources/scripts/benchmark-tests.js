#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script de benchmark pour comparer les performances des tests
 * séquentiels vs parallèles
 */

class TestBenchmark {
  constructor() {
    this.results = {
      sequential: {},
      parallel: {},
      comparison: {}
    };
    this.testSuites = [
      { name: 'unit', command: 'test:unit' },
      { name: 'integration', command: 'test:integration' },
      { name: 'performance', command: 'test:performance' },
      { name: 'all', command: 'test' }
    ];
  }

  async runBenchmark() {
    console.log('🚀 Démarrage du benchmark des tests...\n');
    
    // Tests séquentiels
    console.log('📊 Exécution des tests séquentiels...');
    await this.runSequentialTests();
    
    // Tests parallèles
    console.log('\n📊 Exécution des tests parallèles...');
    await this.runParallelTests();
    
    // Analyse des résultats
    console.log('\n📈 Analyse des résultats...');
    this.analyzeResults();
    
    // Génération du rapport
    this.generateReport();
    
    console.log('\n✅ Benchmark terminé !');
  }

  async runSequentialTests() {
    for (const suite of this.testSuites) {
      console.log(`  ⏱️  Exécution séquentielle: ${suite.name}`);
      
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      try {
        const output = execSync(`npm run ${suite.command} -- --runInBand --silent`, {
          encoding: 'utf8',
          timeout: 300000 // 5 minutes max
        });
        
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        
        this.results.sequential[suite.name] = {
          duration: endTime - startTime,
          memoryUsed: endMemory.heapUsed - startMemory.heapUsed,
          success: true,
          output: output.trim()
        };
        
        console.log(`    ✅ ${suite.name}: ${this.results.sequential[suite.name].duration}ms`);
        
      } catch (error) {
        this.results.sequential[suite.name] = {
          duration: Date.now() - startTime,
          success: false,
          error: error.message
        };
        
        console.log(`    ❌ ${suite.name}: ÉCHEC`);
      }
      
      // Pause entre les tests pour éviter les interférences
      await this.sleep(2000);
    }
  }

  async runParallelTests() {
    for (const suite of this.testSuites) {
      console.log(`  ⏱️  Exécution parallèle: ${suite.name}`);
      
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      try {
        const maxWorkers = suite.name === 'performance' ? 1 : 4;
        const output = execSync(`npm run ${suite.command} -- --maxWorkers=${maxWorkers} --silent`, {
          encoding: 'utf8',
          timeout: 300000 // 5 minutes max
        });
        
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        
        this.results.parallel[suite.name] = {
          duration: endTime - startTime,
          memoryUsed: endMemory.heapUsed - startMemory.heapUsed,
          success: true,
          output: output.trim(),
          workers: maxWorkers
        };
        
        console.log(`    ✅ ${suite.name}: ${this.results.parallel[suite.name].duration}ms (${maxWorkers} workers)`);
        
      } catch (error) {
        this.results.parallel[suite.name] = {
          duration: Date.now() - startTime,
          success: false,
          error: error.message
        };
        
        console.log(`    ❌ ${suite.name}: ÉCHEC`);
      }
      
      // Pause entre les tests
      await this.sleep(2000);
    }
  }

  analyzeResults() {
    for (const suite of this.testSuites) {
      const sequential = this.results.sequential[suite.name];
      const parallel = this.results.parallel[suite.name];
      
      if (sequential.success && parallel.success) {
        const speedup = sequential.duration / parallel.duration;
        const memoryRatio = parallel.memoryUsed / sequential.memoryUsed;
        
        this.results.comparison[suite.name] = {
          speedup: speedup,
          speedupPercent: ((speedup - 1) * 100).toFixed(1),
          memoryRatio: memoryRatio,
          memoryRatioPercent: ((memoryRatio - 1) * 100).toFixed(1),
          sequentialTime: sequential.duration,
          parallelTime: parallel.duration,
          timeSaved: sequential.duration - parallel.duration,
          efficiency: (speedup / (parallel.workers || 1)).toFixed(2)
        };
      }
    }
  }

  generateReport() {
    const reportPath = path.join(__dirname, '..', 'test-results', 'benchmark-report.json');
    const htmlReportPath = path.join(__dirname, '..', 'test-results', 'benchmark-report.html');
    
    // Créer le dossier s'il n'existe pas
    const resultsDir = path.dirname(reportPath);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Rapport JSON
    const report = {
      timestamp: new Date().toISOString(),
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        cpus: require('os').cpus().length,
        totalMemory: require('os').totalmem(),
        freeMemory: require('os').freemem()
      },
      results: this.results
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Rapport HTML
    const htmlReport = this.generateHtmlReport(report);
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    // Affichage console
    this.displayConsoleReport();
    
    console.log(`\n📄 Rapports générés:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  displayConsoleReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RAPPORT DE BENCHMARK DES TESTS');
    console.log('='.repeat(80));
    
    console.log('\n🏃‍♂️ PERFORMANCES PAR SUITE DE TESTS:');
    console.log('-'.repeat(80));
    
    for (const suite of this.testSuites) {
      const comparison = this.results.comparison[suite.name];
      if (comparison) {
        console.log(`\n${suite.name.toUpperCase()}:`);
        console.log(`  Séquentiel:     ${comparison.sequentialTime}ms`);
        console.log(`  Parallèle:      ${comparison.parallelTime}ms`);
        console.log(`  Accélération:   ${comparison.speedup.toFixed(2)}x (${comparison.speedupPercent}%)`);
        console.log(`  Temps économisé: ${comparison.timeSaved}ms`);
        console.log(`  Efficacité:     ${comparison.efficiency}`);
        console.log(`  Mémoire:        ${comparison.memoryRatioPercent}% ${comparison.memoryRatio > 1 ? '↑' : '↓'}`);
      }
    }
    
    // Résumé global
    const totalSequential = Object.values(this.results.sequential)
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.duration, 0);
    
    const totalParallel = Object.values(this.results.parallel)
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.duration, 0);
    
    if (totalSequential > 0 && totalParallel > 0) {
      const globalSpeedup = totalSequential / totalParallel;
      const globalTimeSaved = totalSequential - totalParallel;
      
      console.log('\n🎯 RÉSUMÉ GLOBAL:');
      console.log('-'.repeat(40));
      console.log(`Temps total séquentiel:  ${totalSequential}ms`);
      console.log(`Temps total parallèle:   ${totalParallel}ms`);
      console.log(`Accélération globale:    ${globalSpeedup.toFixed(2)}x`);
      console.log(`Temps total économisé:   ${globalTimeSaved}ms (${((globalSpeedup - 1) * 100).toFixed(1)}%)`);
    }
    
    console.log('\n' + '='.repeat(80));
  }

  generateHtmlReport(report) {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Benchmark des Tests</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2 { color: #333; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #007bff; }
        .speedup { border-left-color: #28a745; }
        .memory { border-left-color: #ffc107; }
        .time { border-left-color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .positive { color: #28a745; font-weight: bold; }
        .negative { color: #dc3545; font-weight: bold; }
        .chart { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Rapport de Benchmark des Tests</h1>
        <p><strong>Généré le:</strong> ${new Date(report.timestamp).toLocaleString('fr-FR')}</p>
        
        <h2>🖥️ Informations Système</h2>
        <div class="metric">
            <strong>Plateforme:</strong> ${report.system.platform} ${report.system.arch}
        </div>
        <div class="metric">
            <strong>Node.js:</strong> ${report.system.nodeVersion}
        </div>
        <div class="metric">
            <strong>CPUs:</strong> ${report.system.cpus}
        </div>
        <div class="metric">
            <strong>Mémoire:</strong> ${Math.round(report.system.totalMemory / 1024 / 1024 / 1024)}GB
        </div>
        
        <h2>🏃‍♂️ Résultats par Suite de Tests</h2>
        <table>
            <thead>
                <tr>
                    <th>Suite</th>
                    <th>Séquentiel (ms)</th>
                    <th>Parallèle (ms)</th>
                    <th>Accélération</th>
                    <th>Temps Économisé</th>
                    <th>Efficacité</th>
                </tr>
            </thead>
            <tbody>
                ${this.testSuites.map(suite => {
                  const comp = report.results.comparison[suite.name];
                  if (!comp) return '';
                  return `
                    <tr>
                        <td><strong>${suite.name}</strong></td>
                        <td>${comp.sequentialTime}</td>
                        <td>${comp.parallelTime}</td>
                        <td class="positive">${comp.speedup.toFixed(2)}x (${comp.speedupPercent}%)</td>
                        <td class="positive">${comp.timeSaved}ms</td>
                        <td>${comp.efficiency}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
        
        <h2>📈 Métriques Détaillées</h2>
        ${this.testSuites.map(suite => {
          const comp = report.results.comparison[suite.name];
          if (!comp) return '';
          return `
            <h3>${suite.name.toUpperCase()}</h3>
            <div class="metric speedup">
                <strong>Accélération:</strong> ${comp.speedup.toFixed(2)}x<br>
                <small>Amélioration de ${comp.speedupPercent}%</small>
            </div>
            <div class="metric time">
                <strong>Temps économisé:</strong> ${comp.timeSaved}ms<br>
                <small>${comp.sequentialTime}ms → ${comp.parallelTime}ms</small>
            </div>
            <div class="metric memory">
                <strong>Utilisation mémoire:</strong> ${comp.memoryRatioPercent}%<br>
                <small>Ratio: ${comp.memoryRatio.toFixed(2)}</small>
            </div>
          `;
        }).join('')}
        
        <h2>💡 Recommandations</h2>
        <ul>
            <li>Les tests parallèles montrent une amélioration significative des performances</li>
            <li>L'efficacité optimale est atteinte avec 2-4 workers selon le type de test</li>
            <li>Les tests de performance doivent rester séquentiels pour des mesures précises</li>
            <li>Surveiller l'utilisation mémoire lors de l'augmentation du parallélisme</li>
        </ul>
    </div>
</body>
</html>
    `;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exécution du benchmark
if (require.main === module) {
  const benchmark = new TestBenchmark();
  benchmark.runBenchmark().catch(console.error);
}

module.exports = TestBenchmark;