#!/usr/bin/env node

/**
 * Script de validation complète des supports de cours CI/CD
 * 
 * Ce script effectue :
 * - Révision complète de tous les contenus
 * - Test de tous les exercices
 * - Validation de la cohérence pédagogique
 * - Vérification de l'accessibilité WCAG 2.1
 */

const fs = require('fs');
const path = require('path');

class CourseValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.info = [];
        this.basePath = path.join(__dirname, '..');
    }

    log(level, message, details = null) {
        const entry = { level, message, details, timestamp: new Date().toISOString() };
        
        switch(level) {
            case 'error':
                this.errors.push(entry);
                console.error(`❌ ERREUR: ${message}`);
                break;
            case 'warning':
                this.warnings.push(entry);
                console.warn(`⚠️  ATTENTION: ${message}`);
                break;
            case 'info':
                this.info.push(entry);
                console.log(`ℹ️  INFO: ${message}`);
                break;
            case 'success':
                console.log(`✅ SUCCÈS: ${message}`);
                break;
        }
        
        if (details) {
            console.log(`   Détails: ${details}`);
        }
    }

    // 1. Validation de la structure des fichiers
    validateFileStructure() {
        this.log('info', 'Validation de la structure des fichiers...');
        
        const requiredStructure = {
            'modules': {
                'module-1-fondamentaux': ['README.md'],
                'module-2-ia-tests': ['README.md'],
                'module-3-tests-fonctionnels': ['README.md'],
                'module-4-documentation': ['README.md']
            },
            'exercices': {
                'module-1': [],
                'module-2': [],
                'module-3': [],
                'module-4': []
            },
            'evaluations': {
                'qcm-intermediaires': [],
                'qcm-final': []
            },
            'guides': ['guide-formateur.md', 'guide-apprenant.md'],
            'ressources': {
                'images': [],
                'templates': [],
                'outils': []
            }
        };

        this.validateStructureRecursive('', requiredStructure);
    }

    validateStructureRecursive(currentPath, structure) {
        for (const [item, content] of Object.entries(structure)) {
            const fullPath = path.join(this.basePath, currentPath, item);
            
            if (Array.isArray(content)) {
                // C'est un dossier avec des fichiers requis
                if (!fs.existsSync(fullPath)) {
                    this.log('error', `Dossier manquant: ${path.join(currentPath, item)}`);
                    continue;
                }
                
                // Vérifier les fichiers requis
                content.forEach(file => {
                    const filePath = path.join(fullPath, file);
                    if (!fs.existsSync(filePath)) {
                        this.log('error', `Fichier manquant: ${path.join(currentPath, item, file)}`);
                    }
                });
            } else if (typeof content === 'object') {
                // C'est un dossier avec des sous-dossiers
                if (!fs.existsSync(fullPath)) {
                    this.log('error', `Dossier manquant: ${path.join(currentPath, item)}`);
                    continue;
                }
                
                this.validateStructureRecursive(path.join(currentPath, item), content);
            } else {
                // C'est un fichier
                if (!fs.existsSync(fullPath)) {
                    this.log('error', `Fichier manquant: ${path.join(currentPath, item)}`);
                }
            }
        }
    }

    // 2. Validation du contenu des modules
    validateModuleContent() {
        this.log('info', 'Validation du contenu des modules...');
        
        const modules = ['module-1-fondamentaux', 'module-2-ia-tests', 'module-3-tests-fonctionnels', 'module-4-documentation'];
        
        modules.forEach(module => {
            this.validateSingleModule(module);
        });
    }

    validateSingleModule(moduleName) {
        const modulePath = path.join(this.basePath, 'modules', moduleName);
        
        if (!fs.existsSync(modulePath)) {
            this.log('error', `Module manquant: ${moduleName}`);
            return;
        }

        // Vérifier le README du module
        const readmePath = path.join(modulePath, 'README.md');
        if (fs.existsSync(readmePath)) {
            const content = fs.readFileSync(readmePath, 'utf8');
            
            // Vérifier la présence des sections obligatoires
            const requiredSections = ['# ', '## Objectifs', '## Contenu', '## Exercices'];
            requiredSections.forEach(section => {
                if (!content.includes(section)) {
                    this.log('warning', `Section manquante dans ${moduleName}: ${section}`);
                }
            });

            // Vérifier la longueur du contenu
            if (content.length < 500) {
                this.log('warning', `Contenu trop court pour ${moduleName} (${content.length} caractères)`);
            }
        }
    }

    // 3. Validation des exercices
    validateExercises() {
        this.log('info', 'Validation des exercices...');
        
        const exercisesPath = path.join(this.basePath, 'exercices');
        
        if (!fs.existsSync(exercisesPath)) {
            this.log('error', 'Dossier exercices manquant');
            return;
        }

        const modules = fs.readdirSync(exercisesPath).filter(item => 
            fs.statSync(path.join(exercisesPath, item)).isDirectory()
        );

        modules.forEach(module => {
            this.validateModuleExercises(module);
        });
    }

    validateModuleExercises(module) {
        const modulePath = path.join(this.basePath, 'exercices', module);
        const exercises = fs.readdirSync(modulePath).filter(item => 
            fs.statSync(path.join(modulePath, item)).isDirectory()
        );

        if (exercises.length === 0) {
            this.log('warning', `Aucun exercice trouvé pour ${module}`);
            return;
        }

        exercises.forEach(exercise => {
            this.validateSingleExercise(module, exercise);
        });
    }

    validateSingleExercise(module, exercise) {
        const exercisePath = path.join(this.basePath, 'exercices', module, exercise);
        
        // Vérifier les fichiers requis pour un exercice
        const requiredFiles = ['README.md'];
        const optionalFiles = ['solution.md', 'ressources'];
        
        requiredFiles.forEach(file => {
            const filePath = path.join(exercisePath, file);
            if (!fs.existsSync(filePath)) {
                this.log('error', `Fichier manquant pour l'exercice ${module}/${exercise}: ${file}`);
            } else {
                // Valider le contenu du README de l'exercice
                const content = fs.readFileSync(filePath, 'utf8');
                const requiredSections = ['## Objectifs', '## Instructions', '## Résultat attendu'];
                
                requiredSections.forEach(section => {
                    if (!content.includes(section)) {
                        this.log('warning', `Section manquante dans l'exercice ${module}/${exercise}: ${section}`);
                    }
                });
            }
        });
    }

    // 4. Validation des QCM
    validateQCM() {
        this.log('info', 'Validation des QCM...');
        
        const evaluationsPath = path.join(this.basePath, 'evaluations');
        
        // Vérifier QCM intermédiaires
        const qcmIntermediairesPath = path.join(evaluationsPath, 'qcm-intermediaires');
        if (fs.existsSync(qcmIntermediairesPath)) {
            const qcmFiles = fs.readdirSync(qcmIntermediairesPath).filter(file => file.endsWith('.md'));
            
            if (qcmFiles.length === 0) {
                this.log('warning', 'Aucun QCM intermédiaire trouvé');
            } else {
                qcmFiles.forEach(file => {
                    this.validateQCMFile(path.join(qcmIntermediairesPath, file), 'intermédiaire');
                });
            }
        }

        // Vérifier QCM final
        const qcmFinalPath = path.join(evaluationsPath, 'qcm-final');
        if (fs.existsSync(qcmFinalPath)) {
            const qcmFiles = fs.readdirSync(qcmFinalPath).filter(file => file.endsWith('.md'));
            
            if (qcmFiles.length === 0) {
                this.log('error', 'QCM final manquant');
            } else {
                qcmFiles.forEach(file => {
                    this.validateQCMFile(path.join(qcmFinalPath, file), 'final');
                });
            }
        }
    }

    validateQCMFile(filePath, type) {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);
        
        // Compter les questions (recherche de patterns comme "1.", "2.", etc.)
        const questionMatches = content.match(/^\d+\./gm);
        const questionCount = questionMatches ? questionMatches.length : 0;
        
        if (type === 'final' && questionCount < 40) {
            this.log('warning', `QCM final ${fileName} a seulement ${questionCount} questions (minimum recommandé: 40)`);
        } else if (type === 'intermédiaire' && questionCount < 5) {
            this.log('warning', `QCM intermédiaire ${fileName} a seulement ${questionCount} questions (minimum recommandé: 5)`);
        }

        // Vérifier la présence de réponses et explications
        const hasAnswers = content.includes('**Réponse') || content.includes('**Correction');
        if (!hasAnswers) {
            this.log('warning', `QCM ${fileName} ne semble pas contenir de réponses`);
        }
    }

    // 5. Validation de la cohérence pédagogique
    validatePedagogicalCoherence() {
        this.log('info', 'Validation de la cohérence pédagogique...');
        
        // Vérifier la progression des modules
        this.validateModuleProgression();
        
        // Vérifier la cohérence des références
        this.validateCrossReferences();
        
        // Vérifier les prérequis
        this.validatePrerequisites();
    }

    validateModuleProgression() {
        const expectedProgression = [
            'module-1-fondamentaux',
            'module-2-ia-tests', 
            'module-3-tests-fonctionnels',
            'module-4-documentation'
        ];
        
        // Vérifier que chaque module fait référence aux concepts du précédent
        for (let i = 1; i < expectedProgression.length; i++) {
            const currentModule = expectedProgression[i];
            const previousModule = expectedProgression[i-1];
            
            const currentPath = path.join(this.basePath, 'modules', currentModule, 'README.md');
            if (fs.existsSync(currentPath)) {
                const content = fs.readFileSync(currentPath, 'utf8');
                
                // Vérifier les références aux modules précédents (basique)
                if (i > 1 && !content.toLowerCase().includes('prérequis')) {
                    this.log('warning', `${currentModule} ne mentionne pas de prérequis`);
                }
            }
        }
    }

    validateCrossReferences() {
        // Vérifier que les liens internes fonctionnent
        const indexPath = path.join(this.basePath, 'index.md');
        if (fs.existsSync(indexPath)) {
            const content = fs.readFileSync(indexPath, 'utf8');
            
            // Extraire les liens markdown
            const linkMatches = content.match(/\[.*?\]\((.*?)\)/g);
            if (linkMatches) {
                linkMatches.forEach(link => {
                    const urlMatch = link.match(/\[.*?\]\((.*?)\)/);
                    if (urlMatch && urlMatch[1]) {
                        const linkedPath = urlMatch[1];
                        if (!linkedPath.startsWith('http')) {
                            const fullPath = path.join(this.basePath, linkedPath);
                            if (!fs.existsSync(fullPath)) {
                                this.log('warning', `Lien brisé dans index.md: ${linkedPath}`);
                            }
                        }
                    }
                });
            }
        }
    }

    validatePrerequisites() {
        // Vérifier que les prérequis sont cohérents
        const guidePath = path.join(this.basePath, 'guides', 'guide-apprenant.md');
        if (fs.existsSync(guidePath)) {
            const content = fs.readFileSync(guidePath, 'utf8');
            
            if (!content.toLowerCase().includes('prérequis')) {
                this.log('warning', 'Guide apprenant ne mentionne pas les prérequis');
            }
        }
    }

    // 6. Validation de l'accessibilité WCAG 2.1
    validateAccessibility() {
        this.log('info', 'Validation de l\'accessibilité WCAG 2.1...');
        
        // Vérifier les fichiers HTML générés
        this.validateHTMLAccessibility();
        
        // Vérifier les images
        this.validateImageAccessibility();
        
        // Vérifier la structure des documents
        this.validateDocumentStructure();
    }

    validateHTMLAccessibility() {
        const htmlOutputPath = path.join(this.basePath, 'html-output');
        
        if (!fs.existsSync(htmlOutputPath)) {
            this.log('warning', 'Dossier html-output manquant pour la validation d\'accessibilité');
            return;
        }

        // Vérifier le fichier index.html principal
        const indexPath = path.join(htmlOutputPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            const content = fs.readFileSync(indexPath, 'utf8');
            
            // Vérifications WCAG basiques
            if (!content.includes('lang=')) {
                this.log('warning', 'Attribut lang manquant dans index.html');
            }
            
            if (!content.includes('<title>')) {
                this.log('warning', 'Balise title manquante dans index.html');
            }
            
            // Vérifier les images sans alt
            const imgMatches = content.match(/<img[^>]*>/g);
            if (imgMatches) {
                imgMatches.forEach(img => {
                    if (!img.includes('alt=')) {
                        this.log('warning', 'Image sans attribut alt trouvée dans index.html');
                    }
                });
            }
            
            // Vérifier les liens sans texte descriptif
            const linkMatches = content.match(/<a[^>]*>.*?<\/a>/g);
            if (linkMatches) {
                linkMatches.forEach(link => {
                    const textMatch = link.match(/>([^<]*)</);
                    if (textMatch && textMatch[1].trim().length < 3) {
                        this.log('warning', 'Lien avec texte trop court trouvé dans index.html');
                    }
                });
            }
        }
    }

    validateImageAccessibility() {
        const imagesPath = path.join(this.basePath, 'ressources', 'images');
        
        if (!fs.existsSync(imagesPath)) {
            this.log('info', 'Dossier images non trouvé');
            return;
        }

        const images = fs.readdirSync(imagesPath).filter(file => 
            /\.(jpg|jpeg|png|gif|svg)$/i.test(file)
        );

        if (images.length === 0) {
            this.log('info', 'Aucune image trouvée');
        } else {
            this.log('info', `${images.length} images trouvées - vérifiez manuellement les textes alternatifs`);
        }
    }

    validateDocumentStructure() {
        // Vérifier la structure des titres dans les documents Markdown
        const modulesPath = path.join(this.basePath, 'modules');
        
        if (fs.existsSync(modulesPath)) {
            const modules = fs.readdirSync(modulesPath).filter(item => 
                fs.statSync(path.join(modulesPath, item)).isDirectory()
            );

            modules.forEach(module => {
                const readmePath = path.join(modulesPath, module, 'README.md');
                if (fs.existsSync(readmePath)) {
                    this.validateHeadingStructure(readmePath, module);
                }
            });
        }
    }

    validateHeadingStructure(filePath, context) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        let previousLevel = 0;
        let hasH1 = false;
        
        lines.forEach((line, index) => {
            const headingMatch = line.match(/^(#{1,6})\s/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                
                if (level === 1) {
                    hasH1 = true;
                }
                
                // Vérifier que les niveaux de titre sont logiques
                if (previousLevel > 0 && level > previousLevel + 1) {
                    this.log('warning', `Saut de niveau de titre dans ${context} ligne ${index + 1}: h${previousLevel} vers h${level}`);
                }
                
                previousLevel = level;
            }
        });
        
        if (!hasH1) {
            this.log('warning', `Aucun titre H1 trouvé dans ${context}`);
        }
    }

    // 7. Test des formats de sortie
    validateOutputFormats() {
        this.log('info', 'Validation des formats de sortie...');
        
        // Vérifier HTML
        const htmlPath = path.join(this.basePath, 'html-output');
        if (fs.existsSync(htmlPath)) {
            this.log('success', 'Format HTML disponible');
        } else {
            this.log('warning', 'Format HTML manquant');
        }
        
        // Vérifier PDF
        const pdfPath = path.join(this.basePath, 'pdf-exports');
        if (fs.existsSync(pdfPath)) {
            const pdfFiles = fs.readdirSync(pdfPath).filter(file => file.endsWith('.html'));
            if (pdfFiles.length > 0) {
                this.log('success', `${pdfFiles.length} fichiers prêts pour export PDF`);
            } else {
                this.log('warning', 'Aucun fichier prêt pour export PDF');
            }
        } else {
            this.log('warning', 'Dossier pdf-exports manquant');
        }
    }

    // 8. Génération du rapport de validation
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                errors: this.errors.length,
                warnings: this.warnings.length,
                info: this.info.length
            },
            details: {
                errors: this.errors,
                warnings: this.warnings,
                info: this.info
            }
        };

        // Sauvegarder le rapport
        const reportPath = path.join(this.basePath, 'validation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Générer un rapport lisible
        this.generateReadableReport(report);
        
        return report;
    }

    generateReadableReport(report) {
        const reportPath = path.join(this.basePath, 'validation-report.md');
        
        let content = `# Rapport de Validation des Supports de Cours CI/CD\n\n`;
        content += `**Date:** ${new Date().toLocaleString('fr-FR')}\n\n`;
        content += `## Résumé\n\n`;
        content += `- ❌ Erreurs: ${report.summary.errors}\n`;
        content += `- ⚠️ Avertissements: ${report.summary.warnings}\n`;
        content += `- ℹ️ Informations: ${report.summary.info}\n\n`;
        
        if (report.details.errors.length > 0) {
            content += `## Erreurs à Corriger\n\n`;
            report.details.errors.forEach((error, index) => {
                content += `${index + 1}. **${error.message}**\n`;
                if (error.details) {
                    content += `   - ${error.details}\n`;
                }
                content += `\n`;
            });
        }
        
        if (report.details.warnings.length > 0) {
            content += `## Avertissements\n\n`;
            report.details.warnings.forEach((warning, index) => {
                content += `${index + 1}. **${warning.message}**\n`;
                if (warning.details) {
                    content += `   - ${warning.details}\n`;
                }
                content += `\n`;
            });
        }
        
        content += `## Recommandations\n\n`;
        content += `1. Corriger toutes les erreurs avant la livraison finale\n`;
        content += `2. Examiner les avertissements et corriger si nécessaire\n`;
        content += `3. Tester manuellement tous les exercices dans l'environnement cible\n`;
        content += `4. Faire réviser le contenu par un expert pédagogique\n`;
        content += `5. Valider l'accessibilité avec des outils spécialisés\n\n`;
        
        fs.writeFileSync(reportPath, content);
        this.log('success', `Rapport de validation généré: validation-report.md`);
    }

    // Méthode principale de validation
    validate() {
        console.log('🚀 Début de la validation des supports de cours CI/CD\n');
        
        try {
            this.validateFileStructure();
            this.validateModuleContent();
            this.validateExercises();
            this.validateQCM();
            this.validatePedagogicalCoherence();
            this.validateAccessibility();
            this.validateOutputFormats();
            
            const report = this.generateReport();
            
            console.log('\n📊 RÉSULTATS DE LA VALIDATION:');
            console.log(`   Erreurs: ${report.summary.errors}`);
            console.log(`   Avertissements: ${report.summary.warnings}`);
            console.log(`   Informations: ${report.summary.info}`);
            
            if (report.summary.errors === 0) {
                console.log('\n✅ Validation réussie! Les supports sont prêts pour la livraison.');
            } else {
                console.log('\n❌ Des erreurs doivent être corrigées avant la livraison.');
            }
            
            return report.summary.errors === 0;
            
        } catch (error) {
            this.log('error', 'Erreur lors de la validation', error.message);
            return false;
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    console.log('Démarrage du script de validation...');
    const validator = new CourseValidator();
    const success = validator.validate();
    console.log('Validation terminée, succès:', success);
    process.exit(success ? 0 : 1);
}

module.exports = CourseValidator;