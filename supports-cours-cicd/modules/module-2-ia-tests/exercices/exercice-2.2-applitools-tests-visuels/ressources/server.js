const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route principale
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demo App - Tests Visuels</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
            }
            
            header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 1rem 0;
                text-align: center;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }
            
            .hero {
                background: #f8f9fa;
                padding: 4rem 0;
                text-align: center;
            }
            
            .hero h1 {
                font-size: 3rem;
                margin-bottom: 1rem;
                color: #2c3e50;
            }
            
            .hero p {
                font-size: 1.2rem;
                color: #7f8c8d;
                margin-bottom: 2rem;
            }
            
            .btn {
                display: inline-block;
                background: #3498db;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                transition: background 0.3s ease;
            }
            
            .btn:hover {
                background: #2980b9;
            }
            
            .features {
                padding: 4rem 0;
                background: white;
            }
            
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                margin-top: 2rem;
            }
            
            .feature-card {
                background: #f8f9fa;
                padding: 2rem;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .feature-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            
            .dynamic-content {
                background: #e74c3c;
                color: white;
                padding: 10px;
                margin: 20px 0;
                border-radius: 5px;
                text-align: center;
            }
            
            footer {
                background: #2c3e50;
                color: white;
                text-align: center;
                padding: 2rem 0;
            }
            
            @media (max-width: 768px) {
                .hero h1 {
                    font-size: 2rem;
                }
                
                .features-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <header>
            <div class="container">
                <h1>Demo App pour Tests Visuels</h1>
                <p>Application de démonstration pour Applitools</p>
            </div>
        </header>
        
        <section class="hero">
            <div class="container">
                <h1>Bienvenue dans notre Demo</h1>
                <p>Cette application sert à démontrer les capacités des tests visuels automatisés</p>
                <a href="#features" class="btn">Découvrir les fonctionnalités</a>
            </div>
        </section>
        
        <div class="dynamic-content">
            <strong>Contenu dynamique:</strong> ${new Date().toLocaleString()} - Visiteur #${Math.floor(Math.random() * 1000)}
        </div>
        
        <section class="features" id="features">
            <div class="container">
                <h2 style="text-align: center; margin-bottom: 1rem;">Nos Fonctionnalités</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🚀</div>
                        <h3>Performance</h3>
                        <p>Application optimisée pour des performances maximales</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🔒</div>
                        <h3>Sécurité</h3>
                        <p>Sécurité renforcée avec les dernières technologies</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📱</div>
                        <h3>Responsive</h3>
                        <p>Interface adaptée à tous les appareils</p>
                    </div>
                </div>
            </div>
        </section>
        
        <footer>
            <div class="container">
                <p>&copy; 2024 Demo App - Formation CI/CD. Tous droits réservés.</p>
            </div>
        </footer>
        
        <script>
            // Simulation d'interactions pour les tests
            document.addEventListener('DOMContentLoaded', function() {
                const btn = document.querySelector('.btn');
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelector('#features').scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });
        </script>
    </body>
    </html>
    `);
});

// Route pour simuler des changements visuels
app.get('/variant', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demo App - Variant</title>
        <style>
            /* Styles identiques mais avec quelques modifications pour tester la détection */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
            }
            
            header {
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); /* Couleur changée */
                color: white;
                padding: 1rem 0;
                text-align: center;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }
            
            .hero {
                background: #f8f9fa;
                padding: 4rem 0;
                text-align: center;
            }
            
            .hero h1 {
                font-size: 3.5rem; /* Taille augmentée */
                margin-bottom: 1rem;
                color: #2c3e50;
            }
            
            .btn {
                display: inline-block;
                background: #e74c3c; /* Couleur changée */
                color: white;
                padding: 15px 35px; /* Padding augmenté */
                text-decoration: none;
                border-radius: 8px; /* Border radius augmenté */
                transition: background 0.3s ease;
            }
            
            /* Reste des styles identiques... */
        </style>
    </head>
    <body>
        <!-- Contenu similaire avec les modifications CSS appliquées -->
        <header>
            <div class="container">
                <h1>Demo App pour Tests Visuels - VARIANT</h1>
                <p>Version modifiée pour tester la détection de changements</p>
            </div>
        </header>
        <!-- Reste du contenu... -->
    </body>
    </html>
    `);
});

app.listen(port, () => {
    console.log(`Serveur de démonstration démarré sur http://localhost:${port}`);
    console.log(`Version variant disponible sur http://localhost:${port}/variant`);
});