console.log('=== VALIDATION ACCESSIBILITÉ WCAG 2.1 ===\n');

const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '..');
let accessibilityIssues = [];
let accessibilityWarnings = [];

function logIssue(type, message, file = null) {
    const entry = { type, message, file, timestamp: new Date().toISOString() };
    if (type === 'error') {
        accessibilityIssues.push(entry);
        console.log(`❌ ERREUR: ${message}${file ? ` (${file})` : ''}`);
    } else {
        accessibilityWarnings.push(entry);
        console.log(`⚠️  ATTENTION: ${message}${file ? ` (${file})` : ''}`);
    }
}

function logSuccess(message) {
    console.log(`✅ ${message}`);
}

// 1. Validation des fichiers HTML
console.log('1. VALIDATION HTML WCAG 2.1:');
const htmlPath = path.join(basePath, 'html-output');
let htmlFiles = [];
    
    // Trouver tous les fichiers HTML
    function findHtmlFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                findHtmlFiles(filePath, fileList);
            } else if (file.endsWith('.html')) {
                fileList.push(filePath);
            }
        });
        return fileList;
    }
    
    findHtmlFiles(htmlPath, htmlFiles);
    console.log(`Trouvé ${htmlFiles.length} fichiers HTML à valider`);
    
    htmlFiles.forEach(filePath => {
        const relativePath = path.relative(basePath, filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // WCAG 2.1 - Critère 3.1.1 : Langue de la page
        if (!content.includes('lang=')) {
            logIssue('error', 'Attribut lang manquant', relativePath);
        } else {
            logSuccess(`Langue spécifiée - ${relativePath}`);
        }
        
        // WCAG 2.1 - Critère 2.4.2 : Titre de page
        if (!content.includes('<title>') || content.match(/<title>\s*<\/title>/)) {
            logIssue('error', 'Titre de page manquant ou vide', relativePath);
        } else {
            logSuccess(`Titre présent - ${relativePath}`);
        }
        
        // WCAG 2.1 - Critère 1.1.1 : Images avec texte alternatif
        const imgMatches = content.match(/<img[^>]*>/g);
        if (imgMatches) {
            imgMatches.forEach(img => {
                if (!img.includes('alt=')) {
                    logIssue('error', 'Image sans attribut alt', relativePath);
                } else if (img.includes('alt=""') && !img.includes('role="presentation"')) {
                    logIssue('warning', 'Image avec alt vide sans role presentation', relativePath);
                }
            });
        }
        
        // WCAG 2.1 - Critère 1.4.3 : Contraste des couleurs (vérification basique)
        if (content.includes('color:') && !content.includes('/* WCAG contrast checked */')) {
            logIssue('warning', 'Couleurs personnalisées détectées - vérifier le contraste manuellement', relativePath);
        }
        
        // WCAG 2.1 - Critère 2.4.1 : Structure des titres
        const headings = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/g);
        if (headings) {
            let previousLevel = 0;
            headings.forEach(heading => {
                const levelMatch = heading.match(/<h([1-6])/);
                if (levelMatch) {
                    const level = parseInt(levelMatch[1]);
                    if (previousLevel > 0 && level > previousLevel + 1) {
                        logIssue('warning', `Saut de niveau de titre: h${previousLevel} vers h${level}`, relativePath);
                    }
                    previousLevel = level;
                }
            });
        }
        
        // WCAG 2.1 - Critère 2.4.4 : Liens descriptifs
        const linkMatches = content.match(/<a[^>]*>.*?<\/a>/g);
        if (linkMatches) {
            linkMatches.forEach(link => {
                const textMatch = link.match(/>([^<]*)</);
                if (textMatch) {
                    const linkText = textMatch[1].trim();
                    if (linkText.length < 3 || linkText.toLowerCase().includes('cliquez ici') || linkText.toLowerCase().includes('lire plus')) {
                        logIssue('warning', `Texte de lien peu descriptif: "${linkText}"`, relativePath);
                    }
                }
            });
        }
        
        // WCAG 2.1 - Critère 1.4.4 : Redimensionnement du texte
        if (!content.includes('viewport') || !content.includes('user-scalable')) {
            logIssue('warning', 'Meta viewport manquant ou restrictif', relativePath);
        }
        
        // WCAG 2.1 - Critère 2.1.1 : Navigation au clavier
        const interactiveElements = content.match(/<(button|input|select|textarea|a)[^>]*>/g);
        if (interactiveElements) {
            interactiveElements.forEach(element => {
                if (element.includes('tabindex="-1"') && !element.includes('aria-hidden="true"')) {
                    logIssue('warning', 'Élément interactif avec tabindex négatif', relativePath);
                }
            });
        }
    });
} else {
    logIssue('error', 'Dossier html-output manquant');
}

