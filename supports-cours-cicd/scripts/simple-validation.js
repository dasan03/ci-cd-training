console.log('=== VALIDATION DES SUPPORTS DE COURS CI/CD ===\n');

const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '..');
console.log('Chemin de base:', basePath);

// 1. Vérification de la structure de base
console.log('\n1. VÉRIFICATION DE LA STRUCTURE:');
const requiredDirs = ['modules', 'exercices', 'evaluations', 'guides', 'ressources'];
let structureOK = true;

requiredDirs.forEach(dir => {
    const dirPath = path.join(basePath, dir);
    if (fs.existsSync(dirPath)) {
        console.log(`✅ ${dir} - OK`);
    } else {
        console.log(`❌ ${dir} - MANQUANT`);
        structureOK = false;
    }
});

// 2. Vérification des modules
console.log('\n2. VÉRIFICATION DES MODULES:');
const modules = ['module-1-fondamentaux', 'module-2-ia-tests', 'module-3-tests-fonctionnels', 'module-4-documentation'];
let modulesOK = true;

modules.forEach(module => {
    const modulePath = path.join(basePath, 'modules', module);
    const readmePath = path.join(modulePath, 'README.md');
    
    if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf8');
        const wordCount = content.split(' ').length;
        console.log(`✅ ${module} - ${wordCount} mots`);
    } else {
        console.log(`❌ ${module} - README manquant`);
        modulesOK = false;
    }
});

// 3. Vérification des exercices
console.log('\n3. VÉRIFICATION DES EXERCICES:');
let exercisesOK = true;
const exercisesPath = path.join(basePath, 'exercices');

if (fs.existsSync(exercisesPath)) {
    const moduleExercises = fs.readdirSync(exercisesPath).filter(item => 
        fs.statSync(path.join(exercisesPath, item)).isDirectory()
    );
    
    moduleExercises.forEach(moduleDir => {
        const modulePath = path.join(exercisesPath, moduleDir);
        const exercises = fs.readdirSync(modulePath).filter(item => 
            fs.statSync(path.join(modulePath, item)).isDirectory()
        );
        console.log(`✅ ${moduleDir} - ${exercises.length} exercices`);
    });
} else {
    console.log('❌ Dossier exercices manquant');
    exercisesOK = false;
}

// 4. Vérification des QCM
console.log('\n4. VÉRIFICATION DES QCM:');
let qcmOK = true;
const evaluationsPath = path.join(basePath, 'evaluations');

if (fs.existsSync(evaluationsPath)) {
    const qcmIntermediaires = path.join(evaluationsPath, 'qcm-intermediaires');
    const qcmFinal = path.join(evaluationsPath, 'qcm-final');
    
    if (fs.existsSync(qcmIntermediaires)) {
        const qcmFiles = fs.readdirSync(qcmIntermediaires).filter(f => f.endsWith('.md'));
        console.log(`✅ QCM intermédiaires - ${qcmFiles.length} fichiers`);
    } else {
        console.log('❌ QCM intermédiaires manquants');
        qcmOK = false;
    }
    
    if (fs.existsSync(qcmFinal)) {
        const qcmFiles = fs.readdirSync(qcmFinal).filter(f => f.endsWith('.md'));
        console.log(`✅ QCM final - ${qcmFiles.length} fichiers`);
    } else {
        console.log('❌ QCM final manquant');
        qcmOK = false;
    }
} else {
    console.log('❌ Dossier evaluations manquant');
    qcmOK = false;
}

// 5. Vérification des guides
console.log('\n5. VÉRIFICATION DES GUIDES:');
let guidesOK = true;
const guidesPath = path.join(basePath, 'guides');

['guide-formateur.md', 'guide-apprenant.md'].forEach(guide => {
    const guidePath = path.join(guidesPath, guide);
    if (fs.existsSync(guidePath)) {
        const content = fs.readFileSync(guidePath, 'utf8');
        const wordCount = content.split(' ').length;
        console.log(`✅ ${guide} - ${wordCount} mots`);
    } else {
        console.log(`❌ ${guide} - manquant`);
        guidesOK = false;
    }
});

// 6. Vérification des formats de sortie
console.log('\n6. VÉRIFICATION DES FORMATS DE SORTIE:');
let formatsOK = true;

const htmlPath = path.join(basePath, 'html-output');
if (fs.existsSync(htmlPath)) {
    console.log('✅ Format HTML disponible');
} else {
    console.log('⚠️  Format HTML manquant');
}

const pdfPath = path.join(basePath, 'pdf-exports');
if (fs.existsSync(pdfPath)) {
    console.log('✅ Exports PDF disponibles');
} else {
    console.log('⚠️  Exports PDF manquants');
}

// Résumé final
console.log('\n=== RÉSUMÉ DE LA VALIDATION ===');
const allOK = structureOK && modulesOK && exercisesOK && qcmOK && guidesOK;

if (allOK) {
    console.log('🎉 VALIDATION RÉUSSIE - Tous les éléments essentiels sont présents');
} else {
    console.log('⚠️  VALIDATION PARTIELLE - Certains éléments nécessitent attention');
}

console.log('\nDétails:');
console.log(`- Structure: ${structureOK ? '✅' : '❌'}`);
console.log(`- Modules: ${modulesOK ? '✅' : '❌'}`);
console.log(`- Exercices: ${exercisesOK ? '✅' : '❌'}`);
console.log(`- QCM: ${qcmOK ? '✅' : '❌'}`);
console.log(`- Guides: ${guidesOK ? '✅' : '❌'}`);

// Recommandations
console.log('\n=== RECOMMANDATIONS ===');
console.log('1. Tester manuellement tous les exercices');
console.log('2. Vérifier la cohérence pédagogique entre modules');
console.log('3. Valider l\'accessibilité des formats HTML');
console.log('4. Faire réviser le contenu par un expert métier');
console.log('5. Tester les QCM avec des apprenants pilotes');

process.exit(allOK ? 0 : 1);