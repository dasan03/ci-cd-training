const { Builder } = require('selenium-webdriver');
const { Eyes, Target, Configuration, BatchInfo } = require('@applitools/eyes-selenium');
const { expect } = require('chai');

describe('Tests Visuels avec Applitools', function() {
    let driver;
    let eyes;

    before(async function() {
        // Configuration du driver Selenium
        driver = await new Builder()
            .forBrowser('chrome')
            .build();

        // Configuration d'Applitools Eyes
        eyes = new Eyes();
        
        // Configuration de base
        const configuration = new Configuration();
        configuration.setApiKey(process.env.APPLITOOLS_API_KEY);
        configuration.setAppName('Demo App Visual Testing');
        configuration.setTestName('Regression Tests');
        
        // Configuration du batch pour regrouper les tests
        const batchInfo = new BatchInfo('Module 2 - Visual Testing Batch');
        configuration.setBatch(batchInfo);
        
        eyes.setConfiguration(configuration);
    });

    after(async function() {
        if (driver) {
            await driver.quit();
        }
        if (eyes) {
            await eyes.abortIfNotClosed();
        }
    });

    it('devrait capturer la page d\'accueil comme baseline', async function() {
        try {
            // Ouvrir les yeux d'Applitools
            await eyes.open(driver, 'Demo App', 'Homepage Baseline Test');
            
            // Naviguer vers la page à tester
            await driver.get('http://localhost:3000');
            
            // Attendre que la page soit chargée
            await driver.sleep(2000);
            
            // Capturer la page entière
            await eyes.check('Homepage Full Page', Target.window().fully());
            
            // Fermer les yeux et récupérer les résultats
            const results = await eyes.close();
            console.log('Résultats du test:', results);
            
        } catch (error) {
            console.error('Erreur lors du test visuel:', error);
            throw error;
        }
    });

    it('devrait détecter les changements dans le header', async function() {
        try {
            await eyes.open(driver, 'Demo App', 'Header Change Detection');
            
            await driver.get('http://localhost:3000');
            await driver.sleep(2000);
            
            // Capturer seulement la zone du header
            const headerElement = await driver.findElement({css: 'header'});
            await eyes.check('Header Section', Target.region(headerElement));
            
            const results = await eyes.close();
            console.log('Test header terminé:', results);
            
        } catch (error) {
            console.error('Erreur test header:', error);
            throw error;
        }
    });

    it('devrait tester la responsivité sur différentes tailles', async function() {
        const viewports = [
            { width: 1200, height: 800, name: 'Desktop' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 375, height: 667, name: 'Mobile' }
        ];

        for (const viewport of viewports) {
            try {
                await eyes.open(driver, 'Demo App', `Responsive Test - ${viewport.name}`);
                
                // Redimensionner la fenêtre
                await driver.manage().window().setRect({
                    width: viewport.width,
                    height: viewport.height
                });
                
                await driver.get('http://localhost:3000');
                await driver.sleep(2000);
                
                await eyes.check(`${viewport.name} View`, Target.window().fully());
                
                const results = await eyes.close();
                console.log(`Test ${viewport.name} terminé:`, results);
                
            } catch (error) {
                console.error(`Erreur test ${viewport.name}:`, error);
                throw error;
            }
        }
    });

    it('devrait ignorer les zones dynamiques', async function() {
        try {
            await eyes.open(driver, 'Demo App', 'Dynamic Content Ignore Test');
            
            await driver.get('http://localhost:3000');
            await driver.sleep(2000);
            
            // Ignorer les éléments avec du contenu dynamique (timestamp, compteurs, etc.)
            const dynamicElements = await driver.findElements({css: '.dynamic-content'});
            
            let target = Target.window().fully();
            for (const element of dynamicElements) {
                target = target.ignore(element);
            }
            
            await eyes.check('Page with Ignored Dynamic Content', target);
            
            const results = await eyes.close();
            console.log('Test avec zones ignorées terminé:', results);
            
        } catch (error) {
            console.error('Erreur test zones dynamiques:', error);
            throw error;
        }
    });
});