// 2. Validation des documents Markdown
console.log('\n2. VALIDATION STRUCTURE MARKDOWN:');
let markdownFiles = [];

function findMarkdownFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findMarkdownFiles(filePath, fileList);
        } else if (file.endsWith('.md')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

['modules', 'guides', 'exercices', 'evaluations'].forEach(dir => {
    findMarkdownFiles(path.join(basePath, dir), markdownFiles);
});

console.log(`Trouvé ${markdownFiles.length} fichiers Markdown à valider`);

markdownFiles.forEach(filePath => {
    const relativePath = path.relative(basePath, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Vérifier la structure des titres
    let previousLevel = 0;
    let hasH1 = false;
    
    lines.forEach((line, index) => {
        const headingMatch = line.match(/^(#{1,6})\s/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            
            if (level === 1) {
                hasH1 = true;
            }
            
            if (previousLevel > 0 && level > previousLevel + 1) {
                logIssue('warning', `Saut de niveau de titre ligne ${index + 1}: h${previousLevel} vers h${level}`, relativePath);
            }
            
            previousLevel = level;
        }
    });
    
    if (!hasH1) {
        logIssue('warning', 'Aucun titre H1 trouvé', relativePath);
    }
    
    // Vérifier les liens
    const linkMatches = content.match(/\[([^\]]*)\]\(([^)]*)\)/g);
    if (linkMatches) {
        linkMatches.forEach(link => {
            const match = link.match(/\[([^\]]*)\]\(([^)]*)\)/);
            if (match) {
                const linkText = match[1].trim();
                const linkUrl = match[2];
                
                if (linkText.length < 3) {
                    logIssue('warning', `Texte de lien trop court: "${linkText}"`, relativePath);
                }
                
                // Vérifier les liens internes
                if (!linkUrl.startsWith('http') && !linkUrl.startsWith('#')) {
                    const linkedPath = path.resolve(path.dirname(filePath), linkUrl);
                    if (!fs.existsSync(linkedPath)) {
                        logIssue('error', `Lien brisé: ${linkUrl}`, relativePath);
                    }
                }
            }
        });
    }
    
    // Vérifier les images
    const imageMatches = content.match(/!\[([^\]]*)\]\(([^)]*)\)/g);
    if (imageMatches) {
        imageMatches.forEach(image => {
            const match = image.match(/!\[([^\]]*)\]\(([^)]*)\)/);
            if (match) {
                const altText = match[1].trim();
                if (altText.length === 0) {
                    logIssue('warning', 'Image sans texte alternatif', relativePath);
                } else if (altText.length < 5) {
                    logIssue('warning', `Texte alternatif trop court: "${altText}"`, relativePath);
                }
            }
        });
    }
});

// 3. Validation des ressources
console.log('\n3. VALIDATION DES RESSOURCES:');
const resourcesPath = path.join(basePath, 'ressources');

if (fs.existsSync(resourcesPath)) {
    // Vérifier les images
    const imagesPath = path.join(resourcesPath, 'images');
    if (fs.existsSync(imagesPath)) {
        const images = fs.readdirSync(imagesPath).filter(file => 
            /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(file)
        );
        
        console.log(`Trouvé ${images.length} images`);
        
        images.forEach(image => {
            const imagePath = path.join(imagesPath, image);
            const stats = fs.statSync(imagePath);
            
            // Vérifier la taille des fichiers (recommandation performance)
            if (stats.size > 1024 * 1024) { // 1MB
                logIssue('warning', `Image volumineuse (${Math.round(stats.size / 1024)}KB): ${image}`);
            }
            
            // Vérifier les formats recommandés
            if (image.toLowerCase().endsWith('.bmp') || image.toLowerCase().endsWith('.tiff')) {
                logIssue('warning', `Format d'image non optimisé: ${image}`);
            }
        });
        
        if (images.length > 0) {
            logSuccess(`${images.length} images trouvées - vérifiez manuellement les textes alternatifs`);
        }
    }
} else {
    logIssue('warning', 'Dossier ressources manquant');
}

