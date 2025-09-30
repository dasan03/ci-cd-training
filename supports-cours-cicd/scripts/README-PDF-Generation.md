# Génération PDF - Supports de Cours CI/CD

Ce système permet de convertir tous les supports de cours Markdown en fichiers PDF haute qualité avec signets, liens internes et mise en page professionnelle.

## 🎯 Fonctionnalités

- **Conversion automatique** de tous les fichiers Markdown en PDF
- **Mise en page professionnelle** avec template LaTeX personnalisé
- **Signets et navigation** intégrés dans les PDF
- **Liens internes** préservés et fonctionnels
- **Formats optimisés** pour impression A4 et présentation
- **PDF consolidé** regroupant tous les supports
- **Fallback HTML** si Pandoc n'est pas disponible

## 📋 Prérequis

### Obligatoires
- **Node.js** (version 14 ou supérieure)
- **npm** (inclus avec Node.js)

### Recommandés pour PDF haute qualité
- **Pandoc** (version 2.0 ou supérieure)
- **LaTeX** (TeX Live, MiKTeX, ou MacTeX)
- **XeLaTeX** (inclus dans les distributions LaTeX modernes)

## 🚀 Installation

### 1. Installation des dépendances Node.js
```bash
cd supports-cours-cicd/scripts
npm install
```

### 2. Installation de Pandoc

#### Windows
```bash
# Avec Chocolatey
choco install pandoc

# Ou télécharger depuis https://pandoc.org/installing.html
```

#### macOS
```bash
# Avec Homebrew
brew install pandoc

# Avec MacPorts
sudo port install pandoc
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install pandoc
```

### 3. Installation de LaTeX (pour PDF haute qualité)

#### Windows
- Télécharger et installer **MiKTeX** : https://miktex.org/download
- Ou **TeX Live** : https://www.tug.org/texlive/

#### macOS
```bash
# MacTeX (recommandé)
brew install --cask mactex

# Ou BasicTeX (plus léger)
brew install --cask basictex
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install texlive-full

# Ou installation minimale
sudo apt-get install texlive-latex-base texlive-fonts-recommended texlive-latex-extra
```

## 📖 Utilisation

### Génération complète
```bash
cd supports-cours-cicd/scripts
npm run generate-pdf
```

### Vérification des prérequis
```bash
npm run check-pandoc
```

### Configuration et installation
```bash
npm run setup
```

## 📁 Structure des fichiers générés

```
supports-cours-cicd/
├── pdf-exports/
│   ├── supports-cours-cicd-complet.pdf     # Document consolidé
│   ├── supports-cours-cicd-index.pdf       # Index général
│   ├── guide-formateur.pdf                 # Guide formateur
│   ├── guide-apprenant.pdf                 # Guide apprenant
│   ├── modules/
│   │   ├── module-1-fondamentaux-complet.pdf
│   │   ├── module-2-ia-tests-complet.pdf
│   │   ├── module-3-tests-fonctionnels-complet.pdf
│   │   └── module-4-documentation-complet.pdf
│   └── evaluations/
│       ├── qcm-module-1-fondamentaux.pdf
│       ├── qcm-module-2-ia-automatisation.pdf
│       ├── qcm-module-2-ml-optimisation.pdf
│       ├── qcm-module-3-tests-fonctionnels.pdf
│       ├── qcm-module-4-documentation.pdf
│       └── qcm-final-evaluation.pdf
```

## ⚙️ Configuration

### Options PDF (dans generate-pdf.js)
```javascript
const PDF_CONFIG = {
  pandocOptions: [
    '--pdf-engine=xelatex',        // Moteur PDF
    '--template=pdf-template.tex',  // Template LaTeX
    '--toc',                       // Table des matières
    '--toc-depth=3',              // Profondeur TOC
    '--number-sections',          // Numérotation sections
    '--highlight-style=tango',    // Style coloration syntaxe
    '--variable=geometry:margin=2cm', // Marges
    '--variable=fontsize:11pt'    // Taille police
  ]
};
```

