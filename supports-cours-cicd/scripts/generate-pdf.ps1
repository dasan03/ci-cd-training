# Script PowerShell de génération PDF pour les supports de cours CI/CD
# Exécution: .\generate-pdf.ps1

param(
    [switch]$SkipChecks,
    [switch]$Verbose,
    [string]$OutputDir = "..\pdf-exports"
)

# Configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Couleurs pour l'affichage
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Info { Write-ColorOutput Cyan $args }

# En-tête
Write-Host "========================================" -ForegroundColor Blue
Write-Host "   Génération PDF - Supports CI/CD" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

try {
    # Vérification de Node.js
    if (-not $SkipChecks) {
        Write-Info "🔍 Vérification des prérequis..."
        
        try {
            $nodeVersion = node --version
            Write-Success "✅ Node.js détecté: $nodeVersion"
        }
        catch {
            Write-Error "❌ Node.js n'est pas installé ou non trouvé dans le PATH"
            Write-Host ""
            Write-Host "Veuillez installer Node.js depuis https://nodejs.org/"
            exit 1
        }

        # Vérification de npm
        try {
            $npmVersion = npm --version
            Write-Success "✅ npm détecté: v$npmVersion"
        }
        catch {
            Write-Error "❌ npm n'est pas disponible"
            exit 1
        }

        # Installation des dépendances si nécessaire
        if (-not (Test-Path "node_modules")) {
            Write-Info "📦 Installation des dépendances npm..."
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Error "❌ Erreur lors de l'installation des dépendances"
                exit 1
            }
            Write-Success "✅ Dépendances installées"
        }

        # Vérification de Pandoc (optionnel)
        Write-Host ""
        Write-Info "🔍 Vérification de Pandoc..."
        try {
            $pandocVersion = pandoc --version | Select-Object -First 1
            Write-Success "✅ Pandoc détecté: $pandocVersion"
        }
        catch {
            Write-Warning "⚠️  Pandoc non détecté - Les PDF seront générés en mode fallback HTML"
            Write-Warning "   Pour une meilleure qualité, installez Pandoc depuis https://pandoc.org/"
        }

        # Vérification de LaTeX (optionnel)
        Write-Host ""
        Write-Info "🔍 Vérification de LaTeX..."
        try {
            $latexVersion = xelatex --version | Select-Object -First 1
            Write-Success "✅ XeLaTeX détecté"
        }
        catch {
            Write-Warning "⚠️  XeLaTeX non détecté - Qualité PDF limitée"
            Write-Warning "   Pour une meilleure qualité, installez MiKTeX ou TeX Live"
        }
    }

    # Génération PDF
    Write-Host ""
    Write-Info "🚀 Lancement de la génération PDF..."
    Write-Host ""

    # Mesurer le temps d'exécution
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

    if ($Verbose) {
        $env:DEBUG = "1"
    }

    # Exécuter le générateur Node.js
    node generate-pdf.js
    $generationResult = $LASTEXITCODE

    $stopwatch.Stop()
    $executionTime = $stopwatch.Elapsed.ToString("mm\:ss")

    Write-Host ""
    if ($generationResult -eq 0) {
        Write-Success "✅ Génération PDF terminée avec succès en $executionTime!"
        Write-Host ""
        
        # Vérifier les fichiers générés
        $outputPath = Resolve-Path $OutputDir -ErrorAction SilentlyContinue
        if ($outputPath -and (Test-Path $outputPath)) {
            Write-Info "📁 Fichiers générés dans: $outputPath"
            Write-Host ""
            
            # Lister les fichiers principaux
            $mainFiles = @(
                "supports-cours-cicd-complet.pdf",
                "guide-formateur.pdf",
                "guide-apprenant.pdf"
            )
            
            Write-Host "Fichiers principaux:" -ForegroundColor Green
            foreach ($file in $mainFiles) {
                $filePath = Join-Path $outputPath $file
                if (Test-Path $filePath) {
                    $fileSize = [math]::Round((Get-Item $filePath).Length / 1MB, 2)
                    Write-Host "  ✓ $file ($fileSize MB)" -ForegroundColor Green
                } else {
                    Write-Host "  ✗ $file (non généré)" -ForegroundColor Yellow
                }
            }
            
            # Compter les modules et évaluations
            $modulesPath = Join-Path $outputPath "modules"
            $evaluationsPath = Join-Path $outputPath "evaluations"
            
            if (Test-Path $modulesPath) {
                $moduleCount = (Get-ChildItem $modulesPath -Filter "*.pdf").Count
                Write-Host "  ✓ $moduleCount modules générés" -ForegroundColor Green
            }
            
            if (Test-Path $evaluationsPath) {
                $qcmCount = (Get-ChildItem $evaluationsPath -Filter "*.pdf").Count
                Write-Host "  ✓ $qcmCount QCM générés" -ForegroundColor Green
            }
            
            Write-Host ""
            
            # Proposer d'ouvrir le dossier
            $openFolder = Read-Host "Voulez-vous ouvrir le dossier des PDF générés? (o/N)"
            if ($openFolder -eq "o" -or $openFolder -eq "O") {
                Start-Process explorer.exe -ArgumentList $outputPath
            }
            
        } else {
            Write-Warning "⚠️  Dossier de sortie non trouvé: $OutputDir"
        }
        
    } else {
        Write-Error "❌ Erreur lors de la génération PDF (Code: $generationResult)"
        Write-Host ""
        Write-Host "Solutions possibles:" -ForegroundColor Yellow
        Write-Host "  1. Installer Pandoc pour une meilleure conversion" -ForegroundColor Yellow
        Write-Host "  2. Installer LaTeX (MiKTeX/TeX Live) pour les PDF haute qualité" -ForegroundColor Yellow
        Write-Host "  3. Vérifier que tous les fichiers source existent" -ForegroundColor Yellow
        Write-Host "  4. Consulter le README-PDF-Generation.md pour plus d'aide" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Pour plus de détails, relancez avec: .\generate-pdf.ps1 -Verbose" -ForegroundColor Cyan
        
        exit $generationResult
    }

} catch {
    Write-Error "❌ Erreur inattendue: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Stack trace:" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Génération terminée. Appuyez sur Entrée pour continuer..." -ForegroundColor Gray
Read-Host