// 4. Génération du rapport d'accessibilité
console.log('\n4. GÉNÉRATION DU RAPPORT:');

const report = {
    timestamp: new Date().toISOString(),
    summary: {
        errors: accessibilityIssues.length,
        warnings: accessibilityWarnings.length,
        filesChecked: htmlFiles.length + markdownFiles.length
    },
    details: {
        errors: accessibilityIssues,
        warnings: accessibilityWarnings
    },
    wcagCriteria: {
        '1.1.1': 'Images avec texte alternatif',
        '1.4.3': 'Contraste des couleurs',
        '1.4.4': 'Redimensionnement du texte',
        '2.1.1': 'Navigation au clavier',
        '2.4.1': 'Structure des titres',
        '2.4.2': 'Titre de page',
        '2.4.4': 'Liens descriptifs',
        '3.1.1': 'Langue de la page'
    }
};

// Sauvegarder le rapport JSON
const reportPath = path.join(basePath, 'accessibility-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Générer un rapport lisible
const readableReportPath = path.join(basePath, 'accessibility-report.md');
let reportContent = `# Rapport d'Accessibilité WCAG 2.1\n\n`;
reportContent += `**Date:** ${new Date().toLocaleString('fr-FR')}\n`;
reportContent += `**Fichiers vérifiés:** ${report.summary.filesChecked}\n\n`;

reportContent += `## Résumé\n\n`;
reportContent += `- ❌ Erreurs: ${report.summary.errors}\n`;
reportContent += `- ⚠️ Avertissements: ${report.summary.warnings}\n\n`;

if (report.details.errors.length > 0) {
    reportContent += `## Erreurs à Corriger\n\n`;
    report.details.errors.forEach((error, index) => {
        reportContent += `${index + 1}. **${error.message}**\n`;
        if (error.file) {
            reportContent += `   - Fichier: ${error.file}\n`;
        }
        reportContent += `\n`;
    });
}

if (report.details.warnings.length > 0) {
    reportContent += `## Avertissements\n\n`;
    report.details.warnings.forEach((warning, index) => {
        reportContent += `${index + 1}. **${warning.message}**\n`;
        if (warning.file) {
            reportContent += `   - Fichier: ${warning.file}\n`;
        }
        reportContent += `\n`;
    });
}

reportContent += `## Critères WCAG 2.1 Vérifiés\n\n`;
Object.entries(report.wcagCriteria).forEach(([criterion, description]) => {
    reportContent += `- **${criterion}:** ${description}\n`;
});

reportContent += `\n## Recommandations\n\n`;
reportContent += `1. Corriger toutes les erreurs d'accessibilité\n`;
reportContent += `2. Tester avec un lecteur d'écran (NVDA, JAWS)\n`;
reportContent += `3. Vérifier la navigation au clavier uniquement\n`;
reportContent += `4. Valider les contrastes avec un outil spécialisé\n`;
reportContent += `5. Tester avec des utilisateurs en situation de handicap\n`;

fs.writeFileSync(readableReportPath, reportContent);

// Résumé final
console.log('\n=== RÉSUMÉ ACCESSIBILITÉ ===');
console.log(`Fichiers vérifiés: ${report.summary.filesChecked}`);
console.log(`Erreurs: ${report.summary.errors}`);
console.log(`Avertissements: ${report.summary.warnings}`);

if (report.summary.errors === 0) {
    console.log('\n✅ ACCESSIBILITÉ: Aucune erreur critique détectée');
} else {
    console.log('\n❌ ACCESSIBILITÉ: Des erreurs doivent être corrigées');
}

console.log(`\n📄 Rapport détaillé: accessibility-report.md`);

process.exit(report.summary.errors === 0 ? 0 : 1);