### Personnalisation du template LaTeX
Le fichier `pdf-template.tex` peut être modifié pour :
- Changer les couleurs du thème
- Modifier la mise en page
- Ajouter un logo ou en-tête personnalisé
- Ajuster les styles de titres

## 🔧 Dépannage

### Pandoc non trouvé
```bash
# Vérifier l'installation
pandoc --version

# Ajouter au PATH si nécessaire (Windows)
set PATH=%PATH%;C:\Users\%USERNAME%\AppData\Local\Pandoc

# Ou utiliser le fallback HTML
# Les fichiers .html seront générés à la place des .pdf
```

### Erreurs LaTeX
```bash
# Installer les packages manquants (MiKTeX)
miktex-console

# Ou mettre à jour TeX Live
tlmgr update --self --all
```

### Problèmes de polices
```bash
# Installer les polices système manquantes
# Windows : Panneau de configuration > Polices
# macOS : Font Book
# Linux : sudo apt-get install fonts-liberation
```

### Mémoire insuffisante
Pour les gros documents, augmenter la mémoire disponible :
```bash
# Variables d'environnement
export NODE_OPTIONS="--max-old-space-size=4096"
```

## 📊 Formats de sortie

### PDF Standard
- **Résolution** : 300 DPI
- **Format** : A4 (210×297 mm)
- **Marges** : 2 cm
- **Police** : Latin Modern (LaTeX par défaut)

### PDF Présentation
- **Format** : 16:9 ou 4:3
- **Marges réduites** : 1.5 cm
- **Police plus grande** : 12pt

### Fallback HTML
Si Pandoc n'est pas disponible :
- **Format** : HTML5 responsive
- **Styles** : CSS intégré
- **Conversion manuelle** : Instructions incluses

## 🎨 Personnalisation

### Couleurs du thème
```latex
% Dans pdf-template.tex
\definecolor{primaryblue}{RGB}{52, 152, 219}
\definecolor{secondaryblue}{RGB}{41, 128, 185}
\definecolor{darkgray}{RGB}{44, 62, 80}
```

### En-têtes personnalisés
```latex
\fancyhead[L]{\textcolor{primaryblue}{\textbf{Formation CI/CD}}}
\fancyhead[R]{\textcolor{darkgray}{$title$}}
```

### Ajout de logo
```latex
% Dans la page de titre
\includegraphics[width=0.3\textwidth]{chemin/vers/logo.png}
```

## 📈 Optimisation

### Performance
- **Traitement parallèle** des modules
- **Cache des ressources** communes
- **Compression des images** automatique

### Qualité
- **Vectorisation** des diagrammes
- **Optimisation** des captures d'écran
- **Validation** des liens internes

## 🔍 Validation

### Tests automatiques
```bash
# Vérifier tous les liens
npm run validate-links

# Tester la génération
npm run test-generation

# Valider la qualité PDF
npm run validate-pdf
```

### Métriques de qualité
- **Taille des fichiers** : < 50 MB par module
- **Temps de génération** : < 5 minutes total
- **Liens fonctionnels** : 100%
- **Signets corrects** : Tous les titres

## 📞 Support

### Problèmes courants
1. **Pandoc non installé** → Voir section Installation
2. **LaTeX manquant** → Installer TeX Live/MiKTeX
3. **Polices manquantes** → Installer fonts-liberation
4. **Mémoire insuffisante** → Augmenter NODE_OPTIONS

### Logs et débogage
```bash
# Mode verbose
DEBUG=1 npm run generate-pdf

# Logs détaillés
npm run generate-pdf > generation.log 2>&1
```

### Contact
- **Documentation** : Voir README principal
- **Issues** : Créer un ticket avec logs
- **Améliorations** : Proposer via PR

---

*Générateur PDF v1.0.0 - Formation CI/CD EADL*