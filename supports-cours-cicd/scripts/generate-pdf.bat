@echo off
REM Script de génération PDF pour Windows
REM Supports de cours CI/CD

echo ========================================
echo   Génération PDF - Supports CI/CD
echo ========================================
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé ou non trouvé dans le PATH
    echo.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    echo Puis relancer ce script.
    pause
    exit /b 1
)

echo ✅ Node.js détecté
node --version

REM Vérifier si npm est disponible
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm n'est pas disponible
    pause
    exit /b 1
)

echo ✅ npm détecté
npm --version

REM Vérifier si les dépendances sont installées
if not exist "node_modules" (
    echo.
    echo 📦 Installation des dépendances npm...
    npm install
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
    echo ✅ Dépendances installées
)

REM Vérifier Pandoc (optionnel)
echo.
echo 🔍 Vérification de Pandoc...
pandoc --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Pandoc non détecté - Les PDF seront générés en mode fallback HTML
    echo    Pour une meilleure qualité, installez Pandoc depuis https://pandoc.org/
    echo.
) else (
    echo ✅ Pandoc détecté
    pandoc --version | findstr "pandoc"
)

REM Vérifier LaTeX (optionnel)
echo.
echo 🔍 Vérification de LaTeX...
xelatex --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  XeLaTeX non détecté - Qualité PDF limitée
    echo    Pour une meilleure qualité, installez MiKTeX ou TeX Live
    echo.
) else (
    echo ✅ XeLaTeX détecté
)

echo.
echo 🚀 Lancement de la génération PDF...
echo.

REM Exécuter le générateur
node generate-pdf.js
set GENERATION_RESULT=%errorlevel%

echo.
if %GENERATION_RESULT% equ 0 (
    echo ✅ Génération PDF terminée avec succès!
    echo.
    echo 📁 Fichiers générés dans le dossier: ..\pdf-exports\
    echo.
    echo Fichiers principaux:
    echo   - supports-cours-cicd-complet.pdf
    echo   - guide-formateur.pdf
    echo   - guide-apprenant.pdf
    echo   - modules\module-*-complet.pdf
    echo   - evaluations\qcm-*.pdf
    echo.
    
    REM Proposer d'ouvrir le dossier
    set /p OPEN_FOLDER="Voulez-vous ouvrir le dossier des PDF générés? (o/N): "
    if /i "%OPEN_FOLDER%"=="o" (
        start "" "..\pdf-exports"
    )
    
) else (
    echo ❌ Erreur lors de la génération PDF
    echo.
    echo Vérifiez les messages d'erreur ci-dessus.
    echo.
    echo Solutions possibles:
    echo   1. Installer Pandoc pour une meilleure conversion
    echo   2. Installer LaTeX (MiKTeX/TeX Live) pour les PDF haute qualité
    echo   3. Vérifier que tous les fichiers source existent
    echo   4. Consulter le README-PDF-Generation.md pour plus d'aide
)

echo.
echo Appuyez sur une touche pour fermer...
pause >nul